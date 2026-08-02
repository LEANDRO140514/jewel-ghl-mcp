/**
 * Integration tests for execute-route.ts endpoints
 */

import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// Set up test environment variables before imports
process.env.GHL_API_KEY = 'test_api_key_123';
process.env.GHL_BASE_URL = 'https://test.leadconnectorhq.com';
process.env.GHL_LOCATION_ID = 'test_location_123';
process.env.NODE_ENV = 'test';
process.env.MCP_SERVER_SECRET = 'test-secret';

// Simple auth middleware for testing
const testRequireSecret = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || auth.slice(7) !== 'test-secret') {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
};

describe('POST /execute', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock registry that returns a simple result
    const mockRegistry = {
      getAllToolDefinitions: () => [],
      getToolCount: () => 0,
      getToolInventory: () => [],
      callTool: async (name: string, _args: Record<string, unknown>) => {
        if (name === 'get_contact') {
          return { id: 'test123', name: 'Test Contact' };
        }
        if (name === 'nonexistent_tool') {
          return undefined;
        }
        throw new Error('Unknown tool');
      },
    };

    const { registerExecuteRoutes } = require('../src/execute-route.js');
    registerExecuteRoutes(app, mockRegistry as any, undefined, testRequireSecret);
  });

  it('should respond with { ok: true, result } on successful execution', async () => {
    const response = await request(app)
      .post('/execute')
      .set('Authorization', 'Bearer test-secret')
      .send({ name: 'get_contact', arguments: { contactId: 'test123' } });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ok', true);
    expect(response.body).toHaveProperty('result');
    expect(response.body.result).toEqual({ id: 'test123', name: 'Test Contact' });
    expect(response.body).not.toHaveProperty('error');
  });

  it('should respond with { ok: false, error } for unknown tool', async () => {
    const response = await request(app)
      .post('/execute')
      .set('Authorization', 'Bearer test-secret')
      .send({ name: 'nonexistent_tool', arguments: {} });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('ok', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unknown tool');
  });

  it('should respond with { ok: false, error } for missing name', async () => {
    const response = await request(app)
      .post('/execute')
      .set('Authorization', 'Bearer test-secret')
      .send({ arguments: {} });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('ok', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('non-empty string "name"');
  });

  it('should respond with { ok: false, error } for empty name', async () => {
    const response = await request(app)
      .post('/execute')
      .set('Authorization', 'Bearer test-secret')
      .send({ name: '', arguments: {} });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('ok', false);
    expect(response.body).toHaveProperty('error');
  });
});

describe('GET /tools', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const mockRegistry = {
      getAllToolDefinitions: () => [
        { name: 'tool1', description: 'Tool 1', inputSchema: { type: 'object', properties: {} } },
      ],
      getToolCount: () => 1,
      getToolInventory: () => [{ name: 'tool1' }],
      callTool: async () => ({}),
    };

    const { registerExecuteRoutes } = require('../src/execute-route.js');
    registerExecuteRoutes(app, mockRegistry as any, undefined, testRequireSecret);
  });

  it('should respond with { tools, count } on success', async () => {
    const response = await request(app)
      .get('/tools')
      .set('Authorization', 'Bearer test-secret');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tools');
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.tools)).toBe(true);
  });

  it('should require authorization', async () => {
    const response = await request(app).get('/tools');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('ok', false);
    expect(response.body.error).toBe('Unauthorized');
  });
});