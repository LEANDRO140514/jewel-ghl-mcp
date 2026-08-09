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

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: version,
      Accept: 'application/json',
    },
  });
  let body;
  try { body = await response.json(); } catch { body = undefined; }
  return { status: response.status, body };
}

function report(name, status) {
  const ok = status >= 200 && status < 500;
  console.log(`${ok ? 'ok' : 'fail'} ${name}: HTTP ${status}`);
  return ok;
}

let failed = 0;

// Fetch location first: its response carries companyId, required by users-search below.
const locationResult = await get(`/locations/${encodeURIComponent(locationId)}`);
if (!report('location', locationResult.status)) failed += 1;
const companyId = locationResult.body?.location?.companyId;

const contactsResult = await get(`/contacts/?locationId=${encodeURIComponent(locationId)}&limit=1`);
if (!report('contacts-search', contactsResult.status)) failed += 1;

if (companyId) {
  const usersResult = await get(`/users/search?companyId=${encodeURIComponent(companyId)}&locationId=${encodeURIComponent(locationId)}&limit=1`);
  if (!report('users-search', usersResult.status)) failed += 1;
} else {
  console.log('fail users-search: could not read companyId from /locations response');
  failed += 1;
}

const emailResult = await get(`/emails/schedule?locationId=${encodeURIComponent(locationId)}&limit=1&campaignsOnly=true`);
if (!report('email-schedule', emailResult.status)) failed += 1;

if (failed > 0) process.exit(1);
