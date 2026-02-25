import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { queryDB, testConnection } from "./db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { isImpersonating, maskSensitiveData } from "./replit_integrations/auth/routes";
import { authStorage } from "./replit_integrations/auth/storage";
import { recalculateAllScores, recalculateSingleBookScore, startScoreCron } from "./scoreCalculation";

const log = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

const trackingRateCache = new Map<string, { count: number; windowStart: number }>();

let cachedTrackingSettings: {
  bot_user_agents: string[];
  rate_limit_window_minutes: number;
  rate_limit_max_views: number;
  rate_limit_max_clicks: number;
  excluded_admin_ips: string[];
  _loaded_at: number;
} | null = null;

async function getTrackingSettings() {
  if (cachedTrackingSettings && Date.now() - cachedTrackingSettings._loaded_at < 60_000) {
    return cachedTrackingSettings;
  }
  try {
    const result = await queryDB('SELECT * FROM tracking_settings WHERE id = 1');
    if (result.rows.length > 0) {
      cachedTrackingSettings = { ...result.rows[0], _loaded_at: Date.now() };
      return cachedTrackingSettings;
    }
  } catch { /* fallback to defaults */ }
  return {
    bot_user_agents: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot', 'facebookexternalhit', 'Twitterbot', 'AhrefsBot', 'SemrushBot', 'curl', 'wget', 'PostmanRuntime'],
    rate_limit_window_minutes: 60,
    rate_limit_max_views: 3,
    rate_limit_max_clicks: 5,
    excluded_admin_ips: [] as string[],
    _loaded_at: Date.now(),
  };
}

function getClientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ALLOWED_SLUG_TABLES = new Set([
  'curators', 'menu_items', 'author_profiles', 'awards', 'tags',
  'storefronts', 'persons', 'affiliates', 'bookstore_profiles', 'pages',
]);

async function generateUniqueSlug(table: string, baseText: string, excludeId?: number | string): Promise<string> {
  if (!ALLOWED_SLUG_TABLES.has(table)) {
    throw new Error(`generateUniqueSlug: table "${table}" is not in the allowed list`);
  }

  const baseSlug = slugify(baseText);
  let slug = baseSlug;
  let counter = 2;

  const validExcludeId = excludeId && typeof excludeId === 'number' ? excludeId :
                         excludeId && !isNaN(Number(excludeId)) ? Number(excludeId) : null;

  while (true) {
    const checkQuery = validExcludeId
      ? `SELECT id FROM ${table} WHERE slug = $1 AND id != $2 LIMIT 1`
      : `SELECT id FROM ${table} WHERE slug = $1 LIMIT 1`;

    const params = validExcludeId ? [slug, validExcludeId] : [slug];
    const result = await queryDB(checkQuery, params);

    if (result.rows.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    if (counter > 100) {
      throw new Error(`generateUniqueSlug: exceeded max attempts for table "${table}", base "${baseText}"`);
    }
  }
}

async function verifyAdminToken(token: string | null): Promise<boolean> {
  if (!token) {
    log.warn('verifyAdminToken: No token provided');
    return false;
  }

  try {
    const result = await queryDB(
      `select token
       from public.admin_sessions
       where token = $1
         and expires_at > now()
       limit 1`,
      [token]
    );

    const rows = (result?.rows ?? result) as any[];
    const isValid = Array.isArray(rows) && rows.length > 0;
    return isValid;
  } catch (error) {
    log.error('Token verification error:', error);
    return false;
  }
}

async function tryAuditLog(action: string, entityType: string, entityId: string | number | null, adminUser: string, changes?: any) {
  try {
    const params = changes
      ? [action, entityType, entityId, adminUser, JSON.stringify(changes)]
      : [action, entityType, entityId, adminUser];

    const query = changes
      ? `INSERT INTO navigation_audit_log (action, entity_type, entity_id, admin_user, changes) VALUES ($1, $2, $3, $4, $5)`
      : `INSERT INTO navigation_audit_log (action, entity_type, entity_id, admin_user) VALUES ($1, $2, $3, $4)`;

    await queryDB(query, params);
  } catch (error: any) {
    console.warn(`Audit log failed (action: ${action}, entity: ${entityType}):`, error.message);
  }
}

async function requireAdminGuard(req: Request, res: Response): Promise<boolean> {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const sessionUser = req.user as any;
    if (sessionUser.role === 'admin' || sessionUser.role === 'super_admin') {
      return true;
    }
    const userId = sessionUser.claims?.sub;
    if (userId) {
      try {
        const dbUser = await authStorage.getUser(userId);
        if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin')) {
          return true;
        }
      } catch (err) {
        log.warn('requireAdminGuard: DB user lookup failed:', err);
      }
    }
  }

  const token = (req.headers['x-admin-token'] as string) || req.body?.token || "";

  if (!token) {
    res.status(401).json({ ok: false, error: { code: "MISSING_ADMIN_TOKEN" } });
    return false;
  }

  const ok = await verifyAdminToken(token);

  if (!ok) {
    res.status(401).json({ ok: false, error: { code: "INVALID_OR_EXPIRED_ADMIN_TOKEN" } });
    return false;
  }

  return true;
}

