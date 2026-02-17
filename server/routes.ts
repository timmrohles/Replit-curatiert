import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { queryDB, testConnection } from "./db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

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

async function generateUniqueSlug(table: string, baseText: string, excludeId?: number | string): Promise<string> {
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
    log.info('Awards tag_id column verified');
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
    if (parseInt(countResult.rows[0].cnt) < 90) {
      const defaults: Array<[string, string | null]> = [
        ['8grad Verlag', null], ['Adocs Verlag', null], ['Aisthesis Verlag', null],
        ['Alexander Verlag Berlin', null], ['Arco Verlag', null],
        ['Argument Verlag mit Ariadne', 'Krimi / Feminismus'], ['Ariella Verlag', null],
        ['Assoziation A', 'Politik / Globaler Süden'], ['Aviva Verlag', null],
        ['be.bra Verlag', null], ['Berenberg Verlag', null], ['bilgerverlag', null],
        ['Blumenbar Verlag', null], ['Brinkmann & Bose', null],
        ['Büchergilde Gutenberg', null], ['C.H.Beck Literatur', null],
        ['Das Kulturelle Gedächtnis', null], ['Die Andere Bibliothek', null],
        ['Dittrich Verlag', null], ['Dörlemann Verlag', null], ['Droschl Verlag', null],
        ['Edition Fünf', 'Frauenliteratur'], ['Edition Nautilus', null],
        ['Edition Orient', null], ['Elfenbein Verlag', null], ['Engeler Verlag', null],
        ['Erik Verlag', null], ['Favoritenpresse', null],
        ['Friedenauer Presse', null], ['Galiani Berlin', null],
        ['Guggolz Verlag', null], ['Hablizel Verlag', null],
        ['Haymon Verlag', null], ['Helvetiq', null],
        ['Henrich Editionen', null], ['Homunculus Verlag', null],
        ['Jung und Jung', null], ['Kalkutta Verlag', null],
        ['Kanon Verlag', null], ['Karl Rauch Verlag', null],
        ['Kein & Aber', null], ['Kjona Verlag', null],
        ['Klak Verlag', null], ['Klett-Cotta', null],
        ['Kookbooks', null], ['Kremayr & Scheriau', null],
        ['Kunstmann Verlag', null], ['Kupido Verlag', null],
        ['Leibniz Verlag', null], ['Lenos Verlag', null],
        ['Liebeskind', null], ['Lilienfeld Verlag', null],
        ['Limbus Verlag', null], ['Louisoder Verlag', null],
        ['Luftschacht Verlag', null], ['Mairisch Verlag', null],
        ['Mandelbaum Verlag', 'Politik / Gesellschaft'], ['Mare Verlag', null],
        ['Matthes & Seitz Berlin', null], ['Mirabilis Verlag', null],
        ['Mitteldeutscher Verlag', null], ['Müry Salzmann', null],
        ['Nagel & Kimche', null], ['Nordpark Verlag', null],
        ['Osburg Verlag', null], ['Otto Müller Verlag', null],
        ['P. Kirchheim Verlag', null], ['parasitenpresse', null],
        ['Picus Verlag', null], ['Poetenladen Verlag', null],
        ['Quintus Verlag', null], ['Reprodukt', 'Comic / Graphic Novel'],
        ['Residenz Verlag', null], ['Rogner & Bernhard', null],
        ['Rotpunktverlag', null], ['Rüffer & Rub', null],
        ['Salzgeber Buchverlage', null], ['Schiler & Mücke', null],
        ['Schöffling & Co.', null], ['Secession Verlag', null],
        ['SuKuLTuR', null], ['Topalian & Milani', null],
        ['Transit Verlag', null], ['Tropen Verlag', null],
        ['Unionsverlag', null], ['Ventil Verlag', null],
        ['Verbrecher Verlag', null], ['Verlag Antje Kunstmann', null],
        ['Verlag Das Wunderhorn', null], ['Verlag Klaus Wagenbach', null],
        ['Verlag Voland & Quist', null], ['Verlag Westfälisches Dampfboot', 'Theorie / Sozial'],
        ['Verlagshaus Berlin', null], ['Voland & Quist', null],
        ['w_orten & meer', 'Antirassismus / Queer'], ['Walde+Graf Verlag', null],
        ['Wallstein Verlag', null], ['Wehrhahn Verlag', null],
        ['weissbooks', null], ['Wunderhorn', null],
        ['Suhrkamp', null], ['Kiepenheuer & Witsch', null],
        ['Aufbau Verlag', null], ['Zsolnay', null],
        ['Luchterhandt', null], ['Ullstein', null]
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
      await queryDB(`ALTER TABLE curators ADD COLUMN IF NOT EXISTS user_id UUID`);
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
               email = $11, visible_tabs = $12::jsonb, updated_at = NOW()
           WHERE id = $13 AND deleted_at IS NULL
           RETURNING *`,
          [
            name.trim(), slug, bioValue, avatarValue,
            instagramValue, youtubeValue, tiktokValue,
            podcastValue, websiteValue, focusValue,
            emailValue, visibleTabsValue, id
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
        { parent: 'footer-entdecken', name: 'Alle Bookstores', slug: 'footer-alle-bookstores', path: '/storefronts', order: 3 },
        { parent: 'footer-entdecken', name: 'Alle Bücher', slug: 'footer-alle-buecher', path: '/bücher', order: 4 },
        { parent: 'footer-entdecken', name: 'Alle Autor:innen', slug: 'footer-alle-autoren', path: '/authors', order: 5 },
        { parent: 'footer-entdecken', name: 'Alle Verlage', slug: 'footer-alle-verlage', path: '/publishers', order: 6 },
        { parent: 'footer-entdecken', name: 'Alle Events', slug: 'footer-alle-events', path: '/events', order: 7 },
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
      const { id, parent_id, name, path, description, icon, visible, display_order, target_type, target_page_id, location, kind, scope, panel_layout, clickable, level } = body;

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

      if (id) {
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
             updated_at = NOW()
           WHERE id = $15
           RETURNING *`,
          [parent_id, nameValue, nameValue, slug, path, path, description || '', icon || '', visible !== false, visible !== false, display_order || 0, display_order || 0, target_type || null, target_page_id || null, id, locationValue, kindValue, scopeValue, panelLayoutValue, clickableValue, levelValue]
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
             created_at, updated_at
           )
           VALUES ($1, $2::varchar, $3::text, $4, $5::varchar, $6::text, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
           RETURNING *`,
          [parent_id, nameValue, nameValue, slug, path, path, description || '', icon || '', visible !== false, visible !== false, display_order || 0, display_order || 0, target_type || null, target_page_id || null, locationValue, kindValue, scopeValue, panelLayoutValue, clickableValue, levelValue]
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

  // BOOKS
  // ==================================================================
  app.get('/api/books', async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || '20');
      const offset = parseInt((req.query.offset as string) || '0');
      const result = await queryDB(
        'SELECT * FROM books ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Books fetch error:', error);
      return res.status(500).json({ ok: false, error: String(error), data: [] });
    }
  });

  app.get('/api/books/search', async (req: Request, res: Response) => {
    try {
      const q = req.query.q as string;
      const category = req.query.category as string;
      const limit = parseInt((req.query.limit as string) || '200');

      // Check available columns
      const colCheck = await queryDB(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'books' AND table_schema = 'public'`, []
      );
      const cols = new Set(colCheck.rows.map((r: any) => r.column_name));

      if (cols.size === 0) {
        return res.json({ ok: true, data: [] });
      }

      let query = 'SELECT * FROM books WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (q) {
        const searchParts: string[] = [];
        if (cols.has('title')) searchParts.push(`title ILIKE $${paramIndex}`);
        if (cols.has('author')) searchParts.push(`author ILIKE $${paramIndex}`);
        if (cols.has('publisher')) searchParts.push(`publisher ILIKE $${paramIndex}`);
        if (cols.has('isbn13')) searchParts.push(`isbn13 ILIKE $${paramIndex}`);
        if (searchParts.length > 0) {
          query += ` AND (${searchParts.join(' OR ')})`;
          params.push(`%${q}%`);
          paramIndex++;
        }
      }

      if (category) {
        const catParts: string[] = [];
        if (cols.has('genre')) catParts.push(`genre ILIKE $${paramIndex}`);
        if (cols.has('category')) catParts.push(`category ILIKE $${paramIndex}`);
        if (catParts.length > 0) {
          query += ` AND (${catParts.join(' OR ')})`;
          params.push(`%${category}%`);
          paramIndex++;
        }
      }

      query += ` ORDER BY created_at DESC LIMIT ${limit}`;

      const result = await queryDB(query, params);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Books search error:', error);
      return res.status(500).json({ ok: false, error: String(error), data: [] });
    }
  });

  app.post('/api/books/resolve-by-tags', async (req: Request, res: Response) => {
    try {
      const { includeAll, includeAny, exclude, category, maxYearsAgo, limit: reqLimit } = req.body;
      const bookLimit = parseInt(reqLimit || '50');

      // First check which columns exist on books table
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
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

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

      const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      query += `${where} ORDER BY b.created_at DESC LIMIT ${bookLimit}`;

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
  app.get('/api/awards', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB('SELECT * FROM awards ORDER BY name ASC', []);
      const mapped = result.rows.map((row: any) => ({
        ...row,
        visible: row.visibility !== 'hidden',
      }));
      return res.json({ ok: true, data: mapped });
    } catch (error) {
      return res.json({ ok: true, data: [] });
    }
  });

  app.post('/api/awards', async (req: Request, res: Response) => {
    try {
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Admin token required' });
      }

      const isValid = await verifyAdminToken(adminToken);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin token' });
      }

      const body = req.body;
      const { id, name, issuer_name, website_url, description, logo_url, country } = body;

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
        log.info(`Award "${name}" created with auto-linked tag id=${newTag.id}`);
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Award save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/awards/:id', async (req: Request, res: Response) => {
    try {
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken || !(await verifyAdminToken(adminToken))) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

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
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken || !(await verifyAdminToken(adminToken))) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

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
        `SELECT e.id, e.award_id, e.year, e.theme, e.notes,
                a.name AS award_name, a.visibility AS status
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
      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      log.error('Recipient save error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.delete('/api/awards/:awardId/editions/:editionId/outcomes/:outcomeId/recipients/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const outcomeId = req.params.outcomeId;
      const result = await queryDB(
        'DELETE FROM award_recipients WHERE id = $1 AND award_outcome_id = $2 RETURNING id',
        [id, outcomeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Recipient not found' });
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
      const result = await queryDB(
        `SELECT c.id, c.name, c.bio, c.avatar_url, c.slug, c.focus,
                s.id as storefront_id, s.name as storefront_name, s.slug as storefront_slug,
                s.tagline, s.hero_image_url
         FROM curators c
         INNER JOIN storefronts s ON s.curator_id = c.id AND s.is_published = true AND s.deleted_at IS NULL
         WHERE c.deleted_at IS NULL AND c.visible = true
         ORDER BY c.display_order ASC, c.name ASC`,
        []
      );
      const curators = result.rows.map((row: any) => ({
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
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken) {
        return res.status(401).json({ ok: false, error: 'Unauthorized: Admin token required' });
      }

      const isValid = await verifyAdminToken(adminToken);
      if (!isValid) {
        return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid admin token' });
      }

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
      const adminToken = req.headers['x-admin-token'] as string;
      if (!adminToken) {
        return res.status(401).json({ ok: false, error: 'Unauthorized: Admin token required' });
      }

      const isValid = await verifyAdminToken(adminToken);
      if (!isValid) {
        return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid admin token' });
      }

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
  app.get('/api/categories', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB(
        `SELECT
          id, name, slug, parent_id,
          display_order, status, visibility, created_at, updated_at
        FROM categories
        WHERE deleted_at IS NULL
          AND status = 'published'
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
      const result = await queryDB('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Tag not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Tag delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================================================================
  // PERSONS
  // ==================================================================
  app.get('/api/persons', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB('SELECT * FROM persons ORDER BY name ASC', []);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      return res.json({ ok: true, data: [] });
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

      const statusFilter = includeDraft ? '' : `AND status = 'published' AND visibility = 'visible'`;

      const pageResult = await queryDB(
        `SELECT * FROM pages WHERE slug = $1 ${statusFilter} LIMIT 1`,
        [slug]
      );

      if (!pageResult.rows || pageResult.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          path,
          error: {
            code: 'PAGE_NOT_FOUND',
            message: `Page not found for path: ${path}`,
          },
        });
      }

      const page = pageResult.rows[0];

      const sectionsResult = await queryDB(
        `SELECT ps.*,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', si.id,
                'book_id', COALESCE(
                  nullif(si.data->>'book_id', '')::int,
                  nullif(si.target_params->>'bookId', '')::int
                ),
                'sort_order', si.sort_order
              )
              ORDER BY si.sort_order
            )
            FROM public.section_items si
            WHERE si.page_section_id = ps.id
              AND ($2::boolean = true OR si.status = 'published')
            ), '[]'::json
          ) as items
         FROM public.page_sections ps
         WHERE ps.page_id = $1::bigint
           AND ($2::boolean = true OR ps.status = 'published')
           AND ($2::boolean = true OR ps.publish_at IS NULL OR ps.publish_at <= NOW())
           AND ($2::boolean = true OR ps.unpublish_at IS NULL OR ps.unpublish_at > NOW())
           AND ($2::boolean = true OR ps.max_views IS NULL OR COALESCE(ps.current_views, 0) < ps.max_views)
           AND ($2::boolean = true OR ps.max_clicks IS NULL OR COALESCE(ps.current_clicks, 0) < ps.max_clicks)
         ORDER BY ps.sort_order ASC`,
        [page.id, includeDraft]
      );

      const sections = sectionsResult.rows || [];

      const bookIds = new Set<number>();
      sections.forEach((section: any) => {
        if (section.items && Array.isArray(section.items)) {
          section.items.forEach((item: any) => {
            if (item.book_id) bookIds.add(item.book_id);
          });
        }
      });

      let books: any[] = [];
      if (bookIds.size > 0) {
        const bookIdsArray = Array.from(bookIds);
        const placeholders = bookIdsArray.map((_, i) => `$${i + 1}`).join(',');
        const booksResult = await queryDB(
          `SELECT * FROM books WHERE id IN (${placeholders})`,
          bookIdsArray
        );
        books = booksResult.rows || [];

        try {
          const indieRes = await queryDB('SELECT name FROM indie_publishers');
          const indieNames = (indieRes.rows || []).map((r: any) => r.name.toLowerCase());
          const spRes = await queryDB('SELECT pattern, match_type FROM selfpublisher_patterns');
          const spPatterns = spRes.rows || [];

          let awardMap: Record<number, { wins: number; nominations: number }> = {};
          try {
            const awardRes = await queryDB(
              `SELECT ar.book_id,
                ao.result_status
               FROM award_recipients ar
               JOIN award_outcomes ao ON ar.award_outcome_id = ao.id
               WHERE ar.book_id IN (${placeholders})`,
              bookIdsArray
            );
            for (const row of awardRes.rows || []) {
              if (!row.book_id) continue;
              if (!awardMap[row.book_id]) awardMap[row.book_id] = { wins: 0, nominations: 0 };
              const status = (row.result_status || '').toLowerCase();
              if (status === 'winner' || status === 'gewinner') {
                awardMap[row.book_id].wins++;
              } else {
                awardMap[row.book_id].nominations++;
              }
            }
          } catch { /* award_recipients may not exist yet */ }

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
            };
          });
        } catch (enrichErr) {
          log.warn('Book enrichment error (non-fatal):', enrichErr);
        }
      }

      const curatorIds = new Set<string>();
      sections.forEach((s: any) => {
        const cfg = s.section_config || s.config;
        if (cfg?.curatorId) curatorIds.add(String(cfg.curatorId));
      });

      let curatorsMap: Record<string, any> = {};
      if (curatorIds.size > 0) {
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
        const sortMode = cfg.books?.query?.sort;
        if (sortMode && sortedItems.length > 0) {
          sortedItems.sort((a: any, b: any) => {
            const bookA = booksById[a.book_id];
            const bookB = booksById[b.book_id];
            if (!bookA || !bookB) return 0;
            if (sortMode === 'newest') {
              return new Date(bookB.created_at || 0).getTime() - new Date(bookA.created_at || 0).getTime();
            }
            if (sortMode === 'awarded') {
              return (bookB.award_count || 0) - (bookA.award_count || 0);
            }
            if (sortMode === 'popular') {
              return (bookB.follow_count || 0) - (bookA.follow_count || 0);
            }
            return (a.sort_order || 0) - (b.sort_order || 0);
          });
        }

        return {
          id: s.id,
          zone: s.zone,
          type: s.section_type,
          title: cfg.title || '',
          config: cfg,
          items: sortedItems,
          order: s.sort_order,
        };
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
        robots = 'index,follow'
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
          content_version, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, NOW(), NOW())
        RETURNING
          id, slug, type, template_key, status, visibility,
          seo_title, seo_description, canonical_url, robots,
          publish_at, unpublish_at, content_version,
          created_at, updated_at`,
        [
          slug.trim(), type, template_key || null,
          status, visibility,
          seo_title || null, seo_description || null,
          canonical_url || null, robots
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
      const result = await queryDB(`SELECT id, slug, type, template_key, status, visibility, seo_title, seo_description, canonical_url, robots, publish_at, unpublish_at, content_version, created_at, updated_at FROM public.pages WHERE id = $1`, [id]);
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
      const allowedFields = ['slug', 'type', 'template_key', 'status', 'visibility', 'seo_title', 'seo_description', 'canonical_url', 'robots', 'publish_at', 'unpublish_at'];
      for (const field of allowedFields) {
        if (field in body) {
          updates.push(`${field} = $${paramIndex}`);
          values.push(body[field]);
          paramIndex++;
        }
      }
      if (updates.length === 0) return res.status(400).json({ ok: false, success: false, error: { code: 'NO_UPDATES' } });
      values.push(id);
      const result = await queryDB(`UPDATE public.pages SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, slug, type, template_key, status, visibility, seo_title, seo_description, canonical_url, robots, publish_at, unpublish_at, content_version, created_at, updated_at`, values);
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
      if (!zone || !Array.isArray(sectionIds)) return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_INPUT' } });
      for (let i = 0; i < sectionIds.length; i++) {
        await queryDB(`UPDATE public.page_sections SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND page_id = $3 AND zone = $4`, [i, sectionIds[i], pageId, zone]);
      }
      return res.json({ ok: true, success: true, data: { pageId, zone, reorderedCount: sectionIds.length } });
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
      const authHeader = req.headers['x-admin-token'] as string;
      if (!authHeader) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }

      const isValid = await verifyAdminToken(authHeader);
      if (!isValid) {
        return res.status(401).json({ ok: false, error: 'Invalid admin token' });
      }

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
      const authHeader = req.headers['x-admin-token'] as string;
      if (!authHeader) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }

      const isValid = await verifyAdminToken(authHeader);
      if (!isValid) {
        return res.status(401).json({ ok: false, error: 'Invalid admin token' });
      }

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
      const authHeader = req.headers['x-admin-token'] as string;
      if (!authHeader) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }

      const isValid = await verifyAdminToken(authHeader);
      if (!isValid) {
        return res.status(401).json({ ok: false, error: 'Invalid admin token' });
      }

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
      const authHeader = req.headers['x-admin-token'] as string;
      if (!authHeader) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }

      const isValid = await verifyAdminToken(authHeader);
      if (!isValid) {
        return res.status(401).json({ ok: false, error: 'Invalid admin token' });
      }

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
      const { slug } = req.params;
      if (!slug) {
        return res.status(400).json({ ok: false, error: 'Slug is required' });
      }
      let profile: any = null;
      let curations: any[] = [];

      const profileResult = await queryDB(
        `SELECT * FROM bookstore_profiles WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      if (profileResult.rows.length > 0) {
        profile = profileResult.rows[0];
        const curatorBySlug = await queryDB(
          `SELECT avatar_url, website_url, instagram_url, tiktok_url, youtube_url, podcast_url, focus, bio, visible_tabs FROM curators WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`,
          [slug]
        );
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
        const curatorResult = await queryDB(
          `SELECT * FROM curators WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`,
          [slug]
        );
        if (curatorResult.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Profile not found' });
        }
        const curator = curatorResult.rows[0];
        profile = {
          id: curator.id,
          user_id: curator.user_id || null,
          display_name: curator.name,
          slug: curator.slug,
          tagline: curator.focus || '',
          description: curator.bio || '',
          bio: curator.bio || '',
          avatar_url: curator.avatar_url || '',
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

  return httpServer;
}
