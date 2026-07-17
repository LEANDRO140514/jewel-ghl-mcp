/**
 * Tests for auth-middleware.ts
 */

import { Request, Response, NextFunction } from 'express';
import { requireSecret, requireTenant } from '../src/auth-middleware.js';

// Mock request/response helpers
const createMockRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    headers: {},
    ...overrides,
  } as Request;
};

const createMockResponse = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const createMockNext = (): NextFunction => {
  return jest.fn();
};

describe('requireSecret', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should call next() without auth when MCP_SERVER_SECRET is not set', () => {
    delete process.env.MCP_SERVER_SECRET;
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    requireSecret(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() without auth when MCP_SERVER_SECRET is empty', () => {
    process.env.MCP_SERVER_SECRET = '';
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    requireSecret(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is missing', () => {
    process.env.MCP_SERVER_SECRET = 'test-secret';
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    requireSecret(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header does not start with Bearer', () => {
    process.env.MCP_SERVER_SECRET = 'test-secret';
    const req = createMockRequest({ headers: { authorization: 'Basic abc123' } });
    const res = createMockResponse();
    const next = createMockNext();

    requireSecret(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token does not match', () => {
    process.env.MCP_SERVER_SECRET = 'test-secret';
    const req = createMockRequest({ headers: { authorization: 'Bearer wrong-token' } });
    const res = createMockResponse();
    const next = createMockNext();

    requireSecret(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when token matches', () => {
    process.env.MCP_SERVER_SECRET = 'test-secret';
    const req = createMockRequest({ headers: { authorization: 'Bearer test-secret' } });
    const res = createMockResponse();
    const next = createMockNext();

    requireSecret(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('requireTenant', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should call next() when REQUIRE_TENANT_HEADERS is not set', () => {
    delete process.env.REQUIRE_TENANT_HEADERS;
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    requireTenant(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() when REQUIRE_TENANT_HEADERS is not "true"', () => {
    process.env.REQUIRE_TENANT_HEADERS = 'false';
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    requireTenant(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when x-ghl-access-token is missing', () => {
    process.env.REQUIRE_TENANT_HEADERS = 'true';
    const req = createMockRequest({ headers: { 'x-ghl-location-id': 'loc123' } });
    const res = createMockResponse();
    const next = createMockNext();

    requireTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: 'Tenant headers required (x-ghl-access-token, x-ghl-location-id)',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when x-ghl-location-id is missing', () => {
    process.env.REQUIRE_TENANT_HEADERS = 'true';
    const req = createMockRequest({ headers: { 'x-ghl-access-token': 'token123' } });
    const res = createMockResponse();
    const next = createMockNext();

    requireTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: 'Tenant headers required (x-ghl-access-token, x-ghl-location-id)',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when both tenant headers are present', () => {
    process.env.REQUIRE_TENANT_HEADERS = 'true';
    const req = createMockRequest({
      headers: {
        'x-ghl-access-token': 'token123',
        'x-ghl-location-id': 'loc123',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    requireTenant(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() when both tenant headers are empty strings (truthy check)', () => {
    process.env.REQUIRE_TENANT_HEADERS = 'true';
    const req = createMockRequest({
      headers: {
        'x-ghl-access-token': '',
        'x-ghl-location-id': '',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    requireTenant(req, res, next);

    // Empty strings are falsy, so it should fail
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});