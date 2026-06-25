# Arquitectura — jewel-ghl-mcp

Documento de blindaje para Fase 1. Define roles, límites y entry points del motor MCP.
No sustituye la documentación operativa en [TOOLING.md](./TOOLING.md).

---

## Mapa de productos

| Capa | Qué es | Rol |
| --- | --- | --- |
| **jewel-ghl-mcp** (este repo) | Motor soberano de herramientas GHL | Expone ~834 tools MCP, transports HTTP/stdio, perfiles de acceso, bridge REST. Es la única fuente de verdad para *cómo* se ejecutan operaciones contra la API de GHL. |
| **jewel-ghl** | SaaS / producto comercial | UI, onboarding, facturación, orquestación multi-tenant. Consume el motor MCP vía HTTP; no duplica lógica de tools. |
| **Cursor** | Consola de ingeniería | Desarrollo, auditoría, debugging y configuración local del MCP. No es el canal de producción para usuarios finales. |
| **GoHighLevel (GHL)** | Frontend operacional único | CRM, pipelines, workflows, landings, encuestas. Todo trabajo comercial visible para el cliente vive aquí. |
| **InsForge / Supabase** | Estado técnico | Tokens, sesiones, tenants, logs de agente, colas. **No** es frontend comercial ni sustituto del CRM. |

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cursor    │     │    jewel-ghl     │     │  Agentes / API  │
│ (ingeniería)│     │  (SaaS producto) │     │   consumidores  │
└──────┬──────┘     └────────┬─────────┘     └────────┬────────┘
       │ stdio               │ HTTP + headers          │ HTTP
       │                     │ multi-tenant            │
       └─────────────────────┼─────────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   jewel-ghl-mcp      │
                  │   (motor MCP)        │
                  └──────────┬───────────┘
                             │ GHL API
                             ▼
                  ┌──────────────────────┐
                  │   GoHighLevel        │
                  │   (CRM operacional)  │
                  └──────────────────────┘
                             ▲
                  ┌──────────┴───────────┐
                  │ InsForge / Supabase  │
                  │ (estado técnico)     │
                  └──────────────────────┘
```

---

## Regla GHL-first

Todo insight, decisión o resultado de agente con valor comercial **debe terminar visible en GHL**. No basta con guardarlo solo en Supabase, logs internos o memoria del agente.

Destinos válidos en GHL:

| Tipo | Uso |
| --- | --- |
| **Note** | Resúmenes, hallazgos, contexto de conversación |
| **Task** | Acciones pendientes con responsable y fecha |
| **Custom Field** | Señales estructuradas (score, etapa IA, flags) |
| **Opportunity Note** | Contexto ligado a un deal |
| **Señal visible** | Cualquier artefacto que el equipo vea en la UI de GHL sin abrir otra app |

Si un flujo no puede escribir en GHL, debe documentarse como excepción explícita y temporal.

---

## Entry points del servidor

El motor compila a `dist/` desde `src/`. Cada entry point sirve un transport distinto; **no son intercambiables** en producción.

### `src/main.ts` — HTTP multi-tenant principal

| Aspecto | Detalle |
| --- | --- |
| **Bin / script** | `npm run start` / `npm run start:http` → `dist/main.js` |
| **Transport** | Streamable HTTP (`/mcp`), SSE legacy (`/sse`), REST bridge (`/tools`, `/execute`, `/health`, …) |
| **Multi-tenant** | Sí — headers `x-ghl-access-token` y `x-ghl-location-id` crean un cliente GHL por request en `/mcp` y `/execute` |
| **CORS** | Localhost, `*.vercel.app`, ChatGPT, `ALLOWED_ORIGINS` |
| **Credenciales** | `GHL_API_KEY` opcional en HTTP; si faltan env vars, el tenant puede autenticarse solo por headers |
| **Perfil tools** | Respeta `GHL_TOOL_PROFILE` vía `ToolRegistry` |

**Canal de producción** para jewel-ghl SaaS y despliegues en Vercel/Railway.

### `src/server.ts` — stdio / local

| Aspecto | Detalle |
| --- | --- |
| **Bin / script** | `npm run start:stdio` → `dist/server.js` |
| **Transport** | MCP stdio (Claude Desktop, Cursor, Windsurf) |
| **Multi-tenant** | No — una sola credencial por proceso (`GHL_API_KEY` + `GHL_LOCATION_ID` obligatorios) |
| **Cliente** | `GHLApiClient` directo |
| **Perfil tools** | Respeta `GHL_TOOL_PROFILE` |

**Canal de ingeniería** y desarrollo local. No usar como backend multi-tenant.

### `src/http-server.ts` — legacy

| Aspecto | Detalle |
| --- | --- |
| **Script** | `npm run start:legacy` → `dist/http-server.js` |
| **Transport** | SSE únicamente |
| **Multi-tenant** | No |
| **CORS** | Solo localhost y ChatGPT — **sin** soporte Vercel ni headers `x-ghl-*` |
| **Estado** | Mantenido por compatibilidad; no extender para nuevas features |

---

## Componentes internos clave

| Ruta | Responsabilidad |
| --- | --- |
| `src/tool-registry.ts` | Registro de ~50 módulos de tools; filtrado por `GHL_TOOL_PROFILE` |
| `src/clients/ghl-api-client.ts` | Cliente HTTP GHL; header `Version` configurable |
| `src/enhanced-ghl-client.ts` | Wrapper con caché y retry usado por HTTP |
| `src/execute-route.ts` | Bridge REST `GET /tools`, `POST /execute` con soporte multi-tenant |
| `src/tools/*` | Implementación de tools por dominio (contacts, workflows, snapshots, …) |
| `scripts/ghl-mcp.mjs` | CLI companion (doctor, auth-check, configure, scan) |
| `mcp-apps/` | MCP Apps companion (UI embebida); subproyecto independiente |

---

## Perfiles de tools

Ver [TOOL-PROFILES.md](./TOOL-PROFILES.md) para perfiles actuales (`full`, `curated`, `raw`) y perfiles JEWEL objetivo (`jewel_readonly`, `jewel_operator`, …).

---

## ⚠️ Protección en merges upstream

`src/main.ts` contiene customizaciones JEWEL que **no existen** en el upstream base:

- CORS para `*.vercel.app`
- Headers multi-tenant `x-ghl-access-token` / `x-ghl-location-id`
- `GHL_API_KEY` opcional en modo HTTP
- Cliente GHL per-request en `/mcp`

**En cualquier merge o rebase con upstream:**

1. Resolver conflictos en `src/main.ts` manualmente — nunca aceptar la versión upstream ciega.
2. Verificar que CORS, headers permitidos y lógica per-request siguen intactos.
3. Ejecutar smoke HTTP con headers de tenant antes de cerrar el merge.
4. Documentar en el PR qué líneas JEWEL se preservaron.

Otros archivos de alto riesgo en sync: `package.json`, `README.md`, `.env.example`. Ver auditoría Fase 1 para la lista completa.

---

## Documentos relacionados

| Documento | Contenido |
| --- | --- |
| [TOOL-PROFILES.md](./TOOL-PROFILES.md) | Perfiles actuales y matriz canal → perfil |
| [TOOLING.md](./TOOLING.md) | Comandos operativos y tooling loop |
| [tooling/client-config-generator.md](./tooling/client-config-generator.md) | Snippets MCP para clientes |
