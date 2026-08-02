#!/usr/bin/env node
/**
 * Fase 3C-2 — create missing Eva WA contact custom fields only.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv();

const LOCATION_ID = process.env.GHL_LOCATION_ID || 'uPgYlVj3v4nLWNRc5SQq';

const FIELDS = [
  {
    logicalKey: 'wa_last_intent',
    name: 'WA — Última intención',
    dataType: 'TEXT',
    placeholder: 'humano / beca / no_se_que_estudiar / duda_test',
    position: 0,
  },
  {
    logicalKey: 'wa_last_message_at',
    name: 'WA — Fecha último mensaje',
    dataType: 'DATE',
    placeholder: '2026-06-18T05:19:46.310Z',
    position: 1,
  },
  {
    logicalKey: 'wa_stage',
    name: 'WA — Etapa',
    dataType: 'TEXT',
    placeholder: 'inicio / test_recomendado / asesor_requerido / beca_interes',
    position: 2,
  },
  {
    logicalKey: 'wa_needs_human',
    name: 'WA — Requiere asesor',
    dataType: 'CHECKBOX',
    placeholder: 'true / false',
    position: 3,
    picklistOptions: ['true', 'false'],
    options: ['true', 'false'],
  },
  {
    logicalKey: 'wa_summary',
    name: 'WA — Resumen Eva',
    dataType: 'LARGE_TEXT',
    placeholder: 'Resumen breve de la interacción',
    position: 4,
  },
  {
    logicalKey: 'wa_source',
    name: 'WA — Fuente',
    dataType: 'TEXT',
    placeholder: 'YCloud / Eva WA',
    position: 5,
  },
  {
    logicalKey: 'wa_last_inbound_text',
    name: 'WA — Último mensaje entrante',
    dataType: 'LARGE_TEXT',
    placeholder: 'Último mensaje recibido por WhatsApp',
    position: 6,
  },
  {
    logicalKey: 'wa_last_outbound_text',
    name: 'WA — Última respuesta Eva',
    dataType: 'LARGE_TEXT',
    placeholder: 'Última respuesta generada por Eva WA',
    position: 7,
  },
];

const NAME_HINTS = {
  wa_last_intent: ['ltima intenci', 'ultima intenci'],
  wa_last_message_at: ['fecha', 'ltimo mensaje'],
  wa_stage: ['etapa'],
  wa_needs_human: ['requiere asesor'],
  wa_summary: ['resumen eva'],
  wa_source: ['fuente'],
  wa_last_inbound_text: ['mensaje entrante'],
  wa_last_outbound_text: ['respuesta eva', 'ltima respuesta'],
};

function loadDotEnv() {
  const paths = [
    join(repoRoot, '.env'),
    'c:\\Users\\vonde\\Proyectos\\curdeeclau-monorepo\\packages\\engines\\telegram-provider\\.env',
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function readGhlConfig() {
  if (!process.env.GHL_API_KEY) throw new Error('GHL_API_KEY missing');
  return {
    accessToken: process.env.GHL_API_KEY,
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || '2021-07-28',
    locationId: LOCATION_ID,
  };
}

function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ');
}

function fieldExists(existing, logicalKey) {
  const hints = NAME_HINTS[logicalKey] || [];
  return existing.find((cf) => {
    const n = normalizeName(cf.name);
    const fk = String(cf.fieldKey || '').toLowerCase();
    if (fk.includes(logicalKey)) return true;
    return hints.some((h) => n.includes(normalizeName(h)));
  });
}

async function main() {
  const { ToolRegistry } = await import(pathToFileURL(join(repoRoot, 'dist/tool-registry.js')).href);
  const { EnhancedGHLClient } = await import(pathToFileURL(join(repoRoot, 'dist/enhanced-ghl-client.js')).href);
  const client = new EnhancedGHLClient(readGhlConfig());
  const registry = new ToolRegistry(client);

  let list = await registry.callTool('get_location_custom_fields', {
    locationId: LOCATION_ID,
    model: 'contact',
  });
  let existing = list.customFields || [];

  const createdNow = [];
  const skipped = [];

  for (const field of FIELDS) {
    const found = fieldExists(existing, field.logicalKey);
    if (found) {
      skipped.push({ logicalKey: field.logicalKey, id: found.id, reason: 'already_exists' });
      continue;
    }

    const payload = {
      locationId: LOCATION_ID,
      model: 'contact',
      name: field.name,
      dataType: field.dataType,
      placeholder: field.placeholder,
      position: field.position,
      fieldKey: field.logicalKey,
    };
    if (field.options) payload.options = field.options;

    const result = await registry.callTool('create_location_custom_field', payload);
    if (!result?.success && !result?.customField) {
      throw new Error(`Failed "${field.name}": ${result?.message || result?.error || JSON.stringify(result)}`);
    }
    createdNow.push({
      logicalKey: field.logicalKey,
      customField: result.customField,
    });
    await sleep(450);

    list = await registry.callTool('get_location_custom_fields', {
      locationId: LOCATION_ID,
      model: 'contact',
    });
    existing = list.customFields || [];
  }

  const fieldMap = {};
  for (const field of FIELDS) {
    const cf = fieldExists(existing, field.logicalKey);
    if (cf) fieldMap[field.logicalKey] = cf.id;
  }

  console.log(JSON.stringify({
    createdNowCount: createdNow.length,
    skippedCount: skipped.length,
    totalContactFields: existing.length,
    skipped,
    createdNow: createdNow.map((c) => ({
      logicalKey: c.logicalKey,
      id: c.customField?.id,
      fieldKey: c.customField?.fieldKey,
      name: c.customField?.name,
      dataType: c.customField?.dataType,
    })),
    customFields: existing.map((cf) => ({
      name: cf.name,
      id: cf.id,
      fieldKey: cf.fieldKey,
      dataType: cf.dataType,
      model: cf.model,
    })),
    GHL_WA_FIELD_MAP: fieldMap,
  }, null, 2));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
