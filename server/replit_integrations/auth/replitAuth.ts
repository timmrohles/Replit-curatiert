import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

type AuthProvider = "replit" | "auth0" | "custom";

interface OidcProviderConfig {
  provider: AuthProvider;
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  endSessionSupported: boolean;
}

function getProviderConfig(): OidcProviderConfig {
  const customIssuer = process.env.OIDC_ISSUER_URL;
  const customClientId = process.env.OIDC_CLIENT_ID;
  const customClientSecret = process.env.OIDC_CLIENT_SECRET;

  if (customIssuer && customClientId) {
    const isAuth0 = customIssuer.includes("auth0.com");
    return {
      provider: isAuth0 ? "auth0" : "custom",
      issuerUrl: customIssuer,
      clientId: customClientId,
      clientSecret: customClientSecret,
      scopes: ["openid", "email", "profile", "offline_access"],
      endSessionSupported: !isAuth0,
    };
  }

  return {
    provider: "replit",
    issuerUrl: process.env.ISSUER_URL ?? "https://replit.com/oidc",
    clientId: process.env.REPL_ID!,
    clientSecret: undefined,
    scopes: ["openid", "email", "profile", "offline_access"],
    endSessionSupported: true,
  };
}

const providerConfig = getProviderConfig();

const getOidcConfig = memoize(
  async () => {
    if (providerConfig.clientSecret) {
      return await client.discovery(
        new URL(providerConfig.issuerUrl),
        providerConfig.clientId,
        providerConfig.clientSecret
      );
    }
    return await client.discovery(
      new URL(providerConfig.issuerUrl),
      providerConfig.clientId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProd = process.env.NODE_ENV === "production";
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

function normalizeUserClaims(claims: any): {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
} {
  const id = claims["sub"];
  const email = claims["email"];

  let firstName: string | undefined;
  let lastName: string | undefined;
  let profileImageUrl: string | undefined;

  switch (providerConfig.provider) {
    case "auth0":
      firstName = claims["given_name"];
      lastName = claims["family_name"];
      profileImageUrl = claims["picture"];
      if (!firstName && !lastName && claims["name"]) {
        const parts = (claims["name"] as string).split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ") || undefined;
      }
      break;

    case "replit":
      firstName = claims["first_name"];
      lastName = claims["last_name"];
      profileImageUrl = claims["profile_image_url"];
      break;

    case "custom":
      firstName = claims["given_name"] || claims["first_name"];
      lastName = claims["family_name"] || claims["last_name"];
      profileImageUrl = claims["picture"] || claims["profile_image_url"];
      if (!firstName && !lastName && claims["name"]) {
        const parts = (claims["name"] as string).split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ") || undefined;
      }
      break;
  }

  return { id, email, firstName, lastName, profileImageUrl };
}

async function upsertUser(claims: any) {
  const normalized = normalizeUserClaims(claims);
  await authStorage.upsertUser(normalized);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (req: any) => {
    const domain = req.hostname;
    const strategyName = `oidcauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const callbackURL = process.env.OIDC_CALLBACK_URL
        || `${req.protocol}://${domain}/api/callback`;
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: providerConfig.scopes.join(" "),
          callbackURL,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req);
    const returnTo = req.query.returnTo as string;
    if (returnTo && returnTo.startsWith("/")) {
      (req.session as any).returnTo = returnTo;
    }
    const authOptions: any = {
      scope: providerConfig.scopes,
    };
    if (providerConfig.provider === "replit") {
      authOptions.prompt = "login consent";
    }
    passport.authenticate(`oidcauth:${req.hostname}`, authOptions)(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req);
    passport.authenticate(`oidcauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      if (providerConfig.endSessionSupported) {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: providerConfig.clientId,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      } else if (providerConfig.provider === "auth0") {
        const returnTo = encodeURIComponent(`${req.protocol}://${req.hostname}`);
        const baseUrl = providerConfig.issuerUrl.replace(/\/$/, "");
        res.redirect(
          `${baseUrl}/v2/logout?client_id=${providerConfig.clientId}&returnTo=${returnTo}`
        );
      } else {
        res.redirect("/");
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export { providerConfig };
