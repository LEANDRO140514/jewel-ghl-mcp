# Perfiles de tools — jewel-ghl-mcp

Define qué tools MCP expone el motor según canal y nivel de riesgo.
Complementa la sección breve en [TOOLING.md](./TOOLING.md).

---

## Estado actual (implementado)

El registro filtra tools vía la variable de entorno `GHL_TOOL_PROFILE`, leída en `src/tool-registry.ts`.

| Perfil | Valor env | Tools visibles | Caso de uso |
| --- | --- | --- | --- |
| **full** | `GHL_TOOL_PROFILE=full` (default del código hoy) | Todos: ~834 endpoint tools + capa curated `agent-workspace` | Desarrollo, inventario completo, CI |
| **curated** | `GHL_TOOL_PROFILE=curated` | Solo tools `agent-workspace` (flujos CRM de alto nivel) | Agentes conversacionales con cola de confirmación |
| **raw** | `GHL_TOOL_PROFILE=raw` | Solo endpoint-level; sin capa curated | Integraciones que llaman API GHL tool por tool |
| **jewel_readonly** | `GHL_TOOL_PROFILE=jewel_readonly` | Lectura, búsqueda, workspaces y preparación sin patrones write/destructive | Cursor laboratorio / auditoría |
| **jewel_operator** | `GHL_TOOL_PROFILE=jewel_operator` | Curated no destructivo + raw solo lectura | SaaS producción con aprobación humana externa |

### Cómo se clasifica cada tool

| Capa | Criterio en código |
| --- | --- |
| Curated | `_meta.labels.category === 'agent-workspace'` o `source === 'curated-agent-workspace'` |
| Raw | Todo lo demás (contacts, workflows, snapshots, official-spec, …) |
| JEWEL readonly | `isReadOnlyTool()` — metadata `readOnly`, prefijos `get_`/`search_`/`list_`, workspaces `crm_*_workspace`, `crm_prepare_*` sin subcadenas write |
| JEWEL operator | Curated no excluido + raw readonly; excluye `delete`, `remove`, `bulk`, `snapshot`, workflow triggers, writes raw |

> **Nota:** Los filtros JEWEL son **defensivos por nombre y anotaciones inferidas**. Deben evolucionar hacia metadata explícita (`readOnly`, `destructive`, `access`) en cada tool.

### Ejemplos

```bash
GHL_TOOL_PROFILE=curated npm run tools:list
GHL_TOOL_PROFILE=curated npm run start:stdio
GHL_TOOL_PROFILE=raw npm run start:http
GHL_TOOL_PROFILE=jewel_readonly npm run start:stdio
GHL_TOOL_PROFILE=jewel_operator npm run start:http
```

Tests: `tests/tool-registry.test.ts`.

---

## Perfiles JEWEL

| Perfil | Estado | Intención |
| --- | --- | --- |
| **jewel_readonly** | **Implementado** | Observación sin mutación — excluye `create`, `update`, `delete`, `send`, `bulk`, etc. |
| **jewel_operator** | **Implementado** | Curated + raw lectura; excluye destructivos, snapshots, workflow triggers, writes raw |
| **jewel_admin** | Pendiente | Setup agencia — operator + configuración |
| **jewel_danger_zone** | Pendiente | Acciones irreversibles — desactivado por defecto |

Implementación: `src/tool-registry.ts` → `filterJewelReadOnly()`, `filterJewelOperator()`, helpers `isReadOnlyTool`, `isWriteLikeTool`, `isDestructiveTool`.

---

## Perfiles legacy (upstream)

Los perfiles `full`, `curated` y `raw` se mantienen sin cambios de comportamiento.

---

## Matriz canal → perfil (actualizada)

| Canal | Perfil obligatorio | Transport | Notas |
| --- | --- | --- | --- |
| **Cursor** (ingeniería) | `jewel_readonly` | stdio (`server.ts`) | Nunca `full` ni `jewel_admin` en sesiones de desarrollo contra datos reales sin confirmación explícita |
| **jewel-ghl SaaS — producción** | `jewel_operator` | HTTP (`main.ts`) + headers tenant | Default para usuarios finales y agentes embebidos |
| **jewel-ghl SaaS — admin / setup** | `jewel_admin` | HTTP (`main.ts`) | Solo roles con permiso de configuración; audit log en InsForge/Supabase |
| **danger_zone** | `jewel_danger_zone` | Cualquiera | **Off por defecto**; requiere flag explícito por tenant + confirmación en UI + trazabilidad GHL-first |

### Mapeo canal → perfil (Fase 1F)

| Canal | Perfil |
| --- | --- |
| Cursor | `jewel_readonly` |
| SaaS producción | `jewel_operator` |
| SaaS admin | `jewel_admin` (pendiente) |
| danger_zone | `jewel_danger_zone` (pendiente) |

---

## Reglas de producción

### 1. `full` nunca es default en producción

- **Hoy el código defaultea a `full`** si `GHL_TOOL_PROFILE` no está definido.
- **Política JEWEL:** en despliegues SaaS y HTTP público, el orquestador (jewel-ghl) **debe** inyectar `GHL_TOOL_PROFILE=jewel_operator` (o `jewel_readonly` en Cursor).
- `full` queda reservado para: CI, `tools:list`, `scan:ghl-api`, entornos locales aislados.

### 2. Writes destructivos

- Tools con `destructive: true` o `access: write` requieren confirmación explícita (`--confirm` en CLI, cola de aprobación en SaaS).
- `jewel_danger_zone` nunca se habilita por variable de entorno global; solo per-tenant con TTL.

### 3. GHL-first en salida de agente

Independiente del perfil, los agentes en perfiles `operator` y superiores deben persistir resultados en GHL (Note, Task, Custom Field, etc.). Ver [ARCHITECTURE.md](./ARCHITECTURE.md#regla-ghl-first).

### 4. Multi-tenant y perfil

En HTTP (`main.ts`), perfil y credenciales son **por proceso** hoy. En jewel-ghl SaaS, el perfil deberá resolverse por tenant (header o JWT) — trabajo de Fase 1B+.

---

## Evolución planificada

| Fase | Entrega |
| --- | --- |
| **1A** (actual) | Este documento + ARCHITECTURE.md |
| **1B** | Remote upstream, diff, lista de conflictos |
| **1F** | Perfiles `jewel_readonly` / `jewel_operator` en registry |
| **2A** | Port selectivo CLI upstream; reactivar tests en cuarentena |

---

## Referencias

- Implementación actual: `src/tool-registry.ts` → `readToolProfile()`, `isToolVisible()`
- Inventario generado: `docs/tool-inventory.json` (campos `readOnly`, `destructive`, `access`, `category`)
- Metadata: [tooling/tool-metadata-categories.md](./tooling/tool-metadata-categories.md)
