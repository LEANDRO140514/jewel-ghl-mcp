import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ToolRegistry } from '../src/tool-registry.js';

const mockClient = {
  getConfig: () => ({
    accessToken: 'test',
    baseUrl: 'https://test.leadconnectorhq.com',
    version: '2021-07-28',
    locationId: 'test_location_123',
  }),
  makeRequest: async () => ({ success: true, data: {} }),
};

const WRITE_LIKE_SAMPLES = [
  'create_contact',
  'update_contact',
  'delete_contact',
  'send_sms',
  'crm_prepare_contact_update',
] as const;

const OPERATOR_EXCLUDED_SAMPLES = [
  'crm_prepare_workflow_trigger',
  'crm_prepare_snapshot_rollout',
  'crm_prepare_lead_assignment',
] as const;

const SIDE_EFFECT_TOOLS = [
  'disable_calendar_group',
  'start_social_oauth',
  'approve_affiliate',
  'reject_affiliate',
  'start_campaign',
  'pause_campaign',
  'resume_campaign',
  'enroll_contact_in_course',
  'disconnect_custom_provider_config',
  'purchase_phone_number',
  'release_phone_number',
  'reply_to_review',
  'disconnect_review_platform',
  'pause_saas_location',
  'enable_saas_location',
  'enable_trigger',
  'disable_trigger',
] as const;

describe('ToolRegistry profiles', () => {
  const previousProfile = process.env.GHL_TOOL_PROFILE;

  beforeEach(() => {
    delete process.env.GHL_TOOL_PROFILE;
  });

  afterEach(() => {
    if (previousProfile === undefined) {
      delete process.env.GHL_TOOL_PROFILE;
    } else {
      process.env.GHL_TOOL_PROFILE = previousProfile;
    }
  });

  it('defaults to full profile with raw and curated tools', () => {
    const registry = new ToolRegistry(mockClient as any);

    expect(registry.getToolProfile()).toBe('full');
    expect(registry.getAllToolNames()).toContain('search_contacts');
    expect(registry.getAllToolNames()).toContain('crm_prepare_lead_intake');
    expect(registry.getToolCount()).toBe(registry.getAllToolDefinitions().length);
  });

  it('can expose only curated agent workspace tools', async () => {
    process.env.GHL_TOOL_PROFILE = 'curated';
    const registry = new ToolRegistry(mockClient as any);
    const names = registry.getAllToolNames();

    expect(registry.getToolProfile()).toBe('curated');
    expect(names).toContain('crm_prepare_lead_intake');
    expect(names).toContain('crm_prepare_appointment_booking');
    expect(names).not.toContain('search_contacts');
    expect(await registry.callTool('search_contacts', {})).toBeUndefined();
    expect(await registry.callTool('crm_list_workspaces', {})).toBeDefined();
  });

  it('can expose only raw endpoint-level tools', () => {
    process.env.GHL_TOOL_PROFILE = 'raw';
    const registry = new ToolRegistry(mockClient as any);
    const names = registry.getAllToolNames();

    expect(registry.getToolProfile()).toBe('raw');
    expect(names).toContain('search_contacts');
    expect(names).not.toContain('crm_prepare_lead_intake');
  });

  it('exposes jewel_readonly as pure read without prepare or side-effects', () => {
    process.env.GHL_TOOL_PROFILE = 'jewel_readonly';
    const registry = new ToolRegistry(mockClient as any);
    const names = registry.getAllToolNames();

    expect(registry.getToolProfile()).toBe('jewel_readonly');
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('search_contacts');
    expect(names).toContain('crm_list_workspaces');
    expect(names).toContain('crm_find_unworked_leads');
    expect(names).not.toContain('crm_prepare_lead_intake');

    for (const toolName of WRITE_LIKE_SAMPLES) {
      expect(names).not.toContain(toolName);
    }
    for (const toolName of SIDE_EFFECT_TOOLS) {
      expect(names).not.toContain(toolName);
    }
    expect(names.filter((name) => name.startsWith('crm_prepare_'))).toEqual([]);
  });

  it('exposes jewel_operator with curated prep but blocks side-effects and raw writes', () => {
    process.env.GHL_TOOL_PROFILE = 'jewel_operator';
    const registry = new ToolRegistry(mockClient as any);
    const names = registry.getAllToolNames();

    expect(registry.getToolProfile()).toBe('jewel_operator');
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('crm_prepare_lead_intake');
    expect(names).toContain('crm_prepare_contact_note');
    expect(names).toContain('search_contacts');
    expect(names).not.toContain('create_contact');
    expect(names).not.toContain('delete_contact');

    for (const toolName of SIDE_EFFECT_TOOLS) {
      expect(names).not.toContain(toolName);
    }
    for (const toolName of OPERATOR_EXCLUDED_SAMPLES) {
      expect(names).not.toContain(toolName);
    }
  });

  it('jewel_operator exposes more tools than jewel_readonly', () => {
    process.env.GHL_TOOL_PROFILE = 'jewel_readonly';
    const readonlyCount = new ToolRegistry(mockClient as any).getToolCount();

    process.env.GHL_TOOL_PROFILE = 'jewel_operator';
    const operatorCount = new ToolRegistry(mockClient as any).getToolCount();

    expect(operatorCount).toBeGreaterThan(readonlyCount);
  });

  it('falls back to full for unknown profiles', () => {
    process.env.GHL_TOOL_PROFILE = 'jewel_admin';
    const registry = new ToolRegistry(mockClient as any);

    expect(registry.getToolProfile()).toBe('full');
    expect(registry.getAllToolNames()).toContain('create_contact');
    expect(registry.getAllToolNames()).toContain('crm_prepare_lead_intake');
  });
});
