# Auditoría de exposición por perfil — Fase 1G

Generado: 2026-06-24  
Rama: `phase-1c/repo-operability`  
Método: `GHL_TOOL_PROFILE=<perfil> node scripts/ghl-mcp.mjs list-tools --json`

---

## Conteo por perfil

| Perfil | Tools |
| --- | ---: |
| full | 834 |
| curated | 32 |
| raw | 802 |
| jewel_readonly | 419 |
| jewel_operator | 419 |

---

## Top categorías por perfil

### full (top 12)

| Categoría | Count |
| --- | ---: |
| official-ad-manager | 94 |
| calendar | 39 |
| courses | 32 |
| agent-workspace | 32 |
| contacts | 31 |
| locations | 27 |
| official-social-media-posting | 24 |
| payments | 22 |
| official-saas-api | 21 |
| conversations | 20 |
| phone-numbers | 20 |
| social-media | 19 |

### curated

| Categoría | Count |
| --- | ---: |
| agent-workspace | 32 |

### raw (top 12)

| Categoría | Count |
| --- | ---: |
| official-ad-manager | 94 |
| calendar | 39 |
| courses | 32 |
| contacts | 31 |
| locations | 27 |
| official-social-media-posting | 24 |
| payments | 22 |
| official-saas-api | 21 |
| conversations | 20 |
| phone-numbers | 20 |
| social-media | 19 |
| invoices | 18 |

### jewel_readonly (top 12)

| Categoría | Count |
| --- | ---: |
| official-ad-manager | 47 |
| agent-workspace | 27 |
| official-social-media-posting | 17 |
| calendar | 16 |
| payments | 13 |
| courses | 12 |
| analytics | 12 |
| locations | 11 |
| phone-numbers | 11 |
| social-media | 10 |
| affiliates | 10 |
| reputation | 10 |

### jewel_operator (top 12)

| Categoría | Count |
| --- | ---: |
| official-ad-manager | 47 |
| agent-workspace | 27 |
| official-social-media-posting | 17 |
| calendar | 16 |
| payments | 13 |
| courses | 12 |
| analytics | 12 |
| locations | 11 |
| phone-numbers | 11 |
| social-media | 10 |
| affiliates | 10 |
| reputation | 10 |

---

## jewel_readonly — análisis de riesgo

### Metadata peligrosa

| Tipo | Count |
| --- | ---: |
| destructive / access=delete | 0 |
| access=write sin readOnly | 15 |

### Tools con metadata `access=write` (curated prepare — sin mutación directa GHL)

Estas 15 tools son `crm_prepare_*` de agent-workspace: preparan payloads para cola de aprobación humana, no ejecutan writes raw. El filtro por nombre las permite; **revisar si deben estar en readonly de Cursor**.

- `crm_prepare_contact_note`
- `crm_prepare_contact_task`
- `crm_prepare_lead_intake`
- `crm_prepare_conversation_reply`
- `crm_prepare_conversation_status`
- `crm_prepare_pipeline_follow_up`
- `crm_prepare_appointment_booking`
- `crm_prepare_appointment_reschedule`
- `crm_prepare_automation_enrollment`
- `crm_prepare_review_reply`
- `crm_prepare_review_request`
- `crm_prepare_ad_campaign_status`
- `crm_prepare_invoice`
- `crm_prepare_payment_record`
- `crm_prepare_user_invite`

### Acciones con side-effect en raw (no matchean HARD por nombre)

Total: **17** — recomendadas para exclusión en `jewel_readonly` en Fase 2.

- `disable_calendar_group`
- `start_social_oauth`
- `approve_affiliate`
- `reject_affiliate`
- `start_campaign`
- `pause_campaign`
- `resume_campaign`
- `enroll_contact_in_course`
- `disconnect_custom_provider_config`
- `purchase_phone_number`
- `release_phone_number`
- `reply_to_review`
- `disconnect_review_platform`
- `pause_saas_location`
- `enable_saas_location`
- `enable_trigger`
- `disable_trigger`

### Sospechosas HARD (patrones write/destructive en nombre)

Total: **0**

_Ninguna._


### Sospechosas SOFT (subcadenas de dominio; muchas son lecturas legítimas)

Total: **81**