function parseIdParam(raw: string | string[] | undefined): number | null {
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (!val) return null;
  const id = Number(val);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function mapCuratorRow(row: any) {
  return {
    id: String(row.id),
    name: row.name || '',
    slug: row.slug || '',
    email: row.email || '',
    avatar: row.avatar_url || row.avatar || '',
    bio: row.bio || '',
    focus: row.focus || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    socialMedia: {
      instagram: row.instagram_url || row.instagram || '',
      youtube: row.youtube_url || row.youtube || '',
      tiktok: row.tiktok_url || row.tiktok || '',
      podcast: row.podcast_url || row.podcast || '',
      website: row.website_url || row.website || '',
    },
    visible_tabs: row.visible_tabs || {},
    visible: Boolean(row.visible),
    verified: Boolean(row.verified),
    display_order: Number(row.display_order) || 0,
    status: row.status || 'draft',
    visibility: row.visibility || 'visible',
    publish_at: row.publish_at || null,
    unpublish_at: row.unpublish_at || null,
    user_id: row.user_id || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

async function ensureSchemaReady() {
  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL DEFAULT 'admin',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    log.info('Admin auth tables verified');
  } catch (err) {
    log.warn('Could not verify admin auth tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS storefronts (
        id SERIAL PRIMARY KEY,
        curator_id INTEGER REFERENCES curators(id) ON DELETE CASCADE,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(500),
        description TEXT,
        logo_url TEXT,
        hero_image_url TEXT,
        color_scheme JSONB DEFAULT '{}',
        social_media JSONB DEFAULT '{}',
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS storefront_book_series (
        id SERIAL PRIMARY KEY,
        storefront_id INTEGER REFERENCES storefronts(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reason TEXT,
        occasion TEXT,
        type VARCHAR(20) DEFAULT 'static',
        sort_order VARCHAR(20) DEFAULT 'popular',
        is_own_books BOOLEAN DEFAULT false,
        filters JSONB DEFAULT '{}',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS storefront_series_books (
        id SERIAL PRIMARY KEY,
        series_id INTEGER REFERENCES storefront_book_series(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL,
        display_order INTEGER DEFAULT 0,
        UNIQUE(series_id, book_id)
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_storefronts_slug ON storefronts(slug)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_storefronts_curator ON storefronts(curator_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_sf_series_storefront ON storefront_book_series(storefront_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_sf_series_books_series ON storefront_series_books(series_id)`);
    log.info('Storefront tables verified');
  } catch (err) {
    log.warn('Could not verify storefront tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        network VARCHAR(50) DEFAULT 'manual',
        merchant_id VARCHAR(255),
        program_id VARCHAR(255),
        website_url TEXT,
        link_template TEXT NOT NULL DEFAULT '',
        product_url_template TEXT,
        icon_url TEXT,
        favicon_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        show_in_carousel BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS show_in_carousel BOOLEAN DEFAULT false`);
    await queryDB(`ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS favicon_url TEXT`);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS book_affiliates (
        id SERIAL PRIMARY KEY,
        book_id VARCHAR(255) NOT NULL,
        affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
        merchant_product_id VARCHAR(255),
        external_id VARCHAR(255),
        link_override TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(book_id, affiliate_id)
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_affiliates_active ON affiliates(is_active)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_book_affiliates_book ON book_affiliates(book_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_book_affiliates_affiliate ON book_affiliates(affiliate_id)`);
    log.info('Affiliate tables verified');
  } catch (err) {
    log.warn('Could not verify affiliate tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS affiliate_creator_profiles (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        artist_name VARCHAR(255),
        birth_date DATE,
        nationality VARCHAR(100),
        street VARCHAR(255),
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(10) DEFAULT 'DE',
        email VARCHAR(255),
        phone VARCHAR(50),
        tax_status VARCHAR(50),
        tax_number VARCHAR(100),
        tax_id VARCHAR(100),
        vat_id VARCHAR(100),
        tax_country VARCHAR(10),
        tax_self_responsible BOOLEAN DEFAULT false,
        account_holder VARCHAR(255),
        iban VARCHAR(50),
        bic VARCHAR(20),
        payout_country VARCHAR(10),
        currency VARCHAR(10) DEFAULT 'EUR',
        min_payout_accepted BOOLEAN DEFAULT false,
        accept_creator_contract BOOLEAN DEFAULT false,
        accept_revenue_share BOOLEAN DEFAULT false,
        accept_ad_disclosure BOOLEAN DEFAULT false,
        accept_no_third_party_rights BOOLEAN DEFAULT false,
        accept_tracking BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    log.info('Affiliate creator profiles table verified');
  } catch (err) {
    log.warn('Could not verify affiliate_creator_profiles table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS affiliate_clicks (
        id SERIAL PRIMARY KEY,
        creator_id VARCHAR(255) NOT NULL,
        creator_slug VARCHAR(255),
        book_id VARCHAR(255) NOT NULL,
        isbn13 VARCHAR(20),
        session_id VARCHAR(255) NOT NULL,
        merchant VARCHAR(255),
        affiliate_id INTEGER,
        landing_page TEXT,
        referrer TEXT,
        user_agent TEXT,
        ip_hash VARCHAR(64),
        click_timestamp TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_aff_clicks_creator ON affiliate_clicks(creator_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_aff_clicks_session ON affiliate_clicks(session_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_aff_clicks_book ON affiliate_clicks(book_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_aff_clicks_ts ON affiliate_clicks(click_timestamp)`);

    await queryDB(`
      CREATE TABLE IF NOT EXISTS affiliate_orders (
        id SERIAL PRIMARY KEY,
        creator_id VARCHAR(255) NOT NULL,
        click_id INTEGER REFERENCES affiliate_clicks(id),
        session_id VARCHAR(255),
        book_id VARCHAR(255),
        isbn13 VARCHAR(20),
        merchant VARCHAR(255),
        affiliate_id INTEGER,
        order_reference VARCHAR(255),
        purchase_timestamp TIMESTAMPTZ DEFAULT NOW(),
        merchant_commission NUMERIC(10,2) DEFAULT 0,
        creator_share NUMERIC(10,2) DEFAULT 0,
        platform_share NUMERIC(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_aff_orders_creator ON affiliate_orders(creator_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_aff_orders_status ON affiliate_orders(status)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_aff_orders_session ON affiliate_orders(session_id)`);
    log.info('Affiliate tracking tables verified');
  } catch (err) {
    log.warn('Could not verify affiliate tracking tables:', err);
  }

  try {
    await queryDB(`ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS cookie_duration_days INTEGER DEFAULT 30`);
    log.info('Affiliates cookie_duration_days column verified');
  } catch (err) {
    log.warn('Could not add cookie_duration_days to affiliates:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS referral_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        ref_creator_id VARCHAR(255) NOT NULL,
        first_seen_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
        landing_url TEXT
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_referral_sessions_creator ON referral_sessions(ref_creator_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_referral_sessions_expires ON referral_sessions(expires_at)`);
    log.info('referral_sessions table verified');
  } catch (err) {
    log.warn('Could not create referral_sessions table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS curation_clicks (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        curation_id INTEGER,
        curation_owner_creator_id VARCHAR(255) NOT NULL,
        book_id VARCHAR(255) NOT NULL,
        isbn VARCHAR(20),
        clicked_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_curation_clicks_session ON curation_clicks(session_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_curation_clicks_creator ON curation_clicks(curation_owner_creator_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_curation_clicks_session_book ON curation_clicks(session_id, book_id, clicked_at)`);
    log.info('curation_clicks table verified');
  } catch (err) {
    log.warn('Could not create curation_clicks table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS creator_commissions (
        id SERIAL PRIMARY KEY,
        external_order_id VARCHAR(255) UNIQUE,
        merchant VARCHAR(255),
        session_id VARCHAR(255),
        book_id VARCHAR(255),
        isbn VARCHAR(20),
        attribution_type VARCHAR(20) CHECK (attribution_type IN ('REFERRAL', 'CURATION')),
        attributed_creator_id VARCHAR(255) NOT NULL,
        commission_amount_net NUMERIC(10,4),
        share_rate NUMERIC(5,4) DEFAULT 0.5000,
        creator_payout_amount NUMERIC(10,4),
        occurred_at TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(merchant, session_id, book_id, occurred_at)
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_creator_commissions_creator ON creator_commissions(attributed_creator_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_creator_commissions_status ON creator_commissions(status)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_creator_commissions_type ON creator_commissions(attribution_type)`);
    log.info('creator_commissions table verified');
  } catch (err) {
    log.warn('Could not create creator_commissions table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS site_banners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        badge_text VARCHAR(100),
        button_text VARCHAR(200),
        button_url TEXT,
        bg_color VARCHAR(50) DEFAULT '#247ba0',
        text_color VARCHAR(50) DEFAULT '#ffffff',
        badge_bg_color VARCHAR(50) DEFAULT '#ffe066',
        badge_text_color VARCHAR(50) DEFAULT '#2a2a2a',
        visible BOOLEAN DEFAULT true,
        status VARCHAR(20) DEFAULT 'draft',
        position VARCHAR(20) DEFAULT 'top',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`ALTER TABLE site_banners ADD COLUMN IF NOT EXISTS bg_color VARCHAR(50) DEFAULT '#247ba0'`);
    await queryDB(`ALTER TABLE site_banners ADD COLUMN IF NOT EXISTS text_color VARCHAR(50) DEFAULT '#ffffff'`);
    await queryDB(`ALTER TABLE site_banners ADD COLUMN IF NOT EXISTS badge_bg_color VARCHAR(50) DEFAULT '#ffe066'`);
    await queryDB(`ALTER TABLE site_banners ADD COLUMN IF NOT EXISTS badge_text_color VARCHAR(50) DEFAULT '#2a2a2a'`);
    log.info('Site banners table verified');
  } catch (err) {
    log.warn('Could not verify site_banners table:', err);
  }

  try {
    await queryDB(`ALTER TABLE curators ADD COLUMN IF NOT EXISTS visible_tabs JSONB DEFAULT '{}'::jsonb`);
    log.info('Curators visible_tabs column verified');
  } catch (err) {
    log.warn('Could not verify curators visible_tabs column:', err);
  }

  try {
    await queryDB(`ALTER TABLE awards ADD COLUMN IF NOT EXISTS tag_id INTEGER`);
    await queryDB(`ALTER TABLE awards ADD COLUMN IF NOT EXISTS award_type VARCHAR(50)`);
    await queryDB(`ALTER TABLE awards ADD COLUMN IF NOT EXISTS genre VARCHAR(100)`);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS award_tag_links (
        id SERIAL PRIMARY KEY,
        award_id INTEGER NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL,
        link_type VARCHAR(50) NOT NULL DEFAULT 'award_type',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(award_id, tag_id)
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_award_tag_links_award ON award_tag_links(award_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_award_tag_links_tag ON award_tag_links(tag_id)`);
    log.info('Awards tag_id column and award_tag_links table verified');
  } catch (err) {
    log.warn('Could not add tag_id to awards:', err);
  }

  try {
    await queryDB(`ALTER TABLE public.page_sections ADD COLUMN IF NOT EXISTS max_views INTEGER DEFAULT NULL`);
    await queryDB(`ALTER TABLE public.page_sections ADD COLUMN IF NOT EXISTS max_clicks INTEGER DEFAULT NULL`);
    await queryDB(`ALTER TABLE public.page_sections ADD COLUMN IF NOT EXISTS current_views INTEGER DEFAULT 0`);
    await queryDB(`ALTER TABLE public.page_sections ADD COLUMN IF NOT EXISTS current_clicks INTEGER DEFAULT 0`);
    log.info('page_sections tracking columns verified');
  } catch (err) {
    log.warn('Could not add tracking columns to page_sections:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS tracking_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        bot_user_agents TEXT[] DEFAULT ARRAY[
          'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
          'YandexBot', 'Sogou', 'facebookexternalhit', 'Twitterbot',
          'LinkedInBot', 'WhatsApp', 'Applebot', 'AhrefsBot', 'SemrushBot',
          'MJ12bot', 'DotBot', 'PetalBot', 'UptimeRobot', 'StatusCake',
          'Pingdom', 'GTmetrix', 'PageSpeed', 'Lighthouse', 'HeadlessChrome',
          'PhantomJS', 'Scrapy', 'Python-urllib', 'Go-http-client', 'curl',
          'wget', 'httpie', 'PostmanRuntime', 'insomnia'
        ],
        rate_limit_window_minutes INTEGER DEFAULT 60,
        rate_limit_max_views INTEGER DEFAULT 3,
        rate_limit_max_clicks INTEGER DEFAULT 5,
        excluded_admin_ips TEXT[] DEFAULT ARRAY[]::TEXT[],
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);
    await queryDB(`INSERT INTO tracking_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
    log.info('tracking_settings table verified');
  } catch (err) {
    log.warn('Could not create tracking_settings table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS indie_publishers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        focus TEXT,
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    try { await queryDB('ALTER TABLE indie_publishers ADD COLUMN IF NOT EXISTS focus TEXT'); } catch {}
    const countResult = await queryDB('SELECT COUNT(*) as cnt FROM indie_publishers');
    const bigPublisherNames = ['suhrkamp', 'kiepenheuer & witsch', 'aufbau verlag', 'zsolnay', 'luchterhandt', 'ullstein', 'klett-cotta', 'galiani berlin', 'nagel & kimche', 'tropen verlag', 'blumenbar verlag', 'c.h.beck literatur'];
    const hasOldBigPublishers = await queryDB(
      `SELECT COUNT(*) as cnt FROM indie_publishers WHERE LOWER(name) = ANY($1::text[])`,
      [bigPublisherNames]
    );
    if (parseInt(hasOldBigPublishers.rows[0].cnt) > 0) {
      await queryDB(
        `DELETE FROM indie_publishers WHERE LOWER(name) = ANY($1::text[])`,
        [bigPublisherNames]
      );
      log.info(`Removed ${hasOldBigPublishers.rows[0].cnt} incorrect big publishers from indie_publishers`);
    }
    if (parseInt(countResult.rows[0].cnt) === 0 || parseInt(hasOldBigPublishers.rows[0].cnt) > 0) {
      const defaults: Array<[string, string | null]> = [
        ['8grad Verlag', null], ['Adocs Verlag', null], ['Aisthesis Verlag', null],
        ['Alexander Verlag Berlin', null], ['Arco Verlag', null],
        ['Argument Verlag mit Ariadne', 'Krimi / Feminismus'], ['Ariella Verlag', null],
        ['Assoziation A', 'Politik / Globaler Süden'], ['Aviva Verlag', null],
        ['Bebra Verlag', null], ['Bertz + Fischer', null], ['Büchner-Verlag', null],
        ['ça ira', null], ['Connewitzer Verlagsbuchhandlung', null],
        ['Conte Verlag', null], ['Culturbooks Verlag', null],
        ['Dağyeli Verlag', null], ['Danube Books', null],
        ['Verlag Das Kulturelle Gedächtnis', null], ['Derdiwan Hörbuchverlag', null],
        ['Axel Dielmann Verlag', null], ['Verlag Dreiviertelhaus', null],
        ['Ebersbach & Simon', null], ['Edition A·B·Fischer', null],
        ['Edition Assemblage', null], ['Verlag Edition AV', null],
        ['Edition Bracklo', null], ['Edition Contra-Bass', null],
        ['Edition Converso', null], ['Edition Faust', null],
        ['Edition.Fototapeta', null], ['Edition Frölich', null],
        ['Edition Hibana', null], ['Edition Karo', null],
        ['Edition Nautilus', null], ['Edition Orient', null],
        ['Edition Tiamat', null], ['Edition W', null],
        ['Eisele Verlag', null], ['Elfenbein Verlag', null],
        ['Elif Verlag', null], ['Eta Verlag', null],
        ['Frankfurter Verlagsanstalt', null], ['Friedenauer Presse', null],
        ['Gans Verlag', null], ['Guggolz Verlag', null],
        ['Peter Hammer Verlag', null], ['Ulrike Helmer Verlag', null],
        ['Hentrich & Hentrich Verlag', null], ['hochroth', null],
        ['Interkontinental Verlag', null], ['Jaron Verlag', null],
        ['Jupitermond Verlag', null], ['Kanon Verlag', null],
        ['Karl-May-Verlag', null], ['Kibitz Verlag', null],
        ['Killroy Media Verlag', null], ['Kindermann Verlag', null],
        ['Zu Klampen Verlag', null], ['Kleinheinrich', null],
        ['Klett Kinderbuch Verlag', null], ['Konkursbuch Verlag Claudia Gehrke', null],
        ['Alfred Kröner Verlag', null], ['Kulturverlag Kadmos', null],
        ['Kunstanstifter', null], ['Verlag Antje Kunstmann', null],
        ['Lilienfeld Verlag', null], ['Litradukt', null],
        ['Lukas Verlag', null], ['Mairisch Verlag', null],
        ['Maroverlag', null], ['März Verlag', null],
        ['Mehring Verlag', null], ['Merlin Verlag', null],
        ['mikrotext', null], ['Mirabilis Verlag', null],
        ['Mitteldeutscher Verlag', null], ['Mixtvision Verlag', null],
        ['Neofelis Verlag', null], ['Nonsolo Verlag', null],
        ['Orlanda Verlag', null], ['Palmartpress', null],
        ['Parodos Verlag', null], ['Pendragon Verlag', null],
        ['Poetenladen', null], ['Polar Verlag', null],
        ['Pulp Master', null], ['Querverlag', null],
        ['Verlag Andreas Reiffer', null], ['Reimer Verlag', null],
        ['Reisedepeschen Verlag', null], ['Reprodukt', 'Comic / Graphic Novel'],
        ['Salon Literaturverlag', null], ['Salzgeber Buchverlage', null],
        ['Satyr Verlag', null], ['Verlag Hermann Schmidt', null],
        ['Schöffling & Co.', null], ['Schüren Verlag', null],
        ['Secession Verlag', null],
        ['Sisifo / Leipziger Literaturverlag', null], ['Speak Low', null],
        ['Spector Books', null], ['Starfruit Publications', null],
        ['Stroux Edition', null], ['SuKuLTuR', null],
        ['Theater der Zeit', null], ['Trabantenverlag', null],
        [':transit Buchverlag', null],
        ['Unionsverlag', null], ['Ventil Verlag', null],
        ['Verbrecher Verlag', null], ['Verlag Das Wunderhorn', null],
        ['Verlag für Berlin-Brandenburg', null], ['Verlag Klaus Wagenbach', null],
        ['Verlag Voland & Quist', null], ['Verlag Vorwerk', null],
        ['Verlag Westfälisches Dampfboot', 'Theorie / Sozial'],
        ['Verlagshaus Berlin', null], ['Volk Verlag', null],
        ['VSA: Verlag', null], ['w_orten & meer', 'Antirassismus / Queer'],
        ['Wallstein Verlag', null], ['Wehrhahn Verlag', null],
        ['weissbooks', null], ['parasitenpresse', null],
        ['Berenberg Verlag', null], ['Brinkmann & Bose', null],
        ['Die Andere Bibliothek', null], ['Dittrich Verlag', null],
        ['Dörlemann Verlag', null], ['Droschl Verlag', null],
        ['Edition Fünf', 'Frauenliteratur'], ['Engeler Verlag', null],
        ['Favoritenpresse', null], ['Hablizel Verlag', null],
        ['Haymon Verlag', null], ['Helvetiq', null],
        ['Homunculus Verlag', null], ['Jung und Jung', null],
        ['Kalkutta Verlag', null], ['Karl Rauch Verlag', null],
        ['Kein & Aber', null], ['Kjona Verlag', null],
        ['Klak Verlag', null], ['Kookbooks', null],
        ['Kremayr & Scheriau', null], ['Kunstmann Verlag', null],
        ['Kupido Verlag', null], ['Leibniz Verlag', null],
        ['Lenos Verlag', null], ['Liebeskind', null],
        ['Limbus Verlag', null], ['Louisoder Verlag', null],
        ['Luftschacht Verlag', null], ['Mandelbaum Verlag', 'Politik / Gesellschaft'],
        ['Mare Verlag', null], ['Matthes & Seitz Berlin', null],
        ['Müry Salzmann', null], ['Nordpark Verlag', null],
        ['Osburg Verlag', null], ['Otto Müller Verlag', null],
        ['P. Kirchheim Verlag', null], ['Picus Verlag', null],
        ['Quintus Verlag', null], ['Residenz Verlag', null],
        ['Rogner & Bernhard', null], ['Rotpunktverlag', null],
        ['Rüffer & Rub', null], ['Schiler & Mücke', null],
        ['Topalian & Milani', null], ['Walde+Graf Verlag', null],
        ['Wunderhorn', null], ['Büchergilde Gutenberg', null],
        ['Erik Verlag', null], ['Henrich Editionen', null]
      ];
      for (const [name, focus] of defaults) {
        await queryDB('INSERT INTO indie_publishers (name, focus, source) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET focus = COALESCE(EXCLUDED.focus, indie_publishers.focus)', [name, focus, 'kurt-wolff-stiftung']);
      }
    }
    log.info('indie_publishers table verified');
  } catch (err) {
    log.warn('Could not create indie_publishers table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS selfpublisher_patterns (
        id SERIAL PRIMARY KEY,
        pattern TEXT NOT NULL UNIQUE,
        match_type TEXT DEFAULT 'contains',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const countResult = await queryDB('SELECT COUNT(*) as cnt FROM selfpublisher_patterns');
    if (parseInt(countResult.rows[0].cnt) === 0) {
      const defaults = [
        { pattern: 'BoD', match_type: 'contains' },
        { pattern: 'Books on Demand', match_type: 'contains' },
        { pattern: 'epubli', match_type: 'contains' },
        { pattern: 'tredition', match_type: 'contains' },
        { pattern: 'Nova MD', match_type: 'contains' },
        { pattern: 'Independently published', match_type: 'contains' },
        { pattern: 'Kindle Direct', match_type: 'contains' },
        { pattern: 'CreateSpace', match_type: 'contains' },
      ];
      for (const d of defaults) {
        await queryDB('INSERT INTO selfpublisher_patterns (pattern, match_type) VALUES ($1, $2) ON CONFLICT (pattern) DO NOTHING', [d.pattern, d.match_type]);
      }
    }
    log.info('selfpublisher_patterns table verified');
  } catch (err) {
    log.warn('Could not create selfpublisher_patterns table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS user_modules (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        module_key TEXT NOT NULL,
        granted_by TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, module_key)
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS module_requests (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        module_key TEXT NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      )
    `);
    log.info('user_modules and module_requests tables verified');
  } catch (err) {
    log.warn('Could not create user/module tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS curation_likes (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        curation_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, curation_id)
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS curation_bookmarks (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        curation_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, curation_id)
      )
    `);
    log.info('curation_likes and curation_bookmarks tables verified');
  } catch (err) {
    log.warn('Could not create curation interaction tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS author_profiles (
        id SERIAL PRIMARY KEY,
        user_id TEXT UNIQUE,
        display_name TEXT NOT NULL,
        slug TEXT UNIQUE,
        bio TEXT,
        website TEXT,
        socials JSONB DEFAULT '{}',
        onix_match_name TEXT,
        avatar_url TEXT,
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_author_profiles_user ON author_profiles(user_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_author_profiles_status ON author_profiles(status)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_author_profiles_onix ON author_profiles(onix_match_name)`);

    await queryDB(`
      CREATE TABLE IF NOT EXISTS author_requests (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        requested_name TEXT NOT NULL,
        onix_match_name TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending',
        decision_by TEXT,
        decision_note TEXT,
        decided_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_author_requests_user ON author_requests(user_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_author_requests_status ON author_requests(status)`);

    log.info('author_profiles and author_requests tables verified');
  } catch (err) {
    log.warn('Could not create author tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS curators (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        bio TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        website_url TEXT DEFAULT '',
        instagram_url TEXT DEFAULT '',
        tiktok_url TEXT DEFAULT '',
        youtube_url TEXT DEFAULT '',
        podcast_url TEXT DEFAULT '',
        focus TEXT DEFAULT '',
        visible BOOLEAN DEFAULT true,
        verified BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        visibility VARCHAR(50) DEFAULT 'visible',
        publish_at TIMESTAMPTZ,
        unpublish_at TIMESTAMPTZ,
        user_id UUID,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_curators_slug ON curators(slug)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_curators_user_id ON curators(user_id)`);
    try {
      await queryDB(`ALTER TABLE curators ADD COLUMN IF NOT EXISTS podcast_url TEXT DEFAULT ''`);
      await queryDB(`ALTER TABLE curators ADD COLUMN IF NOT EXISTS user_id TEXT`);
      await queryDB(`ALTER TABLE curators ALTER COLUMN user_id TYPE TEXT`).catch(() => {});
      await queryDB(`ALTER TABLE curators ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT ''`);
    } catch (alterErr) {
      log.warn('Could not alter curators table:', alterErr);
    }
    log.info('curators table verified');
  } catch (err) {
    log.warn('Could not create curators table:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS user_curations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tags TEXT[] DEFAULT '{}',
        is_published BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        curation_type VARCHAR(20) DEFAULT 'manual',
        category_id INTEGER,
        category_label VARCHAR(255),
        tag_rules JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_user_curations_user ON user_curations(user_id)`);
    // Add new columns if they don't exist (for existing tables)
    await queryDB(`ALTER TABLE user_curations ADD COLUMN IF NOT EXISTS curation_type VARCHAR(20) DEFAULT 'manual'`);
    await queryDB(`ALTER TABLE user_curations ADD COLUMN IF NOT EXISTS category_id INTEGER`);
    await queryDB(`ALTER TABLE user_curations ADD COLUMN IF NOT EXISTS category_label VARCHAR(255)`);
    await queryDB(`ALTER TABLE user_curations ADD COLUMN IF NOT EXISTS tag_rules JSONB DEFAULT '{}'`);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS curation_books (
        id SERIAL PRIMARY KEY,
        curation_id INTEGER REFERENCES user_curations(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL,
        display_order INTEGER DEFAULT 0,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(curation_id, book_id)
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_curation_books_curation ON curation_books(curation_id)`);
    await queryDB(`ALTER TABLE curation_books ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`);
    await queryDB(`ALTER TABLE curation_books ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW()`);
    const constraintCheck = await queryDB(`
      SELECT 1 FROM pg_constraint
      WHERE conname = 'curation_books_curation_id_book_id_key'
      AND conrelid = 'curation_books'::regclass
    `);
    if (constraintCheck.rows.length === 0) {
      await queryDB(`ALTER TABLE curation_books ADD CONSTRAINT curation_books_curation_id_book_id_key UNIQUE (curation_id, book_id)`);
      log.info('Added unique constraint to curation_books');
    }
    const badFk = await queryDB(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'curation_books'::regclass
      AND contype = 'f'
      AND conname LIKE '%curations_id%'
    `);
    for (const row of badFk.rows) {
      await queryDB(`ALTER TABLE curation_books DROP CONSTRAINT "${row.conname}"`);
      log.info(`Dropped bad FK constraint: ${row.conname}`);
    }
    const goodFk = await queryDB(`
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'curation_books'::regclass
      AND contype = 'f'
      AND confrelid = 'user_curations'::regclass
    `);
    if (goodFk.rows.length === 0) {
      await queryDB(`DELETE FROM curation_books WHERE curation_id NOT IN (SELECT id FROM user_curations)`);
      await queryDB(`ALTER TABLE curation_books ADD CONSTRAINT curation_books_curation_id_fkey FOREIGN KEY (curation_id) REFERENCES user_curations(id) ON DELETE CASCADE`);
      log.info('Added correct FK constraint to curation_books');
    }
    log.info('user_curations and curation_books tables verified');
  } catch (err) {
    log.warn('Could not create user_curations tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS bookstore_profiles (
        id SERIAL PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE,
        display_name VARCHAR(255),
        tagline VARCHAR(500),
        description TEXT,
        avatar_url TEXT,
        hero_image_url TEXT,
        social_links JSONB DEFAULT '{}',
        address TEXT,
        address_lat DOUBLE PRECISION,
        address_lng DOUBLE PRECISION,
        is_published BOOLEAN DEFAULT false,
        is_physical_store BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_bookstore_profiles_slug ON bookstore_profiles(slug)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_bookstore_profiles_user ON bookstore_profiles(user_id)`);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS bookstore_curation_links (
        id SERIAL PRIMARY KEY,
        bookstore_id INTEGER REFERENCES bookstore_profiles(id) ON DELETE CASCADE,
        curation_id INTEGER REFERENCES user_curations(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        UNIQUE(bookstore_id, curation_id)
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_bcl_bookstore ON bookstore_curation_links(bookstore_id)`);
    log.info('bookstore_profiles and bookstore_curation_links tables verified');
  } catch (err) {
    log.warn('Could not create bookstore tables:', err);
  }

  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS content_reports (
        id SERIAL PRIMARY KEY,
        reporter_id TEXT,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT DEFAULT 'open',
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status)`);
    log.info('content_reports table verified');
  } catch (err) {
    log.warn('Could not create content_reports table:', err);
  }

  try {
    await queryDB(`ALTER TABLE extracted_books ADD COLUMN IF NOT EXISTS cover_url TEXT`);
  } catch (err) {
    log.warn('Could not add cover_url to extracted_books:', err);
  }

  // ==================================================================
  // EVENTS / VERANSTALTUNGEN TABLES
  // ==================================================================
  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS user_events (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) NOT NULL DEFAULT 'lesung',
        location_type VARCHAR(20) NOT NULL DEFAULT 'vor_ort',
        location_name VARCHAR(255),
        location_address TEXT,
        event_date TIMESTAMPTZ NOT NULL,
        event_end_date TIMESTAMPTZ,
        background_image_url TEXT,
        video_link TEXT,
        video_link_public BOOLEAN DEFAULT false,
        entry_fee NUMERIC(10,2) DEFAULT 0,
        entry_fee_currency VARCHAR(10) DEFAULT 'EUR',
        max_participants INTEGER,
        is_recurring BOOLEAN DEFAULT false,
        recurrence_rule VARCHAR(50),
        recurrence_parent_id INTEGER REFERENCES user_events(id) ON DELETE SET NULL,
        rss_source_url TEXT,
        event_page_url TEXT,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(event_date)`);

    // Add columns that may be missing from older table versions
    const missingCols = [
      { col: 'event_page_url', def: 'TEXT' },
      { col: 'rss_source_url', def: 'TEXT' },
      { col: 'video_link', def: 'TEXT' },
      { col: 'video_link_public', def: 'BOOLEAN DEFAULT false' },
      { col: 'background_image_url', def: 'TEXT' },
      { col: 'is_recurring', def: 'BOOLEAN DEFAULT false' },
      { col: 'recurrence_rule', def: 'VARCHAR(50)' },
    ];
    for (const { col, def } of missingCols) {
      try {
        await queryDB(`ALTER TABLE user_events ADD COLUMN IF NOT EXISTS ${col} ${def}`);
      } catch (_) { /* column may already exist */ }
    }

    await queryDB(`
      CREATE TABLE IF NOT EXISTS event_participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        user_display_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'booked',
        booked_at TIMESTAMPTZ DEFAULT NOW(),
        reminder_sent BOOLEAN DEFAULT false,
        UNIQUE(event_id, user_id)
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id)`);

    await queryDB(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'event_reminder',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id)`);

    log.info('user_events, event_participants, and user_notifications tables verified');
  } catch (err) {
    log.warn('Could not create events tables:', err);
  }

  // ==================================================================
  // CATEGORY CARDS TABLE
  // ==================================================================
  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS category_cards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url TEXT,
        link TEXT NOT NULL DEFAULT '',
        color VARCHAR(50) DEFAULT '#247ba0',
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        location VARCHAR(100) DEFAULT 'homepage',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    log.info('category_cards table verified');
  } catch (err) {
    log.warn('Could not create category_cards table:', err);
  }

  try {
    const heroExists = await queryDB(
      `SELECT id FROM page_sections WHERE page_id = 26 AND section_type = 'category_hero' LIMIT 1`
    );
    if (heroExists.rows.length === 0) {
      await queryDB(
        `INSERT INTO page_sections (page_id, zone, sort_order, section_type, config, status, visibility, current_views, current_clicks, created_at, updated_at)
         VALUES (26, 'above_fold', 0, 'category_hero', $1, 'published', 'visible', 0, 0, NOW(), NOW())`,
        [JSON.stringify({
          title: 'Belletristik',
          subtitle: 'Die besten Romane, Erzählungen und literarischen Entdeckungen — kuratiert von unserer Community und Redaktion. Entdecke preisgekrönte Werke, Debüts und verborgene Perlen der deutschsprachigen und internationalen Literatur.',
          backgroundImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80'
        })]
      );
      log.info('category_hero section seeded for Belletristik page');
    }
  } catch (err) {
    log.warn('Could not seed category_hero section:', err);
  }

  // ==================================================================
  // AWARDS TABLES
  // ==================================================================
  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS awards (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        issuer_name TEXT,
        website_url TEXT,
        description TEXT,
        logo_url TEXT,
        country TEXT,
        award_type VARCHAR(50),
        genre VARCHAR(100),
        tag_id INTEGER,
        status TEXT DEFAULT 'active',
        visibility TEXT DEFAULT 'visible',
        display_order INTEGER DEFAULT 0,
        publish_at TIMESTAMPTZ,
        unpublish_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        deleted_by TEXT,
        created_by TEXT,
        updated_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS award_editions (
        id SERIAL PRIMARY KEY,
        award_id INTEGER NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        label TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
        visibility TEXT DEFAULT 'visible',
        display_order INTEGER DEFAULT 0,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        publish_at TIMESTAMPTZ,
        unpublish_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        deleted_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(award_id, year)
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS award_outcomes (
        id SERIAL PRIMARY KEY,
        award_edition_id INTEGER NOT NULL REFERENCES award_editions(id) ON DELETE CASCADE,
        outcome_type TEXT NOT NULL CHECK (outcome_type IN ('winner', 'shortlist', 'longlist', 'nominee', 'finalist', 'special')),
        title TEXT,
        result_status TEXT,
        sort_order INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        publish_status TEXT DEFAULT 'published' CHECK (publish_status IN ('draft', 'scheduled', 'published', 'archived')),
        status TEXT,
        visibility TEXT,
        scheduled_at TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        publish_at TIMESTAMPTZ,
        unpublish_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        deleted_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryDB(`
      CREATE TABLE IF NOT EXISTS award_outcome_recipients (
        id SERIAL PRIMARY KEY,
        award_outcome_id INTEGER NOT NULL REFERENCES award_outcomes(id) ON DELETE CASCADE,
        recipient_type TEXT DEFAULT 'book' CHECK (recipient_type IN ('book', 'person')),
        book_id INTEGER,
        person_id INTEGER,
        recipient_name TEXT,
        role TEXT,
        notes TEXT,
        sort_order INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        visibility TEXT,
        publish_at TIMESTAMPTZ,
        unpublish_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        deleted_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CHECK ((recipient_type = 'book' AND book_id IS NOT NULL) OR (recipient_type = 'person' AND (person_id IS NOT NULL OR recipient_name IS NOT NULL)))
      )
    `);
    log.info('Awards tables verified');
  } catch (err) {
    log.warn('Could not create awards tables:', err);
  }

  try {
    await queryDB(`ALTER TABLE books ADD COLUMN IF NOT EXISTS award_score INTEGER DEFAULT 0`);
    await queryDB(`ALTER TABLE books ADD COLUMN IF NOT EXISTS media_score INTEGER DEFAULT 0`);
    await queryDB(`ALTER TABLE books ADD COLUMN IF NOT EXISTS curation_score INTEGER DEFAULT 0`);
    await queryDB(`ALTER TABLE books ADD COLUMN IF NOT EXISTS structure_bonus INTEGER DEFAULT 0`);
    await queryDB(`ALTER TABLE books ADD COLUMN IF NOT EXISTS base_score INTEGER DEFAULT 0`);
    await queryDB(`ALTER TABLE books ADD COLUMN IF NOT EXISTS user_score REAL DEFAULT 0`);
    await queryDB(`ALTER TABLE books ADD COLUMN IF NOT EXISTS total_score REAL DEFAULT 0`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_books_base_score ON books(base_score DESC NULLS LAST)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_books_total_score ON books(total_score DESC NULLS LAST)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_books_award_score ON books(award_score DESC NULLS LAST)`);
    await queryDB(`CREATE INDEX IF NOT EXISTS idx_books_user_score ON books(user_score DESC NULLS LAST)`);
    log.info('Book score columns and indexes verified');
  } catch (err) {
    log.warn('Could not add book score columns:', err);
  }

  log.info('Schema verification complete');
}

let schemaInitPromise: Promise<void> | null = null;
function getSchemaInit() {
  if (!schemaInitPromise) {
    schemaInitPromise = ensureSchemaReady().catch(err => {
      log.error('Schema initialization failed:', err);
    });
  }
  return schemaInitPromise;
}

interface ConversionInput {
  session_id: string;
  book_id: string;
  isbn?: string;
  merchant: string;
  commission_amount_net: number;
  occurred_at: string;
  external_order_id?: string;
}

interface ConversionResult {
  attributed: boolean;
  commission?: any;
  existing?: boolean;
}

// REFERRAL hat exklusive Priorität; CURATION nur wenn kein Referral existiert
async function attributeConversion(conversion: ConversionInput): Promise<ConversionResult> {
  const { session_id, book_id, isbn, merchant, commission_amount_net, occurred_at, external_order_id } = conversion;

  if (external_order_id) {
    const existing = await queryDB(
      `SELECT * FROM creator_commissions WHERE external_order_id = $1 LIMIT 1`,
      [external_order_id]
    );
    if (existing.rows.length > 0) {
      return { attributed: true, commission: existing.rows[0], existing: true };
    }
  }

  const dedupCheck = await queryDB(
    `SELECT * FROM creator_commissions WHERE merchant = $1 AND session_id = $2 AND book_id = $3 AND occurred_at = $4 LIMIT 1`,
    [merchant, session_id, book_id, occurred_at]
  );
  if (dedupCheck.rows.length > 0) {
    return { attributed: true, commission: dedupCheck.rows[0], existing: true };
  }

  let attribution_type: string | null = null;
  let attributed_creator_id: string | null = null;

  const referralResult = await queryDB(
    `SELECT ref_creator_id FROM referral_sessions WHERE session_id = $1 AND expires_at > NOW() LIMIT 1`,
    [session_id]
  );
  if (referralResult.rows.length > 0) {
    attribution_type = 'REFERRAL';
    attributed_creator_id = referralResult.rows[0].ref_creator_id;
  }

  if (!attribution_type) {
    const curationResult = await queryDB(
      `SELECT curation_owner_creator_id FROM curation_clicks
       WHERE session_id = $1 AND book_id = $2 AND clicked_at > NOW() - INTERVAL '24 hours'
       ORDER BY clicked_at DESC LIMIT 1`,
      [session_id, book_id]
    );
    if (curationResult.rows.length > 0) {
      attribution_type = 'CURATION';
      attributed_creator_id = curationResult.rows[0].curation_owner_creator_id;
    }
  }

  if (!attribution_type || !attributed_creator_id) {
    return { attributed: false };
  }

  const share_rate = 0.5;
  const creator_payout_amount = Number((commission_amount_net * share_rate).toFixed(4));

  const insertResult = await queryDB(
    `INSERT INTO creator_commissions
       (external_order_id, merchant, session_id, book_id, isbn, attribution_type, attributed_creator_id,
        commission_amount_net, share_rate, creator_payout_amount, occurred_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [
      external_order_id || null,
      merchant,
      session_id,
      book_id,
      isbn || null,
      attribution_type,
      attributed_creator_id,
      commission_amount_net,
      share_rate,
      creator_payout_amount,
      occurred_at,
    ]
  );

  if (insertResult.rows.length > 0) {
    return { attributed: true, commission: insertResult.rows[0] };
  }

  const fallback = await queryDB(
    `SELECT * FROM creator_commissions WHERE merchant = $1 AND session_id = $2 AND book_id = $3 AND occurred_at = $4 LIMIT 1`,
    [merchant, session_id, book_id, occurred_at]
  );
  if (fallback.rows.length > 0) {
    return { attributed: true, commission: fallback.rows[0], existing: true };
  }

  return { attributed: false };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  getSchemaInit();

  // ==================================================================
  // AVATAR UPLOAD
  // ==================================================================
  const uploadsDir = path.resolve(process.cwd(), 'client/src/public/uploads/avatars');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `avatar-${uniqueSuffix}${ext}`);
    }
  });

  const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Nur JPG, PNG, WebP und GIF erlaubt'));
      }
    }
  });

  const uploadsRoot = path.resolve(process.cwd(), 'client/src/public/uploads');
  const expressModule = await import('express');
  app.use('/uploads', expressModule.default.static(uploadsRoot));

  app.post('/api/admin/upload/avatar', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      avatarUpload.single('avatar')(req, res, async (err: any) => {
        if (err) {
          log.error('Multer error:', err);
          return res.status(400).json({ ok: false, error: err.message || 'Upload fehlgeschlagen' });
        }

        if (!req.file) {
          return res.status(400).json({ ok: false, error: 'Keine Datei hochgeladen' });
        }

        try {
          const originalPath = req.file.path;
          const webpFilename = req.file.filename.replace(/\.[^.]+$/, '.webp');
          const webpPath = path.join(uploadsDir, webpFilename);

          await sharp(originalPath)
            .webp({ quality: 82 })
            .resize({ width: 512, height: 512, fit: 'cover' })
            .toFile(webpPath);

          if (originalPath !== webpPath) {
            fs.unlinkSync(originalPath);
          }

          const avatarUrl = `/uploads/avatars/${webpFilename}`;
          log.info('Avatar uploaded & converted to WebP:', avatarUrl);

          return res.json({ ok: true, data: { url: avatarUrl } });
        } catch (convErr) {
          log.error('WebP conversion error:', convErr);
          const avatarUrl = `/uploads/avatars/${req.file.filename}`;
          return res.json({ ok: true, data: { url: avatarUrl } });
        }
      });
    } catch (error) {
      log.error('Avatar upload error:', error);
      return res.status(500).json({ ok: false, error: 'Upload fehlgeschlagen' });
    }
  });

  app.post('/api/upload/avatar', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ ok: false, error: 'Nicht authentifiziert' });
      }

      avatarUpload.single('avatar')(req, res, async (err: any) => {
        if (err) {
          log.error('Multer error:', err);
          return res.status(400).json({ ok: false, error: err.message || 'Upload fehlgeschlagen' });
        }

        if (!req.file) {
          return res.status(400).json({ ok: false, error: 'Keine Datei hochgeladen' });
        }

        try {
          const originalPath = req.file.path;
          const webpFilename = req.file.filename.replace(/\.[^.]+$/, '.webp');
          const webpPath = path.join(uploadsDir, webpFilename);

          await sharp(originalPath)
            .webp({ quality: 82 })
            .resize({ width: 512, height: 512, fit: 'cover' })
            .toFile(webpPath);

          if (originalPath !== webpPath) {
            fs.unlinkSync(originalPath);
          }

          const avatarUrl = `/uploads/avatars/${webpFilename}`;
          log.info('User avatar uploaded & converted to WebP:', avatarUrl);

          return res.json({ ok: true, data: { url: avatarUrl } });
        } catch (convErr) {
          log.error('WebP conversion error:', convErr);
          const avatarUrl = `/uploads/avatars/${req.file.filename}`;
          return res.json({ ok: true, data: { url: avatarUrl } });
        }
      });
    } catch (error) {
      log.error('User avatar upload error:', error);
      return res.status(500).json({ ok: false, error: 'Upload fehlgeschlagen' });
    }
  });

  // ==================================================================
  // USER CURATOR PROFILE (accessible without admin auth)
  // ==================================================================
  app.get('/api/user/curator-profile/:curatorId', async (req: Request, res: Response) => {
    try {
      const { curatorId } = req.params;
      const id = parseInt(curatorId, 10);
      if (isNaN(id)) {
        return res.status(400).json({ ok: false, error: 'Invalid curator ID' });
      }
      const result = await queryDB(
        `SELECT * FROM curators WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.json({ ok: true, data: null });
      }
      return res.json({ ok: true, data: mapCuratorRow(result.rows[0]) });
    } catch (error) {
      log.error('Error loading user curator profile:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/user/tab-content-counts/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });

      const [curationsRes, eventsRes] = await Promise.all([
        queryDB(`SELECT COUNT(*) as count FROM user_curations WHERE user_id = $1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
        queryDB(`SELECT COUNT(*) as count FROM user_events WHERE user_id = $1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
      ]);

      return res.json({
        ok: true,
        data: {
          kurationen: parseInt(curationsRes.rows[0]?.count || '0', 10) > 0,
          buchbesprechung: false,
          rezensionen: false,
          bewertungen: false,
          veranstaltungen: parseInt(eventsRes.rows[0]?.count || '0', 10) > 0,
          buchclub: false,
          leseliste: false,
        }
      });
    } catch (error) {
      log.error('Error checking tab content counts:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/user/curator-profile', async (req: Request, res: Response) => {
    try {
      const { curatorId, name, email, bio, focus, avatar_url, socials, userId, visible_tabs } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ ok: false, error: 'Name is required' });
      }

      const emailValue = (email || '').trim();
      const bioValue = (bio || '').trim();
      const focusValue = (focus || '').trim();
      const avatarValue = (avatar_url || '').trim();
      const instagramValue = (socials?.instagram || '').trim();
      const youtubeValue = (socials?.youtube || '').trim();
      const tiktokValue = (socials?.tiktok || '').trim();
      const podcastValue = (socials?.podcast || '').trim();
      const websiteValue = (socials?.website || '').trim();

      const visibleTabsValue = visible_tabs ? JSON.stringify(visible_tabs) : '{}';

      let result;
      if (curatorId) {
        const id = parseInt(curatorId, 10);
        const slug = await generateUniqueSlug('curators', name.trim(), id);
        result = await queryDB(
          `UPDATE curators
           SET name = $1, slug = $2, bio = $3, avatar_url = $4,
               instagram_url = $5, youtube_url = $6, tiktok_url = $7,
               podcast_url = $8, website_url = $9, focus = $10,
               email = $11, visible_tabs = $12::jsonb,
               user_id = COALESCE($14, user_id),
               updated_at = NOW()
           WHERE id = $13 AND deleted_at IS NULL
           RETURNING *`,
          [
            name.trim(), slug, bioValue, avatarValue,
            instagramValue, youtubeValue, tiktokValue,
            podcastValue, websiteValue, focusValue,
            emailValue, visibleTabsValue, id,
            userId || null
          ]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Curator not found' });
        }

        if (userId) {
          try {
            const bpExists = await queryDB(
              `SELECT id FROM bookstore_profiles WHERE user_id = $1 LIMIT 1`,
              [userId]
            );
            if (bpExists.rows.length > 0) {
              await queryDB(
                `UPDATE bookstore_profiles SET slug = $1, display_name = $2, updated_at = NOW() WHERE user_id = $3`,
                [slug, name.trim(), userId]
              );
            } else {
              await queryDB(
                `INSERT INTO bookstore_profiles (user_id, display_name, slug, is_published, created_at, updated_at)
                 VALUES ($1, $2, $3, false, NOW(), NOW())`,
                [userId, name.trim(), slug]
              );
            }
          } catch (syncErr) {
            log.warn('Could not sync curator slug to bookstore_profiles:', syncErr);
          }
        }
      } else {
        const slug = await generateUniqueSlug('curators', name.trim(), null);
        result = await queryDB(
          `INSERT INTO curators (
            name, slug, bio, avatar_url, instagram_url, youtube_url,
            tiktok_url, podcast_url, website_url, focus,
            email, visible_tabs, visible, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, true, 'active', NOW(), NOW())
           RETURNING *`,
          [
            name.trim(), slug, bioValue, avatarValue,
            instagramValue, youtubeValue, tiktokValue,
            podcastValue, websiteValue, focusValue,
            emailValue, visibleTabsValue
          ]
        );

        if (userId) {
          try {
            const bpExists = await queryDB(
              `SELECT id FROM bookstore_profiles WHERE user_id = $1 LIMIT 1`,
              [userId]
            );
            if (bpExists.rows.length > 0) {
              await queryDB(
                `UPDATE bookstore_profiles SET slug = $1, display_name = $2, updated_at = NOW() WHERE user_id = $3`,
                [slug, name.trim(), userId]
              );
            } else {
              await queryDB(
                `INSERT INTO bookstore_profiles (user_id, display_name, slug, is_published, created_at, updated_at)
                 VALUES ($1, $2, $3, false, NOW(), NOW())`,
                [userId, name.trim(), slug]
              );
            }
          } catch (syncErr) {
            log.warn('Could not sync curator slug to bookstore_profiles:', syncErr);
          }
        }
      }

      return res.json({ ok: true, data: mapCuratorRow(result.rows[0]) });
    } catch (error) {
      log.error('Error saving user curator profile:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // TAG IMAGE UPLOAD
  // ==================================================================
  const tagImagesDir = path.resolve(process.cwd(), 'client/src/public/uploads/tags');
  if (!fs.existsSync(tagImagesDir)) {
    fs.mkdirSync(tagImagesDir, { recursive: true });
  }

  const tagImageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tagImagesDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `tag-${uniqueSuffix}${ext}`);
    }
  });

  const tagImageUpload = multer({
    storage: tagImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Nur JPG, PNG, WebP, GIF und SVG erlaubt'));
      }
    }
  });

  app.post('/api/admin/upload/tag-image', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      tagImageUpload.single('image')(req, res, async (err: any) => {
        if (err) {
          log.error('Tag image upload error:', err);
          return res.status(400).json({ ok: false, error: err.message || 'Upload fehlgeschlagen' });
        }

        if (!req.file) {
          return res.status(400).json({ ok: false, error: 'Keine Datei hochgeladen' });
        }

        try {
          const originalPath = req.file.path;
          const webpFilename = req.file.filename.replace(/\.[^.]+$/, '.webp');
          const webpPath = path.join(tagImagesDir, webpFilename);

          await sharp(originalPath)
            .webp({ quality: 85 })
            .resize({ width: 800, height: 800, fit: 'cover', withoutEnlargement: true })
            .toFile(webpPath);

          if (originalPath !== webpPath) {
            fs.unlinkSync(originalPath);
          }

          const imageUrl = `/uploads/tags/${webpFilename}`;
          log.info('Tag image uploaded & converted to WebP:', imageUrl);

          return res.json({ ok: true, data: { url: imageUrl } });
        } catch (convErr) {
          log.error('Tag image WebP conversion error:', convErr);
          const imageUrl = `/uploads/tags/${req.file.filename}`;
          return res.json({ ok: true, data: { url: imageUrl } });
        }
      });
    } catch (error) {
      log.error('Tag image upload error:', error);
      return res.status(500).json({ ok: false, error: 'Upload fehlgeschlagen' });
    }
  });

  // ==================================================================
  // SECTION IMAGE UPLOAD (category cards, etc.) → WebP conversion
  // ==================================================================
  const sectionImagesDir = path.resolve(process.cwd(), 'client/src/public/uploads/sections');
  if (!fs.existsSync(sectionImagesDir)) {
    fs.mkdirSync(sectionImagesDir, { recursive: true });
  }

  const sectionImageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, sectionImagesDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `section-${uniqueSuffix}${ext}`);
    }
  });

  const sectionImageUpload = multer({
    storage: sectionImageStorage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Nur JPG, PNG, WebP und GIF erlaubt'));
      }
    }
  });

  app.post('/api/admin/upload/section-image', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      sectionImageUpload.single('image')(req, res, async (err: any) => {
        if (err) {
          log.error('Section image upload error:', err);
          return res.status(400).json({ ok: false, error: err.message || 'Upload fehlgeschlagen' });
        }

        if (!req.file) {
          return res.status(400).json({ ok: false, error: 'Keine Datei hochgeladen' });
        }

        try {
          const originalPath = req.file.path;
          const webpFilename = req.file.filename.replace(/\.[^.]+$/, '.webp');
          const webpPath = path.join(sectionImagesDir, webpFilename);

          await sharp(originalPath)
            .webp({ quality: 85 })
            .resize({ width: 1280, height: 720, fit: 'cover', withoutEnlargement: true })
            .toFile(webpPath);

          if (originalPath !== webpPath) {
            fs.unlinkSync(originalPath);
          }

          const imageUrl = `/uploads/sections/${webpFilename}`;
          log.info('Section image uploaded & converted to WebP:', imageUrl);

          return res.json({ ok: true, data: { url: imageUrl } });
        } catch (convErr) {
          log.error('Section image WebP conversion error:', convErr);
          const imageUrl = `/uploads/sections/${req.file.filename}`;
          return res.json({ ok: true, data: { url: imageUrl } });
        }
      });
    } catch (error) {
      log.error('Section image upload error:', error);
      return res.status(500).json({ ok: false, error: 'Upload fehlgeschlagen' });
    }
  });

  // ==================================================================
  // TAG IMAGE URL UPDATE (set image_url directly, e.g. from Unsplash)
  // ==================================================================
  app.patch('/api/admin/tags/:id/image', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const { imageUrl } = req.body;

      const result = await queryDB(
        'UPDATE tags SET image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [imageUrl || null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Tag nicht gefunden' });
      }

      return res.json({ ok: true, data: mapTagRow(result.rows[0]) });
    } catch (error) {
      log.error('Tag image update error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // UNSPLASH SEARCH PROXY (Public - simplified for user-facing features)
  // ==================================================================
  app.get('/api/unsplash/search', async (req: Request, res: Response) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      const query = req.query.query as string;
      if (!query?.trim()) return res.json({ success: true, data: [] });

      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) return res.json({ success: true, data: [] });

      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`;
      const unsplashRes = await fetch(unsplashUrl, {
        headers: { 'Authorization': `Client-ID ${accessKey}` }
      });
      if (!unsplashRes.ok) return res.json({ success: true, data: [] });

      const data = await unsplashRes.json();
      const results = (data.results || []).map((photo: any) => ({
        id: photo.id,
        url: photo.urls?.regular || photo.urls?.small || '',
        thumb: photo.urls?.thumb || photo.urls?.small || '',
        alt: photo.alt_description || photo.description || '',
        author: photo.user?.name || '',
        authorUrl: photo.user?.links?.html || '',
      }));
      return res.json({ success: true, data: results });
    } catch {
      return res.json({ success: true, data: [] });
    }
  });

  // ==================================================================
  // UNSPLASH SEARCH PROXY (Admin - detailed)
  // ==================================================================
  app.get('/api/admin/unsplash/search', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 12;

      if (!query || !query.trim()) {
        return res.status(400).json({ ok: false, error: 'Suchbegriff erforderlich' });
      }

      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return res.status(500).json({ ok: false, error: 'Unsplash API-Key nicht konfiguriert' });
      }

      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=squarish`;
      const unsplashRes = await fetch(unsplashUrl, {
        headers: { 'Authorization': `Client-ID ${accessKey}` }
      });

      if (!unsplashRes.ok) {
        const errText = await unsplashRes.text();
        log.error('Unsplash API error:', errText);
        return res.status(unsplashRes.status).json({ ok: false, error: 'Unsplash-Suche fehlgeschlagen' });
      }

      const data = await unsplashRes.json();

      const results = (data.results || []).map((photo: any) => ({
        id: photo.id,
        description: photo.description || photo.alt_description || '',
        urls: {
          thumb: photo.urls?.thumb,
          small: photo.urls?.small,
          regular: photo.urls?.regular,
        },
        user: {
          name: photo.user?.name || '',
          link: photo.user?.links?.html || '',
        },
        downloadLink: photo.links?.download_location,
      }));

      return res.json({
        ok: true,
        data: results,
        total: data.total || 0,
        totalPages: data.total_pages || 0,
      });
    } catch (error) {
      log.error('Unsplash search error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/unsplash/download', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const { downloadLink, photoId } = req.body;

      const accessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return res.status(500).json({ ok: false, error: 'Unsplash API-Key nicht konfiguriert' });
      }

      if (downloadLink) {
        fetch(`${downloadLink}?client_id=${accessKey}`).catch(() => {});
      }

      const photoRes = await fetch(`https://api.unsplash.com/photos/${photoId}`, {
        headers: { 'Authorization': `Client-ID ${accessKey}` }
      });

      if (!photoRes.ok) {
        return res.status(500).json({ ok: false, error: 'Foto konnte nicht abgerufen werden' });
      }

      const photoData = await photoRes.json();
      const imageUrlToDownload = photoData.urls?.regular || photoData.urls?.small;

      if (!imageUrlToDownload) {
        return res.status(500).json({ ok: false, error: 'Keine Bild-URL gefunden' });
      }

      const imgResponse = await fetch(imageUrlToDownload);
      const buffer = Buffer.from(await imgResponse.arrayBuffer());

      const webpFilename = `unsplash-${photoId}-${Date.now()}.webp`;
      const webpPath = path.join(tagImagesDir, webpFilename);

      await sharp(buffer)
        .webp({ quality: 85 })
        .resize({ width: 800, height: 800, fit: 'cover', withoutEnlargement: true })
        .toFile(webpPath);

      const localUrl = `/uploads/tags/${webpFilename}`;
      log.info('Unsplash image downloaded & converted:', localUrl);

      return res.json({
        ok: true,
        data: {
          url: localUrl,
          credit: {
            name: photoData.user?.name || '',
            link: photoData.user?.links?.html || '',
          }
        }
      });
    } catch (error) {
      log.error('Unsplash download error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // HEALTH CHECK
  // ==================================================================
  app.get('/api/health', async (_req: Request, res: Response) => {
    let dbStatus = "not connected";
    let pagesSchema = null;
    let sectionsSchema = null;
    let curatorsSchema = null;

    try {
      await testConnection();
      dbStatus = "connected";

      try {
        const pagesInfo = await queryDB(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'pages'
          ORDER BY ordinal_position
        `);
        pagesSchema = pagesInfo.rows;
      } catch (e) {
        pagesSchema = { error: String(e) };
      }

      try {
        const sectionsInfo = await queryDB(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'sections'
          ORDER BY ordinal_position
        `);
        sectionsSchema = sectionsInfo.rows;
      } catch (e) {
        sectionsSchema = { error: String(e) };
      }

      try {
        const curatorsInfo = await queryDB(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'curators'
          ORDER BY ordinal_position
        `);
        curatorsSchema = curatorsInfo.rows;
      } catch (e) {
        curatorsSchema = { error: String(e) };
      }
    } catch (err) {
      dbStatus = `error: ${err}`;
    }

    return res.json({
      status: "ok",
      version: "v1124-audit-optional",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      schema: {
        pages: pagesSchema,
        sections: sectionsSchema,
        curators: curatorsSchema
      },
      features: {
        autoSlug: true,
        affiliateSystem: true,
        pageResolve: true,
        granularPublish: true,
      },
    });
  });

  app.get('/api/platform-stats', async (_req: Request, res: Response) => {
    try {
      const [booksRes, indieRes, tagsRes] = await Promise.all([
        queryDB('SELECT COUNT(*) as cnt FROM books').catch(() => ({ rows: [{ cnt: 0 }] })),
        queryDB('SELECT COUNT(*) as cnt FROM indie_publishers').catch(() => ({ rows: [{ cnt: 0 }] })),
        queryDB("SELECT COUNT(*) as cnt FROM tags").catch(() => ({ rows: [{ cnt: 0 }] })),
      ]);
      return res.json({
        ok: true,
        stats: {
          totalBooks: parseInt(booksRes.rows[0].cnt) || 0,
          totalIndiePublishers: parseInt(indieRes.rows[0].cnt) || 0,
          totalTags: parseInt(tagsRes.rows[0].cnt) || 0,
        }
      });
    } catch (error) {
      return res.json({ ok: true, stats: { totalBooks: 0, totalIndiePublishers: 0, totalTags: 0 } });
    }
  });

  // ==================================================================
  // REGIONS (Public)
  // ==================================================================
  app.get('/api/regions', async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active !== 'false';
      const query = activeOnly
        ? `SELECT * FROM regions WHERE is_active = true ORDER BY is_default DESC, locale ASC`
        : `SELECT * FROM regions ORDER BY is_default DESC, locale ASC`;
      const result = await queryDB(query);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Error fetching regions:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.get('/api/regions/:locale', async (req: Request, res: Response) => {
    try {
      const { locale } = req.params;
      const result = await queryDB(
        `SELECT * FROM regions WHERE locale = $1`,
        [locale.toLowerCase()]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Region not found' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Error fetching region:', error);
      return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });

  // ==================================================================
  // SITE CONFIG - BANNER (Public)
  // ==================================================================
  app.get('/api/site-config/banner', async (req: Request, res: Response) => {
    try {
      const position = (req.query.position as string) || 'top';

      const result = await queryDB(
        `SELECT id, name, message, badge_text, button_text, button_url, bg_color, text_color, badge_bg_color, badge_text_color, visible, status, position
         FROM site_banners
         WHERE status = 'published' AND visible = true AND position = $1
         ORDER BY display_order DESC, id DESC LIMIT 1`,
        [position]
      );

      if (result.rows.length === 0) {
        if (position === 'top') {
          return res.json({
            ok: true,
            banner: { visible: true, message: 'Diese Seite befindet sich derzeit in der Beta-Phase', badge_text: 'NEU', button_text: null, button_url: null, bg_color: '#247ba0', text_color: '#ffffff', badge_bg_color: '#ffe066', badge_text_color: '#2a2a2a' }
          });
        }
        return res.json({ ok: true, banner: null });
      }

      const banner = result.rows[0];
      return res.json({
        ok: true,
        banner: { id: banner.id, name: banner.name, visible: banner.visible, message: banner.message, badge_text: banner.badge_text, button_text: banner.button_text, button_url: banner.button_url, position: banner.position, bg_color: banner.bg_color || '#247ba0', text_color: banner.text_color || '#ffffff', badge_bg_color: banner.badge_bg_color || '#ffe066', badge_text_color: banner.badge_text_color || '#2a2a2a' }
      });
    } catch (error) {
      log.error('Error fetching banner config:', error);
      const position = (req.query.position as string) || 'top';
      if (position === 'top') {
        return res.json({
          ok: true,
          banner: { visible: true, message: 'Diese Seite befindet sich derzeit in der Beta-Phase', badge_text: 'NEU', button_text: null, button_url: null, bg_color: '#247ba0', text_color: '#ffffff', badge_bg_color: '#ffe066', badge_text_color: '#2a2a2a' }
        });
      }
      return res.json({ ok: true, banner: null });
    }
  });

  // ==================================================================
  // ADMIN AUTH (bcrypt + DB-stored credentials)
  // ==================================================================

  app.get('/api/admin/auth/status', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(`SELECT COUNT(*) as count FROM admin_credentials`);
      const rows = (result?.rows ?? result) as any[];
      const hasCredentials = rows.length > 0 && parseInt(rows[0].count) > 0;
      return res.json({ success: true, initialized: hasCredentials });
    } catch {
      return res.json({ success: true, initialized: false });
    }
  });

  app.post('/api/admin/auth/setup', async (req: Request, res: Response) => {
    try {
      const existing = await queryDB(`SELECT COUNT(*) as count FROM admin_credentials`);
      const existingRows = (existing?.rows ?? existing) as any[];
      if (existingRows.length > 0 && parseInt(existingRows[0].count) > 0) {
        return res.status(403).json({ success: false, error: 'Admin-Passwort ist bereits eingerichtet. Nutze die Passwort-Aendern-Funktion.' });
      }

      const { password, setup_key } = req.body;
      const expectedKey = process.env.SESSION_SECRET;
      if (!expectedKey || setup_key !== expectedKey) {
        return res.status(401).json({ success: false, error: 'Ungueltiger Setup-Schluessel' });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({ success: false, error: 'Passwort muss mindestens 8 Zeichen lang sein' });
      }

      const hash = await bcrypt.hash(password, 12);
      await queryDB(
        `INSERT INTO admin_credentials (username, password_hash, created_at, updated_at)
         VALUES ('admin', $1, NOW(), NOW())`,
        [hash]
      );

      return res.json({ success: true, message: 'Admin-Passwort wurde erfolgreich eingerichtet' });
    } catch (error) {
      log.error('Setup error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/admin/auth/login', async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ success: false, error: 'Passwort ist erforderlich' });
      }

      const result = await queryDB(`SELECT password_hash FROM admin_credentials WHERE username = 'admin' LIMIT 1`);
      const rows = (result?.rows ?? result) as any[];

      if (!rows || rows.length === 0) {
        return res.status(503).json({ success: false, error: 'Admin-Zugang noch nicht eingerichtet', needsSetup: true });
      }

      const isValid = await bcrypt.compare(password, rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Ungueltiges Passwort' });
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await queryDB(
        `INSERT INTO admin_sessions (token, expires_at, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (token) DO UPDATE SET expires_at = $2, updated_at = NOW()`,
        [token, expiresAt]
      );

      return res.json({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        message: 'Login erfolgreich'
      });
    } catch (error) {
      log.error('Login error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/admin/auth/verify', async (req: Request, res: Response) => {
    try {
      const token = (req.headers['x-admin-token'] as string) || req.body?.token || null;
      const isValid = await verifyAdminToken(token);
      return res.json({ ok: true, data: { valid: isValid } });
    } catch (error) {
      return res.status(500).json({ ok: false, error: { message: String(error) } });
    }
  });

  app.post('/api/admin/change-password', async (req: Request, res: Response) => {
    try {
      const token = (req.headers['x-admin-token'] as string) ?? "";
      const isAuthed = await verifyAdminToken(token);
      if (!isAuthed) {
        return res.status(401).json({ ok: false, error: { message: 'Nicht autorisiert' } });
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({ ok: false, error: { message: 'Altes und neues Passwort sind erforderlich' } });
      }

      if (new_password.length < 8) {
        return res.status(400).json({ ok: false, error: { message: 'Neues Passwort muss mindestens 8 Zeichen lang sein' } });
      }

      const result = await queryDB(`SELECT password_hash FROM admin_credentials WHERE username = 'admin' LIMIT 1`);
      const rows = (result?.rows ?? result) as any[];

      if (!rows || rows.length === 0) {
        return res.status(404).json({ ok: false, error: { message: 'Keine Admin-Zugangsdaten gefunden' } });
      }

      const isValid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ ok: false, error: { message: 'Aktuelles Passwort ist falsch' } });
      }

      const newHash = await bcrypt.hash(new_password, 12);
      await queryDB(
        `UPDATE admin_credentials SET password_hash = $1, updated_at = NOW() WHERE username = 'admin'`,
        [newHash]
      );

      return res.json({ ok: true, data: { message: 'Passwort wurde erfolgreich geaendert' } });
    } catch (error) {
      return res.status(500).json({ ok: false, error: { message: String(error) } });
    }
  });

  // ==================================================================
  // NAVIGATION
  // ==================================================================
  app.get('/api/navigation', async (_req: Request, res: Response) => {
    try {
      let result;
      try {
        result = await queryDB('SELECT * FROM get_navigation_v2()', []);
      } catch (funcError) {
        console.warn('get_navigation_v2() function not available, using fallback query');
        result = null;
      }

      if (!result || result.rows.length === 0) {
        const menuItems = await queryDB(
          `SELECT id, name, slug, path, description, icon, parent_id, level, display_order, visible
           FROM menu_items
           WHERE deleted_at IS NULL
             AND status = 'published'
             AND visible = true
           ORDER BY level ASC, display_order ASC`,
          []
        );

        const items = menuItems.rows
          .filter((item: any) => item.level === 0)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            path: item.path || '/',
            description: item.description || '',
            icon: item.icon,
            children: menuItems.rows
              .filter((child: any) => child.parent_id === item.id)
              .map((child: any) => ({
                id: child.id,
                name: child.name,
                slug: child.slug,
                path: child.path || '/',
                description: child.description || '',
                icon: child.icon,
                children: []
              }))
          }));

        return res.json({
          schema_version: "nav-v2",
          content_version: 1,
          items: items,
          meta: {
            generated_at: new Date().toISOString(),
            source: "fallback_query",
            items_count: items.length
          }
        });
      }

      let navData = result.rows[0].get_navigation_v2 || result.rows[0];

      if (typeof navData === 'string') {
        try {
          navData = JSON.parse(navData);
        } catch (parseError) {
          throw new Error('Invalid navigation JSON format');
        }
      }

      return res.json(navData);
    } catch (error) {
      log.error('Navigation fetch error:', error);
      return res.json({
        schema_version: "nav-v2",
        content_version: null,
        items: [],
        meta: { generated_at: new Date().toISOString(), source: "error", error: String(error) }
      });
    }
  });

  app.get('/api/navigation/admin/items', async (_req: Request, res: Response) => {
    try {
      const tableCheck = await queryDB(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'menu_items'
        )`,
        []
      );

      const tableExists = tableCheck.rows[0]?.exists;

      if (!tableExists) {
        return res.json({ success: true, data: [] });
      }

      const columnsResult = await queryDB(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'menu_items'`,
        []
      );

      const existingColumns = columnsResult.rows.map((row: any) => row.column_name);

      const selectClauses: string[] = [];

      if (existingColumns.includes('id')) selectClauses.push('mi.id::int AS id');
      if (existingColumns.includes('parent_id')) selectClauses.push('mi.parent_id::int AS parent_id');

      if (existingColumns.includes('label')) {
        selectClauses.push('mi.label AS name');
      } else if (existingColumns.includes('name')) {
        selectClauses.push('mi.name');
      } else if (existingColumns.includes('path')) {
        selectClauses.push('mi.path AS name');
      } else if (existingColumns.includes('slug')) {
        selectClauses.push('mi.slug AS name');
      } else {
        selectClauses.push(`'Unnamed' AS name`);
      }

      selectClauses.push(existingColumns.includes('slug') ? 'mi.slug' : `'' AS slug`);

      if (existingColumns.includes('path')) {
        selectClauses.push('mi.path');
      } else if (existingColumns.includes('href')) {
        selectClauses.push('mi.href AS path');
      } else {
        selectClauses.push('NULL AS path');
      }

      selectClauses.push(existingColumns.includes('description') ? 'mi.description' : `'' AS description`);
      selectClauses.push(existingColumns.includes('icon') ? 'mi.icon' : `NULL AS icon`);
      selectClauses.push(existingColumns.includes('kind') ? 'mi.kind' : `'link' AS kind`);
      selectClauses.push(existingColumns.includes('location') ? 'mi.location' : `'header' AS location`);
      selectClauses.push(existingColumns.includes('scope') ? 'mi.scope' : `'public' AS scope`);
      selectClauses.push(existingColumns.includes('panel_layout') ? 'mi.panel_layout' : `'none' AS panel_layout`);
      selectClauses.push(existingColumns.includes('clickable') ? 'mi.clickable' : `true AS clickable`);
      selectClauses.push(existingColumns.includes('level') ? 'mi.level' : `0 AS level`);

      if (existingColumns.includes('display_order')) {
        selectClauses.push('mi.display_order');
      } else if (existingColumns.includes('sort_order')) {
        selectClauses.push('mi.sort_order AS display_order');
      } else {
        selectClauses.push('0 AS display_order');
      }

      if (existingColumns.includes('column_id')) {
        selectClauses.push('mi.column_id::int AS column_id');
      } else {
        selectClauses.push('NULL AS column_id');
      }

      selectClauses.push(existingColumns.includes('status') ? 'mi.status' : `'published' AS status`);

      if (existingColumns.includes('visible')) {
        selectClauses.push('mi.visible');
      } else if (existingColumns.includes('is_active')) {
        selectClauses.push('mi.is_active AS visible');
      } else {
        selectClauses.push('true AS visible');
      }

      selectClauses.push(existingColumns.includes('is_active') ? 'mi.is_active' : `true AS is_active`);

      if (existingColumns.includes('created_at')) selectClauses.push('mi.created_at');
      if (existingColumns.includes('updated_at')) selectClauses.push('mi.updated_at');

      if (existingColumns.includes('target_type')) selectClauses.push('mi.target_type');
      if (existingColumns.includes('target_page_id')) selectClauses.push('mi.target_page_id');

      selectClauses.push(`
        COALESCE(
          CASE WHEN mi.target_type = 'page' THEN p.slug END,
          mi.href,
          mi.path
        ) AS href_resolved
      `);

      const whereClause = existingColumns.includes('deleted_at') ? 'WHERE mi.deleted_at IS NULL' : '';

      let orderBy = 'ORDER BY ';
      if (existingColumns.includes('display_order')) {
        orderBy += 'mi.display_order ASC';
      } else if (existingColumns.includes('sort_order')) {
        orderBy += 'mi.sort_order ASC';
      } else {
        orderBy += 'mi.id ASC';
      }
      orderBy += ', mi.id ASC';

      const query = `
        SELECT ${selectClauses.join(', ')}
        FROM menu_items mi
        LEFT JOIN pages p ON mi.target_type = 'page' AND mi.target_page_id = p.id
        ${whereClause}
        ${orderBy}
      `;

      const result = await queryDB(query, []);
      return res.json({ success: true, data: result.rows });
    } catch (error: any) {
      log.error('Navigation admin/items fetch error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || String(error),
        data: []
      });
    }
  });

  app.get('/api/navigation/items', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        `SELECT
          mi.id,
          mi.parent_id,
          COALESCE(mi.name, mi.label) AS name,
          COALESCE(
            CASE WHEN mi.target_type = 'page' THEN p.slug END,
            mi.href,
            mi.path
          ) AS href_resolved,
          COALESCE(mi.display_order, mi.sort_order, 0) AS display_order,
          COALESCE(mi.visible, mi.is_active, true) AS visible,
          mi.target_type,
          mi.target_page_id
        FROM menu_items mi
        LEFT JOIN pages p ON mi.target_type = 'page' AND mi.target_page_id = p.id
        WHERE mi.deleted_at IS NULL
        ORDER BY COALESCE(mi.display_order, mi.sort_order, 0) ASC, mi.id ASC`,
        []
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Navigation items fetch error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.post('/api/navigation/admin/seed-footer', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;
      const columnsResult = await queryDB(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'menu_items'`,
        []
      );
      const existingColumns = columnsResult.rows.map((row: any) => row.column_name);

      if (!existingColumns.includes('location')) {
        await queryDB(`ALTER TABLE menu_items ADD COLUMN location VARCHAR(50) DEFAULT 'header'`, []);
      }
      if (!existingColumns.includes('kind')) {
        await queryDB(`ALTER TABLE menu_items ADD COLUMN kind VARCHAR(50) DEFAULT 'link'`, []);
      }

      const existing = await queryDB(
        `SELECT id FROM menu_items WHERE location = 'footer' AND deleted_at IS NULL LIMIT 1`,
        []
      );
      if (existing.rows.length > 0) {
        return res.json({ success: true, message: 'Footer items already exist', seeded: false });
      }

      const groups = [
        { name: 'Kuratiert', slug: 'footer-kuratiert', order: 1 },
        { name: 'Entdecken', slug: 'footer-entdecken', order: 2 },
        { name: 'Alle Seiten', slug: 'footer-alle-seiten', order: 3 },
      ];

      const groupIds: Record<string, number> = {};
      for (const g of groups) {
        const r = await queryDB(
          `INSERT INTO menu_items (name, label, slug, path, href, kind, location, level, display_order, sort_order, visible, is_active, status, created_at, updated_at)
           VALUES ($1, $2, $3, '', '', 'group', 'footer', 0, $4, $5, true, true, 'published', NOW(), NOW())
           RETURNING id`,
          [g.name, g.name, g.slug, g.order, g.order]
        );
        groupIds[g.slug] = r.rows[0].id;
      }

      const links = [
        { parent: 'footer-kuratiert', name: 'Über uns', slug: 'footer-ueber-uns', path: '/ueber-uns', order: 1 },
        { parent: 'footer-kuratiert', name: 'Mission', slug: 'footer-mission', path: '/mission', order: 2 },
        { parent: 'footer-kuratiert', name: 'FAQ', slug: 'footer-faq', path: '/faq', order: 3 },
        { parent: 'footer-kuratiert', name: 'Admin', slug: 'footer-admin', path: '/sys-mgmt-xK9/login', order: 4, icon: 'Settings' },
        { parent: 'footer-entdecken', name: 'Alle Kurator:innen', slug: 'footer-alle-kuratoren', path: '/curators', order: 1 },
        { parent: 'footer-entdecken', name: 'Alle Kurationen', slug: 'footer-alle-kurationen', path: '/kurationen', order: 2 },
        { parent: 'footer-entdecken', name: 'Alle Bücher', slug: 'footer-alle-buecher', path: '/buecher', order: 3 },
        { parent: 'footer-entdecken', name: 'Alle Events', slug: 'footer-alle-events', path: '/events', order: 4 },
        { parent: 'footer-alle-seiten', name: 'Startseite', slug: 'footer-startseite', path: '/', order: 1 },
        { parent: 'footer-alle-seiten', name: 'Serien', slug: 'footer-serien', path: '/series', order: 2 },
        { parent: 'footer-alle-seiten', name: 'Dashboard', slug: 'footer-dashboard', path: '/dashboard', order: 3 },
      ];

      for (const link of links) {
        await queryDB(
          `INSERT INTO menu_items (parent_id, name, label, slug, path, href, icon, kind, location, level, display_order, sort_order, visible, is_active, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'link', 'footer', 1, $8, $9, true, true, 'published', NOW(), NOW())`,
          [groupIds[link.parent], link.name, link.name, link.slug, link.path, link.path, (link as any).icon || null, link.order, link.order]
        );
      }

      return res.json({ success: true, message: 'Footer navigation seeded', seeded: true, groupIds });
    } catch (error) {
      console.error('Footer seed error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get('/api/navigation/footer', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        `SELECT id, parent_id, name, slug, path, icon, kind, location, display_order, visible
         FROM menu_items
         WHERE deleted_at IS NULL
           AND location = 'footer'
           AND visible = true
           AND status = 'published'
         ORDER BY level ASC, display_order ASC, id ASC`,
        []
      );

      const rows = result.rows;
      const groups = rows
        .filter((r: any) => !r.parent_id)
        .map((group: any) => ({
          id: group.id,
          name: group.name,
          slug: group.slug,
          children: rows
            .filter((child: any) => child.parent_id === group.id)
            .map((child: any) => ({
              id: child.id,
              name: child.name,
              path: child.path || '/',
              icon: child.icon || null,
            }))
        }));

      return res.json({ success: true, data: groups });
    } catch (error) {
      console.error('Footer navigation error:', error);
      return res.json({ success: true, data: [] });
    }
  });

  app.post('/api/navigation/admin/items', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const { id, parent_id, name, path, description, icon, visible, display_order, target_type, target_page_id, location, kind, scope, panel_layout, clickable, level, status } = body;

      if (!name || (typeof name === 'string' && name.trim() === '')) {
        return res.status(400).json({ success: false, error: 'Name is required and cannot be empty' });
      }

      const nameValue = typeof name === 'string' ? name.trim() : String(name);
      const slug = await generateUniqueSlug('menu_items', nameValue, id);
      const locationValue = location || 'header';
      const kindValue = kind || 'link';
      const scopeValue = scope || 'public';
      const panelLayoutValue = panel_layout || 'none';
      const clickableValue = clickable !== false;
      const levelValue = level || 0;
      const statusValue = status === 'published' ? 'published' : 'draft';

      if (id) {
        const displayOrderValue = display_order != null ? display_order : 0;
        const result = await queryDB(
          `UPDATE menu_items
           SET
             parent_id = $1,
             name = $2::varchar,
             label = $3::text,
             slug = $4,
             path = $5::varchar,
             href = $6::text,
             description = $7,
             icon = $8,
             visible = $9,
             is_active = $10,
             display_order = $11,
             sort_order = $12,
             target_type = $13,
             target_page_id = $14,
             location = $16,
             kind = $17,
             scope = $18,
             panel_layout = $19,
             clickable = $20,
             level = $21,
             status = $22,
             updated_at = NOW()
           WHERE id = $15
           RETURNING *`,
          [parent_id, nameValue, nameValue, slug, path, path, description || '', icon || '', visible !== false, visible !== false, displayOrderValue, displayOrderValue, target_type || null, target_page_id || null, id, locationValue, kindValue, scopeValue, panelLayoutValue, clickableValue, levelValue, statusValue]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Item not found' });
        }

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO menu_items (
             parent_id, name, label, slug, path, href, description, icon,
             visible, is_active, display_order, sort_order,
             target_type, target_page_id,
             location, kind, scope, panel_layout, clickable, level,
             status, created_at, updated_at
           )
           VALUES ($1, $2::varchar, $3::text, $4, $5::varchar, $6::text, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
           RETURNING *`,
          [parent_id, nameValue, nameValue, slug, path, path, description || '', icon || '', visible !== false, visible !== false, display_order || 0, display_order || 0, target_type || null, target_page_id || null, locationValue, kindValue, scopeValue, panelLayoutValue, clickableValue, levelValue, statusValue]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Navigation save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/navigation/admin/items/reorder', async (req: Request, res: Response) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Items array is required' });
      }

      for (const item of items) {
        await queryDB(
          `UPDATE menu_items SET display_order = $1, sort_order = $2, parent_id = $3, updated_at = NOW() WHERE id = $4`,
          [item.display_order, item.display_order, item.parent_id ?? null, item.id]
        );
      }

      return res.json({ success: true });
    } catch (error) {
      log.error('Navigation reorder error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/navigation/admin/items/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await queryDB(
        'UPDATE menu_items SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Navigation delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get('/api/navigation/columns/:rootId', async (req: Request, res: Response) => {
    try {
      const rootId = req.params.rootId;
      const result = await queryDB(
        'SELECT * FROM mega_menu_columns WHERE root_menu_item_id = $1 ORDER BY column_order ASC',
        [rootId]
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      return res.json({ success: true, data: [] });
    }
  });

  app.post('/api/navigation/columns', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const { root_menu_item_id, title, column_order } = req.body;
      const result = await queryDB(
        `INSERT INTO mega_menu_columns (root_menu_item_id, title, column_order, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
        [root_menu_item_id, title, column_order]
      );
      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.put('/api/navigation/columns/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const { title, column_order } = req.body;
      const result = await queryDB(
        'UPDATE mega_menu_columns SET title = $1, column_order = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [title, column_order, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/navigation/columns/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const result = await queryDB('DELETE FROM mega_menu_columns WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // CURATION CATEGORIES (from navigation)
  // ==================================================================
  app.get('/api/curation-categories', async (_req: Request, res: Response) => {
    const FALLBACK_CATEGORIES = [
      { id: 1, name: 'Belletristik', label: 'Belletristik', children: [
        { id: 101, name: 'Psychothriller', label: 'Psychothriller' },
        { id: 102, name: 'Gegenwartsliteratur', label: 'Gegenwartsliteratur' },
        { id: 103, name: 'High Fantasy', label: 'High Fantasy' },
        { id: 104, name: 'Science Fiction', label: 'Science Fiction' },
        { id: 105, name: 'Cosy Crime', label: 'Cosy Crime' },
        { id: 106, name: 'Historische Romane', label: 'Historische Romane' },
        { id: 107, name: 'Familienromane', label: 'Familienromane' },
      ]},
      { id: 2, name: 'Sachbuch', label: 'Sachbuch', children: [
        { id: 201, name: 'Fachbuch', label: 'Fachbuch' },
        { id: 202, name: 'Lifestyle', label: 'Lifestyle' },
        { id: 203, name: 'Reise', label: 'Reise' },
        { id: 204, name: 'Ratgeber', label: 'Ratgeber' },
      ]},
      { id: 3, name: 'Kinder & Jugend', label: 'Kinder & Jugend', children: [] },
    ];

    const EXCLUDED_TERMS = [
      'auszeichnungen', 'buchbesprechungen', 'kurator*innen', 'kuratoren', 'kurator:innen',
      'alle bücher', 'alle kuratoren', 'alle kurationen', 'alle bookstores',
      'alle autor:innen', 'alle verlage', 'alle events', 'startseite',
      'alle kurator:innen', 'awards', 'reviews', 'curators', 'storefronts',
    ];

    const isExcluded = (item: any): boolean => {
      const fields = [
        (item.label || '').toLowerCase(),
        (item.name || '').toLowerCase(),
        (item.slug || '').toLowerCase(),
        (item.href || '').toLowerCase(),
      ];
      return fields.some(f => EXCLUDED_TERMS.some(term => f === term || f.includes('/' + term)));
    };

    try {
      let navResult;
      try {
        navResult = await queryDB('SELECT * FROM get_navigation_v2()', []);
      } catch { navResult = null; }

      if (navResult && navResult.rows.length > 0) {
        let navData = navResult.rows[0].get_navigation_v2 || navResult.rows[0];
        if (typeof navData === 'string') navData = JSON.parse(navData);

        const items = navData.items || [];
        const bookCategories = items
          .filter((item: any) => !isExcluded(item))
          .map((item: any) => {
            const children = (item.children || [])
              .filter((c: any) => !isExcluded(c))
              .map((c: any) => ({
                id: c.id,
                name: c.label || c.name || '',
                label: c.label || c.name || '',
              }));
            return {
              id: item.id,
              name: item.label || item.name || '',
              label: item.label || item.name || '',
              children,
            };
          });

        if (bookCategories.length > 0) {
          return res.json({ ok: true, data: bookCategories });
        }
      }

      return res.json({ ok: true, data: FALLBACK_CATEGORIES });
    } catch (error) {
      log.error('Curation categories error:', error);
      return res.json({ ok: true, data: FALLBACK_CATEGORIES });
    }
  });

  // BOOKS - FILTER DATA ENDPOINTS
  // ==================================================================

  app.get('/api/books/filter/authors', async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string) || '';
      const limit = parseInt((req.query.limit as string) || '50');
      let result;
      const authorClean = `author IS NOT NULL AND author != '' AND author NOT LIKE '%<span%' AND author NOT LIKE '%</%' AND author NOT LIKE '(%' AND author NOT LIKE '#%' AND author NOT LIKE '$%' AND author ~ '^[a-zA-ZÀ-ÿ]' AND author NOT LIKE '%;%' AND length(author) > 2 AND length(author) < 100`;
      if (q) {
        result = await queryDB(
          `SELECT DISTINCT author FROM books WHERE ${authorClean} AND author ILIKE $1 ORDER BY author LIMIT $2`,
          [`%${q}%`, limit]
        );
      } else {
        result = await queryDB(
          `SELECT DISTINCT author FROM books WHERE ${authorClean} ORDER BY author LIMIT $1`,
          [limit]
        );
      }
      return res.json({ ok: true, data: result.rows.map((r: any) => r.author) });
    } catch (error) {
      log.error('Books filter authors error:', error);
      return res.status(500).json({ ok: false, error: String(error), data: [] });
    }
  });

  app.get('/api/books/filter/publishers', async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string) || '';
      const limit = parseInt((req.query.limit as string) || '50');
      let result;
      const pubClean = `publisher IS NOT NULL AND publisher != '' AND publisher != '-' AND publisher ~ '^[a-zA-ZÀ-ÿ]' AND length(publisher) > 2 AND length(publisher) < 120`;
      if (q) {
        result = await queryDB(
          `SELECT DISTINCT publisher FROM books WHERE ${pubClean} AND publisher ILIKE $1 ORDER BY publisher LIMIT $2`,
          [`%${q}%`, limit]
        );
      } else {
        result = await queryDB(
          `SELECT DISTINCT publisher FROM books WHERE ${pubClean} ORDER BY publisher LIMIT $1`,
          [limit]
        );
      }
      return res.json({ ok: true, data: result.rows.map((r: any) => r.publisher) });
    } catch (error) {
      log.error('Books filter publishers error:', error);
      return res.status(500).json({ ok: false, error: String(error), data: [] });
    }
  });

  app.get('/api/public/awards-list', async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      let query = `SELECT id, name, country FROM awards WHERE deleted_at IS NULL`;
      const params: any[] = [];
      if (search) {
        params.push(`%${search}%`);
        query += ` AND name ILIKE $1`;
      }
      query += ` ORDER BY name ASC LIMIT 200`;
      const result = await queryDB(query, params);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Public awards list error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.get('/api/public/content-source-names', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        `SELECT DISTINCT source_type, title AS name FROM content_sources WHERE is_active = true ORDER BY title`,
        []
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Public content source names error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  // BOOKS
  // ==================================================================
  async function enrichBooksWithAwards(books: any[]): Promise<any[]> {
    if (books.length === 0) return books;
    try {
      const bookIds = books.map((b: any) => b.id);
      const placeholders = bookIds.map((_: any, i: number) => `$${i + 1}`).join(',');

      let awardDetailMap: Record<number, Array<{ name: string; year?: number; outcome: string }>> = {};
      try {
        const awardRes = await queryDB(
          `SELECT aor.book_id, ao.outcome_type, a.name AS award_name, ae.year AS award_year
           FROM award_outcome_recipients aor
           JOIN award_outcomes ao ON aor.award_outcome_id = ao.id
           JOIN award_editions ae ON ao.award_edition_id = ae.id
           JOIN awards a ON ae.award_id = a.id
           WHERE aor.book_id IN (${placeholders}) AND aor.deleted_at IS NULL`,
          bookIds
        );
        for (const row of awardRes.rows || []) {
          if (!row.book_id) continue;
          if (!awardDetailMap[row.book_id]) awardDetailMap[row.book_id] = [];
          awardDetailMap[row.book_id].push({
            name: row.award_name || 'Literaturpreis',
            year: row.award_year || undefined,
            outcome: row.outcome_type || 'nominee',
          });
        }
      } catch { /* award tables may not exist */ }

      let onixTagMap: Record<number, string[]> = {};
      try {
        const tagRes = await queryDB(
          `SELECT book_id, tag_id FROM book_onix_tags WHERE book_id IN (${placeholders})`,
          bookIds
        );
        for (const row of tagRes.rows || []) {
          if (!onixTagMap[row.book_id]) onixTagMap[row.book_id] = [];
          onixTagMap[row.book_id].push(String(row.tag_id));
        }
      } catch { /* table may not exist */ }

      return books.map((book: any) => ({
        ...book,
        award_details: awardDetailMap[book.id] || [],
        onix_tag_ids: onixTagMap[book.id] || [],
      }));
    } catch (err) {
      log.warn('Book enrichment error (non-fatal):', err);
      return books;
    }
  }

  app.get('/api/books', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || '50'), 200);
      const offset = parseInt((req.query.offset as string) || '0');
      const q = (req.query.q as string) || '';
      const sortValues = ((req.query.sort as string) || 'relevance').split(',').filter(Boolean);
      const sortMode = (req.query.sortMode as string) || 'and';
      const authors = req.query.authors ? (req.query.authors as string).split(',') : [];
      const publishers = req.query.publishers ? (req.query.publishers as string).split(',') : [];
      const awards = req.query.awards ? (req.query.awards as string).split(',') : [];
      const categories = req.query.categories ? (req.query.categories as string).split(',') : [];
      const themes = req.query.themes ? (req.query.themes as string).split(',') : [];
      const curators = req.query.curators ? (req.query.curators as string).split(',') : [];
      const podcasts = req.query.podcasts ? (req.query.podcasts as string).split(',') : [];
      const pubTypes = req.query.pubTypes ? (req.query.pubTypes as string).split(',') : [];

      let query = 'SELECT DISTINCT b.* FROM books b';
      const joins: string[] = [];
      const conditions: string[] = ['b.deleted_at IS NULL'];
      const params: any[] = [];
      let paramIdx = 1;

      if (q) {
        conditions.push(`(b.title ILIKE $${paramIdx} OR b.author ILIKE $${paramIdx} OR b.publisher ILIKE $${paramIdx} OR b.isbn13 ILIKE $${paramIdx})`);
        params.push(`%${q}%`);
        paramIdx++;
      }

      if (authors.length > 0) {
        const authorConditions = authors.map(() => `b.author ILIKE $${paramIdx++}`).join(' OR ');
        conditions.push(`(${authorConditions})`);
        authors.forEach(a => params.push(`%${a}%`));
      }

      if (publishers.length > 0) {
        const pubConditions = publishers.map(() => `b.publisher ILIKE $${paramIdx++}`).join(' OR ');
        conditions.push(`(${pubConditions})`);
        publishers.forEach(p => params.push(`%${p}%`));
      }

      if (awards.length > 0) {
        const awardPlaceholders = awards.map(() => `$${paramIdx++}`).join(',');
        conditions.push(`b.id IN (
          SELECT aor.book_id FROM award_outcome_recipients aor
          JOIN award_outcomes ao ON aor.award_outcome_id = ao.id
          JOIN award_editions ae ON ao.award_edition_id = ae.id
          JOIN awards a ON ae.award_id = a.id
          WHERE aor.book_id IS NOT NULL AND aor.deleted_at IS NULL AND a.name IN (${awardPlaceholders})
        )`);
        awards.forEach(a => params.push(a));
      }

      if (categories.length > 0) {
        const allNumeric = categories.every(c => /^\d+$/.test(c));
        if (allNumeric) {
          const ph1 = categories.map(() => `$${paramIdx++}`).join(',');
          const ph2 = categories.map(() => `$${paramIdx++}`).join(',');
          conditions.push(`(b.id IN (
            SELECT bt.book_id FROM book_tags bt WHERE bt.tag_id IN (${ph1}) AND bt.deleted_at IS NULL
          ) OR b.id IN (
            SELECT bot.book_id FROM book_onix_tags bot WHERE bot.tag_id IN (${ph2})
          ))`);
          categories.forEach(c => params.push(parseInt(c)));
          categories.forEach(c => params.push(parseInt(c)));
        } else {
          const ph1 = categories.map(() => `$${paramIdx++}`).join(',');
          const ph2 = categories.map(() => `$${paramIdx++}`).join(',');
          conditions.push(`(b.id IN (
            SELECT bt.book_id FROM book_tags bt
            JOIN tags t ON bt.tag_id = t.id
            WHERE t.tag_type IN ('genre') AND t.name IN (${ph1}) AND bt.deleted_at IS NULL
          ) OR b.id IN (
            SELECT bot.book_id FROM book_onix_tags bot
            JOIN tags t2 ON bot.tag_id = t2.id
            WHERE t2.name IN (${ph2})
          ))`);
          categories.forEach(c => params.push(c));
          categories.forEach(c => params.push(c));
        }
      }

      if (themes.length > 0) {
        const themePlaceholders = themes.map(() => `$${paramIdx++}`).join(',');
        conditions.push(`b.id IN (
          SELECT bt.book_id FROM book_tags bt
          JOIN tags t ON bt.tag_id = t.id
          WHERE t.tag_type IN ('topic', 'audience', 'feature', 'publisher_cluster') AND t.name IN (${themePlaceholders}) AND bt.deleted_at IS NULL
        )`);
        themes.forEach(t => params.push(t));
      }

      if (curators.length > 0) {
        const curPlaceholders = curators.map(() => `$${paramIdx++}`).join(',');
        conditions.push(`b.id IN (
          SELECT si.book_id FROM section_items si
          JOIN page_sections ps ON si.section_id = ps.id
          JOIN pages p ON ps.page_id = p.id
          JOIN curators c ON CAST(ps.config->>'curatorId' AS INTEGER) = c.id
          WHERE si.book_id IS NOT NULL AND c.name IN (${curPlaceholders})
        )`);
        curators.forEach(c => params.push(c));
      }

      if (podcasts.length > 0) {
        const podPlaceholders = podcasts.map(() => `$${paramIdx++}`).join(',');
        conditions.push(`b.id IN (
          SELECT DISTINCT csb.matched_book_id FROM content_source_books csb
          JOIN content_sources cs ON csb.content_source_id = cs.id
          WHERE csb.matched_book_id IS NOT NULL AND cs.name IN (${podPlaceholders})
        )`);
        podcasts.forEach(p => params.push(p));
      }

      if (pubTypes.length > 0) {
        const pubConditions: string[] = [];
        if (pubTypes.includes('indie')) {
          pubConditions.push(`b.id IN (
            SELECT bk.id FROM books bk
            JOIN indie_publishers ip ON LOWER(bk.publisher) = LOWER(ip.name)
            WHERE bk.deleted_at IS NULL
          )`);
        }
        if (pubTypes.includes('selfpublishing')) {
          pubConditions.push(`b.id IN (
            SELECT bk.id FROM books bk
            JOIN selfpublisher_patterns sp ON (
              (sp.match_type = 'exact' AND LOWER(bk.publisher) = LOWER(sp.pattern))
              OR (sp.match_type != 'exact' AND LOWER(bk.publisher) LIKE '%' || LOWER(sp.pattern) || '%')
            )
            WHERE bk.deleted_at IS NULL
          )`);
        }
        if (pubTypes.includes('debut')) {
          pubConditions.push(`b.structure_bonus >= 2`);
        }
        if (pubConditions.length > 0) {
          conditions.push(`(${pubConditions.join(' OR ')})`);
        }
      }

      const sortFilterConditions: string[] = [];
      const orderParts: string[] = [];

      for (const sort of sortValues) {
        switch (sort) {
          case 'relevance':
            orderParts.push('b.base_score DESC NULLS LAST, b.created_at DESC');
            break;
          case 'newest':
          case 'date':
            orderParts.push('b.created_at DESC');
            break;
          case 'most-awarded':
          case 'awarded':
            sortFilterConditions.push('b.award_count > 0');
            orderParts.push('b.award_score DESC NULLS LAST, b.award_count DESC NULLS LAST');
            break;
          case 'popular':
          case 'popularity':
            orderParts.push('b.user_score DESC NULLS LAST, b.base_score DESC NULLS LAST');
            break;
          case 'hidden-gems':
            sortFilterConditions.push('b.is_hidden_gem = true');
            orderParts.push('b.base_score DESC NULLS LAST');
            break;
          case 'az':
            orderParts.push('b.title ASC');
            break;
        }
      }

      if (sortFilterConditions.length > 0) {
        if (sortMode === 'or') {
          conditions.push(`(${sortFilterConditions.join(' OR ')})`);
        } else {
          sortFilterConditions.forEach(c => conditions.push(c));
        }
      }

      const uniqueOrderParts = [...new Set(orderParts)];
      const orderClause = uniqueOrderParts.length > 0
        ? `ORDER BY ${uniqueOrderParts.join(', ')}`
        : 'ORDER BY b.base_score DESC NULLS LAST, b.created_at DESC';

      const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

      query = `SELECT DISTINCT b.* FROM books b` + joins.join(' ') + whereClause + ` ${orderClause} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
      params.push(limit, offset);

      const result = await queryDB(query, params);
      const enriched = await enrichBooksWithAwards(result.rows || []);

      const countQuery = `SELECT COUNT(DISTINCT b.id) as total FROM books b${joins.join(' ')}${whereClause}`;
      const countParams = params.slice(0, -2);
      let total = enriched.length;
      try {
        const countResult = await queryDB(countQuery, countParams);
        total = parseInt(countResult.rows[0]?.total || '0');
      } catch { /* count query may fail for complex filters */ }

      return res.json({ ok: true, data: enriched, total, limit, offset });
    } catch (error) {
      log.error('Books fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error), data: [] });
    }
  });

  app.get('/api/books/search', async (req: Request, res: Response) => {
    try {
      const q = req.query.q as string;
      const category = req.query.category as string;
      const limit = Math.min(parseInt((req.query.limit as string) || '50'), 200);

      let query = 'SELECT * FROM books WHERE deleted_at IS NULL';
      const params: any[] = [];
      let paramIndex = 1;

      if (q) {
        query += ` AND (title ILIKE $${paramIndex} OR author ILIKE $${paramIndex} OR publisher ILIKE $${paramIndex} OR isbn13 ILIKE $${paramIndex})`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      if (category) {
        query += ` AND (genre ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
        params.push(`%${category}%`);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await queryDB(query, params);
      const enriched = await enrichBooksWithAwards(result.rows || []);
      return res.json({ ok: true, data: enriched });
    } catch (error) {
      log.error('Books search error:', error);
      return res.status(500).json({ ok: false, error: String(error), data: [] });
    }
  });

  app.post('/api/books/resolve-by-tags', async (req: Request, res: Response) => {
    try {
      const { includeAll, includeAny, exclude, category, maxYearsAgo, awardIds, awardOutcome, limit: reqLimit } = req.body;
      const bookLimit = parseInt(reqLimit || '50');

      const colCheck = await queryDB(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'books' AND table_schema = 'public'`, []
      );
      const cols = new Set(colCheck.rows.map((r: any) => r.column_name));
      const hasGenre = cols.has('genre');
      const hasTags = cols.has('tags');
      const hasCategory = cols.has('category');
      const hasAuthor = cols.has('author');
      const hasTitle = cols.has('title');
      const hasPublicationDate = cols.has('publication_date');
      const hasPublishedDate = cols.has('published_date');
      const hasYear = cols.has('year');
      const hasCreatedAt = cols.has('created_at');

      if (cols.size === 0) {
        return res.json({ ok: true, data: [], count: 0 });
      }

      const buildTagMatch = (paramIdx: number): string => {
        const parts: string[] = [];
        if (hasGenre) parts.push(`b.genre ILIKE $${paramIdx}`);
        if (hasTags) parts.push(`b.tags::text ILIKE $${paramIdx}`);
        if (hasAuthor) parts.push(`b.author ILIKE $${paramIdx}`);
        if (hasTitle) parts.push(`b.title ILIKE $${paramIdx}`);
        return parts.length > 0 ? `(${parts.join(' OR ')})` : 'TRUE';
      };

      let query = 'SELECT DISTINCT b.* FROM books b';
      const joins: string[] = [];
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (Array.isArray(awardIds) && awardIds.length > 0) {
        joins.push(`
          JOIN award_outcome_recipients aor ON aor.book_id = b.id AND aor.deleted_at IS NULL
          JOIN award_outcomes ao ON aor.award_outcome_id = ao.id AND ao.deleted_at IS NULL
          JOIN award_editions ae ON ao.award_edition_id = ae.id AND ae.deleted_at IS NULL
          JOIN awards aw ON ae.award_id = aw.id AND aw.deleted_at IS NULL
        `);
        const awardPlaceholders = awardIds.map((_: any) => {
          params.push(parseInt(_));
          return `$${paramIndex++}`;
        });
        conditions.push(`aw.id IN (${awardPlaceholders.join(', ')})`);

        if (awardOutcome && awardOutcome !== 'all') {
          conditions.push(`ao.outcome_type = $${paramIndex}`);
          params.push(awardOutcome);
          paramIndex++;
        }
      }

      if (Array.isArray(includeAll) && includeAll.length > 0) {
        for (const tag of includeAll) {
          conditions.push(buildTagMatch(paramIndex));
          params.push(`%${tag}%`);
          paramIndex++;
        }
      }

      if (Array.isArray(includeAny) && includeAny.length > 0) {
        const orConds = includeAny.map(tag => {
          const cond = buildTagMatch(paramIndex);
          params.push(`%${tag}%`);
          paramIndex++;
          return cond;
        });
        conditions.push(`(${orConds.join(' OR ')})`);
      }

      if (Array.isArray(exclude) && exclude.length > 0) {
        for (const tag of exclude) {
          conditions.push(`NOT ${buildTagMatch(paramIndex)}`);
          params.push(`%${tag}%`);
          paramIndex++;
        }
      }

      if (category && (hasGenre || hasCategory)) {
        const catParts: string[] = [];
        if (hasGenre) catParts.push(`b.genre ILIKE $${paramIndex}`);
        if (hasCategory) catParts.push(`b.category ILIKE $${paramIndex}`);
        conditions.push(`(${catParts.join(' OR ')})`);
        params.push(`%${category}%`);
        paramIndex++;
      }

      if (maxYearsAgo && parseInt(maxYearsAgo) > 0) {
        const minYear = new Date().getFullYear() - parseInt(maxYearsAgo);
        const minDate = `${minYear}-01-01`;
        if (hasPublicationDate) {
          conditions.push(`b.publication_date >= $${paramIndex}::date`);
          params.push(minDate);
          paramIndex++;
        } else if (hasPublishedDate) {
          conditions.push(`b.published_date >= $${paramIndex}::date`);
          params.push(minDate);
          paramIndex++;
        } else if (hasYear) {
          conditions.push(`b.year >= $${paramIndex}`);
          params.push(minYear);
          paramIndex++;
        } else if (hasCreatedAt) {
          conditions.push(`b.created_at >= $${paramIndex}::date`);
          params.push(minDate);
          paramIndex++;
        }
      }

      const joinStr = joins.length > 0 ? ' ' + joins.join(' ') : '';
      const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      query += `${joinStr}${where} ORDER BY b.created_at DESC LIMIT ${bookLimit}`;

      const result = await queryDB(query, params);
      return res.json({ ok: true, data: result.rows, count: result.rows.length });
    } catch (error) {
      log.error('Resolve books by tags error:', error);
      return res.json({ ok: true, data: [], count: 0 });
    }
  });

  // ==================================================================
  // AUTHOR VERIFICATION WORKFLOW
  // ==================================================================

  app.get('/api/authors/search-onix', async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q || q.length < 2) {
        return res.json({ ok: true, data: [] });
      }
      const result = await queryDB(
        `SELECT DISTINCT author as name, COUNT(*) as book_count
         FROM books
         WHERE author IS NOT NULL AND author != '' AND author ILIKE $1
         GROUP BY author
         ORDER BY COUNT(*) DESC
         LIMIT 20`,
        [`%${q}%`]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Author ONIX search error:', error);
      return res.status(500).json({ ok: false, error: 'Suche fehlgeschlagen' });
    }
  });

  app.post('/api/author-requests', async (req: Request, res: Response) => {
    try {
      const { userId, requestedName, onixMatchName, message } = req.body;
      if (!userId || !requestedName) {
        return res.status(400).json({ ok: false, error: 'userId und requestedName sind erforderlich' });
      }

      const existing = await queryDB(
        `SELECT id, status FROM author_requests WHERE user_id = $1 AND status IN ('pending', 'approved') LIMIT 1`,
        [userId]
      );
      if (existing.rows.length > 0) {
        const st = existing.rows[0].status;
        if (st === 'pending') {
          return res.status(409).json({ ok: false, error: 'Du hast bereits einen offenen Antrag.' });
        }
        if (st === 'approved') {
          return res.status(409).json({ ok: false, error: 'Dein Autoren-Zugang wurde bereits freigeschaltet.' });
        }
      }

      const result = await queryDB(
        `INSERT INTO author_requests (user_id, requested_name, onix_match_name, message)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, requestedName.trim(), onixMatchName?.trim() || null, message?.trim() || null]
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Author request error:', error);
      return res.status(500).json({ ok: false, error: 'Antrag konnte nicht erstellt werden' });
    }
  });

  app.get('/api/author-requests/status', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId erforderlich' });
      }
      const result = await queryDB(
        `SELECT * FROM author_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (result.rows.length === 0) {
        return res.json({ ok: true, data: null });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Author request status error:', error);
      return res.status(500).json({ ok: false, error: 'Status konnte nicht abgerufen werden' });
    }
  });

  app.get('/api/admin/author-requests', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const status = (req.query.status as string) || 'pending';
      const result = await queryDB(
        `SELECT * FROM author_requests WHERE status = $1 ORDER BY created_at DESC`,
        [status]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Admin author requests error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/author-requests/:id/approve', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const requestId = parseIdParam(req.params.id);
      if (!requestId) return res.status(400).json({ ok: false, error: 'Ungültige ID' });

      const { note } = req.body || {};

      const reqResult = await queryDB(
        `SELECT * FROM author_requests WHERE id = $1`,
        [requestId]
      );
      if (reqResult.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Antrag nicht gefunden' });
      }
      const authorReq = reqResult.rows[0];
      if (authorReq.status !== 'pending') {
        return res.status(400).json({ ok: false, error: 'Antrag ist nicht mehr offen' });
      }

      await queryDB(
        `UPDATE author_requests SET status = 'approved', decision_by = 'admin', decision_note = $1, decided_at = NOW() WHERE id = $2`,
        [note || null, requestId]
      );

      const displayName = authorReq.onix_match_name || authorReq.requested_name;
      const slug = await generateUniqueSlug('author_profiles', displayName);

      const existingProfile = await queryDB(
        `SELECT id FROM author_profiles WHERE user_id = $1 LIMIT 1`,
        [authorReq.user_id]
      );
      if (existingProfile.rows.length === 0) {
        await queryDB(
          `INSERT INTO author_profiles (user_id, display_name, slug, onix_match_name, status)
           VALUES ($1, $2, $3, $4, 'active')`,
          [authorReq.user_id, displayName, slug, authorReq.onix_match_name || null]
        );
      }

      const authorModules = [
        'author_storefront', 'author_books', 'author_community',
        'author_bookclub', 'author_members', 'author_bonuscontent',
        'author_newsletter', 'author_events', 'author_statistics'
      ];
      for (const moduleKey of authorModules) {
        await queryDB(
          `INSERT INTO user_modules (user_id, module_key, granted_by, notes)
           VALUES ($1, $2, 'admin', 'Autoren-Freischaltung')
           ON CONFLICT (user_id, module_key) DO NOTHING`,
          [authorReq.user_id, moduleKey]
        );
      }

      return res.json({ ok: true, message: 'Autoren-Zugang freigeschaltet' });
    } catch (error) {
      log.error('Approve author error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/author-requests/:id/reject', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const requestId = parseIdParam(req.params.id);
      if (!requestId) return res.status(400).json({ ok: false, error: 'Ungültige ID' });

      const { note } = req.body || {};

      const reqResult = await queryDB(
        `SELECT status FROM author_requests WHERE id = $1`,
        [requestId]
      );
      if (reqResult.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Antrag nicht gefunden' });
      }
      if (reqResult.rows[0].status !== 'pending') {
        return res.status(400).json({ ok: false, error: 'Antrag ist nicht mehr offen' });
      }

      await queryDB(
        `UPDATE author_requests SET status = 'rejected', decision_by = 'admin', decision_note = $1, decided_at = NOW() WHERE id = $2`,
        [note || null, requestId]
      );

      return res.json({ ok: true, message: 'Antrag abgelehnt' });
    } catch (error) {
      log.error('Reject author error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/user-modules', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId erforderlich' });
      }
      const result = await queryDB(
        `SELECT module_key, granted_by, created_at FROM user_modules WHERE user_id = $1`,
        [userId]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('User modules error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // AWARDS
  // ==================================================================
  app.get('/api/awards/tag-options', async (_req: Request, res: Response) => {
    try {
      const typeTagsResult = await queryDB(
        `SELECT id, name, slug FROM tags WHERE tag_type = 'award_type' AND (deleted_at IS NULL) ORDER BY name ASC`, []
      );
      const genreTagsResult = await queryDB(
        `SELECT id, name, slug FROM tags WHERE tag_type = 'award_genre' AND (deleted_at IS NULL) ORDER BY name ASC`, []
      );
      return res.json({
        ok: true,
        award_types: typeTagsResult.rows,
        award_genres: genreTagsResult.rows,
      });
    } catch (error) {
      return res.json({ ok: true, award_types: [], award_genres: [] });
    }
  });

  app.get('/api/awards', async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      const sortBy = (req.query.sort as string) || 'name';
      const awardTypeTagId = (req.query.award_type_tag_id as string) || '';
      const genreTagId = (req.query.genre_tag_id as string) || '';
      const country = (req.query.country as string) || '';

      const conditions: string[] = [];
      const params: any[] = [];

      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(a.name ILIKE $${params.length} OR a.slug ILIKE $${params.length} OR a.issuer_name ILIKE $${params.length})`);
      }
      if (awardTypeTagId) {
        params.push(parseInt(awardTypeTagId));
        conditions.push(`EXISTS (SELECT 1 FROM award_tag_links atl WHERE atl.award_id = a.id AND atl.tag_id = $${params.length} AND atl.link_type = 'award_type')`);
      }
      if (genreTagId) {
        params.push(parseInt(genreTagId));
        conditions.push(`EXISTS (SELECT 1 FROM award_tag_links atl WHERE atl.award_id = a.id AND atl.tag_id = $${params.length} AND atl.link_type = 'award_genre')`);
      }
      if (country) {
        params.push(country);
        conditions.push(`a.country = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      let orderClause = 'ORDER BY a.name ASC';
      if (sortBy === 'updated') orderClause = 'ORDER BY a.updated_at DESC NULLS LAST';
      else if (sortBy === 'created') orderClause = 'ORDER BY a.created_at DESC NULLS LAST';
      else if (sortBy === 'country') orderClause = 'ORDER BY a.country ASC NULLS LAST, a.name ASC';

      const result = await queryDB(`
        SELECT a.*,
          (SELECT count(*) FROM award_editions ae WHERE ae.award_id = a.id) as editions_count
        FROM awards a
        ${whereClause}
        ${orderClause}
      `, params);

      const tagLinksResult = await queryDB(
        `SELECT atl.award_id, atl.tag_id, atl.link_type, t.name as tag_name, t.slug as tag_slug
         FROM award_tag_links atl
         JOIN tags t ON t.id = atl.tag_id
         ORDER BY t.name ASC`, []
      );

      const tagLinksMap: Record<number, { award_types: any[], award_genres: any[] }> = {};
      for (const link of tagLinksResult.rows) {
        if (!tagLinksMap[link.award_id]) {
          tagLinksMap[link.award_id] = { award_types: [], award_genres: [] };
        }
        const entry = { id: link.tag_id, name: link.tag_name, slug: link.tag_slug };
        if (link.link_type === 'award_type') {
          tagLinksMap[link.award_id].award_types.push(entry);
        } else if (link.link_type === 'award_genre') {
          tagLinksMap[link.award_id].award_genres.push(entry);
        }
      }

      const countriesResult = await queryDB(
        `SELECT DISTINCT country FROM awards WHERE country IS NOT NULL AND country != '' ORDER BY country ASC`, []
      );
      const countries = countriesResult.rows.map((r: any) => r.country);

      const mapped = result.rows.map((row: any) => ({
        ...row,
        visible: row.visibility !== 'hidden',
        linked_award_types: tagLinksMap[row.id]?.award_types || [],
        linked_award_genres: tagLinksMap[row.id]?.award_genres || [],
      }));
      return res.json({
        ok: true,
        data: mapped,
        total: mapped.length,
        facets: { countries }
      });
    } catch (error) {
      log.error('Awards list error:', error);
      return res.json({ ok: true, data: [], total: 0, facets: { countries: [] } });
    }
  });

  app.post('/api/awards/ensure-tag', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const { name, link_type } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }
      const tagType = link_type === 'award_genre' ? 'award_genre' : 'award_type';
      const tagColor = tagType === 'award_type' ? '#4A90D9' : '#2ECC71';

      const existing = await queryDB(
        `SELECT id, name, slug FROM tags WHERE tag_type = $1 AND LOWER(name) = LOWER($2) AND deleted_at IS NULL LIMIT 1`,
        [tagType, name.trim()]
      );
      if (existing.rows.length > 0) {
        return res.json({ success: true, tag: existing.rows[0], created: false });
      }

      const tagSlug = await generateUniqueSlug('tags', name.trim());
      const result = await queryDB(
        `INSERT INTO tags (name, slug, color, tag_type, visible, scope, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, 'book', 'award-auto', NOW(), NOW())
         RETURNING id, name, slug`,
        [name.trim(), tagSlug, tagColor, tagType]
      );
      log.info(`Auto-created ${tagType} tag: "${name.trim()}" (id=${result.rows[0].id})`);
      return res.json({ success: true, tag: result.rows[0], created: true });
    } catch (error) {
      log.error('Ensure award tag error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/awards', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const body = req.body;
      const { id, name, issuer_name, website_url, description, logo_url, country } = body;
      const awardTypeTagIds: number[] = Array.isArray(body.award_type_tag_ids) ? body.award_type_tag_ids : [];
      const awardGenreTagIds: number[] = Array.isArray(body.award_genre_tag_ids) ? body.award_genre_tag_ids : [];

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      const slug = await generateUniqueSlug('awards', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE awards
           SET name = $1, slug = $2, issuer_name = $3, website_url = $4,
               description = $5, logo_url = $6, country = $7, updated_at = NOW()
           WHERE id = $8
           RETURNING *`,
          [name.trim(), slug, issuer_name || null, website_url || null, description || null, logo_url || null, country || null, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Award not found' });
        }

        const award = result.rows[0];
        if (award.tag_id) {
          try {
            await queryDB(
              `UPDATE tags SET name = $1, updated_at = NOW() WHERE id = $2`,
              [name.trim(), award.tag_id]
            );
          } catch (syncErr) {
            log.warn('Could not sync tag name for award:', syncErr);
          }
        }

        await queryDB(`DELETE FROM award_tag_links WHERE award_id = $1`, [id]);
        for (const tagId of awardTypeTagIds) {
          await queryDB(
            `INSERT INTO award_tag_links (award_id, tag_id, link_type) VALUES ($1, $2, 'award_type') ON CONFLICT (award_id, tag_id) DO NOTHING`,
            [id, tagId]
          );
        }
        for (const tagId of awardGenreTagIds) {
          await queryDB(
            `INSERT INTO award_tag_links (award_id, tag_id, link_type) VALUES ($1, $2, 'award_genre') ON CONFLICT (award_id, tag_id) DO NOTHING`,
            [id, tagId]
          );
        }

        return res.json({ success: true, data: award });
      } else {
        const tagSlug = await generateUniqueSlug('tags', name);
        const tagResult = await queryDB(
          `INSERT INTO tags (name, slug, color, tag_type, visible, scope, source, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING *`,
          [name.trim(), tagSlug, '#FFD700', 'award', true, 'book', 'award-auto']
        );
        const newTag = tagResult.rows[0];

        const result = await queryDB(
          `INSERT INTO awards (name, slug, issuer_name, website_url, description, logo_url, country, tag_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           RETURNING *`,
          [name.trim(), slug, issuer_name || null, website_url || null, description || null, logo_url || null, country || null, newTag.id]
        );
        const newAward = result.rows[0];
        log.info(`Award "${name}" created with auto-linked tag id=${newTag.id}`);

        for (const tagId of awardTypeTagIds) {
          await queryDB(
            `INSERT INTO award_tag_links (award_id, tag_id, link_type) VALUES ($1, $2, 'award_type') ON CONFLICT (award_id, tag_id) DO NOTHING`,
            [newAward.id, tagId]
          );
        }
        for (const tagId of awardGenreTagIds) {
          await queryDB(
            `INSERT INTO award_tag_links (award_id, tag_id, link_type) VALUES ($1, $2, 'award_genre') ON CONFLICT (award_id, tag_id) DO NOTHING`,
            [newAward.id, tagId]
          );
        }

        return res.json({ success: true, data: newAward });
      }
    } catch (error) {
      log.error('Award save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/awards/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const awardResult = await queryDB('SELECT tag_id FROM awards WHERE id = $1', [id]);
      const tagId = awardResult.rows[0]?.tag_id;

      const result = await queryDB('DELETE FROM awards WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Award not found' });
      }

      if (tagId) {
        try {
          await queryDB('DELETE FROM tags WHERE id = $1', [tagId]);
          log.info(`Deleted linked tag id=${tagId} for award id=${id}`);
        } catch (tagErr) {
          log.warn('Could not delete linked tag:', tagErr);
        }
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Award delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.patch('/api/awards/:id/visibility', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const { visible } = req.body;

      const awardResult = await queryDB('SELECT tag_id FROM awards WHERE id = $1', [id]);
      if (awardResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Award not found' });
      }

      const tagId = awardResult.rows[0]?.tag_id;

      await queryDB(
        'UPDATE awards SET visibility = $1, updated_at = NOW() WHERE id = $2',
        [visible === true ? 'visible' : 'hidden', id]
      );

      if (tagId) {
        await queryDB(
          'UPDATE tags SET visible = $1, updated_at = NOW() WHERE id = $2',
          [visible === true, tagId]
        );
      }

      return res.json({ success: true, data: { id, visible, tag_id: tagId } });
    } catch (error) {
      log.error('Award visibility toggle error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Flat endpoint: all editions across all awards (for Page Composer picker)
  app.get('/api/award_editions', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        `SELECT e.id, e.award_id, e.year, e.label, e.status,
                a.name AS award_name, a.visibility AS award_visibility
         FROM award_editions e
         JOIN awards a ON e.award_id = a.id
         ORDER BY a.name ASC, e.year DESC`,
        []
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      log.error('Award editions fetch error:', error);
      return res.status(500).json({ success: false, error: 'Fehler beim Laden der Auszeichnungs-Jahrgänge' });
    }
  });

  // Editions
  app.get('/api/awards/:awardId/editions', async (req: Request, res: Response) => {
    try {
      const awardId = req.params.awardId;
      const result = await queryDB(
        'SELECT * FROM award_editions WHERE award_id = $1 ORDER BY year DESC',
        [awardId]
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      return res.json({ success: true, data: [] });
    }
  });

  app.post('/api/awards/:awardId/editions', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;
      const awardId = req.params.awardId;
      const body = req.body;
      const { id, year, theme, notes } = body;

      if (!year) {
        return res.status(400).json({ success: false, error: 'Year is required' });
      }

      if (id) {
        const result = await queryDB(
          `UPDATE award_editions
           SET year = $1, theme = $2, notes = $3, updated_at = NOW()
           WHERE id = $4 AND award_id = $5
           RETURNING *`,
          [year, theme || null, notes || null, id, awardId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Edition not found' });
        }

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO award_editions (award_id, year, theme, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [awardId, year, theme || null, notes || null]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Edition save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/awards/:awardId/editions/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;
      const id = req.params.id;
      const awardId = req.params.awardId;
      const result = await queryDB(
        'DELETE FROM award_editions WHERE id = $1 AND award_id = $2 RETURNING id',
        [id, awardId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Edition not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Edition delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Outcomes
  app.get('/api/awards/:awardId/editions/:editionId/outcomes', async (req: Request, res: Response) => {
    try {
      const editionId = req.params.editionId;
      const result = await queryDB(
        'SELECT * FROM award_outcomes WHERE award_edition_id = $1 ORDER BY display_order ASC',
        [editionId]
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      return res.json({ success: true, data: [] });
    }
  });

  app.post('/api/awards/:awardId/editions/:editionId/outcomes', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;
      const editionId = req.params.editionId;
      const body = req.body;
      const { id, name, display_order, result_status, announced_at, notes } = body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      if (id) {
        const result = await queryDB(
          `UPDATE award_outcomes
           SET name = $1, display_order = $2, result_status = $3, announced_at = $4, notes = $5, updated_at = NOW()
           WHERE id = $6 AND award_edition_id = $7
           RETURNING *`,
          [name, display_order || 0, result_status || 'confirmed', announced_at || null, notes || null, id, editionId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Outcome not found' });
        }

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO award_outcomes (award_edition_id, name, display_order, result_status, announced_at, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING *`,
          [editionId, name, display_order || 0, result_status || 'confirmed', announced_at || null, notes || null]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Outcome save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/awards/:awardId/editions/:editionId/outcomes/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;
      const id = req.params.id;
      const editionId = req.params.editionId;
      const result = await queryDB(
        'DELETE FROM award_outcomes WHERE id = $1 AND award_edition_id = $2 RETURNING id',
        [id, editionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Outcome not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Outcome delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Recipients
  app.get('/api/awards/:awardId/editions/:editionId/outcomes/:outcomeId/recipients', async (req: Request, res: Response) => {
    try {
      const outcomeId = req.params.outcomeId;
      const result = await queryDB(
        `SELECT
           r.*,
           b.title AS book_title,
           b.author AS book_author,
           p.name AS person_name
         FROM award_recipients r
         LEFT JOIN books b ON r.book_id = b.id
         LEFT JOIN persons p ON r.person_id = p.id
         WHERE r.award_outcome_id = $1
         ORDER BY r.created_at ASC`,
        [outcomeId]
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      return res.json({ success: true, data: [] });
    }
  });

  app.post('/api/awards/:awardId/editions/:editionId/outcomes/:outcomeId/recipients', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;
      const outcomeId = req.params.outcomeId;
      const body = req.body;
      const { recipient_kind, book_id, person_id, notes } = body;

      if (!recipient_kind) {
        return res.status(400).json({ success: false, error: 'Recipient kind is required' });
      }

      if (recipient_kind === 'book' && !book_id) {
        return res.status(400).json({ success: false, error: 'Book ID is required' });
      }

      if (recipient_kind === 'person' && !person_id) {
        return res.status(400).json({ success: false, error: 'Person ID is required' });
      }

      const result = await queryDB(
        `INSERT INTO award_recipients (award_outcome_id, recipient_kind, book_id, person_id, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [outcomeId, recipient_kind, book_id || null, person_id || null, notes || null]
      );
      if (recipient_kind === 'book' && book_id) {
        recalculateSingleBookScore(parseInt(book_id)).catch(e => log.warn('Score recalc after award add:', e));
      }
      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      log.error('Recipient save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/awards/:awardId/editions/:editionId/outcomes/:outcomeId/recipients/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;
      const id = req.params.id;
      const outcomeId = req.params.outcomeId;
      const result = await queryDB(
        'DELETE FROM award_recipients WHERE id = $1 AND award_outcome_id = $2 RETURNING id, book_id',
        [id, outcomeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Recipient not found' });
      }

      const deletedBookId = result.rows[0]?.book_id;
      if (deletedBookId) {
        recalculateSingleBookScore(parseInt(deletedBookId)).catch(e => log.warn('Score recalc after award delete:', e));
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Recipient delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // CURATORS
  // ==================================================================
  app.get('/api/curators', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        'SELECT * FROM curators WHERE deleted_at IS NULL ORDER BY display_order ASC, name ASC',
        []
      );

      const mappedCurators = result.rows.map((row: any) => mapCuratorRow(row));
      return res.json({ ok: true, data: mappedCurators });
    } catch (error) {
      log.error('Error loading curators:', error);
      return res.json({ ok: false, error: String(error), data: [] });
    }
  });

  app.get('/api/curators/with-storefronts', async (_req: Request, res: Response) => {
    try {
      const sfResult = await queryDB(
        `SELECT c.id, c.name, c.bio, c.avatar_url, c.slug, c.focus,
                s.id as storefront_id, s.name as storefront_name, s.slug as storefront_slug,
                s.tagline, s.hero_image_url
         FROM curators c
         INNER JOIN storefronts s ON s.curator_id = c.id AND s.is_published = true AND s.deleted_at IS NULL
         WHERE c.deleted_at IS NULL AND c.visible = true
         ORDER BY c.display_order ASC, c.name ASC`,
        []
      );

      if (sfResult.rows.length > 0) {
        const curators = sfResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          bio: row.bio,
          avatarUrl: row.avatar_url,
          slug: row.slug,
          focus: row.focus,
          storefrontId: row.storefront_id,
          storefrontName: row.storefront_name,
          storefrontSlug: row.storefront_slug,
          tagline: row.tagline,
          heroImageUrl: row.hero_image_url,
        }));
        return res.json({ ok: true, data: curators });
      }

      let curResult = await queryDB(
        `SELECT c.id, c.name, c.bio, c.avatar_url, c.slug, c.focus, c.display_order,
                COUNT(cb.id) as curation_book_count
         FROM curators c
         INNER JOIN user_curations uc ON uc.user_id = c.user_id::text AND uc.is_published = true
         INNER JOIN curation_books cb ON cb.curation_id = uc.id
         WHERE c.deleted_at IS NULL AND c.visible = true
         GROUP BY c.id, c.name, c.bio, c.avatar_url, c.slug, c.focus, c.display_order
         ORDER BY c.display_order ASC, c.name ASC`,
        []
      );

      if (curResult.rows.length === 0) {
        curResult = await queryDB(
          `SELECT id, name, bio, avatar_url, slug, focus, display_order
           FROM curators
           WHERE deleted_at IS NULL AND visible = true
           ORDER BY display_order ASC, name ASC`,
          []
        );
      }

      const curators = curResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        slug: row.slug,
        focus: row.focus,
        storefrontId: 0,
        storefrontName: '',
        storefrontSlug: '',
        tagline: row.focus || '',
        heroImageUrl: row.avatar_url || '',
        curationCount: Number(row.curation_book_count || 0),
      }));
      return res.json({ ok: true, data: curators });
    } catch (error) {
      log.error('Error loading curators with storefronts:', error);
      return res.json({ ok: false, error: String(error), data: [] });
    }
  });

  app.get('/api/curators/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await queryDB(
        'SELECT * FROM curators WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Curator not found' });
      }

      const curator = mapCuratorRow(result.rows[0]);
      return res.json({ ok: true, data: curator });
    } catch (error) {
      log.error('Error loading curator:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/curators', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const body = req.body;
      const {
        id,
        name,
        bio,
        avatar_url,
        avatar,
        website_url,
        instagram_url,
        tiktok_url,
        youtube_url,
        socialMedia,
        visible,
        display_order,
        focus,
        status,
        visibility,
        publish_at,
        unpublish_at
      } = body;

      if (!name || !name.trim()) {
        return res.status(400).json({ ok: false, error: 'Name is required' });
      }

      const bioValue = (bio || '').trim() || '';
      const focusValue = (focus || '').trim() || '';
      const avatarValue = (avatar_url || avatar || '').trim() || '';
      const websiteValue = (website_url || socialMedia?.website || '').trim() || '';
      const instagramValue = (instagram_url || socialMedia?.instagram || '').trim() || '';
      const tiktokValue = (tiktok_url || socialMedia?.tiktok || '').trim() || '';
      const youtubeValue = (youtube_url || socialMedia?.youtube || '').trim() || '';
      const statusValue = (status || '').trim() || 'draft';
      const visibilityValue = (visibility || '').trim() || 'visible';

      const slug = await generateUniqueSlug('curators', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE curators
           SET name = $1,
               slug = $2,
               bio = $3,
               avatar_url = $4,
               website_url = $5,
               instagram_url = $6,
               tiktok_url = $7,
               youtube_url = $8,
               focus = $9,
               visible = $10,
               display_order = $11,
               status = $12,
               visibility = $13,
               publish_at = $14,
               unpublish_at = $15,
               updated_at = NOW()
           WHERE id = $16 AND deleted_at IS NULL
           RETURNING *`,
          [
            name.trim(),
            slug,
            bioValue,
            avatarValue,
            websiteValue,
            instagramValue,
            tiktokValue,
            youtubeValue,
            focusValue,
            visible ?? true,
            display_order ?? 0,
            statusValue,
            visibilityValue,
            publish_at || null,
            unpublish_at || null,
            id
          ]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Curator not found' });
        }

        return res.json({ ok: true, data: mapCuratorRow(result.rows[0]) });
      } else {
        const result = await queryDB(
          `INSERT INTO curators (
            name, slug, bio, avatar_url, website_url, instagram_url, tiktok_url, youtube_url,
            focus, visible, display_order, status, visibility, publish_at, unpublish_at,
            created_at, updated_at
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
           RETURNING *`,
          [
            name.trim(),
            slug,
            bioValue,
            avatarValue,
            websiteValue,
            instagramValue,
            tiktokValue,
            youtubeValue,
            focusValue,
            visible ?? true,
            display_order ?? 0,
            statusValue,
            visibilityValue,
            publish_at || null,
            unpublish_at || null
          ]
        );

        return res.json({ ok: true, data: mapCuratorRow(result.rows[0]) });
      }
    } catch (error) {
      log.error('Curator save error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/curators/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const result = await queryDB(
        'UPDATE curators SET deleted_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Curator not found' });
      }

      return res.json({ ok: true, data: { id } });
    } catch (error) {
      log.error('Curator delete error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // STOREFRONTS
  // ==================================================================

  function mapStorefrontRow(row: any) {
    return {
      id: String(row.id),
      curator_id: String(row.curator_id),
      slug: row.slug || '',
      name: row.name || '',
      tagline: row.tagline || '',
      description: row.description || '',
      logo_url: row.logo_url || '',
      hero_image_url: row.hero_image_url || '',
      color_scheme: typeof row.color_scheme === 'string' ? JSON.parse(row.color_scheme || '{}') : (row.color_scheme || {}),
      social_media: typeof row.social_media === 'string' ? JSON.parse(row.social_media || '{}') : (row.social_media || {}),
      is_published: row.is_published ?? false,
      published_at: row.published_at || null,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    };
  }

  app.get('/api/storefronts/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const result = await queryDB(
        `SELECT s.*, c.name as curator_name, c.bio as curator_bio, c.avatar_url as curator_avatar,
                c.focus as curator_focus, c.website_url, c.instagram_url, c.tiktok_url, c.youtube_url
         FROM storefronts s
         JOIN curators c ON s.curator_id = c.id
         WHERE s.slug = $1 AND s.is_published = true AND s.deleted_at IS NULL AND c.deleted_at IS NULL`,
        [slug]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Storefront nicht gefunden' });
      }

      const row = result.rows[0];
      const storefront = mapStorefrontRow(row);

      (storefront as any).curator = {
        id: storefront.curator_id,
        name: row.curator_name || '',
        bio: row.curator_bio || '',
        avatar: row.curator_avatar || '',
        focus: row.curator_focus || '',
        socialMedia: {
          website: row.website_url || '',
          instagram: row.instagram_url || '',
          tiktok: row.tiktok_url || '',
          youtube: row.youtube_url || '',
        },
      };

      const seriesResult = await queryDB(
        `SELECT * FROM storefront_book_series WHERE storefront_id = $1 ORDER BY display_order ASC`,
        [row.id]
      );

      const seriesWithBooks = [];
      for (const series of seriesResult.rows) {
        const booksResult = await queryDB(
          `SELECT b.id, b.title, b.isbn13, b.cover_url, b.description,
                  (SELECT STRING_AGG(p.name, ', ')
                   FROM book_persons bp JOIN persons p ON bp.person_id = p.id
                   WHERE bp.book_id = b.id AND bp.role = 'author') as author
           FROM storefront_series_books ssb
           JOIN books b ON ssb.book_id = b.id
           WHERE ssb.series_id = $1
           ORDER BY ssb.display_order ASC`,
          [series.id]
        );

        seriesWithBooks.push({
          id: String(series.id),
          type: series.type || 'static',
          title: series.title || '',
          description: series.description || '',
          reason: series.reason || '',
          occasion: series.occasion || '',
          sortOrder: series.sort_order || 'popular',
          isOwnBooks: series.is_own_books ?? false,
          displayOrder: series.display_order || 0,
          books: booksResult.rows.map((b: any) => ({
            id: String(b.id),
            title: b.title || '',
            author: b.author || '',
            cover: b.cover_url || '',
            isbn13: b.isbn13 || '',
            description: b.description || '',
            price: '',
          })),
        });
      }

      (storefront as any).bookSeries = seriesWithBooks;

      return res.json({ ok: true, data: storefront });
    } catch (error) {
      log.error('Public storefront fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/storefronts', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const result = await queryDB(
        `SELECT s.*, c.name as curator_name
         FROM storefronts s
         LEFT JOIN curators c ON s.curator_id = c.id
         WHERE s.deleted_at IS NULL
         ORDER BY s.updated_at DESC`,
        []
      );
      const storefronts = result.rows.map((row: any) => ({
        ...mapStorefrontRow(row),
        curator_name: row.curator_name || '',
      }));
      return res.json({ ok: true, data: storefronts });
    } catch (error) {
      log.error('Admin storefronts fetch error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.get('/api/admin/storefronts/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { id } = req.params;
      const result = await queryDB(
        `SELECT s.*, c.name as curator_name, c.bio as curator_bio, c.avatar_url as curator_avatar,
                c.focus as curator_focus
         FROM storefronts s
         LEFT JOIN curators c ON s.curator_id = c.id
         WHERE s.id = $1 AND s.deleted_at IS NULL`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Storefront nicht gefunden' });
      }

      const row = result.rows[0];
      const storefront = {
        ...mapStorefrontRow(row),
        curator_name: row.curator_name || '',
        curator_bio: row.curator_bio || '',
        curator_avatar: row.curator_avatar || '',
        curator_focus: row.curator_focus || '',
      };

      const seriesResult = await queryDB(
        `SELECT * FROM storefront_book_series WHERE storefront_id = $1 ORDER BY display_order ASC`,
        [id]
      );

      const seriesWithBooks = [];
      for (const series of seriesResult.rows) {
        const booksResult = await queryDB(
          `SELECT b.id, b.title, b.isbn13, b.cover_url,
                  (SELECT STRING_AGG(p.name, ', ')
                   FROM book_persons bp JOIN persons p ON bp.person_id = p.id
                   WHERE bp.book_id = b.id AND bp.role = 'author') as author
           FROM storefront_series_books ssb
           JOIN books b ON ssb.book_id = b.id
           WHERE ssb.series_id = $1
           ORDER BY ssb.display_order ASC`,
          [series.id]
        );

        seriesWithBooks.push({
          id: String(series.id),
          title: series.title || '',
          description: series.description || '',
          reason: series.reason || '',
          occasion: series.occasion || '',
          type: series.type || 'static',
          sort_order: series.sort_order || 'popular',
          is_own_books: series.is_own_books ?? false,
          display_order: series.display_order || 0,
          books: booksResult.rows.map((b: any) => ({
            id: String(b.id),
            title: b.title || '',
            author: b.author || '',
            cover_url: b.cover_url || '',
            isbn13: b.isbn13 || '',
          })),
        });
      }

      (storefront as any).book_series = seriesWithBooks;

      return res.json({ ok: true, data: storefront });
    } catch (error) {
      log.error('Admin storefront fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/storefronts', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { id, curator_id, name, tagline, description, logo_url, hero_image_url,
              color_scheme, social_media, is_published } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ ok: false, error: 'Name ist erforderlich' });
      }
      if (!curator_id) {
        return res.status(400).json({ ok: false, error: 'Kurator:in ist erforderlich' });
      }

      const slug = await generateUniqueSlug('storefronts', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE storefronts SET
            name = $1, slug = $2, tagline = $3, description = $4,
            logo_url = $5, hero_image_url = $6, color_scheme = $7,
            social_media = $8, is_published = $9, curator_id = $10,
            published_at = CASE WHEN $9 = true AND published_at IS NULL THEN NOW() ELSE published_at END,
            updated_at = NOW()
           WHERE id = $11 AND deleted_at IS NULL
           RETURNING *`,
          [
            name.trim(), slug, tagline || '', description || '',
            logo_url || '', hero_image_url || '',
            JSON.stringify(color_scheme || {}), JSON.stringify(social_media || {}),
            is_published ?? false, curator_id, id
          ]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Storefront nicht gefunden' });
        }
        return res.json({ ok: true, data: mapStorefrontRow(result.rows[0]) });
      } else {
        const result = await queryDB(
          `INSERT INTO storefronts (curator_id, slug, name, tagline, description,
            logo_url, hero_image_url, color_scheme, social_media, is_published,
            published_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            CASE WHEN $10 = true THEN NOW() ELSE NULL END, NOW(), NOW())
           RETURNING *`,
          [
            curator_id, slug, name.trim(), tagline || '', description || '',
            logo_url || '', hero_image_url || '',
            JSON.stringify(color_scheme || {}), JSON.stringify(social_media || {}),
            is_published ?? false
          ]
        );
        return res.json({ ok: true, data: mapStorefrontRow(result.rows[0]) });
      }
    } catch (error) {
      log.error('Storefront save error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/admin/storefronts/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { id } = req.params;
      const result = await queryDB(
        'UPDATE storefronts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Storefront nicht gefunden' });
      }
      return res.json({ ok: true, data: { id } });
    } catch (error) {
      log.error('Storefront delete error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // STOREFRONT BOOK SERIES
  // ==================================================================

  app.post('/api/admin/storefronts/:storefrontId/series', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { storefrontId } = req.params;
      const { id, title, description, reason, occasion, type, sort_order, is_own_books, display_order } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ ok: false, error: 'Titel ist erforderlich' });
      }

      if (id) {
        const result = await queryDB(
          `UPDATE storefront_book_series SET
            title = $1, description = $2, reason = $3, occasion = $4,
            type = $5, sort_order = $6, is_own_books = $7, display_order = $8,
            updated_at = NOW()
           WHERE id = $9 AND storefront_id = $10
           RETURNING *`,
          [title.trim(), description || '', reason || '', occasion || '',
           type || 'static', sort_order || 'popular', is_own_books ?? false,
           display_order ?? 0, id, storefrontId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Buchserie nicht gefunden' });
        }
        return res.json({ ok: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO storefront_book_series (storefront_id, title, description, reason, occasion,
            type, sort_order, is_own_books, display_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           RETURNING *`,
          [storefrontId, title.trim(), description || '', reason || '', occasion || '',
           type || 'static', sort_order || 'popular', is_own_books ?? false, display_order ?? 0]
        );
        return res.json({ ok: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Series save error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/admin/storefronts/:storefrontId/series/:seriesId', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { storefrontId, seriesId } = req.params;
      const result = await queryDB(
        'DELETE FROM storefront_book_series WHERE id = $1 AND storefront_id = $2 RETURNING id',
        [seriesId, storefrontId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Buchserie nicht gefunden' });
      }
      return res.json({ ok: true, data: { id: seriesId } });
    } catch (error) {
      log.error('Series delete error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/storefronts/:storefrontId/series/:seriesId/books', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { seriesId } = req.params;
      const { book_id, display_order } = req.body;

      if (!book_id) {
        return res.status(400).json({ ok: false, error: 'Buch-ID ist erforderlich' });
      }

      const result = await queryDB(
        `INSERT INTO storefront_series_books (series_id, book_id, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (series_id, book_id) DO UPDATE SET display_order = $3
         RETURNING *`,
        [seriesId, book_id, display_order ?? 0]
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Series book add error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/admin/storefronts/:storefrontId/series/:seriesId/books/:bookId', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { seriesId, bookId } = req.params;
      const result = await queryDB(
        'DELETE FROM storefront_series_books WHERE series_id = $1 AND book_id = $2 RETURNING id',
        [seriesId, bookId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Buch nicht in Serie gefunden' });
      }
      return res.json({ ok: true, data: { seriesId, bookId } });
    } catch (error) {
      log.error('Series book remove error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // USER MODULES API
  // ==================================================================
  app.get('/api/user/:userId/modules', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const result = await queryDB(
        'SELECT * FROM user_modules WHERE user_id = $1',
        [userId]
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      log.error('Get user modules error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get('/api/user/:userId/modules/:moduleKey', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const moduleKey = req.params.moduleKey;
      const result = await queryDB(
        'SELECT * FROM user_modules WHERE user_id = $1 AND module_key = $2',
        [userId, moduleKey]
      );
      const hasAccess = result.rows.length > 0;
      return res.json({ success: true, data: { hasAccess } });
    } catch (error) {
      log.error('Check module error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/user/:userId/modules/request', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const { moduleKey, reason } = req.body;

      if (!moduleKey || !reason) {
        return res.status(400).json({ success: false, error: 'moduleKey and reason required' });
      }

      await queryDB(
        `INSERT INTO module_requests (user_id, module_key, reason, status, created_at)
         VALUES ($1, $2, $3, 'pending', NOW())`,
        [userId, moduleKey, reason]
      );
      return res.json({ success: true, message: 'Module request submitted' });
    } catch (error) {
      log.error('Request module error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get('/api/user/:userId/modules/requests', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const result = await queryDB(
        'SELECT * FROM module_requests WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      log.error('Get module requests error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get('/api/admin/modules/requests', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const result = await queryDB(
        "SELECT * FROM module_requests WHERE status = 'pending' ORDER BY created_at DESC",
        []
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      log.error('Get pending requests error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/admin/modules/approve', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { userId, moduleKey, approvedBy, notes } = req.body;

      if (!userId || !moduleKey || !approvedBy) {
        return res.status(400).json({ success: false, error: 'userId, moduleKey, and approvedBy required' });
      }

      await queryDB(
        `INSERT INTO user_modules (user_id, module_key, granted_by, notes, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, module_key) DO NOTHING`,
        [userId, moduleKey, approvedBy, notes || null]
      );
      await queryDB(
        `UPDATE module_requests SET status = 'approved', updated_at = NOW() WHERE user_id = $1 AND module_key = $2`,
        [userId, moduleKey]
      );
      return res.json({ success: true, message: 'Module approved' });
    } catch (error) {
      log.error('Approve module error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/admin/modules/reject', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { userId, moduleKey, rejectedBy, reason } = req.body;

      if (!userId || !moduleKey || !rejectedBy) {
        return res.status(400).json({ success: false, error: 'userId, moduleKey, and rejectedBy required' });
      }

      await queryDB(
        `UPDATE module_requests SET status = 'rejected', reason = $3, updated_at = NOW() WHERE user_id = $1 AND module_key = $2`,
        [userId, moduleKey, reason || null]
      );
      return res.json({ success: true, message: 'Module rejected' });
    } catch (error) {
      log.error('Reject module error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/admin/modules/:userId/:moduleKey', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const userId = req.params.userId;
      const moduleKey = req.params.moduleKey;

      await queryDB(
        'DELETE FROM user_modules WHERE user_id = $1 AND module_key = $2',
        [userId, moduleKey]
      );
      return res.json({ success: true, message: 'Module revoked' });
    } catch (error) {
      log.error('Revoke module error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // CATEGORIES
  // ==================================================================
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const includeDrafts = req.query.include_drafts === 'true';
      const statusFilter = includeDrafts ? '' : "AND status = 'published'";
      const result = await queryDB(
        `SELECT
          id, name, slug, parent_id,
          display_order, status, visibility, created_at, updated_at
        FROM categories
        WHERE deleted_at IS NULL
          ${statusFilter}
          AND visibility = 'visible'
        ORDER BY display_order ASC, name ASC`,
        []
      );

      return res.json({ ok: true, success: true, data: result.rows || [] });
    } catch (error) {
      log.error('Categories fetch error:', error);
      return res.json({ ok: true, success: true, data: [] });
    }
  });

  app.get('/api/admin/categories', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const result = await queryDB(
        `SELECT id, name, slug, parent_id,
                display_order, status, visibility, created_at, updated_at
         FROM categories
         WHERE deleted_at IS NULL
         ORDER BY display_order ASC, name ASC`,
        []
      );
      return res.json({ ok: true, success: true, data: result.rows || [] });
    } catch (error) {
      log.error('Admin categories fetch error:', error);
      return res.json({ ok: true, success: true, data: [] });
    }
  });

  // ==================================================================
  // TAGS
  // ==================================================================
  app.get('/api/tags', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB('SELECT * FROM tags ORDER BY name ASC', []);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      return res.json({ ok: true, data: [] });
    }
  });

  const TAG_TYPE_MAP: Record<string, string> = {
    'award': 'Auszeichnung',
    'topic': 'Motiv (MVB)',
    'genre': 'Genre (THEMA)',
    'audience': 'Zielgruppe',
    'feature': 'Ausstattung',
    'publisher_cluster': 'Herkunft',
    'media': 'Medienecho',
    'status': 'Status',
    'serie': 'Serie',
    'band': 'Band',
    'feeling': 'Feeling',
    'gattung': 'Gattung',
    'stil_veredelung': 'Stil-Veredelung',
    'schauplatz': 'Schauplatz',
    'zeitgeist': 'Zeitgeist',
  };

  function mapTagRow(row: any) {
    const mappedType = TAG_TYPE_MAP[row.tag_type] || row.tag_type || '';
    return {
      ...row,
      displayName: row.name || '',
      type: mappedType,
      onixCode: row.onix_code || '',
      imageUrl: row.image_url || null,
      visibilityLevel: row.scope === 'book' ? 'prominent' : (row.scope || 'filter'),
    };
  }

  app.get('/api/onix-tags', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB('SELECT * FROM tags ORDER BY name ASC', []);
      return res.json({ ok: true, data: result.rows.map(mapTagRow) });
    } catch (error) {
      return res.json({ ok: true, data: [] });
    }
  });

  app.get('/api/onix-tags/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await queryDB('SELECT * FROM tags WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Tag not found' });
      }
      return res.json({ ok: true, data: mapTagRow(result.rows[0]) });
    } catch (error) {
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/onix-tags', async (req: Request, res: Response) => {
    try {
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken || !(await verifyAdminToken(adminToken))) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const body = req.body;
      const id = body.id;
      const name = body.displayName || body.name;
      const color = body.color;
      const REVERSE_TAG_TYPE_MAP: Record<string, string> = Object.fromEntries(
        Object.entries(TAG_TYPE_MAP).map(([k, v]) => [v, k])
      );
      const rawType = body.type || body.tag_type || '';
      const tag_type = REVERSE_TAG_TYPE_MAP[rawType] || rawType;
      const visible = body.visible;
      const scope = body.scope || 'book';
      const source = body.source || 'manual';
      const onix_code = body.onixCode || body.onix_code;
      const onix_scheme_id = body.onix_scheme_id;
      const onix_heading_text = body.onix_heading_text || body.originalName;
      const display_order = body.display_order || body.displayOrder || 0;
      const image_url = body.imageUrl || body.image_url || null;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      const slug = await generateUniqueSlug('tags', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE tags
           SET name = $1, slug = $2, color = $3, tag_type = $4, visible = $5,
               scope = $6, source = $7, onix_code = $8, onix_scheme_id = $9,
               onix_heading_text = $10, display_order = $11, image_url = $12, updated_at = NOW()
           WHERE id = $13
           RETURNING *`,
          [name.trim(), slug, color || null, tag_type || null, visible !== false, scope || 'book', source || 'manual', onix_code || null, onix_scheme_id || null, onix_heading_text || null, display_order || 0, image_url, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Tag not found' });
        }

        return res.json({ success: true, data: mapTagRow(result.rows[0]) });
      } else {
        const result = await queryDB(
          `INSERT INTO tags (name, slug, color, tag_type, visible, scope, source, onix_code, onix_scheme_id, onix_heading_text, display_order, image_url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
           RETURNING *`,
          [name.trim(), slug, color || null, tag_type || null, visible !== false, scope || 'book', source || 'manual', onix_code || null, onix_scheme_id || null, onix_heading_text || null, display_order || 0, image_url]
        );
        return res.json({ success: true, data: mapTagRow(result.rows[0]) });
      }
    } catch (error) {
      log.error('ONIX Tag save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.patch('/api/onix-tags/:id/visibility', async (req: Request, res: Response) => {
    try {
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken || !(await verifyAdminToken(adminToken))) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const id = req.params.id;
      const { visible } = req.body;

      const result = await queryDB(
        'UPDATE tags SET visible = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [visible === true, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Tag not found' });
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      log.error('Tag visibility toggle error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/onix-tags/:id', async (req: Request, res: Response) => {
    try {
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken || !(await verifyAdminToken(adminToken))) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const id = req.params.id;
      const result = await queryDB('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Tag not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('ONIX Tag delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post('/api/tags', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const name = body.displayName || body.name;
      const id = body.id;
      const color = body.color;
      const description = body.description || null;
      const category = body.category || null;
      const tag_type = body.tag_type || 'topic';
      const visible = body.visible;
      const scope = body.scope || 'book';
      const source = body.source || 'editorial';
      const display_order = body.display_order || body.displayOrder || 0;
      const image_url = body.image_url || body.imageUrl || null;
      const onix_scheme_id = body.onix_scheme_id || null;
      const onix_code = body.onix_code || null;
      const onix_label = body.onix_label || null;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      const slug = await generateUniqueSlug('tags', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE tags
           SET name = $1, slug = $2, color = $3, tag_type = $4, visible = $5,
               scope = $6, source = $7, display_order = $8, image_url = $9,
               description = $10, category = $11,
               onix_scheme_id = $12, onix_code = $13, onix_label = $14,
               updated_at = NOW()
           WHERE id = $15
           RETURNING *`,
          [name.trim(), slug, color || null, tag_type, visible !== false, scope, source, display_order, image_url, description, category, onix_scheme_id, onix_code, onix_label, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Tag not found' });
        }

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO tags (name, slug, color, tag_type, visible, scope, source, display_order, image_url, description, category, onix_scheme_id, onix_code, onix_label, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
           RETURNING *`,
          [name.trim(), slug, color || null, tag_type, visible !== false, scope, source, display_order, image_url, description, category, onix_scheme_id, onix_code, onix_label]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Tag save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/tags/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const check = await queryDB('SELECT id FROM tags WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Tag not found' });
      }

      await queryDB('UPDATE curations SET tag_id = NULL WHERE tag_id = $1', [id]);
      await queryDB('DELETE FROM book_tags WHERE tag_id = $1 OR derived_from_onix_tag_id = $1', [id]);
      await queryDB('DELETE FROM tag_mappings WHERE from_tag_id = $1 OR to_tag_id = $1', [id]);
      await queryDB('UPDATE section_items SET target_tag_id = NULL WHERE target_tag_id = $1', [id]);
      await queryDB('UPDATE menu_items SET target_tag_id = NULL WHERE target_tag_id = $1', [id]);

      await queryDB('DELETE FROM tags WHERE id = $1', [id]);

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Tag delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // PERSONS
  // ==================================================================
  app.get('/api/persons', async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      let whereClause = '';
      const params: any[] = [];
      if (search) {
        params.push(`%${search}%`);
        whereClause = `WHERE p.name ILIKE $${params.length}`;
      }

      const countResult = await queryDB(
        `SELECT count(*) FROM persons p ${whereClause}`, params
      );
      const total = parseInt(countResult.rows[0].count);

      params.push(limit, offset);
      const result = await queryDB(`
        SELECT p.id, p.name, p.slug, p.created_at, p.updated_at,
          (SELECT json_agg(json_build_object(
            'recipient_id', ar.id,
            'award_id', a.id,
            'award_name', a.name,
            'year', ae.year,
            'outcome', ao.title,
            'outcome_type', ao.outcome_type,
            'book_id', ar.book_id,
            'notes', ar.notes
          ) ORDER BY ae.year DESC)
          FROM award_recipients ar
          JOIN award_outcomes ao ON ao.id = ar.award_outcome_id
          JOIN award_editions ae ON ae.id = ao.award_edition_id
          JOIN awards a ON a.id = ae.award_id
          WHERE ar.person_id = p.id) as awards
        FROM persons p
        ${whereClause}
        ORDER BY p.name ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);
      return res.json({ ok: true, data: result.rows, total });
    } catch (error) {
      log.error('Persons list error:', error);
      return res.json({ ok: true, data: [], total: 0 });
    }
  });

  app.post('/api/persons', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const { id, name, bio } = body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      const slug = await generateUniqueSlug('persons', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE persons
           SET name = $1, slug = $2, bio = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [name, slug, bio || null, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Person not found' });
        }

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO persons (name, slug, bio, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING *`,
          [name, slug, bio || null]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Person save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/persons/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await queryDB('DELETE FROM persons WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Person not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Person delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/award-recipients/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const result = await queryDB('DELETE FROM award_recipients WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Recipient not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      log.error('Recipient delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // AFFILIATES
  // ==================================================================
  app.get('/api/admin/affiliates', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const result = await queryDB(
        `SELECT
           id, name, slug, network, merchant_id, program_id,
           website_url, link_template, product_url_template,
           icon_url, favicon_url,
           display_order, is_active, show_in_carousel, notes, created_at, updated_at
         FROM affiliates
         ORDER BY display_order ASC, name ASC`,
        []
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Affiliates fetch error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.post('/api/admin/affiliates', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const body = req.body;
      const {
        id, name, website_url, link_template, product_url_template,
        network, merchant_id, program_id, notes,
        icon_url, favicon_url,
        display_order, is_active, show_in_carousel
      } = body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      if (network && !['awin', 'manual', 'other'].includes(network)) {
        return res.status(400).json({ success: false, error: 'Network must be one of: awin, manual, other' });
      }

      const slug = await generateUniqueSlug('affiliates', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE affiliates
           SET
             name = $1, slug = $2, network = $3, merchant_id = $4,
             program_id = $5, website_url = $6, link_template = $7,
             product_url_template = $8, display_order = $9,
             is_active = $10, notes = $11,
             icon_url = $12, favicon_url = $13, show_in_carousel = $14, updated_at = NOW()
           WHERE id = $15
           RETURNING *`,
          [
            name, slug, network || 'manual', merchant_id || null,
            program_id || null, website_url || null, link_template || '',
            product_url_template || null, display_order || 0,
            is_active !== false, notes || null,
            icon_url || null, favicon_url || null, show_in_carousel === true, id
          ]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Affiliate not found' });
        }

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO affiliates (
             name, slug, network, merchant_id, program_id,
             website_url, link_template, product_url_template,
             icon_url, favicon_url,
             display_order, is_active, show_in_carousel, notes,
             created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
           RETURNING *`,
          [
            name, slug, network || 'manual', merchant_id || null,
            program_id || null, website_url || null, link_template || '',
            product_url_template || null,
            icon_url || null, favicon_url || null,
            display_order || 0,
            is_active !== false, show_in_carousel === true, notes || null
          ]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Affiliate save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/admin/affiliates/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const id = req.params.id;
      const result = await queryDB('DELETE FROM affiliates WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Affiliate not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Affiliate delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get('/api/affiliates/active', async (req: Request, res: Response) => {
    try {
      const region = (req.query.region as string) || 'de-de';
      let regionConfig: any = null;
      try {
        const regionResult = await queryDB(`SELECT affiliate_config FROM regions WHERE locale = $1`, [region]);
        if (regionResult.rows.length > 0) {
          regionConfig = regionResult.rows[0].affiliate_config;
        }
      } catch { /* use all affiliates if regions table not available */ }

      const result = await queryDB(
        `SELECT id, name, slug, website_url, link_template, favicon_url, display_order, show_in_carousel
         FROM affiliates
         WHERE is_active = true
         ORDER BY display_order ASC, name ASC`,
        []
      );

      let data = result.rows;
      if (regionConfig?.partners && Array.isArray(regionConfig.partners)) {
        const allowedSlugs = regionConfig.partners;
        const filtered = data.filter((a: any) => allowedSlugs.includes(a.slug));
        if (filtered.length > 0) data = filtered;
      }

      return res.json({ ok: true, data, region });
    } catch (error) {
      log.error('Active affiliates fetch error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.get('/api/books/:id/affiliates', async (req: Request, res: Response) => {
    try {
      const bookId = req.params.id;
      const result = await queryDB(
        `SELECT
           ba.id, ba.book_id, ba.affiliate_id,
           ba.merchant_product_id, ba.external_id, ba.link_override,
           ba.display_order, ba.is_active,
           a.name AS affiliate_name, a.slug AS affiliate_slug,
           a.link_template, a.website_url, a.icon_url, a.favicon_url,
           a.merchant_id AS affiliate_merchant_id
         FROM book_affiliates ba
         JOIN affiliates a ON ba.affiliate_id = a.id
         WHERE ba.book_id = $1 AND ba.is_active = true AND a.is_active = true
         ORDER BY ba.display_order ASC, a.display_order ASC`,
        [bookId]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Book affiliates fetch error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.get('/api/admin/book-affiliates', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const result = await queryDB(
        `SELECT
           ba.*,
           b.title AS book_title,
           b.author AS book_author,
           b.isbn13 AS book_isbn13,
           a.name AS affiliate_name,
           a.slug AS affiliate_slug
         FROM book_affiliates ba
         JOIN books b ON ba.book_id = b.id
         JOIN affiliates a ON ba.affiliate_id = a.id
         WHERE ba.is_active = true
         ORDER BY b.title, ba.display_order`,
        []
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Book affiliates fetch error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  app.post('/api/admin/book-affiliates', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { book_id, affiliate_id, merchant_product_id, external_id, link_override, display_order, is_active } = req.body;

      if (!book_id || !affiliate_id) {
        return res.status(400).json({ success: false, error: 'book_id and affiliate_id are required' });
      }

      if (!merchant_product_id && !external_id && !link_override) {
        return res.status(400).json({
          success: false,
          error: 'At least one of merchant_product_id, external_id, or link_override must be set'
        });
      }

      const result = await queryDB(
        `INSERT INTO book_affiliates (
           book_id, affiliate_id, merchant_product_id, external_id, link_override,
           display_order, is_active, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          book_id, affiliate_id,
          merchant_product_id || null, external_id || null, link_override || null,
          display_order || 0, is_active !== false
        ]
      );
      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      log.error('Book affiliate assignment save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.put('/api/admin/book-affiliates/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const id = req.params.id;
      const { merchant_product_id, external_id, link_override, display_order, is_active } = req.body;

      if (!merchant_product_id && !external_id && !link_override) {
        return res.status(400).json({
          success: false,
          error: 'At least one of merchant_product_id, external_id, or link_override must be set'
        });
      }

      const result = await queryDB(
        `UPDATE book_affiliates
         SET
           merchant_product_id = $1,
           external_id = $2,
           link_override = $3,
           display_order = $4,
           is_active = $5,
           updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          merchant_product_id || null, external_id || null, link_override || null,
          display_order || 0, is_active !== false, id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Assignment not found' });
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      log.error('Book affiliate assignment update error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/admin/book-affiliates/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const id = req.params.id;
      const result = await queryDB('DELETE FROM book_affiliates WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Assignment not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Book affiliate assignment delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // SECTIONS (Public)
  // ==================================================================
  app.get('/api/sections', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB('SELECT * FROM sections ORDER BY display_order ASC', []);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      return res.json({ ok: true, data: [] });
    }
  });

  // ==================================================================
  // PAGES (Public)
  // ==================================================================
  app.get('/api/pages', async (_req: Request, res: Response) => {
    try {
      const tableCheck = await queryDB(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'pages'
        )`,
        []
      );

      if (!tableCheck.rows[0]?.exists) {
        return res.json({ ok: true, data: [] });
      }

      const columnsResult = await queryDB(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'pages'`,
        []
      );

      const existingColumns = columnsResult.rows.map((row: any) => row.column_name);

      let orderBy = 'ORDER BY ';
      if (existingColumns.includes('title')) {
        orderBy += 'title ASC';
      } else if (existingColumns.includes('name')) {
        orderBy += 'name ASC';
      } else if (existingColumns.includes('slug')) {
        orderBy += 'slug ASC';
      } else {
        orderBy += 'id ASC';
      }

      const result = await queryDB(`SELECT * FROM pages ${orderBy}`, []);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.warn('Pages fetch error:', error);
      return res.json({ ok: true, data: [] });
    }
  });

  // ==================================================================
  // PAGE RESOLVE
  // ==================================================================
  app.get('/api/pages/resolve', async (req: Request, res: Response) => {
    try {
      let path = (req.query.path as string) || '/';
      const includeDraftParam = (req.query.includeDraft as string) || 'false';
      const includeDraft = includeDraftParam === 'true';

      if (!path.startsWith('/')) {
        path = `/${path}`;
      }

      const slug = path === '/' ? '/' : path.substring(1);

      const statusFilter = includeDraft ? '' : `AND p.status = 'published' AND p.visibility = 'visible'`;

      const combinedResult = await queryDB(
        `SELECT
          p.id AS page_id, p.slug, p.type, p.template_key, p.status AS page_status,
          p.visibility AS page_visibility, p.seo_title, p.seo_description,
          p.canonical_url, p.robots, p.og_image_asset_id, p.page_type, p.category_id,
          p.created_at AS page_created_at, p.updated_at AS page_updated_at,
          ps.id AS section_id, ps.zone, ps.sort_order, ps.section_type, ps.config AS section_config,
          ps.status AS section_status, ps.visibility AS section_visibility,
          ps.publish_at, ps.unpublish_at, ps.max_views, ps.max_clicks,
          ps.current_views, ps.current_clicks,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', si.id,
                'book_id', COALESCE(
                  nullif(si.data->>'book_id', '')::int,
                  nullif(si.target_params->>'bookId', '')::int
                ),
                'sort_order', si.sort_order,
                'item_type', si.item_type,
                'data', si.data,
                'target_type', si.target_type,
                'target_category_id', si.target_category_id,
                'target_tag_id', si.target_tag_id,
                'target_page_id', si.target_page_id,
                'target_template_key', si.target_template_key,
                'target_params', si.target_params
              )
              ORDER BY si.sort_order
            )
            FROM public.section_items si
            WHERE si.page_section_id = ps.id
              AND ($2::boolean = true OR si.status = 'published')
            ), '[]'::json
          ) as items
         FROM public.pages p
         LEFT JOIN public.page_sections ps ON ps.page_id = p.id
           AND ($2::boolean = true OR ps.status = 'published')
           AND ($2::boolean = true OR COALESCE(ps.visibility, 'visible') = 'visible')
           AND ($2::boolean = true OR ps.publish_at IS NULL OR ps.publish_at <= NOW())
           AND ($2::boolean = true OR ps.unpublish_at IS NULL OR ps.unpublish_at > NOW())
           AND ($2::boolean = true OR ps.max_views IS NULL OR COALESCE(ps.current_views, 0) < ps.max_views)
           AND ($2::boolean = true OR ps.max_clicks IS NULL OR COALESCE(ps.current_clicks, 0) < ps.max_clicks)
         WHERE p.slug = $1 ${statusFilter}
         ORDER BY ps.sort_order ASC`,
        [slug, includeDraft]
      );

      if (!combinedResult.rows || combinedResult.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          path,
          error: {
            code: 'PAGE_NOT_FOUND',
            message: `Page not found for path: ${path}`,
          },
        });
      }

      const firstRow = combinedResult.rows[0];
      const page = {
        id: firstRow.page_id,
        slug: firstRow.slug,
        type: firstRow.type,
        template_key: firstRow.template_key,
        status: firstRow.page_status,
        visibility: firstRow.page_visibility,
        seo_title: firstRow.seo_title,
        seo_description: firstRow.seo_description,
        canonical_url: firstRow.canonical_url,
        robots: firstRow.robots,
        og_image_asset_id: firstRow.og_image_asset_id,
        page_type: firstRow.page_type,
        category_id: firstRow.category_id,
        created_at: firstRow.page_created_at,
        updated_at: firstRow.page_updated_at,
      };

      const sectionsResult = { rows: combinedResult.rows.filter((r: any) => r.section_id != null).map((r: any) => ({
        id: r.section_id,
        zone: r.zone,
        sort_order: r.sort_order,
        section_type: r.section_type,
        config: r.section_config,
        status: r.section_status,
        visibility: r.section_visibility,
        publish_at: r.publish_at,
        unpublish_at: r.unpublish_at,
        max_views: r.max_views,
        max_clicks: r.max_clicks,
        current_views: r.current_views,
        current_clicks: r.current_clicks,
        items: r.items,
      })) };

      const sections = sectionsResult.rows || [];

      const bookIds = new Set<number>();
      sections.forEach((section: any) => {
        if (section.items && Array.isArray(section.items)) {
          section.items.forEach((item: any) => {
            if (item.book_id) bookIds.add(item.book_id);
          });
        }
      });

      const pageCategoryId = page.page_type === 'category' && page.category_id ? Number(page.category_id) : null;

      const sectionQueryPromises: Array<{ section: any; promise: Promise<any> }> = [];
      for (const section of sections) {
        const cfg = section.section_config || section.config || {};
        const sType = section.section_type;
        if ((sType === 'book_carousel' || sType === 'horizontal_row' || sType === 'book_grid_filtered') && (cfg.books?.query || pageCategoryId)) {
          const query = cfg.books?.query || {};
          const include = query.include || {};
          const limit = Math.min(query.limit || 20, 50);
          const operator = query.operator || 'any';

          const conditions: string[] = [];
          const params: any[] = [];
          let paramIdx = 1;

          const tagIds: number[] = (include.tagIds || []).map(Number).filter(Boolean);
          const categoryIds: number[] = (include.categoryIds || []).map(Number).filter(Boolean);
          const awardDefIds: number[] = (include.awardDefinitionIds || []).map(Number).filter(Boolean);

          if (tagIds.length > 0) {
            const ph1 = tagIds.map(() => `$${paramIdx++}`).join(',');
            const ph2 = tagIds.map(() => `$${paramIdx++}`).join(',');
            conditions.push(`(b.id IN (SELECT bt.book_id FROM book_tags bt WHERE bt.tag_id IN (${ph1})) OR b.id IN (SELECT bot.book_id FROM book_onix_tags bot WHERE bot.tag_id IN (${ph2})))`);
            params.push(...tagIds, ...tagIds);
          }

          if (categoryIds.length > 0) {
            const catPlaceholders = categoryIds.map(() => `$${paramIdx++}`).join(',');
            conditions.push(`b.id IN (SELECT bt.book_id FROM book_tags bt JOIN tags t ON bt.tag_id = t.id JOIN categories c ON t.name = c.name WHERE c.id IN (${catPlaceholders}))`);
            params.push(...categoryIds);
          }

          if (awardDefIds.length > 0) {
            const awardPlaceholders = awardDefIds.map(() => `$${paramIdx++}`).join(',');
            conditions.push(`b.id IN (SELECT ar.book_id FROM award_recipients ar JOIN award_outcomes ao ON ar.award_outcome_id = ao.id JOIN award_editions ae ON ao.award_edition_id = ae.id WHERE ar.book_id IS NOT NULL AND ae.award_id IN (${awardPlaceholders}))`);
            params.push(...awardDefIds);
          }

          const effectiveCategoryId = pageCategoryId || (cfg.categoryId ? Number(cfg.categoryId) : null);

          const hasUserContext = !!(query.userContext?.followedBy || (query.userContext?.readingStatus?.length > 0) || query.userContext?.inMedia?.enabled);
          if (conditions.length === 0 && hasUserContext) {
            conditions.push('TRUE');
          }

          if (query.userContext?.inMedia?.enabled) {
            const period = query.userContext.inMedia.period || 'all';
            let dateCond = '';
            if (period === 'week') dateCond = `AND ce.published_at >= NOW() - INTERVAL '7 days'`;
            else if (period === 'month') dateCond = `AND ce.published_at >= NOW() - INTERVAL '30 days'`;
            else if (period === 'quarter') dateCond = `AND ce.published_at >= NOW() - INTERVAL '90 days'`;
            else if (period === 'year') dateCond = `AND ce.published_at >= NOW() - INTERVAL '365 days'`;
            conditions.push(`b.id IN (SELECT eb.matched_book_id FROM extracted_books eb JOIN content_episodes ce ON eb.episode_id = ce.id WHERE eb.is_verified = true ${dateCond} AND eb.matched_book_id IS NOT NULL)`);
          }

          if (conditions.length > 0) {
            const joiner = operator === 'all' ? ' AND ' : ' OR ';
            const whereClause = conditions.join(joiner);

            const sortClause = query.sort === 'newest' ? 'ORDER BY b.created_at DESC'
              : query.sort === 'awarded' ? 'ORDER BY b.award_count DESC NULLS LAST'
              : query.sort === 'popularity' ? 'ORDER BY b.total_score DESC NULLS LAST'
              : query.sort === 'relevance' ? 'ORDER BY b.total_score DESC NULLS LAST'
              : query.sort === 'hidden_gems' ? 'ORDER BY b.is_hidden_gem DESC NULLS LAST, b.total_score DESC NULLS LAST'
              : 'ORDER BY b.created_at DESC';

            sectionQueryPromises.push({
              section,
              promise: queryDB(
                `SELECT b.* FROM books b WHERE b.deleted_at IS NULL AND (${whereClause}) ${sortClause} LIMIT $${paramIdx}`,
                [...params, limit]
              ).catch(qErr => { log.warn(`Query-based book fetch failed for section ${section.id}:`, qErr); return { rows: [] }; })
            });
          }
        }
      }

      const sectionQueryResults = await Promise.all(sectionQueryPromises.map(sq => sq.promise));
      sectionQueryPromises.forEach((sq, idx) => {
        const fetchedBooks = sectionQueryResults[idx].rows || [];
        fetchedBooks.forEach((b: any) => bookIds.add(b.id));
        sq.section._queryBooks = fetchedBooks.map((b: any) => b.id);
      });

      let books: any[] = [];
      const curatorIds = new Set<string>();
      sections.forEach((s: any) => {
        const cfg = s.section_config || s.config;
        if (cfg?.curatorId) curatorIds.add(String(cfg.curatorId));
      });

      let curatorsMap: Record<string, any> = {};

      if (bookIds.size > 0) {
        const bookIdsArray = Array.from(bookIds);
        const placeholders = bookIdsArray.map((_, i) => `$${i + 1}`).join(',');

        const curatorIdsArray = Array.from(curatorIds);
        const cPlaceholders = curatorIdsArray.map((_, i) => `$${i + 1}`).join(',');

        const [booksResult, indieRes, spRes, awardRes, tagRes, curatorsResult] = await Promise.all([
          queryDB(`SELECT * FROM books WHERE id IN (${placeholders})`, bookIdsArray),
          queryDB('SELECT name FROM indie_publishers').catch(() => ({ rows: [] })),
          queryDB('SELECT pattern, match_type FROM selfpublisher_patterns').catch(() => ({ rows: [] })),
          queryDB(
            `SELECT ar.book_id, ao.result_status, ao.outcome_type, a.name AS award_name, ae.year AS award_year
             FROM award_recipients ar
             JOIN award_outcomes ao ON ar.award_outcome_id = ao.id
             JOIN award_editions ae ON ao.award_edition_id = ae.id
             JOIN awards a ON ae.award_id = a.id
             WHERE ar.book_id IN (${placeholders})`,
            bookIdsArray
          ).catch(() => ({ rows: [] })),
          queryDB(
            `SELECT bt.book_id, t.id AS tag_id, t.name, t.slug, t.tag_type, t.color, t.visible
             FROM book_tags bt
             JOIN tags t ON bt.tag_id = t.id
             WHERE bt.book_id IN (${placeholders}) AND t.deleted_at IS NULL
             UNION
             SELECT bot.book_id, t.id AS tag_id, t.name, t.slug, t.tag_type, t.color, t.visible
             FROM book_onix_tags bot
             JOIN tags t ON bot.tag_id = t.id
             WHERE bot.book_id IN (${placeholders}) AND t.deleted_at IS NULL`,
            bookIdsArray
          ).catch(() => ({ rows: [] })),
          curatorIdsArray.length > 0
            ? queryDB(
                `SELECT id, name, bio, avatar_url, focus, visible FROM curators WHERE id IN (${cPlaceholders}) AND deleted_at IS NULL`,
                curatorIdsArray.map(Number)
              )
            : Promise.resolve({ rows: [] }),
        ]);

        books = booksResult.rows || [];

        for (const c of curatorsResult.rows || []) {
          curatorsMap[String(c.id)] = c;
        }

        try {
          const indieNames = (indieRes.rows || []).map((r: any) => r.name.toLowerCase());
          const spPatterns = spRes.rows || [];

          let awardMap: Record<number, { wins: number; nominations: number; details: Array<{ name: string; year?: number; outcome: string }> }> = {};
          for (const row of awardRes.rows || []) {
            if (!row.book_id) continue;
            if (!awardMap[row.book_id]) awardMap[row.book_id] = { wins: 0, nominations: 0, details: [] };
            const status = (row.result_status || '').toLowerCase();
            const outcomeType = row.outcome_type || 'nominee';
            if (status === 'winner' || status === 'gewinner') {
              awardMap[row.book_id].wins++;
            } else {
              awardMap[row.book_id].nominations++;
            }
            awardMap[row.book_id].details.push({
              name: row.award_name || 'Literaturpreis',
              year: row.award_year || undefined,
              outcome: outcomeType,
            });
          }

          const MOCK_REVIEWS: Record<number, Array<{ source: string; quote: string }>> = {
            75474: [{ source: 'Die Zeit', quote: 'In nur scheinbar sinnlosen und oft so wunderbar poetischen Sätzen entdeckt Geiger die Würde des Vaters.' }],
            75729: [{ source: 'Frankfurter Allgemeine', quote: 'Ein kraftvoller, virtuoser Roman über eine deutsch-türkische Familie.' }],
            80190: [{ source: 'Frankfurter Allgemeine', quote: 'Schonungslos und eindrücklich. Ein kluger Roman über subtile Gewalt.' }],
            75384: [{ source: 'Alena Schröder', quote: 'So mitreißend, feinsinnig und schonungslos, dass es mich einfach nicht loslässt.' }],
            75320: [{ source: 'Gert Scobel, 3sat', quote: 'Unbedingt lesen. Wirklich unbedingt lesen.' }],
            75298: [{ source: 'Süddeutsche Zeitung', quote: 'Thomas Hettche erzählt die Kulturgeschichte der Augsburger Puppenkiste als großen Roman.' }],
            120569: [{ source: 'Die Jury des Deutschen Buchpreises', quote: 'Anne Weber erzählt das unwahrscheinliche Leben in einem brillanten Heldinnenepos.' }],
            158054: [{ source: 'NZZ', quote: 'Christine Wunnicke schreibt so verwegen und schön wie keine andere.' }],
            176370: [{ source: 'Caroline Wahl', quote: 'Das Traurigste, Lustigste und Beste, was ich seit langem gelesen habe.' }],
            60826: [{ source: 'New York Times', quote: 'Attica Locke hat einen Pageturner geschrieben, der zugleich ein soziales Porträt Amerikas ist.' }],
          };

          books = books.map((book: any) => {
            const publisherLower = (book.publisher || '').toLowerCase();
            const authorLower = (book.author || '').toLowerCase();

            const isIndieVerlag = indieNames.some(name => publisherLower === name);
            const isSelfPublisher = spPatterns.some((sp: any) => {
              if (sp.match_type === 'exact') return publisherLower === sp.pattern.toLowerCase();
              return publisherLower.includes(sp.pattern.toLowerCase());
            });
            const isAuthorPublisher = authorLower && publisherLower && (
              authorLower === publisherLower ||
              publisherLower.includes(authorLower) ||
              authorLower.includes(publisherLower)
            );

            const awards = awardMap[book.id] || { wins: 0, nominations: 0 };
            const isHiddenGem = awards.nominations > 0 && awards.wins === 0;

            return {
              ...book,
              is_indie: isIndieVerlag || isSelfPublisher || isAuthorPublisher,
              indie_type: isIndieVerlag ? 'indie_verlag' : (isSelfPublisher || isAuthorPublisher) ? 'selfpublisher' : null,
              is_hidden_gem: isHiddenGem,
              award_count: awards.wins,
              nomination_count: awards.nominations,
              award_details: awards.details || [],
              reviews: MOCK_REVIEWS[book.id] || [],
            };
          });
        } catch (enrichErr) {
          log.warn('Book enrichment error (non-fatal):', enrichErr);
        }

        const tagMap: Record<number, Array<{ id: number; name: string; slug: string; tagType: string; color: string }>> = {};
        for (const row of tagRes.rows || []) {
          if (!tagMap[row.book_id]) tagMap[row.book_id] = [];
          if (!tagMap[row.book_id].some(t => t.id === row.tag_id)) {
            tagMap[row.book_id].push({
              id: row.tag_id,
              name: row.name,
              slug: row.slug,
              tagType: row.tag_type,
              color: row.color,
            });
          }
        }
        books = books.map((book: any) => ({
          ...book,
          tags: tagMap[book.id] || [],
        }));
      } else if (curatorIds.size > 0) {
        const curatorIdsArray = Array.from(curatorIds);
        const cPlaceholders = curatorIdsArray.map((_, i) => `$${i + 1}`).join(',');
        const curatorsResult = await queryDB(
          `SELECT id, name, bio, avatar_url, focus, visible FROM curators WHERE id IN (${cPlaceholders}) AND deleted_at IS NULL`,
          curatorIdsArray.map(Number)
        );
        for (const c of curatorsResult.rows || []) {
          curatorsMap[String(c.id)] = c;
        }
      }

      const booksById: Record<number, any> = {};
      books.forEach((b: any) => { booksById[b.id] = b; });

      const enrichedSections = sections.map((s: any) => {
        const cfg = { ...(s.section_config || s.config) };
        if (cfg.curatorId && curatorsMap[String(cfg.curatorId)]) {
          const cur = curatorsMap[String(cfg.curatorId)];
          cfg.curatorName = cur.name || cfg.curatorName || '';
          cfg.curatorAvatar = cur.avatar_url || cfg.curatorAvatar || '';
          cfg.curatorBio = cur.bio || cfg.curatorBio || '';
          cfg.curatorFocus = cur.focus || cfg.curatorFocus || '';
          cfg.isVerified = cur.visible ?? cfg.isVerified ?? false;
        }

        let sortedItems = Array.isArray(s.items) ? [...s.items] : [];
        const sortMode = cfg.books?.query?.sort || 'relevance';
        if (sortedItems.length > 0) {
          sortedItems.sort((a: any, b: any) => {
            const bookA = booksById[a.book_id];
            const bookB = booksById[b.book_id];
            if (!bookA || !bookB) return 0;
            if (sortMode === 'newest') {
              return new Date(bookB.created_at || 0).getTime() - new Date(bookA.created_at || 0).getTime();
            }
            if (sortMode === 'awarded' || sortMode === 'most-awarded') {
              return (bookB.award_score || 0) - (bookA.award_score || 0);
            }
            if (sortMode === 'relevance') {
              return (bookB.base_score || 0) - (bookA.base_score || 0);
            }
            if (sortMode === 'popular') {
              return (bookB.user_score || 0) - (bookA.user_score || 0);
            }
            if (sortMode === 'manual') {
              return (a.sort_order || 0) - (b.sort_order || 0);
            }
            return (bookB.base_score || 0) - (bookA.base_score || 0);
          });
        }

        const transformedItems = sortedItems.map((item: any) => {
          const itemData = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});
          let target: any = { type: 'page', page: { id: 0, slug: '/' } };

          if (item.target_type === 'category' && item.target_category_id) {
            target = { type: 'category', category: { id: item.target_category_id, slug: '', name: '' } };
          } else if (item.target_type === 'tag' && item.target_tag_id) {
            target = { type: 'tag', tag: { id: item.target_tag_id, slug: '', name: '' } };
          } else if (item.target_type === 'page' && item.target_page_id) {
            target = { type: 'page', page: { id: item.target_page_id, slug: '' } };
          } else if (item.target_type === 'template' && item.target_template_key) {
            const params = typeof item.target_params === 'string' ? JSON.parse(item.target_params) : (item.target_params || {});
            target = { type: 'template', templateKey: item.target_template_key, params };
          } else if (item.target_type === 'url' || itemData.link_href) {
            target = { type: 'url', url: itemData.link_href || '' };
          }

          return {
            id: item.id,
            sortOrder: item.sort_order,
            itemType: item.item_type || 'generic',
            data: itemData,
            target,
            book_id: item.book_id,
          };
        });

        const result: any = {
          id: s.id,
          zone: s.zone,
          type: s.section_type,
          title: cfg.title || '',
          config: cfg,
          items: transformedItems,
          order: s.sort_order,
        };

        if (s._queryBooks && s._queryBooks.length > 0) {
          result._queryBookIds = s._queryBooks;
        }

        return result;
      });

      const response = {
        ok: true,
        page: {
          id: page.id,
          slug: page.slug,
          type: page.type,
          template_key: page.template_key,
          status: page.status,
          visibility: page.visibility,
          seo_title: page.seo_title,
          seo_description: page.seo_description,
          canonical_url: page.canonical_url,
          robots: page.robots,
          page_type: page.page_type || 'composed',
          category_id: page.category_id || null,
          title: page.seo_title || page.slug,
          description: page.seo_description,
          enabled: page.status === 'published' && page.visibility === 'visible',
        },
        sections: enrichedSections,
        books: books,
      };

      return res.json(response);

    } catch (error) {
      log.error('Page Resolve Error:', error);
      return res.status(500).json({
        ok: false,
        path: (req.query.path as string) || '/',
        error: {
          code: 'INTERNAL',
          message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
        },
      });
    }
  });

  // ==================================================================
  // ADMIN PUBLISH/UNPUBLISH ROUTES
  // ==================================================================
  app.post('/api/admin/sections/:id/publish', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_SECTION_ID", message: "Section ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_publish_section($1)`, [id]);
      return res.json({ ok: true, data: { sectionId: id, action: "published" } });
    } catch (error) {
      log.error(`Error publishing section ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "PUBLISH_FAILED", message: String(error) } });
    }
  });

  app.post('/api/admin/sections/:id/unpublish', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_SECTION_ID", message: "Section ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_unpublish_section($1)`, [id]);
      return res.json({ ok: true, data: { sectionId: id, action: "unpublished" } });
    } catch (error) {
      log.error(`Error unpublishing section ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "UNPUBLISH_FAILED", message: String(error) } });
    }
  });

  app.post('/api/admin/sections/:id/publish-with-items', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_SECTION_ID", message: "Section ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_publish_section_with_items($1)`, [id]);
      return res.json({ ok: true, data: { sectionId: id, action: "published_with_items" } });
    } catch (error) {
      log.error(`Error publishing section+items ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "PUBLISH_WITH_ITEMS_FAILED", message: String(error) } });
    }
  });

  app.post('/api/admin/sections/:id/unpublish-with-items', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_SECTION_ID", message: "Section ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_unpublish_section_with_items($1)`, [id]);
      return res.json({ ok: true, data: { sectionId: id, action: "unpublished_with_items" } });
    } catch (error) {
      log.error(`Error unpublishing section+items ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "UNPUBLISH_WITH_ITEMS_FAILED", message: String(error) } });
    }
  });

  app.post('/api/admin/items/:id/publish', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_ITEM_ID", message: "Item ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_publish_item($1)`, [id]);
      return res.json({ ok: true, data: { itemId: id, action: "published" } });
    } catch (error) {
      log.error(`Error publishing item ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "PUBLISH_FAILED", message: String(error) } });
    }
  });

  app.post('/api/admin/items/:id/unpublish', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_ITEM_ID", message: "Item ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_unpublish_item($1)`, [id]);
      return res.json({ ok: true, data: { itemId: id, action: "unpublished" } });
    } catch (error) {
      log.error(`Error unpublishing item ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "UNPUBLISH_FAILED", message: String(error) } });
    }
  });

  app.post('/api/admin/pages/:id/publish', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_PAGE_ID", message: "Page ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_publish_page($1)`, [id]);
      return res.json({ ok: true, data: { pageId: id, action: "published" } });
    } catch (error) {
      log.error(`Error publishing page ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "PUBLISH_FAILED", message: String(error) } });
    }
  });

  app.post('/api/admin/pages/:id/unpublish', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: { code: "INVALID_PAGE_ID", message: "Page ID must be a positive integer" } });
    }

    try {
      await queryDB(`SELECT public.admin_unpublish_page($1)`, [id]);
      return res.json({ ok: true, data: { pageId: id, action: "unpublished" } });
    } catch (error) {
      log.error(`Error unpublishing page ${id}:`, error);
      return res.status(500).json({ ok: false, error: { code: "UNPUBLISH_FAILED", message: String(error) } });
    }
  });

  // ==================================================================
  // ADMIN PAGES CRUD
  // ==================================================================
  app.get('/api/admin/pages', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const status = req.query.status as string;

    try {
      let query = `
        SELECT
          id, slug, type, template_key, status, visibility,
          seo_title, publish_at, unpublish_at,
          page_type, category_id,
          created_at, updated_at
        FROM public.pages
      `;

      const params: any[] = [];

      if (status === 'draft' || status === 'published') {
        query += ` WHERE status = $1`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await queryDB(query, params);
      const rows = result?.rows || [];

      return res.json({
        ok: true,
        success: true,
        data: rows,
        meta: { count: rows.length, status: status || 'all' }
      });
    } catch (error) {
      log.error('Error fetching admin pages:', error);
      return res.json({
        ok: true,
        success: true,
        data: [],
        meta: { count: 0, status: status || 'all', error: String(error) }
      });
    }
  });

  app.post('/api/admin/pages', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const body = req.body;
      const {
        slug,
        type = 'composed',
        status = 'draft',
        visibility = 'visible',
        seo_title,
        seo_description,
        template_key,
        canonical_url,
        robots = 'index,follow',
        page_type = 'composed',
        category_id = null
      } = body;

      if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
        return res.status(400).json({
          ok: false,
          success: false,
          error: { code: 'INVALID_SLUG', message: 'Slug is required and must be a non-empty string' }
        });
      }

      const result = await queryDB(
        `INSERT INTO public.pages (
          slug, type, template_key, status, visibility,
          seo_title, seo_description, canonical_url, robots,
          page_type, category_id,
          content_version, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, NOW(), NOW())
        RETURNING
          id, slug, type, template_key, status, visibility,
          seo_title, seo_description, canonical_url, robots,
          page_type, category_id,
          publish_at, unpublish_at, content_version,
          created_at, updated_at`,
        [
          slug.trim(), type, template_key || null,
          status, visibility,
          seo_title || null, seo_description || null,
          canonical_url || null, robots,
          page_type, category_id ? parseInt(category_id) : null
        ]
      );

      if (result.rows.length === 0) {
        return res.status(500).json({
          ok: false, success: false,
          error: { code: 'CREATE_FAILED', message: 'Failed to create page' }
        });
      }

      return res.json({ ok: true, success: true, data: result.rows[0] });
    } catch (error) {
      log.error('Error creating page:', error);
      const errorMsg = String(error);
      if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
        return res.status(409).json({
          ok: false, success: false,
          error: { code: 'DUPLICATE_SLUG', message: 'A page with this slug already exists' }
        });
      }
      return res.status(500).json({
        ok: false, success: false,
        error: { code: 'CREATE_FAILED', message: String(error) }
      });
    }
  });

  app.get('/api/admin/pages/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_PAGE_ID' } });

    try {
      const result = await queryDB(`SELECT id, slug, type, template_key, status, visibility, seo_title, seo_description, canonical_url, robots, page_type, category_id, publish_at, unpublish_at, content_version, created_at, updated_at FROM public.pages WHERE id = $1`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, success: false, error: { code: 'NOT_FOUND' } });
      return res.json({ ok: true, success: true, data: result.rows[0] });
    } catch (error) {
      log.error(`Error fetching page ${id}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'FETCH_FAILED', message: String(error) } });
    }
  });

  app.patch('/api/admin/pages/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_PAGE_ID' } });

    try {
      const body = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      const allowedFields = ['slug', 'type', 'template_key', 'status', 'visibility', 'seo_title', 'seo_description', 'canonical_url', 'robots', 'publish_at', 'unpublish_at', 'page_type', 'category_id'];
      for (const field of allowedFields) {
        if (field in body) {
          updates.push(`${field} = $${paramIndex}`);
          values.push(body[field]);
          paramIndex++;
        }
      }
      if (updates.length === 0) return res.status(400).json({ ok: false, success: false, error: { code: 'NO_UPDATES' } });
      values.push(id);
      const result = await queryDB(`UPDATE public.pages SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, slug, type, template_key, status, visibility, seo_title, seo_description, canonical_url, robots, page_type, category_id, publish_at, unpublish_at, content_version, created_at, updated_at`, values);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, success: false, error: { code: 'NOT_FOUND' } });
      return res.json({ ok: true, success: true, data: result.rows[0] });
    } catch (error) {
      log.error(`Error updating page ${id}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'UPDATE_FAILED', message: String(error) } });
    }
  });

  app.delete('/api/admin/pages/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({
        ok: false, success: false,
        error: { code: 'INVALID_PAGE_ID', message: 'Page ID must be a positive integer' }
      });
    }

    try {
      const result = await queryDB(
        `DELETE FROM public.pages WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          ok: false, success: false,
          error: { code: 'NOT_FOUND', message: 'Page not found' }
        });
      }

      return res.json({ ok: true, success: true, data: { id } });
    } catch (error) {
      log.error('Error deleting page:', error);
      return res.status(500).json({
        ok: false, success: false,
        error: { code: 'DELETE_FAILED', message: String(error) }
      });
    }
  });

  // ==================================================================
  // ADMIN SECTIONS CRUD
  // ==================================================================
  app.get('/api/admin/sections', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const status = req.query.status as string;

    try {
      let query = `
        SELECT
          s.id, s.title, s.type, s.status,
          s.display_order, s.publish_date,
          s.created_at, s.updated_at
        FROM public.sections s
        WHERE s.deleted_at IS NULL
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND s.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY s.display_order ASC, s.created_at DESC`;

      const result = await queryDB(query, params);

      return res.json({
        ok: true,
        success: true,
        data: result.rows,
        meta: { count: result.rows.length, status: status || 'all' }
      });
    } catch (error) {
      log.error('Error fetching admin sections:', error);
      return res.status(500).json({
        ok: false, success: false,
        error: { code: 'FETCH_FAILED', message: String(error) }
      });
    }
  });

  app.get('/api/admin/items', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    return res.json({
      ok: true,
      success: true,
      data: [],
      meta: { count: 0, message: 'Items table not implemented yet' }
    });
  });

  // Page Sections
  app.get('/api/admin/pages/:pageId/sections', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const pageId = parseIdParam(req.params.pageId);
    if (!pageId) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_PAGE_ID' } });

    try {
      const result = await queryDB(`SELECT id, page_id, zone, sort_order, section_type, config, status, visibility, publish_at, unpublish_at, max_views, max_clicks, current_views, current_clicks, created_at, updated_at FROM public.page_sections WHERE page_id = $1 ORDER BY zone ASC, sort_order ASC`, [pageId]);
      return res.json({ ok: true, success: true, data: result.rows, meta: { count: result.rows.length, pageId } });
    } catch (error) {
      log.error(`Error fetching sections for page ${pageId}:`, error);
      return res.json({ ok: true, success: true, data: [], meta: { count: 0, pageId, error: String(error) } });
    }
  });

  // Create section (multiple endpoint aliases)
  const createSectionHandler = async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const pageId = parseIdParam(req.params.pageId);
    if (!pageId) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_PAGE_ID' } });

    try {
      const body = req.body;
      const { zone = 'main', sort_order = 0, section_type = 'category_grid', config = {}, status = 'draft', visibility = 'visible', publish_at = null, unpublish_at = null, max_views = null, max_clicks = null } = body;

      let configJson: string;
      try {
        configJson = typeof config === 'string' ? config : JSON.stringify(config);
      } catch (jsonErr) {
        return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_CONFIG', message: 'Config must be a valid JSON object' } });
      }

      const result = await queryDB(`INSERT INTO public.page_sections (page_id, zone, sort_order, section_type, config, status, visibility, publish_at, unpublish_at, max_views, max_clicks, current_views, current_clicks, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, NOW(), NOW()) RETURNING id, page_id, zone, sort_order, section_type, config, status, visibility, publish_at, unpublish_at, max_views, max_clicks, current_views, current_clicks, created_at, updated_at`, [pageId, zone, sort_order, section_type, configJson, status, visibility, publish_at, unpublish_at, max_views, max_clicks]);
      if (result.rows.length === 0) return res.status(500).json({ ok: false, success: false, error: { code: 'CREATE_FAILED' } });
      return res.json({ ok: true, success: true, data: result.rows[0] });
    } catch (error) {
      log.error(`Error creating section for page ${pageId}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'CREATE_FAILED', message: String(error) } });
    }
  };

  app.post('/api/admin/pages/:pageId/sections', createSectionHandler);
  app.post('/api/admin/pages/:pageId/page-sections-create', createSectionHandler);
  app.post('/api/admin/pages/:pageId/sections-v2', createSectionHandler);
  app.post('/api/admin/pages/:pageId/sections-create-v3-jan26', createSectionHandler);

  // Reorder Sections
  app.post('/api/admin/pages/:pageId/sections/reorder', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const pageId = parseIdParam(req.params.pageId);
    if (!pageId) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_PAGE_ID' } });

    try {
      const body = req.body;
      const { zone, sectionIds } = body;
      if (!Array.isArray(sectionIds)) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_INPUT' } });
      if (zone) {
        for (let i = 0; i < sectionIds.length; i++) {
          await queryDB(`UPDATE public.page_sections SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND page_id = $3 AND zone = $4`, [i * 10, sectionIds[i], pageId, zone]);
        }
      } else {
        for (let i = 0; i < sectionIds.length; i++) {
          await queryDB(`UPDATE public.page_sections SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND page_id = $3`, [i * 10, sectionIds[i], pageId]);
        }
      }
      return res.json({ ok: true, success: true, data: { pageId, zone: zone || 'all', reorderedCount: sectionIds.length } });
    } catch (error) {
      log.error(`Error reordering sections for page ${pageId}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'REORDER_FAILED', message: String(error) } });
    }
  });

  // PATCH Update Section
  app.patch('/api/admin/sections/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_SECTION_ID' } });

    try {
      const body = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      const allowedFields = ['zone', 'sort_order', 'config', 'section_type', 'status', 'visibility', 'publish_at', 'unpublish_at', 'max_views', 'max_clicks'];
      for (const field of allowedFields) {
        let value = body[field];
        if (field === 'section_type' && !value && body.config?.section_type) {
          value = body.config.section_type;
        }

        if (value !== undefined) {
          if ((field === 'publish_at' || field === 'unpublish_at' || field === 'max_views' || field === 'max_clicks') && value === null) {
            updates.push(`${field} = NULL`);
          } else if (field === 'config' && typeof value === 'object') {
            updates.push(`${field} = $${paramIndex}::jsonb`);
            values.push(JSON.stringify(value));
            paramIndex++;
          } else {
            updates.push(`${field} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
      }
      if (updates.length === 0) return res.status(400).json({ ok: false, success: false, error: { code: 'NO_UPDATES' } });
      values.push(id);
      const result = await queryDB(`UPDATE public.page_sections SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, page_id, zone, sort_order, section_type, config, status, visibility, publish_at, unpublish_at, max_views, max_clicks, current_views, current_clicks, created_at, updated_at`, values);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, success: false, error: { code: 'NOT_FOUND' } });
      return res.json({ ok: true, success: true, data: result.rows[0] });
    } catch (error) {
      log.error(`Error updating section ${id}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'UPDATE_FAILED', message: String(error) } });
    }
  });

  // DELETE Section
  app.delete('/api/admin/sections/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_SECTION_ID' } });

    try {
      const result = await queryDB(`DELETE FROM public.page_sections WHERE id = $1 RETURNING id`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, success: false, error: { code: 'NOT_FOUND' } });
      return res.json({ ok: true, success: true, data: { id } });
    } catch (error) {
      log.error(`Error deleting section ${id}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'DELETE_FAILED', message: String(error) } });
    }
  });

  // Section view/click tracking (public, no auth) with bot/rate filtering
  app.post('/api/sections/:id/track', async (req: Request, res: Response) => {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false });

    const { type } = req.body;
    if (type !== 'view' && type !== 'click') {
      return res.status(400).json({ ok: false, error: 'type must be view or click' });
    }

    try {
      const settings = await getTrackingSettings();
      if (!settings) throw new Error('No tracking settings');
      const ua = (req.headers['user-agent'] || '').toLowerCase();
      const clientIp = getClientIp(req);

      // 1. Bot User-Agent check
      const isBot = (settings.bot_user_agents || []).some((bot: string) => ua.includes(bot.toLowerCase()));
      if (isBot) {
        return res.json({ ok: true, filtered: 'bot' });
      }

      // 2. Admin IP exclusion
      if ((settings.excluded_admin_ips || []).includes(clientIp)) {
        return res.json({ ok: true, filtered: 'admin_ip' });
      }

      // 3. Rate limiting per IP per section per type
      const windowMs = (settings.rate_limit_window_minutes || 60) * 60 * 1000;
      const maxPerWindow = type === 'view' ? (settings.rate_limit_max_views || 3) : (settings.rate_limit_max_clicks || 5);
      const rateKey = `${clientIp}:${id}:${type}`;
      const now = Date.now();
      const entry = trackingRateCache.get(rateKey);

      if (entry) {
        if (now - entry.windowStart > windowMs) {
          trackingRateCache.set(rateKey, { count: 1, windowStart: now });
        } else if (entry.count >= maxPerWindow) {
          return res.json({ ok: true, filtered: 'rate_limit' });
        } else {
          entry.count++;
        }
      } else {
        trackingRateCache.set(rateKey, { count: 1, windowStart: now });
      }

      // Cleanup old entries periodically (every ~1000 requests)
      if (Math.random() < 0.001) {
        const keysToDelete: string[] = [];
        trackingRateCache.forEach((val, key) => {
          if (now - val.windowStart > windowMs * 2) keysToDelete.push(key);
        });
        keysToDelete.forEach(k => trackingRateCache.delete(k));
      }

      const col = type === 'view' ? 'current_views' : 'current_clicks';
      await queryDB(`UPDATE public.page_sections SET ${col} = COALESCE(${col}, 0) + 1 WHERE id = $1`, [id]);
      return res.json({ ok: true });
    } catch (error) {
      log.error(`Error tracking ${type} for section ${id}:`, error);
      return res.json({ ok: true });
    }
  });

  // ==================================================================
  // SECTION ITEMS CRUD
  // ==================================================================
  app.get('/api/admin/sections/:sectionId/items', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const sectionId = parseIdParam(req.params.sectionId);
    if (!sectionId) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_SECTION_ID' } });

    try {
      const result = await queryDB(`
        SELECT si.id, si.page_section_id, si.sort_order, si.item_type, si.data, 
               si.target_type, si.target_category_id, si.target_tag_id,
               si.target_page_id, si.target_template_key, si.target_params,
               si.status, si.visibility, si.publish_at, si.unpublish_at, si.created_at, si.updated_at,
               CASE WHEN si.item_type = 'book' AND si.data->>'book_id' IS NOT NULL THEN
                 json_build_object('id', b.id, 'title', b.title, 'author', b.author, 'isbn13', b.isbn13, 'cover_url', b.cover_url)
               ELSE NULL END AS book
        FROM public.section_items si
        LEFT JOIN public.books b ON si.item_type = 'book' AND si.data->>'book_id' IS NOT NULL AND (si.data->>'book_id')::bigint = b.id
        WHERE si.page_section_id = $1 
        ORDER BY si.sort_order ASC`, [sectionId]);
      const rows = result.rows.map((row: any) => ({
        ...row,
        target_book_id: row.data?.book_id || null,
      }));
      return res.json({ ok: true, success: true, data: rows, meta: { count: rows.length, sectionId } });
    } catch (error) {
      log.error(`Error fetching items for section ${sectionId}:`, error);
      return res.json({ ok: true, success: true, data: [], meta: { count: 0, sectionId, error: String(error) } });
    }
  });

  app.post('/api/admin/sections/:sectionId/items', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const sectionId = parseIdParam(req.params.sectionId);
    if (!sectionId) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_SECTION_ID' } });

    try {
      const body = req.body;
      const {
        sort_order = 0,
        item_type = 'text',
        data = {},
        target_type = null,
        target_category_id = null,
        target_tag_id = null,
        target_book_id = null,
        target_page_id = null,
        target_template_key = null,
        target_params = null,
        status = 'published',
        visibility = 'visible',
        publish_at = null,
        unpublish_at = null
      } = body;

      const itemData = { ...data };
      let finalTargetType = target_type;
      let finalTargetTemplateKey = target_template_key;
      let finalTargetCategoryId = target_category_id;
      let finalTargetTagId = target_tag_id;
      let finalTargetPageId = target_page_id;

      if (item_type === 'book') {
        if (target_book_id) {
          itemData.book_id = target_book_id;
        }
        finalTargetType = 'template';
        finalTargetTemplateKey = 'book';
        finalTargetCategoryId = null;
        finalTargetTagId = null;
        finalTargetPageId = null;
      }

      const nextSortResult = await queryDB(
        `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort FROM public.section_items WHERE page_section_id = $1`,
        [sectionId]
      );
      const nextSort = nextSortResult.rows[0]?.next_sort ?? sort_order;

      const result = await queryDB(
        `INSERT INTO public.section_items (
          page_section_id, sort_order, item_type, data,
          target_type, target_category_id, target_tag_id,
          target_page_id, target_template_key, target_params,
          status, visibility, publish_at, unpublish_at,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *`,
        [
          sectionId, nextSort, item_type, JSON.stringify(itemData),
          finalTargetType, finalTargetCategoryId, finalTargetTagId,
          finalTargetPageId, finalTargetTemplateKey, target_params ? JSON.stringify(target_params) : null,
          status, visibility, publish_at, unpublish_at
        ]
      );

      if (result.rows.length === 0) return res.status(500).json({ ok: false, success: false, error: { code: 'CREATE_FAILED' } });
      return res.json({ ok: true, success: true, data: result.rows[0] });
    } catch (error) {
      log.error(`Error creating item for section ${sectionId}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'CREATE_FAILED', message: String(error) } });
    }
  });

  // PATCH Update Item
  app.patch('/api/admin/items/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_ITEM_ID' } });

    try {
      const body = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      const allowedFields = ['sort_order', 'item_type', 'data', 'target_type', 'target_category_id', 'target_tag_id', 'status', 'visibility', 'publish_at', 'unpublish_at'];
      for (const field of allowedFields) {
        if (field in body) {
          if (field === 'data' && typeof body[field] === 'object') {
            updates.push(`${field} = $${paramIndex}::jsonb`);
            values.push(JSON.stringify(body[field]));
          } else {
            updates.push(`${field} = $${paramIndex}`);
            values.push(body[field]);
          }
          paramIndex++;
        }
      }
      if (updates.length === 0) return res.status(400).json({ ok: false, success: false, error: { code: 'NO_UPDATES' } });
      values.push(id);
      const result = await queryDB(`UPDATE public.section_items SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, page_section_id, sort_order, item_type, data, target_type, target_category_id, target_tag_id, status, visibility, publish_at, unpublish_at, created_at, updated_at`, values);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, success: false, error: { code: 'NOT_FOUND' } });
      return res.json({ ok: true, success: true, data: result.rows[0] });
    } catch (error) {
      log.error(`Error updating item ${id}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'UPDATE_FAILED', message: String(error) } });
    }
  });

  // Reorder Items
  app.post('/api/admin/sections/:sectionId/items/reorder', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const sectionId = parseIdParam(req.params.sectionId);
    if (!sectionId) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_SECTION_ID' } });

    try {
      const body = req.body;
      const { itemIds } = body;
      if (!Array.isArray(itemIds)) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_INPUT' } });
      for (let i = 0; i < itemIds.length; i++) {
        await queryDB(`UPDATE public.section_items SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND page_section_id = $3`, [i, itemIds[i], sectionId]);
      }
      return res.json({ ok: true, success: true, data: { sectionId, reorderedCount: itemIds.length } });
    } catch (error) {
      log.error(`Error reordering items for section ${sectionId}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'REORDER_FAILED', message: String(error) } });
    }
  });

  // DELETE Item
  app.delete('/api/admin/items/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_ITEM_ID' } });

    try {
      const result = await queryDB(`DELETE FROM public.section_items WHERE id = $1 RETURNING id`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, success: false, error: { code: 'NOT_FOUND' } });
      return res.json({ ok: true, success: true, data: { id } });
    } catch (error) {
      log.error(`Error deleting item ${id}:`, error);
      return res.status(500).json({ ok: false, success: false, error: { code: 'DELETE_FAILED', message: String(error) } });
    }
  });

  // ==================================================================
  // NAVIGATION <-> PAGES LINKING
  // ==================================================================
  app.get('/api/admin/pages/:id/navigation-links', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const pageId = parseIdParam(req.params.id);
    if (!pageId) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_PAGE_ID' } });
    }

    try {
      const result = await queryDB(
        `SELECT
           mi.id,
           COALESCE(mi.name, mi.label) AS name,
           COALESCE(
             CASE WHEN mi.target_type = 'page' THEN p.slug END,
             mi.href,
             mi.path
           ) AS href_resolved,
           mi.target_type,
           mi.target_page_id
         FROM menu_items mi
         LEFT JOIN pages p ON mi.target_type = 'page' AND mi.target_page_id = p.id
         WHERE mi.target_type = 'page' AND mi.target_page_id = $1
         ORDER BY name ASC`,
        [pageId]
      );

      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error(`Error fetching navigation links for page ${pageId}:`, error);
      return res.status(500).json({
        ok: false,
        error: { code: 'FETCH_FAILED', message: String(error) }
      });
    }
  });

  app.post('/api/admin/menu-items/:id/link-page', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const menuItemId = parseIdParam(req.params.id);
    if (!menuItemId) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_MENU_ITEM_ID' } });
    }

    const body = req.body;
    if (!body) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_JSON' } });
    }

    const pageId = Number(body.pageId);
    if (!Number.isInteger(pageId) || pageId <= 0) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_PAGE_ID' } });
    }

    try {
      const pageCheck = await queryDB(`SELECT id FROM pages WHERE id = $1 LIMIT 1`, [pageId]);
      if (!pageCheck.rows || pageCheck.rows.length === 0) {
        return res.status(404).json({ ok: false, error: { code: 'PAGE_NOT_FOUND' } });
      }

      const menuCheck = await queryDB(`SELECT id FROM menu_items WHERE id = $1 LIMIT 1`, [menuItemId]);
      if (!menuCheck.rows || menuCheck.rows.length === 0) {
        return res.status(404).json({ ok: false, error: { code: 'MENU_ITEM_NOT_FOUND' } });
      }

      await queryDB(
        `UPDATE menu_items
         SET target_type = 'page',
             target_page_id = $2,
             target_category_id = NULL,
             target_tag_id = NULL,
             target_template_key = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [menuItemId, pageId]
      );

      return res.json({ ok: true, data: { menuItemId, pageId } });
    } catch (error) {
      log.error(`Error linking menu item ${menuItemId} to page ${pageId}:`, error);
      return res.status(500).json({
        ok: false,
        error: { code: 'LINK_FAILED', message: String(error) }
      });
    }
  });

  app.delete('/api/admin/menu-items/:id/unlink-page', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    const menuItemId = parseIdParam(req.params.id);
    if (!menuItemId) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_MENU_ITEM_ID' } });
    }

    try {
      const menuCheck = await queryDB(`SELECT id, target_type, target_page_id FROM menu_items WHERE id = $1 LIMIT 1`, [menuItemId]);
      if (!menuCheck.rows || menuCheck.rows.length === 0) {
        return res.status(404).json({ ok: false, error: { code: 'MENU_ITEM_NOT_FOUND' } });
      }

      await queryDB(
        `UPDATE menu_items
         SET target_type = NULL,
             target_page_id = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [menuItemId]
      );

      return res.json({ ok: true, data: { menuItemId } });
    } catch (error) {
      log.error(`Error unlinking menu item ${menuItemId}:`, error);
      return res.status(500).json({
        ok: false,
        error: { code: 'UNLINK_FAILED', message: String(error) }
      });
    }
  });

  // ==================================================================
  // SITE BANNERS (Admin CRUD - /api/site-config/banner*)
  // ==================================================================
  app.get('/api/site-config/banners', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const result = await queryDB(
        `SELECT * FROM site_banners
         ORDER BY position ASC, display_order DESC, created_at DESC`,
        []
      );

      return res.json({ ok: true, banners: result.rows });
    } catch (error) {
      log.error('Error fetching banners:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/site-config/banner', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const body = req.body;
      const { name, message, badge_text, button_text, button_url, bg_color, text_color, badge_bg_color, badge_text_color, visible, status, position, display_order } = body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Name is required' });
      }

      if (!message || message.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Message is required' });
      }

      const result = await queryDB(
        `INSERT INTO site_banners (
          name, message, badge_text, button_text, button_url,
          bg_color, text_color, badge_bg_color, badge_text_color,
          visible, status, position, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          name.trim(),
          message.trim(),
          badge_text?.trim() || null,
          button_text?.trim() || null,
          button_url?.trim() || null,
          bg_color || '#247ba0',
          text_color || '#ffffff',
          badge_bg_color || '#ffe066',
          badge_text_color || '#2a2a2a',
          visible !== undefined ? visible : true,
          status || 'published',
          position || 'top',
          display_order !== undefined ? parseInt(display_order) : 0
        ]
      );

      return res.json({ ok: true, banner: result.rows[0] });
    } catch (error) {
      log.error('Error creating banner:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/site-config/banner/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const body = req.body;
      const { name, message, badge_text, button_text, button_url, bg_color, text_color, badge_bg_color, badge_text_color, visible, status, position, display_order } = body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Name is required' });
      }

      if (!message || message.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Message is required' });
      }

      const result = await queryDB(
        `UPDATE site_banners
         SET name = $1, message = $2, badge_text = $3, button_text = $4,
             button_url = $5, bg_color = $6, text_color = $7, badge_bg_color = $8,
             badge_text_color = $9, visible = $10, status = $11, position = $12,
             display_order = $13, updated_at = NOW()
         WHERE id = $14
         RETURNING *`,
        [
          name.trim(),
          message.trim(),
          badge_text?.trim() || null,
          button_text?.trim() || null,
          button_url?.trim() || null,
          bg_color || '#247ba0',
          text_color || '#ffffff',
          badge_bg_color || '#ffe066',
          badge_text_color || '#2a2a2a',
          visible !== undefined ? visible : true,
          status || 'published',
          position || 'top',
          display_order !== undefined ? parseInt(display_order) : 0,
          parseInt(String(id))
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Banner not found' });
      }

      return res.json({ ok: true, banner: result.rows[0] });
    } catch (error) {
      log.error('Error updating banner:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/site-config/banner/:id', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const id = req.params.id;
      const result = await queryDB(
        `DELETE FROM site_banners WHERE id = $1 RETURNING *`,
        [parseInt(String(id))]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Banner not found' });
      }

      return res.json({ ok: true, deleted: result.rows[0] });
    } catch (error) {
      log.error('Error deleting banner:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // INDIE PUBLISHERS MANAGEMENT
  // ==================================================================
  app.get('/api/admin/indie-publishers', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const result = await queryDB('SELECT * FROM indie_publishers ORDER BY name ASC');
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Indie publishers fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/indie-publishers', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { name, source } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ ok: false, error: 'Name ist erforderlich' });
      }
      const result = await queryDB(
        'INSERT INTO indie_publishers (name, source) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING *',
        [name.trim(), source || 'manual']
      );
      if (result.rows.length === 0) {
        return res.status(409).json({ ok: false, error: 'Verlag existiert bereits' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Indie publisher create error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/admin/indie-publishers/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const id = req.params.id;
      const result = await queryDB('DELETE FROM indie_publishers WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Nicht gefunden' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Indie publisher delete error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/indie-publishers/bulk', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { publishers, replace } = req.body;
      if (!Array.isArray(publishers) || publishers.length === 0) {
        return res.status(400).json({ ok: false, error: 'publishers Array ist erforderlich' });
      }
      if (replace) {
        await queryDB('DELETE FROM indie_publishers');
      }
      let imported = 0;
      let skipped = 0;
      for (const pub of publishers) {
        const name = typeof pub === 'string' ? pub : pub.name;
        const focus = typeof pub === 'string' ? null : (pub.focus || null);
        const source = typeof pub === 'string' ? 'bulk-import' : (pub.source || 'bulk-import');
        if (!name || !name.trim()) { skipped++; continue; }
        const result = await queryDB(
          'INSERT INTO indie_publishers (name, focus, source) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING RETURNING id',
          [name.trim(), focus, source]
        );
        if (result.rows.length > 0) imported++;
        else skipped++;
      }
      return res.json({ ok: true, imported, skipped, total: publishers.length });
    } catch (error) {
      log.error('Indie publishers bulk import error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/indie-publishers/fuzzy-match', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const indieRes = await queryDB('SELECT id, name, focus FROM indie_publishers ORDER BY name ASC');
      const indiePublishers = indieRes.rows || [];

      const booksRes = await queryDB(
        `SELECT publisher, COUNT(*) as book_count
         FROM books
         WHERE publisher IS NOT NULL AND publisher != ''
         GROUP BY publisher
         ORDER BY COUNT(*) DESC`
      );
      const dbPublishers = booksRes.rows || [];

      const results = indiePublishers.map((indie: any) => {
        const indieLower = indie.name.toLowerCase().trim();
        const matches: Array<{ publisher: string; book_count: number; match_type: string }> = [];

        for (const dbPub of dbPublishers) {
          const dbLower = dbPub.publisher.toLowerCase().trim();
          if (dbLower === indieLower) {
            matches.push({ publisher: dbPub.publisher, book_count: parseInt(dbPub.book_count), match_type: 'exact' });
          } else if (dbLower.includes(indieLower) || indieLower.includes(dbLower)) {
            matches.push({ publisher: dbPub.publisher, book_count: parseInt(dbPub.book_count), match_type: 'contains' });
          } else {
            const indieWords = indieLower.split(/\s+/).filter((w: string) => w.length > 2);
            const dbWords = dbLower.split(/\s+/).filter((w: string) => w.length > 2);
            const commonWords = indieWords.filter((w: string) => dbWords.some((dw: string) => dw.includes(w) || w.includes(dw)));
            if (commonWords.length >= Math.max(1, Math.floor(indieWords.length * 0.5))) {
              const isLikelyMatch = commonWords.length > 0 && (commonWords.length / Math.max(indieWords.length, dbWords.length)) > 0.3;
              if (isLikelyMatch) {
                matches.push({ publisher: dbPub.publisher, book_count: parseInt(dbPub.book_count), match_type: 'fuzzy' });
              }
            }
          }
        }

        return {
          id: indie.id,
          indie_name: indie.name,
          focus: indie.focus,
          matches: matches.slice(0, 10),
          match_count: matches.length,
          total_books: matches.reduce((sum: number, m: any) => sum + m.book_count, 0),
        };
      });

      const matched = results.filter((r: any) => r.match_count > 0);
      const unmatched = results.filter((r: any) => r.match_count === 0);

      return res.json({
        ok: true,
        summary: {
          total_indie: indiePublishers.length,
          matched: matched.length,
          unmatched: unmatched.length,
          total_db_publishers: dbPublishers.length,
        },
        results,
      });
    } catch (error) {
      log.error('Fuzzy match error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // SELFPUBLISHER PATTERNS MANAGEMENT
  // ==================================================================
  app.get('/api/admin/selfpublisher-patterns', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const result = await queryDB('SELECT * FROM selfpublisher_patterns ORDER BY pattern ASC');
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Selfpublisher patterns fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/selfpublisher-patterns', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { pattern, match_type } = req.body;
      if (!pattern || !pattern.trim()) {
        return res.status(400).json({ ok: false, error: 'Pattern ist erforderlich' });
      }
      const result = await queryDB(
        'INSERT INTO selfpublisher_patterns (pattern, match_type) VALUES ($1, $2) ON CONFLICT (pattern) DO NOTHING RETURNING *',
        [pattern.trim(), match_type || 'contains']
      );
      if (result.rows.length === 0) {
        return res.status(409).json({ ok: false, error: 'Pattern existiert bereits' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Selfpublisher pattern create error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/admin/selfpublisher-patterns/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const id = req.params.id;
      const result = await queryDB('DELETE FROM selfpublisher_patterns WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Nicht gefunden' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Selfpublisher pattern delete error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // PUBLIC INDIE CHECK HELPER (used by page resolve enrichment)
  // ==================================================================
  app.get('/api/indie-check', async (_req: Request, res: Response) => {
    try {
      const publishersResult = await queryDB('SELECT name FROM indie_publishers ORDER BY name ASC');
      const patternsResult = await queryDB('SELECT pattern, match_type FROM selfpublisher_patterns ORDER BY pattern ASC');
      return res.json({
        ok: true,
        indie_publishers: publishersResult.rows.map((r: any) => r.name),
        selfpublisher_patterns: patternsResult.rows,
      });
    } catch (error) {
      return res.json({ ok: true, indie_publishers: [], selfpublisher_patterns: [] });
    }
  });

  // ==================================================================
  // TRACKING SETTINGS (Admin)
  // ==================================================================
  app.get('/api/admin/tracking-settings', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const result = await queryDB('SELECT bot_user_agents, rate_limit_window_minutes, rate_limit_max_views, rate_limit_max_clicks, excluded_admin_ips, updated_at FROM tracking_settings WHERE id = 1');
      if (result.rows.length === 0) {
        return res.json({ ok: true, data: null });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Error fetching tracking settings:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.patch('/api/admin/tracking-settings', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;

    try {
      const { bot_user_agents, rate_limit_window_minutes, rate_limit_max_views, rate_limit_max_clicks, excluded_admin_ips } = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (bot_user_agents !== undefined && Array.isArray(bot_user_agents)) {
        updates.push(`bot_user_agents = $${paramIndex}::text[]`);
        values.push(bot_user_agents);
        paramIndex++;
      }
      if (rate_limit_window_minutes !== undefined) {
        updates.push(`rate_limit_window_minutes = $${paramIndex}`);
        values.push(Math.max(1, Math.min(1440, parseInt(String(rate_limit_window_minutes)) || 60)));
        paramIndex++;
      }
      if (rate_limit_max_views !== undefined) {
        updates.push(`rate_limit_max_views = $${paramIndex}`);
        values.push(Math.max(1, Math.min(1000, parseInt(String(rate_limit_max_views)) || 3)));
        paramIndex++;
      }
      if (rate_limit_max_clicks !== undefined) {
        updates.push(`rate_limit_max_clicks = $${paramIndex}`);
        values.push(Math.max(1, Math.min(1000, parseInt(String(rate_limit_max_clicks)) || 5)));
        paramIndex++;
      }
      if (excluded_admin_ips !== undefined && Array.isArray(excluded_admin_ips)) {
        updates.push(`excluded_admin_ips = $${paramIndex}::text[]`);
        values.push(excluded_admin_ips.filter((ip: string) => ip && ip.trim()));
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ ok: false, error: 'No fields to update' });
      }

      updates.push('updated_at = NOW()');
      const result = await queryDB(
        `UPDATE tracking_settings SET ${updates.join(', ')} WHERE id = 1 RETURNING *`,
        values
      );

      // Invalidate cache
      cachedTrackingSettings = null;

      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Error updating tracking settings:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Endpoint to get client's own IP (for admin convenience)
  app.get('/api/admin/my-ip', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    return res.json({ ok: true, ip: getClientIp(req) });
  });

  // ==================================================================
  // MODULE CATALOG (Public)
  // ==================================================================
  app.get('/api/modules/catalog', async (_req: Request, res: Response) => {
    try {
      return res.json({
        success: true,
        data: {
          author_storefront: { name: 'Author Storefront', description: 'Create your author storefront' },
          creator_dashboard: { name: 'Creator Dashboard', description: 'Access creator analytics and tools' },
          publisher_dashboard: { name: 'Publisher Dashboard', description: 'Manage publisher content' },
        }
      });
    } catch (error) {
      log.error('Get module catalog error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // DASHBOARD KPIs
  // ==================================================================
  app.get('/api/dashboard/kpis', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ ok: false, error: 'Nicht authentifiziert' });
      }
      const sessionUser = req.user as any;
      const userId = sessionUser.claims?.sub || sessionUser.id;
      if (!userId) {
        return res.status(401).json({ ok: false, error: 'Benutzer nicht identifizierbar' });
      }

      const [curationsResult, eventsResult, contentSourcesResult] = await Promise.all([
        queryDB(`SELECT COUNT(*) as count FROM user_curations WHERE user_id = $1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
        queryDB(`SELECT COUNT(*) as count FROM user_events WHERE user_id = $1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
        queryDB(`SELECT COUNT(*) as count FROM content_sources WHERE user_id = $1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
      ]);

      const curatorRow = await queryDB(
        `SELECT id, slug FROM curators WHERE user_id = $1::text LIMIT 1`, [userId]
      ).catch(() => ({ rows: [] }));

      const hasStorefront = curatorRow.rows.length > 0;
      const curatorSlug = curatorRow.rows[0]?.slug || null;

      let isPublished = false;
      if (hasStorefront) {
        const bsRow = await queryDB(
          `SELECT is_published FROM bookstore_profiles WHERE user_id = $1 LIMIT 1`, [userId]
        ).catch(() => ({ rows: [] }));
        isPublished = bsRow.rows[0]?.is_published === true;
      }

      return res.json({
        ok: true,
        data: {
          curations: parseInt(curationsResult.rows[0]?.count || '0', 10),
          events: parseInt(eventsResult.rows[0]?.count || '0', 10),
          contentSources: parseInt(contentSourcesResult.rows[0]?.count || '0', 10),
          hasStorefront,
          isPublished,
          curatorSlug,
        }
      });
    } catch (error) {
      log.error('Dashboard KPIs error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // PUBLIC CURATIONS (for CMS sections)
  // ==================================================================
  app.get('/api/public/curations', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || '10'), 50);
      const offset = parseInt((req.query.offset as string) || '0');
      const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : null;
      const status = (req.query.status as string) || 'published';

      let query = `
        SELECT uc.id, uc.title, uc.description, uc.category_id, uc.tags,
               (SELECT COUNT(*) FROM curation_books cb WHERE cb.curation_id = uc.id) AS book_count,
               COALESCE(bp.display_name, uc.user_id) AS user_name,
               bp.avatar_url AS user_avatar
        FROM user_curations uc
        LEFT JOIN bookstore_profiles bp ON bp.user_id = uc.user_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIdx = 1;

      if (status === 'published') {
        query += ` AND uc.is_published = true`;
      }

      if (categoryId) {
        query += ` AND uc.category_id = $${paramIdx++}`;
        params.push(categoryId);
      }

      query += ` ORDER BY uc.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(limit, offset);

      const result = await queryDB(query, params);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Public curations error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // USER CURATIONS CRUD
  // ==================================================================
  app.get('/api/user-curations', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId is required' });
      }
      const result = await queryDB(
        `SELECT * FROM user_curations WHERE user_id = $1 ORDER BY display_order ASC, created_at DESC`,
        [userId]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get user curations error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/user-curations', async (req: Request, res: Response) => {
    try {
      const { userId, title, description, tags, curation_type, category_id, category_label, tag_rules } = req.body;
      if (!userId || !title) {
        return res.status(400).json({ ok: false, error: 'userId and title are required' });
      }
      const tagsArray = Array.isArray(tags) ? tags : [];
      const result = await queryDB(
        `INSERT INTO user_curations (user_id, title, description, tags, curation_type, category_id, category_label, tag_rules)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, title.trim(), description || null, tagsArray, curation_type || 'manual', category_id || null, category_label || null, tag_rules ? JSON.stringify(tag_rules) : '{}']
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Create user curation error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/user-curations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid curation ID' });
      }
      const { title, description, tags, is_published, curation_type, category_id, category_label, tag_rules } = req.body;
      const result = await queryDB(
        `UPDATE user_curations
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             tags = COALESCE($3, tags),
             is_published = COALESCE($4, is_published),
             curation_type = COALESCE($5, curation_type),
             category_id = COALESCE($6, category_id),
             category_label = COALESCE($7, category_label),
             tag_rules = COALESCE($8, tag_rules),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          title ? title.trim() : null,
          description !== undefined ? description : null,
          Array.isArray(tags) ? tags : null,
          is_published !== undefined ? is_published : null,
          curation_type || null,
          category_id !== undefined ? category_id : null,
          category_label !== undefined ? category_label : null,
          tag_rules ? JSON.stringify(tag_rules) : null,
          id
        ]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Curation not found' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Update user curation error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/user-curations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid curation ID' });
      }
      const result = await queryDB(
        `DELETE FROM user_curations WHERE id = $1 RETURNING id`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Curation not found' });
      }
      return res.json({ ok: true, data: { id } });
    } catch (error) {
      log.error('Delete user curation error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/user-curations/:id/books', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid curation ID' });
      }
      const result = await queryDB(
        `SELECT cb.*, b.*
         FROM curation_books cb
         LEFT JOIN books b ON b.id = cb.book_id
         WHERE cb.curation_id = $1
         ORDER BY cb.display_order ASC, cb.added_at ASC`,
        [id]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get curation books error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/user-curations/:id/books', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid curation ID' });
      }
      const { bookId } = req.body;
      if (!bookId) {
        return res.status(400).json({ ok: false, error: 'bookId is required' });
      }
      const maxOrder = await queryDB(
        `SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM curation_books WHERE curation_id = $1`,
        [id]
      );
      const nextOrder = maxOrder.rows[0]?.next_order || 0;
      const result = await queryDB(
        `INSERT INTO curation_books (curation_id, book_id, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (curation_id, book_id) DO NOTHING
         RETURNING *`,
        [id, bookId, nextOrder]
      );
      if (result.rows.length === 0) {
        return res.json({ ok: true, data: null, message: 'Book already in curation' });
      }
      recalculateSingleBookScore(bookId).catch(e => log.warn('Score recalc after curation add:', e));
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Add curation book error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/user-curations/:id/books/:bookId', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const bookId = parseIdParam(req.params.bookId);
      if (!id || !bookId) {
        return res.status(400).json({ ok: false, error: 'Invalid curation or book ID' });
      }
      const result = await queryDB(
        `DELETE FROM curation_books WHERE curation_id = $1 AND book_id = $2 RETURNING id`,
        [id, bookId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Book not found in curation' });
      }
      return res.json({ ok: true, data: { curationId: id, bookId } });
    } catch (error) {
      log.error('Remove curation book error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/user-curations/:id/books/reorder', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid curation ID' });
      }
      const { bookIds } = req.body;
      if (!Array.isArray(bookIds)) {
        return res.status(400).json({ ok: false, error: 'bookIds array is required' });
      }
      for (let i = 0; i < bookIds.length; i++) {
        await queryDB(
          `UPDATE curation_books SET display_order = $1 WHERE curation_id = $2 AND book_id = $3`,
          [i, id, bookIds[i]]
        );
      }
      return res.json({ ok: true, data: { reordered: bookIds.length } });
    } catch (error) {
      log.error('Reorder curation books error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // AFFILIATE CREATOR PROFILE
  // ==================================================================
  app.get('/api/affiliate-creator-profile', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.json({ ok: false, error: 'userId required' });
      const result = await queryDB('SELECT * FROM affiliate_creator_profiles WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.json({ ok: true, data: null });
      }
      let data = result.rows[0];
      if (isImpersonating(req)) {
        data = maskSensitiveData(data);
      }
      res.json({ ok: true, data });
    } catch (error) {
      log.error('Affiliate creator profile fetch error:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });

  app.post('/api/affiliate-creator-profile', async (req: Request, res: Response) => {
    try {
      const {
        userId, firstName, lastName, artistName, birthDate, nationality,
        street, city, postalCode, country, email, phone,
        taxStatus, taxNumber, taxId, vatId, taxCountry, taxSelfResponsible,
        accountHolder, iban, bic, payoutCountry, currency, minPayoutAccepted,
        acceptCreatorContract, acceptRevenueShare, acceptAdDisclosure,
        acceptNoThirdPartyRights, acceptTracking
      } = req.body;

      if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });

      const existing = await queryDB('SELECT id FROM affiliate_creator_profiles WHERE user_id = $1', [userId]);

      if (existing.rows.length > 0) {
        const result = await queryDB(`
          UPDATE affiliate_creator_profiles SET
            first_name = $2, last_name = $3, artist_name = $4, birth_date = $5,
            nationality = $6, street = $7, city = $8, postal_code = $9, country = $10,
            email = $11, phone = $12, tax_status = $13, tax_number = $14, tax_id = $15,
            vat_id = $16, tax_country = $17, tax_self_responsible = $18,
            account_holder = $19, iban = $20, bic = $21, payout_country = $22,
            currency = $23, min_payout_accepted = $24,
            accept_creator_contract = $25, accept_revenue_share = $26,
            accept_ad_disclosure = $27, accept_no_third_party_rights = $28,
            accept_tracking = $29, updated_at = NOW()
          WHERE user_id = $1
          RETURNING *
        `, [userId, firstName, lastName, artistName, birthDate || null, nationality,
            street, city, postalCode, country || 'DE', email, phone,
            taxStatus, taxNumber, taxId, vatId, taxCountry, taxSelfResponsible || false,
            accountHolder, iban, bic, payoutCountry, currency || 'EUR', minPayoutAccepted || false,
            acceptCreatorContract || false, acceptRevenueShare || false,
            acceptAdDisclosure || false, acceptNoThirdPartyRights || false,
            acceptTracking || false]);
        return res.json({ ok: true, data: result.rows[0] });
      } else {
        const result = await queryDB(`
          INSERT INTO affiliate_creator_profiles (
            user_id, first_name, last_name, artist_name, birth_date,
            nationality, street, city, postal_code, country, email, phone,
            tax_status, tax_number, tax_id, vat_id, tax_country, tax_self_responsible,
            account_holder, iban, bic, payout_country, currency, min_payout_accepted,
            accept_creator_contract, accept_revenue_share, accept_ad_disclosure,
            accept_no_third_party_rights, accept_tracking
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
          RETURNING *
        `, [userId, firstName, lastName, artistName, birthDate || null, nationality,
            street, city, postalCode, country || 'DE', email, phone,
            taxStatus, taxNumber, taxId, vatId, taxCountry, taxSelfResponsible || false,
            accountHolder, iban, bic, payoutCountry, currency || 'EUR', minPayoutAccepted || false,
            acceptCreatorContract || false, acceptRevenueShare || false,
            acceptAdDisclosure || false, acceptNoThirdPartyRights || false,
            acceptTracking || false]);
        return res.json({ ok: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Affiliate creator profile save error:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });

  // ==================================================================
  // BOOKSTORE PROFILE
  // ==================================================================
  app.get('/api/bookstore/profile', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId is required' });
      }
      const result = await queryDB(
        `SELECT * FROM bookstore_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      return res.json({ ok: true, data: result.rows[0] || null });
    } catch (error) {
      log.error('Get bookstore profile error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/bookstore/profile', async (req: Request, res: Response) => {
    try {
      const { userId, displayName, tagline, description, slug, socialLinks, address, addressLat, addressLng, avatarUrl, heroImageUrl, isPhysicalStore, isPublished } = req.body;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId is required' });
      }
      const existing = await queryDB(
        `SELECT id FROM bookstore_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      let result;
      if (existing.rows.length > 0) {
        const profileId = existing.rows[0].id;
        const finalSlug = slug ? await generateUniqueSlug('bookstore_profiles', slug, profileId) : null;
        result = await queryDB(
          `UPDATE bookstore_profiles
           SET display_name = COALESCE($1, display_name),
               tagline = COALESCE($2, tagline),
               description = COALESCE($3, description),
               slug = COALESCE($4, slug),
               social_links = COALESCE($5, social_links),
               address = COALESCE($6, address),
               address_lat = COALESCE($7, address_lat),
               address_lng = COALESCE($8, address_lng),
               avatar_url = COALESCE($9, avatar_url),
               hero_image_url = CASE WHEN $10::text IS NOT NULL THEN $10 ELSE hero_image_url END,
               is_physical_store = COALESCE($11, is_physical_store),
               is_published = COALESCE($12, is_published),
               updated_at = NOW()
           WHERE user_id = $13
           RETURNING *`,
          [
            displayName || null, tagline || null, description || null,
            finalSlug, socialLinks ? JSON.stringify(socialLinks) : null,
            address || null, addressLat || null, addressLng || null,
            avatarUrl || null, heroImageUrl !== undefined ? (heroImageUrl || '') : null,
            isPhysicalStore !== undefined ? isPhysicalStore : null,
            isPublished !== undefined ? isPublished : null,
            userId
          ]
        );
      } else {
        const finalSlug = slug ? await generateUniqueSlug('bookstore_profiles', slug) : await generateUniqueSlug('bookstore_profiles', displayName || userId);
        result = await queryDB(
          `INSERT INTO bookstore_profiles (user_id, display_name, tagline, description, slug, social_links, address, address_lat, address_lng, avatar_url, hero_image_url, is_physical_store, is_published)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            userId, displayName || null, tagline || null, description || null,
            finalSlug, socialLinks ? JSON.stringify(socialLinks) : '{}',
            address || null, addressLat || null, addressLng || null,
            avatarUrl || null, heroImageUrl || null,
            isPhysicalStore || false, isPublished || false
          ]
        );
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Save bookstore profile error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/bookstores', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        `SELECT * FROM bookstore_profiles WHERE is_published = true ORDER BY display_name ASC`
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('List bookstores error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // BOOKSTORE CURATION LINKS (Sections) - must be BEFORE :slug route
  // ==================================================================
  app.get('/api/bookstore/sections', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId is required' });
      }
      const result = await queryDB(
        `SELECT bcl.*, uc.title, uc.description, uc.tags, uc.is_published as curation_published
         FROM bookstore_curation_links bcl
         JOIN bookstore_profiles bp ON bp.id = bcl.bookstore_id
         JOIN user_curations uc ON uc.id = bcl.curation_id
         WHERE bp.user_id = $1
         ORDER BY bcl.display_order ASC`,
        [userId]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get bookstore sections error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/bookstore/sections', async (req: Request, res: Response) => {
    try {
      const { userId, curationId } = req.body;
      if (!userId || !curationId) {
        return res.status(400).json({ ok: false, error: 'userId and curationId are required' });
      }
      const profile = await queryDB(
        `SELECT id FROM bookstore_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      if (profile.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Bookstore profile not found' });
      }
      const bookstoreId = profile.rows[0].id;
      const maxOrder = await queryDB(
        `SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM bookstore_curation_links WHERE bookstore_id = $1`,
        [bookstoreId]
      );
      const nextOrder = maxOrder.rows[0]?.next_order || 0;
      const result = await queryDB(
        `INSERT INTO bookstore_curation_links (bookstore_id, curation_id, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (bookstore_id, curation_id) DO NOTHING
         RETURNING *`,
        [bookstoreId, curationId, nextOrder]
      );
      if (result.rows.length === 0) {
        return res.json({ ok: true, data: null, message: 'Curation already linked' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Link bookstore section error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/bookstore/sections/:linkId', async (req: Request, res: Response) => {
    try {
      const linkId = parseIdParam(req.params.linkId);
      if (!linkId) {
        return res.status(400).json({ ok: false, error: 'Invalid link ID' });
      }
      const result = await queryDB(
        `DELETE FROM bookstore_curation_links WHERE id = $1 RETURNING id`,
        [linkId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Link not found' });
      }
      return res.json({ ok: true, data: { id: linkId } });
    } catch (error) {
      log.error('Unlink bookstore section error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/bookstore/sections/reorder', async (req: Request, res: Response) => {
    try {
      const { linkIds } = req.body;
      if (!Array.isArray(linkIds)) {
        return res.status(400).json({ ok: false, error: 'linkIds array is required' });
      }
      for (let i = 0; i < linkIds.length; i++) {
        await queryDB(
          `UPDATE bookstore_curation_links SET display_order = $1 WHERE id = $2`,
          [i, linkIds[i]]
        );
      }
      return res.json({ ok: true, data: { reordered: linkIds.length } });
    } catch (error) {
      log.error('Reorder bookstore sections error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/bookstore/exists/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      if (!slug) {
        return res.json({ exists: false });
      }
      const bpResult = await queryDB(
        `SELECT 1 FROM bookstore_profiles WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      if (bpResult.rows.length > 0) {
        return res.json({ exists: true });
      }
      const curatorResult = await queryDB(
        `SELECT 1 FROM curators WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`,
        [slug]
      );
      return res.json({ exists: curatorResult.rows.length > 0 });
    } catch {
      return res.json({ exists: false });
    }
  });

  // Public bookstore page by slug (must be AFTER /sections, /profile routes)
  app.get('/api/bookstore/:slug', async (req: Request, res: Response) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      const { slug } = req.params;
      if (!slug) {
        return res.status(400).json({ ok: false, error: 'Slug is required' });
      }
      let profile: any = null;
      let curations: any[] = [];

      const curatorBySlug = await queryDB(
        `SELECT id, user_id, avatar_url, website_url, instagram_url, tiktok_url, youtube_url, podcast_url, focus, bio, visible_tabs, name, slug FROM curators WHERE slug = $1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 1`,
        [slug]
      );

      let profileResult;
      if (curatorBySlug.rows.length > 0 && curatorBySlug.rows[0].user_id) {
        profileResult = await queryDB(
          `SELECT * FROM bookstore_profiles WHERE user_id = $1 LIMIT 1`,
          [curatorBySlug.rows[0].user_id]
        );
      }
      if (!profileResult || profileResult.rows.length === 0) {
        profileResult = await queryDB(
          `SELECT * FROM bookstore_profiles WHERE slug = $1 LIMIT 1`,
          [slug]
        );
      }

      if (profileResult.rows.length > 0) {
        profile = profileResult.rows[0];
        if (curatorBySlug.rows.length > 0) {
          const curator = curatorBySlug.rows[0];
          if (!profile.avatar_url && curator.avatar_url) {
            profile.avatar_url = curator.avatar_url;
          }
          const sl = profile.social_links || {};
          const hasSocials = sl.website || sl.instagram || sl.youtube || sl.tiktok || sl.podcast;
          if (!hasSocials) {
            profile.social_links = {
              ...sl,
              website: sl.website || curator.website_url || '',
              instagram: sl.instagram || curator.instagram_url || '',
              youtube: sl.youtube || curator.youtube_url || '',
              tiktok: sl.tiktok || curator.tiktok_url || '',
              podcast: sl.podcast || curator.podcast_url || '',
            };
          }
          profile.tagline = curator.focus || profile.tagline || '';
          profile.bio = curator.bio || profile.description || '';
          profile.description = curator.bio || profile.description || '';
          profile.visible_tabs = curator.visible_tabs || {};
        }
        const curationsResult = await queryDB(
          `SELECT uc.*, bcl.display_order as link_order
           FROM bookstore_curation_links bcl
           JOIN user_curations uc ON uc.id = bcl.curation_id
           WHERE bcl.bookstore_id = $1 AND uc.is_published = true
           ORDER BY bcl.display_order ASC`,
          [profile.id]
        );
        for (const curation of curationsResult.rows) {
          const booksResult = await queryDB(
            `SELECT cb.display_order as curation_book_order, cb.added_at, b.*
             FROM curation_books cb
             LEFT JOIN books b ON b.id = cb.book_id
             WHERE cb.curation_id = $1
             ORDER BY cb.display_order ASC`,
            [curation.id]
          );
          curations.push({
            ...curation,
            books: booksResult.rows
          });
        }
      } else {
        if (curatorBySlug.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Profile not found' });
        }
        const curator = curatorBySlug.rows[0];

        profile = {
          id: curator.id,
          user_id: curator.user_id || null,
          display_name: curator.name,
          slug: curator.slug,
          tagline: curator.focus || '',
          description: curator.bio || '',
          bio: curator.bio || '',
          avatar_url: curator.avatar_url || '',
          hero_image_url: '',
          social_links: {
            website: curator.website_url || '',
            instagram: curator.instagram_url || '',
            youtube: curator.youtube_url || '',
            tiktok: curator.tiktok_url || '',
          },
          visible_tabs: curator.visible_tabs || {},
          is_published: true,
          is_physical_store: false,
        };
      }

      return res.json({ ok: true, data: { profile, curations } });
    } catch (error) {
      log.error('Get bookstore by slug error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // CURATION INTERACTIONS (Like, Bookmark)
  // ==================================================================

  app.get('/api/curations/:id/interactions', async (req: Request, res: Response) => {
    try {
      const curationId = parseInt(req.params.id);
      if (isNaN(curationId)) return res.status(400).json({ ok: false, error: 'Invalid curation ID' });

      const userId = (req.user as any)?.claims?.sub || null;

      const likesResult = await queryDB(
        'SELECT COUNT(*)::int AS count FROM curation_likes WHERE curation_id = $1',
        [curationId]
      );
      const bookmarksResult = await queryDB(
        'SELECT COUNT(*)::int AS count FROM curation_bookmarks WHERE curation_id = $1',
        [curationId]
      );

      let userLiked = false;
      let userBookmarked = false;
      if (userId) {
        const likeCheck = await queryDB(
          'SELECT id FROM curation_likes WHERE curation_id = $1 AND user_id = $2',
          [curationId, userId]
        );
        const bookmarkCheck = await queryDB(
          'SELECT id FROM curation_bookmarks WHERE curation_id = $1 AND user_id = $2',
          [curationId, userId]
        );
        userLiked = likeCheck.rows.length > 0;
        userBookmarked = bookmarkCheck.rows.length > 0;
      }

      return res.json({
        ok: true,
        likes: likesResult.rows[0]?.count || 0,
        bookmarks: bookmarksResult.rows[0]?.count || 0,
        userLiked,
        userBookmarked,
      });
    } catch (error) {
      log.error('Get curation interactions error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/curations/:id/like', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ ok: false, error: 'Login required' });
      }
      const userId = (req.user as any)?.claims?.sub;
      const curationId = parseInt(req.params.id);
      if (isNaN(curationId)) return res.status(400).json({ ok: false, error: 'Invalid curation ID' });

      const existing = await queryDB(
        'SELECT id FROM curation_likes WHERE curation_id = $1 AND user_id = $2',
        [curationId, userId]
      );

      if (existing.rows.length > 0) {
        await queryDB('DELETE FROM curation_likes WHERE curation_id = $1 AND user_id = $2', [curationId, userId]);
      } else {
        await queryDB('INSERT INTO curation_likes (curation_id, user_id) VALUES ($1, $2)', [curationId, userId]);
      }

      const countResult = await queryDB(
        'SELECT COUNT(*)::int AS count FROM curation_likes WHERE curation_id = $1',
        [curationId]
      );

      return res.json({
        ok: true,
        liked: existing.rows.length === 0,
        likes: countResult.rows[0]?.count || 0,
      });
    } catch (error) {
      log.error('Toggle curation like error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/curations/:id/bookmark', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ ok: false, error: 'Login required' });
      }
      const userId = (req.user as any)?.claims?.sub;
      const curationId = parseInt(req.params.id);
      if (isNaN(curationId)) return res.status(400).json({ ok: false, error: 'Invalid curation ID' });

      const existing = await queryDB(
        'SELECT id FROM curation_bookmarks WHERE curation_id = $1 AND user_id = $2',
        [curationId, userId]
      );

      if (existing.rows.length > 0) {
        await queryDB('DELETE FROM curation_bookmarks WHERE curation_id = $1 AND user_id = $2', [curationId, userId]);
      } else {
        await queryDB('INSERT INTO curation_bookmarks (curation_id, user_id) VALUES ($1, $2)', [curationId, userId]);
      }

      const countResult = await queryDB(
        'SELECT COUNT(*)::int AS count FROM curation_bookmarks WHERE curation_id = $1',
        [curationId]
      );

      return res.json({
        ok: true,
        bookmarked: existing.rows.length === 0,
        bookmarks: countResult.rows[0]?.count || 0,
      });
    } catch (error) {
      log.error('Toggle curation bookmark error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // USER'S LIKED & BOOKMARKED CURATIONS
  // ==================================================================

  app.get('/api/me/saved-curations', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ ok: false, error: 'Login required' });
      }
      const userId = (req.user as any)?.claims?.sub;

      const liked = await queryDB(
        `SELECT c.id, c.title, c.rationale as description, c.created_at,
                cl.created_at as liked_at,
                'liked' as interaction_type
         FROM curation_likes cl
         JOIN curations c ON c.id = cl.curation_id
         WHERE cl.user_id = $1 AND c.deleted_at IS NULL
         ORDER BY cl.created_at DESC`,
        [userId]
      );

      const bookmarked = await queryDB(
        `SELECT c.id, c.title, c.rationale as description, c.created_at,
                cb.created_at as bookmarked_at,
                'bookmarked' as interaction_type
         FROM curation_bookmarks cb
         JOIN curations c ON c.id = cb.curation_id
         WHERE cb.user_id = $1 AND c.deleted_at IS NULL
         ORDER BY cb.created_at DESC`,
        [userId]
      );

      return res.json({
        ok: true,
        liked: liked.rows,
        bookmarked: bookmarked.rows,
      });
    } catch (error) {
      log.error('Get saved curations error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // CONTENT REPORTS
  // ==================================================================
  app.post('/api/content-reports', async (req: Request, res: Response) => {
    try {
      const { reporterId, contentType, contentId, reason, details } = req.body;
      if (!contentType || !contentId || !reason) {
        return res.status(400).json({ ok: false, error: 'contentType, contentId, and reason are required' });
      }
      const result = await queryDB(
        `INSERT INTO content_reports (reporter_id, content_type, content_id, reason, details)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [reporterId || null, contentType, contentId, reason, details || null]
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Create content report error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/content-reports', async (req: Request, res: Response) => {
    try {
      const authorized = await requireAdminGuard(req, res);
      if (!authorized) return;
      const status = req.query.status as string;
      let query = 'SELECT * FROM content_reports';
      const params: any[] = [];
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';
      const result = await queryDB(query, params);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get content reports error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/admin/content-reports/:id', async (req: Request, res: Response) => {
    try {
      const authorized = await requireAdminGuard(req, res);
      if (!authorized) return;
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid report ID' });
      }
      const { status, reviewedBy } = req.body;
      if (!status) {
        return res.status(400).json({ ok: false, error: 'status is required' });
      }
      const result = await queryDB(
        `UPDATE content_reports
         SET status = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, reviewedBy || null, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Report not found' });
      }
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Update content report error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // EVENTS / VERANSTALTUNGEN API ROUTES
  // ==================================================================

  // List events for a user
  app.get('/api/user-events', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ ok: false, error: 'userId is required' });
      const result = await queryDB(
        `SELECT e.*, 
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'booked') AS participant_count
         FROM user_events e
         WHERE e.user_id = $1
         ORDER BY e.event_date ASC`,
        [userId]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get user events error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Create event
  app.post('/api/user-events', async (req: Request, res: Response) => {
    try {
      const { userId, title, description, event_type, location_type, location_name, location_address, event_date, event_end_date, background_image_url, video_link, video_link_public, entry_fee, max_participants, is_recurring, recurrence_rule, event_page_url } = req.body;
      if (!userId || !title || !event_date) {
        return res.status(400).json({ ok: false, error: 'userId, title, and event_date are required' });
      }
      const result = await queryDB(
        `INSERT INTO user_events (user_id, title, description, event_type, location_type, location_name, location_address, event_date, event_end_date, background_image_url, video_link, video_link_public, entry_fee, max_participants, is_recurring, recurrence_rule, event_page_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [userId, title.trim(), description || null, event_type || 'lesung', location_type || 'vor_ort', location_name || null, location_address || null, event_date, event_end_date || null, background_image_url || null, video_link || null, video_link_public || false, entry_fee || 0, max_participants || null, is_recurring || false, recurrence_rule || null, event_page_url || null]
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Create event error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Update event
  app.put('/api/user-events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const { title, description, event_type, location_type, location_name, location_address, event_date, event_end_date, background_image_url, video_link, video_link_public, entry_fee, max_participants, is_recurring, recurrence_rule, is_published, event_page_url } = req.body;
      const result = await queryDB(
        `UPDATE user_events SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          event_type = COALESCE($3, event_type),
          location_type = COALESCE($4, location_type),
          location_name = COALESCE($5, location_name),
          location_address = COALESCE($6, location_address),
          event_date = COALESCE($7, event_date),
          event_end_date = COALESCE($8, event_end_date),
          background_image_url = COALESCE($9, background_image_url),
          video_link = COALESCE($10, video_link),
          video_link_public = COALESCE($11, video_link_public),
          entry_fee = COALESCE($12, entry_fee),
          max_participants = COALESCE($13, max_participants),
          is_recurring = COALESCE($14, is_recurring),
          recurrence_rule = COALESCE($15, recurrence_rule),
          is_published = COALESCE($16, is_published),
          event_page_url = COALESCE($17, event_page_url),
          updated_at = NOW()
        WHERE id = $18 RETURNING *`,
        [title || null, description !== undefined ? description : null, event_type || null, location_type || null, location_name !== undefined ? location_name : null, location_address !== undefined ? location_address : null, event_date || null, event_end_date !== undefined ? event_end_date : null, background_image_url !== undefined ? background_image_url : null, video_link !== undefined ? video_link : null, video_link_public !== undefined ? video_link_public : null, entry_fee !== undefined ? entry_fee : null, max_participants !== undefined ? max_participants : null, is_recurring !== undefined ? is_recurring : null, recurrence_rule !== undefined ? recurrence_rule : null, is_published !== undefined ? is_published : null, event_page_url !== undefined ? event_page_url : null, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Update event error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Delete event
  app.delete('/api/user-events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      await queryDB(`DELETE FROM user_events WHERE id = $1`, [id]);
      return res.json({ ok: true });
    } catch (error) {
      log.error('Delete event error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Public events for a bookstore/curator profile
  app.get('/api/bookstore/:slug/events', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const profileResult = await queryDB(`SELECT user_id FROM bookstore_profiles WHERE slug = $1`, [slug]);
      if (profileResult.rows.length === 0) return res.status(404).json({ ok: false, error: 'Profile not found' });
      const userId = profileResult.rows[0].user_id;
      const result = await queryDB(
        `SELECT e.id, e.title, e.description, e.event_type, e.location_type, e.location_name, e.location_address, e.event_date, e.event_end_date, e.background_image_url, 
          CASE WHEN e.video_link_public = true THEN e.video_link ELSE NULL END AS video_link,
          e.video_link_public, e.entry_fee, e.entry_fee_currency, e.max_participants, e.is_recurring, e.recurrence_rule, e.event_page_url,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'booked') AS participant_count
         FROM user_events e
         WHERE e.user_id = $1 AND e.is_published = true AND e.event_date >= NOW() - INTERVAL '1 day'
         ORDER BY e.event_date ASC`,
        [userId]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get public events error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Book a spot at an event
  app.post('/api/user-events/:id/book', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const { userId, displayName } = req.body;
      if (!userId) return res.status(400).json({ ok: false, error: 'userId is required' });

      const event = await queryDB(`SELECT max_participants FROM user_events WHERE id = $1`, [id]);
      if (event.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });

      if (event.rows[0].max_participants) {
        const count = await queryDB(`SELECT COUNT(*) FROM event_participants WHERE event_id = $1 AND status = 'booked'`, [id]);
        if (parseInt(count.rows[0].count) >= event.rows[0].max_participants) {
          return res.status(400).json({ ok: false, error: 'Event is fully booked' });
        }
      }

      const result = await queryDB(
        `INSERT INTO event_participants (event_id, user_id, user_display_name, status)
         VALUES ($1, $2, $3, 'booked')
         ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'booked', booked_at = NOW()
         RETURNING *`,
        [id, userId, displayName || userId]
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Book event error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Cancel booking
  app.delete('/api/user-events/:id/book', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ ok: false, error: 'userId is required' });
      await queryDB(`DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2`, [id, userId]);
      return res.json({ ok: true });
    } catch (error) {
      log.error('Cancel booking error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Get participants for an event (organizer only)
  app.get('/api/user-events/:id/participants', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const result = await queryDB(
        `SELECT ep.*, ue.user_id AS organizer_id
         FROM event_participants ep
         JOIN user_events ue ON ue.id = ep.event_id
         WHERE ep.event_id = $1
         ORDER BY ep.booked_at ASC`,
        [id]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get participants error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Check if user is booked for an event
  app.get('/api/user-events/:id/booking-status', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const userId = req.query.userId as string;
      if (!id || !userId) return res.json({ ok: true, booked: false });
      const result = await queryDB(
        `SELECT id FROM event_participants WHERE event_id = $1 AND user_id = $2 AND status = 'booked'`,
        [id, userId]
      );
      return res.json({ ok: true, booked: result.rows.length > 0 });
    } catch (error) {
      return res.json({ ok: true, booked: false });
    }
  });

  // ICS calendar export for an event
  app.get('/api/user-events/:id/ics', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const result = await queryDB(`SELECT * FROM user_events WHERE id = $1`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });
      const ev = result.rows[0];

      const formatDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const endDate = ev.event_end_date || new Date(new Date(ev.event_date).getTime() + 2 * 60 * 60 * 1000).toISOString();

      const locationParts = [ev.location_name, ev.location_address].filter(Boolean).join(', ');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//coratiert.de//Events//DE',
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(ev.event_date)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${(ev.title || '').replace(/\n/g, '\\n')}`,
        `DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n').substring(0, 500)}`,
        locationParts ? `LOCATION:${locationParts.replace(/\n/g, '\\n')}` : '',
        `UID:event-${ev.id}@coratiert.de`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\r\n');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="event-${ev.id}.ics"`);
      return res.send(ics);
    } catch (error) {
      log.error('ICS export error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Notifications for a user
  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ ok: false, error: 'userId is required' });
      const result = await queryDB(
        `SELECT * FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Get notifications error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // Mark notification as read
  app.put('/api/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid notification ID' });
      await queryDB(`UPDATE user_notifications SET is_read = true WHERE id = $1`, [id]);
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ============================================
  // ADMIN: Events Management
  // ============================================

  app.get('/api/admin/events', async (req: Request, res: Response) => {
    const isAuthed = await requireAdminGuard(req, res);
    if (!isAuthed) return;
    try {
      const result = await queryDB(`
        SELECT e.*,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
        FROM user_events e
        ORDER BY e.created_at DESC
      `);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Admin get events error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/admin/events/:id/toggle-publish', async (req: Request, res: Response) => {
    const isAuthed = await requireAdminGuard(req, res);
    if (!isAuthed) return;
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const current = await queryDB(`SELECT is_published FROM user_events WHERE id = $1`, [id]);
      if (current.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });
      const newStatus = !current.rows[0].is_published;
      await queryDB(`UPDATE user_events SET is_published = $1 WHERE id = $2`, [newStatus, id]);
      return res.json({ ok: true, is_published: newStatus });
    } catch (error) {
      log.error('Admin toggle event publish error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/admin/events/:id', async (req: Request, res: Response) => {
    const isAuthed = await requireAdminGuard(req, res);
    if (!isAuthed) return;
    try {
      const id = parseIdParam(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      await queryDB(`DELETE FROM user_events WHERE id = $1`, [id]);
      return res.json({ ok: true });
    } catch (error) {
      log.error('Admin delete event error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ============================================
  // CATEGORY CARDS - Public + Admin CRUD
  // ============================================

  app.get('/api/category-cards', async (req: Request, res: Response) => {
    try {
      const location = (req.query.location as string) || 'homepage';
      const result = await queryDB(
        `SELECT id, name, image_url, link, color, display_order
         FROM category_cards
         WHERE is_active = true AND location = $1
         ORDER BY display_order ASC, name ASC`,
        [location]
      );
      return res.json({ success: true, data: result.rows });
    } catch (error) {
      log.error('Category cards fetch error:', error);
      return res.json({ success: true, data: [] });
    }
  });

  app.get('/api/admin/category-cards', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const result = await queryDB(
        `SELECT * FROM category_cards ORDER BY location ASC, display_order ASC, name ASC`
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Admin category cards fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/category-cards', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { name, image_url, link, color, display_order, is_active, location } = req.body;
      if (!name?.trim()) return res.status(400).json({ ok: false, error: 'Name is required' });
      const result = await queryDB(
        `INSERT INTO category_cards (name, image_url, link, color, display_order, is_active, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name.trim(), image_url || null, link || '', color || '#247ba0', display_order ?? 0, is_active !== false, location || 'homepage']
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Create category card error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.patch('/api/admin/category-cards/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'Invalid ID' });
    try {
      const body = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;
      const allowed = ['name', 'image_url', 'link', 'color', 'display_order', 'is_active', 'location'];
      for (const field of allowed) {
        if (field in body) {
          updates.push(`${field} = $${idx}`);
          values.push(body[field]);
          idx++;
        }
      }
      if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No updates' });
      values.push(id);
      const result = await queryDB(
        `UPDATE category_cards SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found' });
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Update category card error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/admin/category-cards/:id', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: 'Invalid ID' });
    try {
      const result = await queryDB(`DELETE FROM category_cards WHERE id = $1 RETURNING id`, [id]);
      if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found' });
      return res.json({ ok: true });
    } catch (error) {
      log.error('Delete category card error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/category-cards/reorder', async (req: Request, res: Response) => {
    const authorized = await requireAdminGuard(req, res);
    if (!authorized) return;
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ ok: false, error: 'ids array required' });
      for (let i = 0; i < ids.length; i++) {
        await queryDB(`UPDATE category_cards SET display_order = $1, updated_at = NOW() WHERE id = $2`, [i, ids[i]]);
      }
      return res.json({ ok: true });
    } catch (error) {
      log.error('Reorder category cards error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ============================================
  // ORGANIZER: Participant Management
  // ============================================

  app.delete('/api/user-events/:id/participants/:participantId', async (req: Request, res: Response) => {
    try {
      const eventId = parseIdParam(req.params.id);
      const participantId = parseIdParam(req.params.participantId);
      if (!eventId || !participantId) return res.status(400).json({ ok: false, error: 'Invalid IDs' });
      const organizerUserId = req.query.userId as string;
      if (!organizerUserId) return res.status(400).json({ ok: false, error: 'userId is required' });

      const event = await queryDB(`SELECT user_id, title FROM user_events WHERE id = $1`, [eventId]);
      if (event.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });
      if (event.rows[0].user_id !== organizerUserId) return res.status(403).json({ ok: false, error: 'Not authorized' });

      const participant = await queryDB(`SELECT user_id, user_display_name FROM event_participants WHERE id = $1 AND event_id = $2`, [participantId, eventId]);
      if (participant.rows.length === 0) return res.status(404).json({ ok: false, error: 'Participant not found' });

      await queryDB(`DELETE FROM event_participants WHERE id = $1`, [participantId]);

      await queryDB(
        `INSERT INTO user_notifications (user_id, type, title, message, link) VALUES ($1, 'event_cancelled', $2, $3, $4)`,
        [participant.rows[0].user_id, `Teilnahme entfernt: ${event.rows[0].title}`, `Du wurdest aus der Teilnehmerliste für "${event.rows[0].title}" entfernt.`, `/bookstore`]
      );

      return res.json({ ok: true });
    } catch (error) {
      log.error('Remove participant error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/user-events/:id/message', async (req: Request, res: Response) => {
    try {
      const eventId = parseIdParam(req.params.id);
      if (!eventId) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const { userId, message } = req.body;
      if (!userId || !message?.trim()) return res.status(400).json({ ok: false, error: 'userId and message are required' });

      const event = await queryDB(`SELECT user_id, title FROM user_events WHERE id = $1`, [eventId]);
      if (event.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });
      if (event.rows[0].user_id !== userId) return res.status(403).json({ ok: false, error: 'Not authorized' });

      const participants = await queryDB(`SELECT user_id FROM event_participants WHERE event_id = $1 AND status = 'booked'`, [eventId]);

      let sentCount = 0;
      for (const p of participants.rows) {
        await queryDB(
          `INSERT INTO user_notifications (user_id, type, title, message, link) VALUES ($1, 'event_message', $2, $3, $4)`,
          [p.user_id, `Nachricht: ${event.rows[0].title}`, message.trim(), `/bookstore`]
        );
        sentCount++;
      }

      return res.json({ ok: true, sentCount });
    } catch (error) {
      log.error('Send event message error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/user-events/:id/cancel', async (req: Request, res: Response) => {
    try {
      const eventId = parseIdParam(req.params.id);
      if (!eventId) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const { userId, reason } = req.body;
      if (!userId) return res.status(400).json({ ok: false, error: 'userId is required' });

      const event = await queryDB(`SELECT user_id, title FROM user_events WHERE id = $1`, [eventId]);
      if (event.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });
      if (event.rows[0].user_id !== userId) return res.status(403).json({ ok: false, error: 'Not authorized' });

      await queryDB(`UPDATE user_events SET is_published = false WHERE id = $1`, [eventId]);

      const participants = await queryDB(`SELECT user_id FROM event_participants WHERE event_id = $1 AND status = 'booked'`, [eventId]);
      for (const p of participants.rows) {
        await queryDB(
          `INSERT INTO user_notifications (user_id, type, title, message, link) VALUES ($1, 'event_cancelled', $2, $3, $4)`,
          [p.user_id, `Veranstaltung abgesagt: ${event.rows[0].title}`, reason ? `Grund: ${reason}` : `Die Veranstaltung "${event.rows[0].title}" wurde leider abgesagt.`, `/bookstore`]
        );
      }

      await queryDB(`DELETE FROM event_participants WHERE event_id = $1`, [eventId]);

      return res.json({ ok: true });
    } catch (error) {
      log.error('Cancel event error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/user-events/:id/reschedule', async (req: Request, res: Response) => {
    try {
      const eventId = parseIdParam(req.params.id);
      if (!eventId) return res.status(400).json({ ok: false, error: 'Invalid event ID' });
      const { userId, new_event_date, new_event_end_date, message } = req.body;
      if (!userId || !new_event_date) return res.status(400).json({ ok: false, error: 'userId and new_event_date are required' });

      const event = await queryDB(`SELECT user_id, title, event_date FROM user_events WHERE id = $1`, [eventId]);
      if (event.rows.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });
      if (event.rows[0].user_id !== userId) return res.status(403).json({ ok: false, error: 'Not authorized' });

      await queryDB(
        `UPDATE user_events SET event_date = $1, event_end_date = $2 WHERE id = $3`,
        [new_event_date, new_event_end_date || null, eventId]
      );

      const newDateFormatted = new Date(new_event_date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const participants = await queryDB(`SELECT user_id FROM event_participants WHERE event_id = $1 AND status = 'booked'`, [eventId]);
      for (const p of participants.rows) {
        await queryDB(
          `INSERT INTO user_notifications (user_id, type, title, message, link) VALUES ($1, 'event_rescheduled', $2, $3, $4)`,
          [p.user_id, `Veranstaltung verschoben: ${event.rows[0].title}`, message ? `${message}\n\nNeuer Termin: ${newDateFormatted}` : `Die Veranstaltung "${event.rows[0].title}" wurde auf ${newDateFormatted} verschoben.`, `/bookstore`]
        );
      }

      return res.json({ ok: true });
    } catch (error) {
      log.error('Reschedule event error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // CREATOR LINK RESOLUTION - /@creatorSlug/buch/:isbn
  // ==================================================================

  app.get('/api/creator-link/:creatorSlug/buch/:isbn', async (req: Request, res: Response) => {
    try {
      const { creatorSlug, isbn } = req.params;

      const profileResult = await queryDB(
        `SELECT user_id, display_name, slug, avatar_url, hero_image_url FROM bookstore_profiles WHERE slug = $1 LIMIT 1`,
        [creatorSlug]
      );

      if (profileResult.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Creator not found' });
      }

      const creator = profileResult.rows[0];

      const bookResult = await queryDB(
        `SELECT id, title, author, isbn13, cover_url, description FROM neon_books WHERE isbn13 = $1 LIMIT 1`,
        [isbn]
      );

      let book = bookResult.rows.length > 0 ? bookResult.rows[0] : null;

      if (!book) {
        const altResult = await queryDB(
          `SELECT id, title, author, isbn13, cover_url, description FROM neon_books WHERE id = $1 LIMIT 1`,
          [isbn]
        );
        book = altResult.rows.length > 0 ? altResult.rows[0] : null;
      }

      const affiliatesResult = await queryDB(
        `SELECT a.id, a.name, a.slug, a.link_template, a.icon_url, a.favicon_url,
                ba.link_override, ba.merchant_product_id
         FROM affiliates a
         LEFT JOIN book_affiliates ba ON ba.affiliate_id = a.id AND ba.book_id = $1
         WHERE a.is_active = true
         ORDER BY a.display_order ASC`,
        [book?.id || '']
      );

      const merchants = affiliatesResult.rows.map((a: any) => {
        let url = a.link_override || a.link_template;
        url = url.replace(/\{isbn13\}/g, isbn || book?.isbn13 || '');
        url = url.replace(/\{merchant_product_id\}/g, a.merchant_product_id || '');
        return {
          id: a.id,
          name: a.name,
          slug: a.slug,
          url,
          iconUrl: a.icon_url,
          faviconUrl: a.favicon_url
        };
      });

      return res.json({
        ok: true,
        data: {
          creator: {
            userId: creator.user_id,
            displayName: creator.display_name,
            slug: creator.slug,
            avatarUrl: creator.avatar_url,
            heroImageUrl: creator.hero_image_url
          },
          book: book ? {
            id: book.id,
            title: book.title,
            author: book.author,
            isbn13: book.isbn13,
            coverUrl: book.cover_url,
            description: book.description
          } : null,
          merchants,
          isbn
        }
      });
    } catch (error) {
      log.error('Creator link resolve error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ==================================================================
  // REFERRAL ENTRY TRACKING — /r/:creatorSlug
  // ==================================================================

  app.get('/r/:creatorSlug', async (req: Request, res: Response) => {
    try {
      const { creatorSlug } = req.params;
      if (!creatorSlug || typeof creatorSlug !== 'string') {
        return res.redirect('/');
      }

      const safeSlug = creatorSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

      let creatorUserId: string | null = null;

      const bpResult = await queryDB(
        `SELECT user_id FROM bookstore_profiles WHERE slug = $1 LIMIT 1`,
        [safeSlug]
      );
      if (bpResult.rows.length > 0) {
        creatorUserId = bpResult.rows[0].user_id;
      }

      if (!creatorUserId) {
        const curatorResult = await queryDB(
          `SELECT user_id FROM curators WHERE slug = $1 AND user_id IS NOT NULL LIMIT 1`,
          [safeSlug]
        );
        if (curatorResult.rows.length > 0) {
          creatorUserId = curatorResult.rows[0].user_id;
        }
      }

      if (!creatorUserId) {
        log.info(`Referral: creator slug "${safeSlug}" not found, redirecting without tracking`);
        return res.redirect('/');
      }

      const sessionId = crypto.randomUUID();

      await queryDB(
        `INSERT INTO referral_sessions (session_id, ref_creator_id, expires_at, landing_url)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
        [sessionId, creatorUserId, req.originalUrl]
      );

      const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
      res.cookie('ref_creator_id', creatorUserId, {
        httpOnly: true,
        maxAge: maxAgeMs,
        sameSite: 'lax',
        path: '/',
      });
      res.cookie('ref_session_id', sessionId, {
        httpOnly: true,
        maxAge: maxAgeMs,
        sameSite: 'lax',
        path: '/',
      });

      log.info(`Referral: session ${sessionId} created for creator ${creatorUserId} (slug: ${safeSlug})`);
      return res.redirect('/?ref_landing=true');
    } catch (error) {
      log.error('Referral entry error:', error);
      return res.redirect('/');
    }
  });

  // ==================================================================
  // REFERRAL ?ref= QUERY PARAM MIDDLEWARE
  // ==================================================================

  app.use(async (req: Request, res: Response, next) => {
    try {
      const refSlug = req.query.ref as string | undefined;
      if (!refSlug || typeof refSlug !== 'string') {
        return next();
      }

      if ((req as any).cookies?.ref_creator_id) {
        return next();
      }

      const safeSlug = refSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!safeSlug) {
        return next();
      }

      let creatorUserId: string | null = null;

      const bpResult = await queryDB(
        `SELECT user_id FROM bookstore_profiles WHERE slug = $1 LIMIT 1`,
        [safeSlug]
      );
      if (bpResult.rows.length > 0) {
        creatorUserId = bpResult.rows[0].user_id;
      }

      if (!creatorUserId) {
        const curatorResult = await queryDB(
          `SELECT user_id FROM curators WHERE slug = $1 AND user_id IS NOT NULL LIMIT 1`,
          [safeSlug]
        );
        if (curatorResult.rows.length > 0) {
          creatorUserId = curatorResult.rows[0].user_id;
        }
      }

      if (!creatorUserId) {
        return next();
      }

      const sessionId = crypto.randomUUID();

      await queryDB(
        `INSERT INTO referral_sessions (session_id, ref_creator_id, expires_at, landing_url)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
        [sessionId, creatorUserId, req.originalUrl]
      );

      const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
      res.cookie('ref_creator_id', creatorUserId, {
        httpOnly: true,
        maxAge: maxAgeMs,
        sameSite: 'lax',
        path: '/',
      });
      res.cookie('ref_session_id', sessionId, {
        httpOnly: true,
        maxAge: maxAgeMs,
        sameSite: 'lax',
        path: '/',
      });

      log.info(`Referral (query): session ${sessionId} created for creator ${creatorUserId} (slug: ${safeSlug})`);
    } catch (error) {
      log.warn('Referral query param middleware error:', error);
    }
    next();
  });

  // ==================================================================
  // AFFILIATE TRACKING - Creator Click & Order Tracking
  // ==================================================================

  app.post('/api/affiliate/track-click', async (req: Request, res: Response) => {
    try {
      const { creatorId, creatorSlug, bookId, isbn13, sessionId, merchant, affiliateId, landingPage, referrer } = req.body;
      if (!creatorId || !bookId || !sessionId) {
        return res.status(400).json({ ok: false, error: 'creatorId, bookId, and sessionId are required' });
      }
      const userAgent = req.headers['user-agent'] || '';
      const crypto = await import('crypto');
      const ipRaw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const ipHash = crypto.createHash('sha256').update(String(ipRaw)).digest('hex').substring(0, 16);

      const result = await queryDB(
        `INSERT INTO affiliate_clicks (creator_id, creator_slug, book_id, isbn13, session_id, merchant, affiliate_id, landing_page, referrer, user_agent, ip_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, click_timestamp`,
        [creatorId, creatorSlug || null, bookId, isbn13 || null, sessionId, merchant || null, affiliateId || null, landingPage || null, referrer || null, userAgent, ipHash]
      );
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Track click error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/track/curation-click', async (req: Request, res: Response) => {
    try {
      const clientIp = getClientIp(req);
      const rateKey = `curation-click:${clientIp}`;
      const now = Date.now();
      const windowMs = 60 * 1000;
      const maxPerWindow = 60;
      const entry = trackingRateCache.get(rateKey);

      if (entry) {
        if (now - entry.windowStart > windowMs) {
          trackingRateCache.set(rateKey, { count: 1, windowStart: now });
        } else if (entry.count >= maxPerWindow) {
          return res.status(429).json({ ok: false, error: 'Rate limit exceeded' });
        } else {
          entry.count++;
        }
      } else {
        trackingRateCache.set(rateKey, { count: 1, windowStart: now });
      }

      const { session_id, curation_id, curation_owner_creator_id, book_id, isbn } = req.body;
      if (!session_id || !curation_owner_creator_id || !book_id) {
        return res.status(400).json({ ok: false, error: 'session_id, curation_owner_creator_id, and book_id are required' });
      }

      const result = await queryDB(
        `INSERT INTO curation_clicks (session_id, curation_id, curation_owner_creator_id, book_id, isbn)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [session_id, curation_id || null, curation_owner_creator_id, book_id, isbn || null]
      );

      return res.status(201).json({ ok: true, clickId: result.rows[0].id });
    } catch (error) {
      log.error('Track curation click error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/affiliate/resolve-link', async (req: Request, res: Response) => {
    try {
      const { bookId, isbn13, affiliateSlug } = req.body;
      if (!bookId && !isbn13) {
        return res.status(400).json({ ok: false, error: 'bookId or isbn13 required' });
      }

      let query = '';
      let params: any[] = [];

      if (affiliateSlug) {
        query = `SELECT a.link_template, a.slug, a.name, a.id as affiliate_id, ba.link_override, ba.merchant_product_id, b.isbn13
                 FROM affiliates a
                 LEFT JOIN book_affiliates ba ON ba.affiliate_id = a.id AND ba.book_id = $1
                 LEFT JOIN books b ON b.id = $1
                 WHERE a.slug = $2 AND a.is_active = true
                 LIMIT 1`;
        params = [bookId || '', affiliateSlug];
      } else {
        query = `SELECT a.link_template, a.slug, a.name, a.id as affiliate_id, ba.link_override, ba.merchant_product_id, b.isbn13
                 FROM affiliates a
                 JOIN book_affiliates ba ON ba.affiliate_id = a.id AND ba.book_id = $1 AND ba.is_active = true
                 LEFT JOIN books b ON b.id = $1
                 WHERE a.is_active = true
                 ORDER BY ba.display_order ASC
                 LIMIT 1`;
        params = [bookId || ''];
      }

      const result = await queryDB(query, params);
      if (result.rows.length === 0) {
        return res.json({ ok: true, data: null, message: 'No affiliate link found' });
      }

      const row = result.rows[0];
      let finalUrl = row.link_override || row.link_template;
      const bookIsbn = isbn13 || row.isbn13 || '';
      finalUrl = finalUrl.replace(/\{isbn13\}/g, bookIsbn);
      finalUrl = finalUrl.replace(/\{merchant_product_id\}/g, row.merchant_product_id || '');

      return res.json({
        ok: true,
        data: {
          url: finalUrl,
          merchant: row.slug,
          merchantName: row.name,
          affiliateId: row.affiliate_id
        }
      });
    } catch (error) {
      log.error('Resolve affiliate link error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/affiliate/creator-stats', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId required' });
      }

      const [clicksResult, ordersResult, earningsResult, recentClicksResult] = await Promise.all([
        queryDB(
          `SELECT COUNT(*) as total_clicks,
                  COUNT(DISTINCT book_id) as unique_books,
                  COUNT(DISTINCT session_id) as unique_sessions,
                  COUNT(*) FILTER (WHERE click_timestamp >= NOW() - INTERVAL '30 days') as clicks_30d,
                  COUNT(*) FILTER (WHERE click_timestamp >= NOW() - INTERVAL '7 days') as clicks_7d
           FROM affiliate_clicks WHERE creator_id = $1`, [userId]
        ),
        queryDB(
          `SELECT COUNT(*) as total_orders,
                  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
                  COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
                  COUNT(*) FILTER (WHERE purchase_timestamp >= NOW() - INTERVAL '30 days') as orders_30d
           FROM affiliate_orders WHERE creator_id = $1`, [userId]
        ),
        queryDB(
          `SELECT COALESCE(SUM(creator_share), 0) as total_earnings,
                  COALESCE(SUM(creator_share) FILTER (WHERE status = 'confirmed'), 0) as confirmed_earnings,
                  COALESCE(SUM(creator_share) FILTER (WHERE status = 'pending'), 0) as pending_earnings,
                  COALESCE(SUM(merchant_commission), 0) as total_commission
           FROM affiliate_orders WHERE creator_id = $1`, [userId]
        ),
        queryDB(
          `SELECT ac.book_id, ac.isbn13, ac.merchant, ac.click_timestamp, ac.creator_slug
           FROM affiliate_clicks ac
           WHERE ac.creator_id = $1
           ORDER BY ac.click_timestamp DESC LIMIT 10`, [userId]
        )
      ]);

      return res.json({
        ok: true,
        data: {
          clicks: clicksResult.rows[0],
          orders: ordersResult.rows[0],
          earnings: earningsResult.rows[0],
          recentClicks: recentClicksResult.rows
        }
      });
    } catch (error) {
      log.error('Creator stats error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/creator/commissions', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ ok: false, error: 'userId required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const [commissionsRes, totalsRes, countRes] = await Promise.all([
        queryDB(
          `SELECT id, external_order_id, merchant, session_id, book_id, isbn,
                  attribution_type, commission_amount_net, share_rate,
                  creator_payout_amount, occurred_at, status, created_at
           FROM creator_commissions
           WHERE attributed_creator_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        ),
        queryDB(
          `SELECT
             COALESCE(SUM(creator_payout_amount) FILTER (WHERE status = 'confirmed' AND attribution_type = 'REFERRAL'), 0) as referral_confirmed,
             COALESCE(SUM(creator_payout_amount) FILTER (WHERE status = 'confirmed' AND attribution_type = 'CURATION'), 0) as curation_confirmed,
             COALESCE(SUM(creator_payout_amount) FILTER (WHERE status = 'pending'), 0) as total_pending,
             COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
             COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
             COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
             COUNT(*) FILTER (WHERE attribution_type = 'REFERRAL') as referral_count,
             COUNT(*) FILTER (WHERE attribution_type = 'CURATION') as curation_count
           FROM creator_commissions
           WHERE attributed_creator_id = $1`,
          [userId]
        ),
        queryDB(
          `SELECT COUNT(*) as total FROM creator_commissions WHERE attributed_creator_id = $1`,
          [userId]
        )
      ]);

      const total = parseInt(countRes.rows[0]?.total || '0');

      return res.json({
        ok: true,
        data: {
          commissions: commissionsRes.rows,
          totals: totalsRes.rows[0],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      log.error('Creator commissions error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/affiliate-tracking', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const view = (req.query.view as string) || 'clicks';
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = (page - 1) * limit;
      const creatorFilter = req.query.creator as string;
      const statusFilter = req.query.status as string;

      if (view === 'orders') {
        let whereClause = '';
        const params: any[] = [];
        let paramIdx = 1;

        if (creatorFilter) {
          whereClause += ` AND ao.creator_id = $${paramIdx}`;
          params.push(creatorFilter);
          paramIdx++;
        }
        if (statusFilter) {
          whereClause += ` AND ao.status = $${paramIdx}`;
          params.push(statusFilter);
          paramIdx++;
        }

        const [ordersRes, countRes] = await Promise.all([
          queryDB(
            `SELECT ao.*, bp.display_name as creator_name, bp.slug as creator_profile_slug
             FROM affiliate_orders ao
             LEFT JOIN bookstore_profiles bp ON bp.user_id = ao.creator_id
             WHERE 1=1 ${whereClause}
             ORDER BY ao.created_at DESC
             LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            [...params, limit, offset]
          ),
          queryDB(
            `SELECT COUNT(*) as total FROM affiliate_orders ao WHERE 1=1 ${whereClause}`,
            params
          )
        ]);

        return res.json({
          ok: true,
          data: ordersRes.rows,
          pagination: { page, limit, total: parseInt(countRes.rows[0].total) }
        });
      }

      let whereClause = '';
      const params: any[] = [];
      let paramIdx = 1;

      if (creatorFilter) {
        whereClause += ` AND ac.creator_id = $${paramIdx}`;
        params.push(creatorFilter);
        paramIdx++;
      }

      const [clicksRes, countRes, summaryRes] = await Promise.all([
        queryDB(
          `SELECT ac.*, bp.display_name as creator_name, bp.slug as creator_profile_slug
           FROM affiliate_clicks ac
           LEFT JOIN bookstore_profiles bp ON bp.user_id = ac.creator_id
           WHERE 1=1 ${whereClause}
           ORDER BY ac.click_timestamp DESC
           LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          [...params, limit, offset]
        ),
        queryDB(
          `SELECT COUNT(*) as total FROM affiliate_clicks ac WHERE 1=1 ${whereClause}`,
          params
        ),
        queryDB(
          `SELECT 
            (SELECT COUNT(*) FROM affiliate_clicks) as total_clicks,
            (SELECT COUNT(*) FROM affiliate_orders) as total_orders,
            (SELECT COUNT(*) FROM affiliate_orders WHERE status = 'confirmed') as confirmed_orders,
            (SELECT COALESCE(SUM(merchant_commission), 0) FROM affiliate_orders) as total_commission,
            (SELECT COALESCE(SUM(creator_share), 0) FROM affiliate_orders) as total_creator_share,
            (SELECT COUNT(DISTINCT creator_id) FROM affiliate_clicks) as active_creators`
        )
      ]);

      return res.json({
        ok: true,
        data: clicksRes.rows,
        summary: summaryRes.rows[0],
        pagination: { page, limit, total: parseInt(countRes.rows[0].total) }
      });
    } catch (error) {
      log.error('Admin affiliate tracking error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/affiliate-orders', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const { creatorId, bookId, isbn13, merchant, affiliateId, sessionId, orderReference, merchantCommission, creatorShare, platformShare, status, notes } = req.body;
      if (!creatorId) return res.status(400).json({ ok: false, error: 'creatorId required' });

      let clickId = null;
      if (sessionId) {
        const lastClick = await queryDB(
          `SELECT id FROM affiliate_clicks WHERE session_id = $1 AND creator_id = $2 ORDER BY click_timestamp DESC LIMIT 1`,
          [sessionId, creatorId]
        );
        if (lastClick.rows.length > 0) clickId = lastClick.rows[0].id;
      }

      const result = await queryDB(
        `INSERT INTO affiliate_orders (creator_id, click_id, session_id, book_id, isbn13, merchant, affiliate_id, order_reference, merchant_commission, creator_share, platform_share, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [creatorId, clickId, sessionId || null, bookId || null, isbn13 || null, merchant || null, affiliateId || null, orderReference || null, merchantCommission || 0, creatorShare || 0, platformShare || 0, status || 'pending', notes || null]
      );

      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Create affiliate order error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.patch('/api/admin/affiliate-orders/:id', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const { id } = req.params;
      const { status, merchantCommission, creatorShare, platformShare, notes } = req.body;

      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (status !== undefined) { updates.push(`status = $${idx}`); params.push(status); idx++; }
      if (merchantCommission !== undefined) { updates.push(`merchant_commission = $${idx}`); params.push(merchantCommission); idx++; }
      if (creatorShare !== undefined) { updates.push(`creator_share = $${idx}`); params.push(creatorShare); idx++; }
      if (platformShare !== undefined) { updates.push(`platform_share = $${idx}`); params.push(platformShare); idx++; }
      if (notes !== undefined) { updates.push(`notes = $${idx}`); params.push(notes); idx++; }

      if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No fields to update' });

      updates.push(`updated_at = NOW()`);
      params.push(id);

      const result = await queryDB(
        `UPDATE affiliate_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params
      );

      if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Order not found' });
      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Update affiliate order error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/affiliate-creators', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const result = await queryDB(
        `SELECT acp.user_id, acp.first_name, acp.last_name, acp.artist_name, acp.status as profile_status,
                bp.display_name, bp.slug, bp.avatar_url,
                (SELECT COUNT(*) FROM affiliate_clicks WHERE creator_id = acp.user_id) as total_clicks,
                (SELECT COUNT(*) FROM affiliate_orders WHERE creator_id = acp.user_id) as total_orders,
                (SELECT COALESCE(SUM(creator_share), 0) FROM affiliate_orders WHERE creator_id = acp.user_id AND status = 'confirmed') as total_earnings
         FROM affiliate_creator_profiles acp
         LEFT JOIN bookstore_profiles bp ON bp.user_id = acp.user_id
         ORDER BY acp.created_at DESC`
      );

      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Admin affiliate creators error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/commissions', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const { status, attribution_type, creator_id, date_from, date_to, page = '1', limit = '50' } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      const offset = (pageNum - 1) * limitNum;

      const conditions: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`cc.status = $${paramIdx++}`);
        params.push(status);
      }
      if (attribution_type) {
        conditions.push(`cc.attribution_type = $${paramIdx++}`);
        params.push(attribution_type);
      }
      if (creator_id) {
        conditions.push(`cc.attributed_creator_id = $${paramIdx++}`);
        params.push(creator_id);
      }
      if (date_from) {
        conditions.push(`cc.occurred_at >= $${paramIdx++}`);
        params.push(date_from);
      }
      if (date_to) {
        conditions.push(`cc.occurred_at <= $${paramIdx++}`);
        params.push(date_to);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countResult = await queryDB(
        `SELECT COUNT(*) as total FROM creator_commissions cc ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0]?.total || '0');

      const dataParams = [...params, limitNum, offset];
      const dataResult = await queryDB(
        `SELECT cc.*, bp.display_name as creator_display_name, bp.slug as creator_slug, bp.avatar_url as creator_avatar
         FROM creator_commissions cc
         LEFT JOIN bookstore_profiles bp ON bp.user_id = cc.attributed_creator_id
         ${whereClause}
         ORDER BY cc.created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        dataParams
      );

      const statsResult = await queryDB(
        `SELECT
           COALESCE(SUM(CASE WHEN status = 'pending' THEN creator_payout_amount ELSE 0 END), 0) as total_pending,
           COALESCE(SUM(CASE WHEN status = 'confirmed' THEN creator_payout_amount ELSE 0 END), 0) as total_confirmed,
           COALESCE(SUM(CASE WHEN status = 'cancelled' THEN creator_payout_amount ELSE 0 END), 0) as total_cancelled,
           (SELECT COUNT(*) FROM referral_sessions WHERE expires_at > NOW()) as active_referral_count
         FROM creator_commissions`
      );

      const stats = statsResult.rows[0] || {};

      return res.json({
        ok: true,
        data: dataResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        summary: {
          total_pending: parseFloat(stats.total_pending) || 0,
          total_confirmed: parseFloat(stats.total_confirmed) || 0,
          total_cancelled: parseFloat(stats.total_cancelled) || 0,
          active_referral_count: parseInt(stats.active_referral_count) || 0,
        },
      });
    } catch (error) {
      log.error('Admin commissions list error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/referral-sessions', async (req: Request, res: Response) => {
    try {
      const isAuthed = await requireAdminGuard(req, res);
      if (!isAuthed) return;

      const { page = '1', limit = '50', status: filterStatus } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      const offset = (pageNum - 1) * limitNum;

      let statusCondition = '';
      const params: any[] = [];
      let paramIdx = 1;

      if (filterStatus === 'active') {
        statusCondition = `WHERE rs.expires_at > NOW()`;
      } else if (filterStatus === 'expired') {
        statusCondition = `WHERE rs.expires_at <= NOW()`;
      }

      const countResult = await queryDB(
        `SELECT COUNT(*) as total FROM referral_sessions rs ${statusCondition}`,
        params
      );
      const total = parseInt(countResult.rows[0]?.total || '0');

      const dataResult = await queryDB(
        `SELECT rs.*,
                bp.display_name as creator_display_name, bp.slug as creator_slug, bp.avatar_url as creator_avatar,
                CASE WHEN rs.expires_at > NOW() THEN 'active' ELSE 'expired' END as session_status
         FROM referral_sessions rs
         LEFT JOIN bookstore_profiles bp ON bp.user_id = rs.ref_creator_id
         ${statusCondition}
         ORDER BY rs.first_seen_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, limitNum, offset]
      );

      return res.json({
        ok: true,
        data: dataResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      log.error('Admin referral sessions list error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ===== PODCAST / CONTENT EXTRACTION ROUTES =====

  app.get('/api/content-sources', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const { getContentSources } = await import('./services/podcastExtractor');
      const sources = await getContentSources(userId);
      return res.json({ ok: true, data: sources });
    } catch (error) {
      log.error('Get content sources error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/content-sources', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const { sourceType = 'podcast', feedUrl } = req.body;
      if (!feedUrl) return res.status(400).json({ ok: false, error: 'Feed URL is required' });
      try {
        const parsedUrl = new URL(feedUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res.status(400).json({ ok: false, error: 'Ungültige URL. Bitte eine gültige HTTP/HTTPS-URL angeben.' });
        }
      } catch {
        return res.status(400).json({ ok: false, error: 'Ungültige URL. Bitte eine gültige Feed-URL angeben.' });
      }
      const { addContentSource } = await import('./services/podcastExtractor');
      const source = await addContentSource(userId, sourceType, feedUrl);
      return res.status(201).json({ ok: true, data: source });
    } catch (error) {
      log.error('Add content source error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.patch('/api/content-sources/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const id = parseInt(req.params.id);
      const ownership = await queryDB('SELECT id FROM content_sources WHERE id = $1 AND user_id = $2', [id, userId]);
      if (ownership.rows.length === 0) return res.status(403).json({ ok: false, error: 'Not authorized' });
      const { updateContentSource } = await import('./services/podcastExtractor');
      const source = await updateContentSource(id, req.body);
      return res.json({ ok: true, data: source });
    } catch (error) {
      log.error('Update content source error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.delete('/api/content-sources/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const id = parseInt(req.params.id);
      const ownership = await queryDB('SELECT id FROM content_sources WHERE id = $1 AND user_id = $2', [id, userId]);
      if (ownership.rows.length === 0) return res.status(403).json({ ok: false, error: 'Not authorized' });
      const { deleteContentSource } = await import('./services/podcastExtractor');
      await deleteContentSource(id);
      return res.json({ ok: true });
    } catch (error) {
      log.error('Delete content source error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/content-sources/:id/sync', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const id = parseInt(req.params.id);
      const ownership = await queryDB('SELECT id FROM content_sources WHERE id = $1 AND user_id = $2', [id, userId]);
      if (ownership.rows.length === 0) return res.status(403).json({ ok: false, error: 'Not authorized' });
      const { syncAndProcessSource } = await import('./services/podcastExtractor');
      const result = await syncAndProcessSource(id);
      return res.json({ ok: true, data: result });
    } catch (error) {
      log.error('Sync content source error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/content-sources/:id/episodes', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const id = parseInt(req.params.id);
      const ownership = await queryDB('SELECT id FROM content_sources WHERE id = $1 AND user_id = $2', [id, userId]);
      if (ownership.rows.length === 0) return res.status(403).json({ ok: false, error: 'Not authorized' });
      const { getEpisodesWithBooks } = await import('./services/podcastExtractor');
      const episodes = await getEpisodesWithBooks(id);
      return res.json({ ok: true, data: episodes });
    } catch (error) {
      log.error('Get episodes error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/content-sources/user/books', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const { getExtractedBooksForUser } = await import('./services/podcastExtractor');
      const books = await getExtractedBooksForUser(userId);
      return res.json({ ok: true, data: books });
    } catch (error) {
      log.error('Get extracted books error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.patch('/api/extracted-books/:id/verify', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const id = parseInt(req.params.id);
      const { verified } = req.body;
      const { verifyExtractedBook } = await import('./services/podcastExtractor');
      const book = await verifyExtractedBook(id, verified !== false);
      return res.json({ ok: true, data: book });
    } catch (error) {
      log.error('Verify extracted book error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.patch('/api/extracted-books/:id/visibility', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return res.status(401).json({ ok: false, error: 'User ID required' });
      const id = parseInt(req.params.id);
      const { visible } = req.body;
      const { toggleBookVisibility } = await import('./services/podcastExtractor');
      const book = await toggleBookVisibility(id, visible !== false);
      return res.json({ ok: true, data: book });
    } catch (error) {
      log.error('Toggle book visibility error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/public/content-books/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const profileResult = await queryDB('SELECT user_id FROM bookstore_profiles WHERE slug = $1 LIMIT 1', [slug]);
      if (profileResult.rows.length === 0) return res.json({ ok: true, data: [] });
      const userId = profileResult.rows[0].user_id;

      const result = await queryDB(
        `SELECT * FROM (
           SELECT DISTINCT ON (eb.id) eb.*, ce.title as episode_title, ce.episode_number, ce.published_at as episode_date,
                  ce.content_url as episode_url, ce.description as episode_description,
                  cs.title as source_title, cs.image_url as source_image,
                  cs.source_type,
                  COALESCE(b1.cover_url, NULLIF(eb.cover_url, '')) as book_cover_url,
                  COALESCE(b1.description, '') as book_description,
                  COALESCE(b1.isbn13, '') as book_isbn13,
                  COALESCE(b1.publisher, '') as book_publisher,
                  eb.matched_book_id
           FROM extracted_books eb
           JOIN content_episodes ce ON eb.episode_id = ce.id
           JOIN content_sources cs ON eb.source_id = cs.id
           LEFT JOIN books b1 ON eb.matched_book_id = b1.id
           WHERE cs.user_id = $1 AND cs.is_active = true AND eb.is_visible = true
           ORDER BY eb.id
         ) sub ORDER BY episode_date DESC NULLS LAST, id`,
        [userId]
      );

      let indieNames: string[] = [];
      let spPatterns: Array<{ pattern: string; match_type: string }> = [];
      try {
        const [indieRes, spRes] = await Promise.all([
          queryDB('SELECT name FROM indie_publishers'),
          queryDB('SELECT pattern, match_type FROM selfpublisher_patterns'),
        ]);
        indieNames = (indieRes.rows || []).map((r: any) => r.name.toLowerCase());
        spPatterns = spRes.rows || [];
      } catch {}

      const enriched = result.rows.map((row: any) => {
        const publisher = (row.book_publisher || '').toLowerCase();
        const author = (row.author || '').toLowerCase();
        let isIndie = false;
        let indieType: string | null = null;
        if (publisher) {
          const isIndieVerlag = indieNames.some(name => publisher === name);
          const isSelfPublisher = spPatterns.some((sp: any) => {
            if (sp.match_type === 'exact') return publisher === sp.pattern.toLowerCase();
            return publisher.includes(sp.pattern.toLowerCase());
          });
          const isAuthorPublisher = author && (
            author === publisher ||
            publisher.includes(author) ||
            (author.includes(',') && publisher.includes(author.split(',')[0].trim()))
          );
          isIndie = isIndieVerlag || isSelfPublisher || !!isAuthorPublisher;
          indieType = isIndieVerlag ? 'indie_verlag' : (isSelfPublisher || isAuthorPublisher) ? 'selfpublisher' : null;
        }
        return { ...row, book_is_indie: isIndie, book_indie_type: indieType };
      });

      return res.json({ ok: true, data: enriched });
    } catch (error) {
      log.error('Public content books error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/batch-fetch-covers', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token || !(await verifyAdminToken(token))) return res.status(401).json({ ok: false, error: 'Unauthorized' });
      const limit = Math.min(Number(req.body?.limit) || 50, 200);
      const { batchFetchCovers } = await import('./services/podcastExtractor');
      const result = await batchFetchCovers(limit);
      return res.json({ ok: true, ...result });
    } catch (error) {
      log.error('Batch cover fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/batch-match-books', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token || !(await verifyAdminToken(token))) return res.status(401).json({ ok: false, error: 'Unauthorized' });
      const { batchMatchBooks } = await import('./services/podcastExtractor');
      const result = await batchMatchBooks();
      return res.json({ ok: true, ...result });
    } catch (error) {
      log.error('Batch match books error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/unmatched-books', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token || !(await verifyAdminToken(token))) return res.status(401).json({ ok: false, error: 'Unauthorized' });
      const result = await queryDB(
        `SELECT eb.id, eb.title, eb.author, eb.isbn, eb.sentiment, eb.recommendation_strength,
                eb.extraction_confidence, eb.cover_url, eb.created_at,
                ce.title as episode_title, ce.published_at as episode_date,
                cs.title as source_title, cs.source_type,
                bp.display_name as owner_name, bp.slug as owner_slug
         FROM extracted_books eb
         JOIN content_episodes ce ON eb.episode_id = ce.id
         JOIN content_sources cs ON eb.source_id = cs.id
         LEFT JOIN bookstore_profiles bp ON bp.user_id = cs.user_id
         WHERE eb.matched_book_id IS NULL
         ORDER BY eb.title ASC`
      );
      return res.json({ ok: true, data: result.rows, total: result.rows.length });
    } catch (error) {
      log.error('Unmatched books error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/admin/content-sources', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-admin-token'] as string;
      if (!token || !(await verifyAdminToken(token))) return res.status(401).json({ ok: false, error: 'Unauthorized' });
      const result = await queryDB(
        `SELECT cs.*, bp.display_name, bp.slug,
                (SELECT COUNT(*) FROM content_episodes WHERE source_id = cs.id) as episode_count,
                (SELECT COUNT(*) FROM extracted_books WHERE source_id = cs.id) as book_count
         FROM content_sources cs
         LEFT JOIN bookstore_profiles bp ON bp.user_id = cs.user_id
         ORDER BY cs.created_at DESC`
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Admin content sources error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/:locale/kuratoren/:slug', (req: Request, res: Response) => {
    res.redirect(301, `/${req.params.slug}`);
  });

  app.get('/:locale/storefront/:slug', (req: Request, res: Response) => {
    res.redirect(301, `/${req.params.slug}`);
  });

  app.get('/kuratoren/:slug', (req: Request, res: Response) => {
    res.redirect(301, `/${req.params.slug}`);
  });

  app.get('/storefront/:slug', (req: Request, res: Response) => {
    res.redirect(301, `/${req.params.slug}`);
  });

  app.get('/robots.txt', (_req: Request, res: Response) => {
    const robotsTxt = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: *
Allow: /
Disallow: /sys-mgmt-xK9/
Disallow: /api/
Disallow: /dashboard/

Sitemap: https://coratiert.de/sitemap.xml

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: Meta-ExternalFetcher
Disallow: /

User-agent: YouBot
Disallow: /

User-agent: PetalBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: DataForSeoBot
Disallow: /`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(robotsTxt);
  });

  app.get('/sitemap.xml', async (_req: Request, res: Response) => {
    try {
      const baseUrl = 'https://coratiert.de';
      const locale = 'de-de';

      const staticPages = [
        { path: '', priority: '1.0', changefreq: 'daily' },
        { path: '/buecher', priority: '0.9', changefreq: 'daily' },
        { path: '/ueber-uns', priority: '0.6', changefreq: 'monthly' },
        { path: '/mission', priority: '0.6', changefreq: 'monthly' },
        { path: '/faq', priority: '0.5', changefreq: 'monthly' },
        { path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
        { path: '/impressum', priority: '0.3', changefreq: 'yearly' },
        { path: '/kurationen', priority: '0.8', changefreq: 'daily' },
        { path: '/storefronts', priority: '0.7', changefreq: 'weekly' },
        { path: '/authors', priority: '0.7', changefreq: 'weekly' },
        { path: '/publishers', priority: '0.7', changefreq: 'weekly' },
        { path: '/events', priority: '0.7', changefreq: 'weekly' },
      ];

      let urls = staticPages.map(p => `
    <url>
      <loc>${baseUrl}/${locale}${p.path}</loc>
      <changefreq>${p.changefreq}</changefreq>
      <priority>${p.priority}</priority>
    </url>`).join('');

      try {
        const pages = await queryDB(`SELECT slug, updated_at FROM pages WHERE status = 'published' AND deleted_at IS NULL LIMIT 500`);
        for (const page of pages.rows) {
          const lastmod = page.updated_at ? new Date(page.updated_at).toISOString().split('T')[0] : '';
          urls += `
    <url>
      <loc>${baseUrl}/${locale}/${page.slug}</loc>
      ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
        }
      } catch {}

      try {
        const curators = await queryDB(`SELECT slug FROM curators WHERE deleted_at IS NULL AND visible = true LIMIT 200`);
        for (const c of curators.rows) {
          if (c.slug) {
            urls += `
    <url>
      <loc>${baseUrl}/${locale}/curator/${c.slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
          }
        }
      } catch {}

      try {
        const bookstores = await queryDB(`SELECT slug FROM bookstore_profiles WHERE slug IS NOT NULL LIMIT 500`);
        for (const b of bookstores.rows) {
          if (b.slug) {
            urls += `
    <url>
      <loc>${baseUrl}/${locale}/bookstore/${b.slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.5</priority>
    </url>`;
          }
        }
      } catch {}

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(sitemap);
    } catch (error) {
      log.error('Sitemap generation error:', error);
      return res.status(500).send('Error generating sitemap');
    }
  });

  app.post('/api/track/conversion', async (req: Request, res: Response) => {
    try {
      const isAdmin = await requireAdminGuard(req, res);
      if (!isAdmin) return;

      const { session_id, book_id, isbn, merchant, commission_amount_net, occurred_at, external_order_id } = req.body;
      if (!session_id || !book_id || !merchant || commission_amount_net == null || !occurred_at) {
        return res.status(400).json({ ok: false, error: 'Missing required fields: session_id, book_id, merchant, commission_amount_net, occurred_at' });
      }

      const result = await attributeConversion({
        session_id,
        book_id,
        isbn: isbn || undefined,
        merchant,
        commission_amount_net: Number(commission_amount_net),
        occurred_at,
        external_order_id: external_order_id || undefined,
      });

      return res.status(result.attributed ? 201 : 200).json({ ok: true, data: result });
    } catch (error) {
      log.error('Track conversion error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.post('/api/admin/commissions/:id/cancel', async (req: Request, res: Response) => {
    try {
      const isAdmin = await requireAdminGuard(req, res);
      if (!isAdmin) return;

      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid commission id' });
      }

      const result = await queryDB(
        `UPDATE creator_commissions
         SET status = 'cancelled', creator_payout_amount = 0, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Commission not found' });
      }

      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Cancel commission error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.patch('/api/admin/commissions/:id', async (req: Request, res: Response) => {
    try {
      const isAdmin = await requireAdminGuard(req, res);
      if (!isAdmin) return;

      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Invalid commission id' });
      }

      const existing = await queryDB(`SELECT * FROM creator_commissions WHERE id = $1 LIMIT 1`, [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Commission not found' });
      }

      const commission = existing.rows[0];
      const { status, share_rate } = req.body;

      const newStatus = status || commission.status;
      const newShareRate = share_rate != null ? Number(share_rate) : Number(commission.share_rate);
      const commissionNet = Number(commission.commission_amount_net);
      const newPayoutAmount = Number((commissionNet * newShareRate).toFixed(4));

      const result = await queryDB(
        `UPDATE creator_commissions
         SET status = $1, share_rate = $2, creator_payout_amount = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [newStatus, newShareRate, newPayoutAmount, id]
      );

      return res.json({ ok: true, data: result.rows[0] });
    } catch (error) {
      log.error('Update commission error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  // ======================================================================
  // BOOK SCORE RECALCULATION
  // ======================================================================
  app.post('/api/admin/books/recalculate-scores', async (req: Request, res: Response) => {
    try {
      const isAdmin = await requireAdminGuard(req, res);
      if (!isAdmin) return;

      const updated = await recalculateAllScores();
      return res.json({ ok: true, updated });
    } catch (error) {
      log.error('Score recalculation error:', error);
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/books/score-thresholds', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        `SELECT
           COUNT(*) AS total_books,
           COUNT(*) FILTER (WHERE user_score > 0) AS books_with_user_score,
           SUM(user_score) AS total_user_score
         FROM books WHERE deleted_at IS NULL`
      );
      const row = result.rows[0] || {};
      const totalInteractions = parseFloat(row.total_user_score) || 0;
      const showPopular = totalInteractions >= 300;
      return res.json({ ok: true, showPopular, totalInteractions, totalBooks: parseInt(row.total_books) || 0 });
    } catch (error) {
      return res.json({ ok: true, showPopular: false, totalInteractions: 0, totalBooks: 0 });
    }
  });

  return httpServer;
}
