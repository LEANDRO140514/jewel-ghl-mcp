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

### Cómo se clasifica cada tool

| Capa | Criterio en código |
| --- | --- |
| Curated | `_meta.labels.category === 'agent-workspace'` o `source === 'curated-agent-workspace'` |
| Raw | Todo lo demás (contacts, workflows, snapshots, official-spec, …) |

### Ejemplos

```bash
GHL_TOOL_PROFILE=curated npm run tools:list
GHL_TOOL_PROFILE=curated npm run start:stdio
GHL_TOOL_PROFILE=raw npm run start:http
```

Tests: `tests/tool-registry.test.ts`.

---

## Perfiles JEWEL objetivo (por implementar)

Los perfiles `jewel_*` **no existen aún en código**. Son el contrato de seguridad para producción y deben mapearse sobre `full` / `curated` / `raw` + reglas de acceso (`readOnly`, `destructive`, categoría).

| Perfil | Intención | Alcance esperado |
| --- | --- | --- |
| **jewel_readonly** | Observación sin mutación | Solo tools `readOnly: true`; búsquedas, listados, reportes, insights |
| **jewel_operator** | Operación diaria del SaaS | Curated + subset raw de CRM (contacts, opportunities, tasks, notes, calendar) con writes no destructivos |
| **jewel_admin** | Setup de agencia / location | Operator + configuración (custom fields, pipelines, workflows read/write, snapshots read) |
| **jewel_danger_zone** | Acciones irreversibles | Deletes masivos, snapshot push, billing, permisos, marketplace — **desactivado por defecto** |

Implementación prevista: extender `readToolProfile()` en `tool-registry.ts` o capa de policy por tenant en jewel-ghl SaaS.

---

## Matriz canal → perfil

| Canal | Perfil obligatorio | Transport | Notas |
| --- | --- | --- | --- |
| **Cursor** (ingeniería) | `jewel_readonly` | stdio (`server.ts`) | Nunca `full` ni `jewel_admin` en sesiones de desarrollo contra datos reales sin confirmación explícita |
| **jewel-ghl SaaS — producción** | `jewel_operator` | HTTP (`main.ts`) + headers tenant | Default para usuarios finales y agentes embebidos |
| **jewel-ghl SaaS — admin / setup** | `jewel_admin` | HTTP (`main.ts`) | Solo roles con permiso de configuración; audit log en InsForge/Supabase |
| **danger_zone** | `jewel_danger_zone` | Cualquiera | **Off por defecto**; requiere flag explícito por tenant + confirmación en UI + trazabilidad GHL-first |

### Mapeo provisional canal → perfil actual

Hasta implementar `jewel_*`, usar esta aproximación:

| Canal | Perfil actual recomendado |
| --- | --- |
| Cursor | `curated` o `raw` con tools de solo lectura vía `test-tool` sin `--confirm` |
| SaaS producción | `curated` |
| SaaS admin | `full` con policy externa (temporal — migrar a `jewel_admin`) |
| danger_zone | No exponer; usar CLI local con `--confirm` solo en mantenimiento |

---

## Reglas de producción

### 1. `full` nunca es default en producción

- **Hoy el código defaultea a `full`** si `GHL_TOOL_PROFILE` no está definido.
- **Política JEWEL:** en despliegues SaaS y HTTP público, el orquestador (jewel-ghl) **debe** inyectar `GHL_TOOL_PROFILE=curated` como mínimo hasta que existan `jewel_operator` / `jewel_readonly`.
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
| **1C** | Implementar `jewel_readonly` / `jewel_operator` en registry |
| **1D** | Default de producción ≠ `full`; scripts `configure:cursor`, `auth-check` npm |

---

## Referencias

- Implementación actual: `src/tool-registry.ts` → `readToolProfile()`, `isToolVisible()`
- Inventario generado: `docs/tool-inventory.json` (campos `readOnly`, `destructive`, `access`, `category`)
- Metadata: [tooling/tool-metadata-categories.md](./tooling/tool-metadata-categories.md)