- `crm_contact_workspace` [agent-workspace; read, readOnly] — hits: contact
- `crm_prepare_ad_campaign_status` [agent-workspace; write] — hits: campaign
- `crm_prepare_contact_note` [agent-workspace; write] — hits: contact
- `crm_prepare_contact_task` [agent-workspace; write] — hits: contact
- `crm_prepare_invoice` [agent-workspace; write] — hits: invoice
- `crm_prepare_payment_record` [agent-workspace; write] — hits: payment
- `disable_trigger` [triggers; read, readOnly] — hits: trigger
- `duplicate_trigger` [triggers; read, readOnly] — hits: trigger
- `enable_trigger` [triggers; read, readOnly] — hits: trigger
- `enroll_contact_in_course` [courses; read, readOnly] — hits: contact
- `filter_users_by_email` [users; read, readOnly] — hits: email
- `find_uncontacted_form_leads` [workflow-insights; read, readOnly] — hits: contact
- `generate_invoice_number` [invoices; read, readOnly] — hits: invoice
- `get_affiliate_campaign` [affiliates; read, readOnly] — hits: campaign
- `get_affiliate_campaigns` [affiliates; read, readOnly] — hits: campaign
- `get_campaign` [campaigns; read, readOnly] — hits: campaign
- `get_campaign_recipients` [campaigns; read, readOnly] — hits: campaign
- `get_campaign_stats` [campaigns; read, readOnly] — hits: campaign
- `get_campaigns` [campaigns; read, readOnly] — hits: campaign
- `get_contact` [contacts; read, readOnly] — hits: contact
- `get_contact_appointments` [contacts; read, readOnly] — hits: contact
- `get_contact_note` [contacts; read, readOnly] — hits: contact
- `get_contact_notes` [contacts; read, readOnly] — hits: contact
- `get_contact_task` [contacts; read, readOnly] — hits: contact
- `get_contact_tasks` [contacts; read, readOnly] — hits: contact
- `get_contacts_by_business` [contacts; read, readOnly] — hits: contact
- `get_duplicate_contact` [contacts; read, readOnly] — hits: contact
- `get_email_campaigns` [email; read, readOnly] — hits: email, campaign
- `get_email_message` [conversations; read, readOnly] — hits: email
- `get_email_reports` [analytics; read, readOnly] — hits: email
- `get_email_templates` [email; read, readOnly] — hits: email
- `get_invoice` [invoices; read, readOnly] — hits: invoice
- `get_invoice_schedule` [invoices; read, readOnly] — hits: invoice
- `get_invoice_template` [invoices; read, readOnly] — hits: invoice
- `get_opportunity` [deals; read, readOnly] — hits: opportunity
- _... y 46 más_


---

## jewel_operator — análisis de riesgo

### Metadata peligrosa

| Tipo | Count |
| --- | ---: |
| destructive / access=delete | 0 |
| access=write sin readOnly | 15 |

### Sospechosas HARD

Total: **0**

_Ninguna._


### Sospechosas SOFT

Total: **81**

- `crm_contact_workspace` [agent-workspace; read, readOnly] — hits: contact
- `crm_prepare_ad_campaign_status` [agent-workspace; write] — hits: campaign
- `crm_prepare_contact_note` [agent-workspace; write] — hits: contact
- `crm_prepare_contact_task` [agent-workspace; write] — hits: contact
- `crm_prepare_invoice` [agent-workspace; write] — hits: invoice
- `crm_prepare_payment_record` [agent-workspace; write] — hits: payment
- `disable_trigger` [triggers; read, readOnly] — hits: trigger
- `duplicate_trigger` [triggers; read, readOnly] — hits: trigger
- `enable_trigger` [triggers; read, readOnly] — hits: trigger
- `enroll_contact_in_course` [courses; read, readOnly] — hits: contact
- `filter_users_by_email` [users; read, readOnly] — hits: email
- `find_uncontacted_form_leads` [workflow-insights; read, readOnly] — hits: contact
- `generate_invoice_number` [invoices; read, readOnly] — hits: invoice
- `get_affiliate_campaign` [affiliates; read, readOnly] — hits: campaign
- `get_affiliate_campaigns` [affiliates; read, readOnly] — hits: campaign
- `get_campaign` [campaigns; read, readOnly] — hits: campaign
- `get_campaign_recipients` [campaigns; read, readOnly] — hits: campaign
- `get_campaign_stats` [campaigns; read, readOnly] — hits: campaign
- `get_campaigns` [campaigns; read, readOnly] — hits: campaign
- `get_contact` [contacts; read, readOnly] — hits: contact
- `get_contact_appointments` [contacts; read, readOnly] — hits: contact
- `get_contact_note` [contacts; read, readOnly] — hits: contact
- `get_contact_notes` [contacts; read, readOnly] — hits: contact
- `get_contact_task` [contacts; read, readOnly] — hits: contact
- `get_contact_tasks` [contacts; read, readOnly] — hits: contact
- `get_contacts_by_business` [contacts; read, readOnly] — hits: contact
- `get_duplicate_contact` [contacts; read, readOnly] — hits: contact
- `get_email_campaigns` [email; read, readOnly] — hits: email, campaign
- `get_email_message` [conversations; read, readOnly] — hits: email
- `get_email_reports` [analytics; read, readOnly] — hits: email
- `get_email_templates` [email; read, readOnly] — hits: email
- `get_invoice` [invoices; read, readOnly] — hits: invoice
- `get_invoice_schedule` [invoices; read, readOnly] — hits: invoice
- `get_invoice_template` [invoices; read, readOnly] — hits: invoice
- `get_opportunity` [deals; read, readOnly] — hits: opportunity
- _... y 46 más_


