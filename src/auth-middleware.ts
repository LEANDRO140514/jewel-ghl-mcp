/**
 * Authentication and tenant middleware for Express.
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

let secretWarningLogged = false;

/**
 * Middleware to require a valid Bearer token in the Authorization header.
 * If MCP_SERVER_SECRET is not set, logs a warning once and allows requests through.
 */
export function requireSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.MCP_SERVER_SECRET;

  if (!secret || secret.trim() === '') {
    if (!secretWarningLogged) {
      console.warn(
        'MCP_SERVER_SECRET no configurado — endpoints REST sin autenticación (solo aceptable en desarrollo local)'
      );
      secretWarningLogged = true;
    }
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const providedToken = authHeader.slice(7); // Remove 'Bearer ' prefix

  // Use timingSafeEqual to prevent timing attacks
  const secretBuffer = Buffer.from(secret);
  const tokenBuffer = Buffer.from(providedToken);

  if (secretBuffer.length !== tokenBuffer.length) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (!crypto.timingSafeEqual(secretBuffer, tokenBuffer)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  next();
}

/**
 * Middleware to require tenant headers (x-ghl-access-token and x-ghl-location-id).
 * Only enforced when REQUIRE_TENANT_HEADERS is set to 'true'.
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const requireTenantHeaders = process.env.REQUIRE_TENANT_HEADERS === 'true';

  if (!requireTenantHeaders) {
    return next();
  }

  const accessToken = req.headers['x-ghl-access-token'] as string | undefined;
  const locationId = req.headers['x-ghl-location-id'] as string | undefined;

  if (!accessToken || !locationId) {
    return res.status(401).json({
      ok: false,
      error: 'Tenant headers required (x-ghl-access-token, x-ghl-location-id)',
    });
  }

  next();
}