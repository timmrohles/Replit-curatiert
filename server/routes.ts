import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { queryDB, testConnection } from "./db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const log = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

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
    avatar: row.avatar_url || row.avatar || '',
    bio: row.bio || '',
    focus: row.focus || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    socialMedia: {
      instagram: row.instagram_url || row.instagram || '',
      youtube: row.youtube_url || row.youtube || '',
      tiktok: row.tiktok_url || row.tiktok || '',
      website: row.website_url || row.website || '',
    },
    visible: Boolean(row.visible),
    display_order: Number(row.display_order) || 0,
    status: row.status || 'draft',
    visibility: row.visibility || 'visible',
    publish_at: row.publish_at || null,
    unpublish_at: row.unpublish_at || null,
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

  // ==================================================================
  // SITE CONFIG - BANNER (Public)
  // ==================================================================
  app.get('/api/site-config/banner', async (req: Request, res: Response) => {
    try {
      const position = (req.query.position as string) || 'top';

      const result = await queryDB(
        `SELECT id, name, message, badge_text, button_text, button_url, visible, status, position
         FROM site_banners
         WHERE status = 'published' AND visible = true AND position = $1
         ORDER BY display_order DESC, id DESC LIMIT 1`,
        [position]
      );

      if (result.rows.length === 0) {
        if (position === 'top') {
          return res.json({
            ok: true,
            banner: { visible: true, message: 'Diese Seite befindet sich derzeit in der Beta-Phase', badge_text: 'NEU', button_text: null, button_url: null }
          });
        }
        return res.json({ ok: true, banner: null });
      }

      const banner = result.rows[0];
      return res.json({
        ok: true,
        banner: { id: banner.id, name: banner.name, visible: banner.visible, message: banner.message, badge_text: banner.badge_text, button_text: banner.button_text, button_url: banner.button_url, position: banner.position }
      });
    } catch (error) {
      log.error('Error fetching banner config:', error);
      const position = (req.query.position as string) || 'top';
      if (position === 'top') {
        return res.json({
          ok: true,
          banner: { visible: true, message: 'Diese Seite befindet sich derzeit in der Beta-Phase', badge_text: 'NEU', button_text: null, button_url: null }
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

  app.post('/api/navigation/admin/items', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const { id, parent_id, name, path, description, icon, visible, display_order, target_type, target_page_id } = body;

      if (!name || (typeof name === 'string' && name.trim() === '')) {
        return res.status(400).json({ success: false, error: 'Name is required and cannot be empty' });
      }

      const nameValue = typeof name === 'string' ? name.trim() : String(name);
      const slug = await generateUniqueSlug('menu_items', nameValue, id);

      if (id) {
        const result = await queryDB(
          `UPDATE menu_items
           SET
             parent_id = $1,
             name = $2,
             label = $2,
             slug = $3,
             path = $4,
             href = $4,
             description = $5,
             icon = $6,
             visible = $7,
             is_active = $7,
             display_order = $8,
             sort_order = $8,
             target_type = $9,
             target_page_id = $10,
             updated_at = NOW()
           WHERE id = $11
           RETURNING
             id, parent_id,
             COALESCE(name, label) AS name,
             slug,
             COALESCE(path, href) AS path,
             COALESCE(display_order, sort_order) AS display_order,
             description, icon,
             COALESCE(visible, is_active) AS visible,
             target_type,
             target_page_id,
             created_at, updated_at`,
          [parent_id, nameValue, slug, path, description || '', icon || '', visible !== false, display_order || 0, target_type || null, target_page_id || null, id]
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
             created_at, updated_at
           )
           VALUES ($1, $2, $2, $3, $4, $4, $5, $6, $7, $7, $8, $8, $9, $10, NOW(), NOW())
           RETURNING
             id, parent_id,
             COALESCE(name, label) AS name,
             slug,
             COALESCE(path, href) AS path,
             COALESCE(display_order, sort_order) AS display_order,
             description, icon,
             COALESCE(visible, is_active) AS visible,
             target_type,
             target_page_id,
             created_at, updated_at`,
          [parent_id, nameValue, slug, path, description || '', icon || '', visible !== false, display_order || 0, target_type || null, target_page_id || null]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    } catch (error) {
      log.error('Navigation save error:', error);
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
      const limit = parseInt((req.query.limit as string) || '200');

      let query = 'SELECT * FROM books WHERE 1=1';
      const params: any[] = [];

      if (q) {
        query += ' AND (title ILIKE $1 OR author ILIKE $1 OR isbn13 ILIKE $1)';
        params.push(`%${q}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT ${limit}`;

      const result = await queryDB(query, params);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      log.error('Books search error:', error);
      return res.status(500).json({ ok: false, error: String(error), data: [] });
    }
  });

  // ==================================================================
  // AWARDS
  // ==================================================================
  app.get('/api/awards', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB('SELECT * FROM awards ORDER BY name ASC', []);
      return res.json({ ok: true, data: result.rows });
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

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO awards (name, slug, issuer_name, website_url, description, logo_url, country, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING *`,
          [name.trim(), slug, issuer_name || null, website_url || null, description || null, logo_url || null, country || null]
        );
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
      const result = await queryDB('DELETE FROM awards WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Award not found' });
      }

      return res.json({ success: true, data: { id } });
    } catch (error) {
      log.error('Award delete error:', error);
      return res.status(500).json({ success: false, error: String(error) });
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

  app.get('/api/onix-tags', async (_req: Request, res: Response) => {
    try {
      const result = await queryDB('SELECT * FROM tags ORDER BY name ASC', []);
      return res.json({ ok: true, data: result.rows });
    } catch (error) {
      return res.json({ ok: true, data: [] });
    }
  });

  app.post('/api/tags', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const { id, name, description, category } = body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      const slug = await generateUniqueSlug('tags', name, id);

      if (id) {
        const result = await queryDB(
          `UPDATE tags
           SET name = $1, slug = $2, description = $3, category = $4, updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [name, slug, description || null, category || null, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Tag not found' });
        }

        return res.json({ success: true, data: result.rows[0] });
      } else {
        const result = await queryDB(
          `INSERT INTO tags (name, slug, description, category, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [name, slug, description || null, category || null]
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
           display_order, is_active, notes, created_at, updated_at
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
        display_order, is_active
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
             is_active = $10, notes = $11, updated_at = NOW()
           WHERE id = $12
           RETURNING *`,
          [
            name, slug, network || 'manual', merchant_id || null,
            program_id || null, website_url || null, link_template || '',
            product_url_template || null, display_order || 0,
            is_active !== false, notes || null, id
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
             display_order, is_active, notes,
             created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
           RETURNING *`,
          [
            name, slug, network || 'manual', merchant_id || null,
            program_id || null, website_url || null, link_template || '',
            product_url_template || null, display_order || 0,
            is_active !== false, notes || null
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

  app.get('/api/books/:id/affiliates', async (req: Request, res: Response) => {
    try {
      const bookId = req.params.id;
      const result = await queryDB(
        `SELECT * FROM get_book_affiliate_links($1) ORDER BY display_order ASC`,
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
      }

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
        sections: sections.map((s: any) => ({
          id: s.id,
          zone: s.zone,
          type: s.section_type,
          title: s.section_config?.title || s.config?.title || '',
          config: s.section_config || s.config,
          items: s.items,
          order: s.sort_order,
        })),
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
      const result = await queryDB(`SELECT id, page_id, zone, sort_order, section_type, config, status, visibility, publish_at, unpublish_at, created_at, updated_at FROM public.page_sections WHERE page_id = $1 ORDER BY zone ASC, sort_order ASC`, [pageId]);
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
      const { zone = 'main', sort_order = 0, section_type = 'category_grid', config = {}, status = 'draft', visibility = 'visible' } = body;

      let configJson: string;
      try {
        configJson = typeof config === 'string' ? config : JSON.stringify(config);
      } catch (jsonErr) {
        return res.status(400).json({ ok: false, success: false, error: { code: 'INVALID_CONFIG', message: 'Config must be a valid JSON object' } });
      }

      const result = await queryDB(`INSERT INTO public.page_sections (page_id, zone, sort_order, section_type, config, status, visibility, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id, page_id, zone, sort_order, section_type, config, status, visibility, created_at, updated_at`, [pageId, zone, sort_order, section_type, configJson, status, visibility]);
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
      const allowedFields = ['zone', 'sort_order', 'config', 'section_type', 'status', 'visibility'];
      for (const field of allowedFields) {
        let value = body[field];
        if (field === 'section_type' && !value && body.config?.section_type) {
          value = body.config.section_type;
        }

        if (value !== undefined) {
          if (field === 'config' && typeof value === 'object') {
            updates.push(`${field} = $${paramIndex}::jsonb`);
            values.push(JSON.stringify(value));
          } else {
            updates.push(`${field} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      }
      if (updates.length === 0) return res.status(400).json({ ok: false, success: false, error: { code: 'NO_UPDATES' } });
      values.push(id);
      const result = await queryDB(`UPDATE public.page_sections SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, page_id, zone, sort_order, section_type, config, status, visibility, created_at, updated_at`, values);
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
        status = 'draft',
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
      const { name, message, badge_text, button_text, button_url, visible, status, position, display_order } = body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Name is required' });
      }

      if (!message || message.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Message is required' });
      }

      const result = await queryDB(
        `INSERT INTO site_banners (
          name, message, badge_text, button_text, button_url,
          visible, status, position, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          name.trim(),
          message.trim(),
          badge_text?.trim() || null,
          button_text?.trim() || null,
          button_url?.trim() || null,
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
      const { name, message, badge_text, button_text, button_url, visible, status, position, display_order } = body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Name is required' });
      }

      if (!message || message.trim() === '') {
        return res.status(400).json({ ok: false, error: 'Message is required' });
      }

      const result = await queryDB(
        `UPDATE site_banners
         SET name = $1, message = $2, badge_text = $3, button_text = $4,
             button_url = $5, visible = $6, status = $7, position = $8,
             display_order = $9, updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          name.trim(),
          message.trim(),
          badge_text?.trim() || null,
          button_text?.trim() || null,
          button_url?.trim() || null,
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

  return httpServer;
}