---

## Diferencia operator vs readonly

| Métrica | Valor |
| --- | ---: |
| Tools solo en operator | 0 |
| Tools solo en readonly | 0 |
| Intersección (mismo conteo hoy) | Sí — 419 tools idénticos |

---

## Recomendación de exclusiones adicionales (reporte only — no implementado en 1G)

1. **jewel_readonly**: 0 HARD/destructive en nombre; endurecer 17 side-effects + decidir sobre 15 `crm_prepare_*` antes de Cursor con datos reales.

2. Excluir acciones de estado: `approve_`, `reject_`, `pause_`, `resume_`, `start_`, `enable_`, `disable_`, `purchase_`, `release_`, `disconnect_`, `enroll_`.
3. Excluir `official_ad_manager_*` y reporting ads de readonly (laboratorio CRM, no ads write).
4. Excluir `reply_to_review`, `live_chat_typing` (efectos laterales).
5. **jewel_operator** hoy equivale a readonly en conteo — definir capa curated operator distinta en Fase 2.
6. Migrar filtros de heurística de nombre a metadata `readOnly` / `destructive` explícita por tool.

---

## Veredicto Cursor (jewel_readonly)

**Requiere endurecimiento antes de datos reales.**

| Criterio | Resultado |
| --- | --- |
| Patrones HARD en nombre | 0 — OK |
| Metadata destructive/delete | 0 — OK |
| Metadata write (crm_prepare_*) | 15 — revisar |
| Side-effects raw (approve/start/purchase/…) | 17 — excluir |
| SOFT (subcadenas dominio) | 81 — mayoría lecturas legítimas |

**Uso recomendado hoy:** sandbox GHL + `GHL_TOOL_PROFILE=jewel_readonly` solo tras excluir side-effects y decidir si `crm_prepare_*` pertenecen a Cursor o solo a operator/SaaS.

---

## Fase 1H — Endurecimiento de perfiles

**Fecha:** 2026-06-24  
**Cambios:** `isSideEffectTool()` con prefijos `approve_`, `reject_`, `start_`, `pause_`, `resume_`, `enable_`, `disable_`, `purchase_`, `release_`, `disconnect_`, `enroll_`, `reply_`.

| Resultado | Detalle |
| --- | --- |
| 17 side-effects | Bloqueadas en **jewel_readonly** y **jewel_operator** |
| `crm_prepare_*` | **Fuera** de readonly (0); **dentro** de operator (15) |
| Separación perfiles | readonly 387 vs operator 402 (antes ambos 419) |

### Conteos post-1H

| Perfil | Tools |
| --- | ---: |
| full | 834 |
| curated | 32 |
| raw | 802 |
| jewel_readonly | 387 |
| jewel_operator | 402 |

### Veredicto Cursor post-1H

**Apto para sandbox** con `GHL_TOOL_PROFILE=jewel_readonly`: sin side-effects, sin prepare, sin patrones HARD/destructive. Revisar SOFT (`official_ad_manager_*`, etc.) si el laboratorio no requiere ads.
