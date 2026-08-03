#!/usr/bin/env node
import 'dotenv/config';

const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;
const version = process.env.GHL_API_VERSION || '2021-07-28';

if (!apiKey || !locationId) {
  const missing = [];
  if (!apiKey) missing.push('GHL_API_KEY');
  if (!locationId) missing.push('GHL_LOCATION_ID');
  console.log(`SKIP: falta ${missing.join(' y ')} — set GHL_API_KEY and GHL_LOCATION_ID to run read-only GHL checks.`);
  process.exit(0);
}

const checks = [
  { name: 'location', path: `/locations/${encodeURIComponent(locationId)}` },
  { name: 'contacts-search', path: `/contacts/search?locationId=${encodeURIComponent(locationId)}&pageLimit=1` },
  { name: 'users-search', path: `/users/search?locationId=${encodeURIComponent(locationId)}&limit=1` },
  { name: 'email-schedule', path: `/emails/schedule?locationId=${encodeURIComponent(locationId)}&limit=1&campaignsOnly=true` },
];

let failed = 0;
for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: version,
      Accept: 'application/json',
    },
  });
  const ok = response.status >= 200 && response.status < 500;
  console.log(`${ok ? 'ok' : 'fail'} ${check.name}: HTTP ${response.status}`);
  if (!ok) failed += 1;
}

if (failed > 0) process.exit(1);
