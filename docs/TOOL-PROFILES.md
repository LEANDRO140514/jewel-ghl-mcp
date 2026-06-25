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
| **jewel_readonly** | `GHL_TOOL_PROFILE=jewel_readonly` | Lectura pura: búsqueda, listados, workspaces CRM — **sin** `crm_prepare_*` ni side-effects | Cursor laboratorio / auditoría |
| **jewel_operator** | `GHL_TOOL_PROFILE=jewel_operator` | Curated `crm_prepare_*` + raw solo lectura — sin side-effects ni writes raw | SaaS producción con aprobación humana externa |

### Cómo se clasifica cada tool

| Capa | Criterio en código |
| --- | --- |
| Curated | `_meta.labels.category === 'agent-workspace'` o `source === 'curated-agent-workspace'` |
| Raw | Todo lo demás (contacts, workflows, snapshots, official-spec, …) |
| JEWEL readonly | `isJewelPureReadTool()` — lectura pura; excluye write/destructive/side-effect/snapshot/bulk/`crm_prepare_*` |
| JEWEL operator | Curated no excluido (incluye `crm_prepare_*`) + raw `isJewelPureReadTool`; bloquea `isSideEffectTool` y writes raw |

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
| **jewel_readonly** | **Implementado (Fase 1H)** | Lectura pura — sin `crm_prepare_*`, sin side-effects (`approve_`, `start_`, `disable_`, …) |
| **jewel_operator** | **Implementado (Fase 1H)** | Incluye `crm_prepare_*` curated; bloquea side-effects raw y writes destructivos |
| **jewel_admin** | Pendiente | Setup agencia — operator + configuración |
| **jewel_danger_zone** | Pendiente | Acciones irreversibles — desactivado por defecto |

Implementación: `src/tool-registry.ts` → `filterJewelReadOnly()`, `filterJewelOperator()`, helpers `isJewelPureReadTool`, `isSideEffectTool`, `isWriteLikeTool`, `isDestructiveTool`.

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

## Cursor configuration

Configuración recomendada para **Cursor como consola de ingeniería** (laboratorio, no producción).

| Regla | Detalle |
| --- | --- |
| Perfil obligatorio | `GHL_TOOL_PROFILE=jewel_readonly` |
| Cuenta GHL | **Sandbox** — Private Integration Token de entorno de prueba |
| No usar en Cursor | `full`, `jewel_operator`, `curated` sin restricción |
| Secretos | Nunca commitear tokens reales; usar placeholders en repo |

### Archivo de ejemplo

Copiar desde la raíz del repo: [`cursor-mcp-config.example.json`](../cursor-mcp-config.example.json)

Entrada MCP: `jewel-ghl-readonly` → `node` + `dist/server.js` con perfil readonly.

### Preview CLI (no escribe `mcp.json`)

```powershell
npm run configure:cursor
```

Imprime JSON a stdout con servidor `ghl` y **sin** `GHL_TOOL_PROFILE`. Para Cursor, usar el example file o fusionar manualmente la entrada `jewel-ghl-readonly` en tu config local.

### Instalación manual en Cursor

1. `npm run build` en `C:\dev\jewel-ghl-mcp`
2. Abrir Cursor → Settings → MCP (o editar `%USERPROFILE%\.cursor\mcp.json`)
3. **Hacer backup** del `mcp.json` existente antes de editar
4. Añadir el bloque `jewel-ghl-readonly` desde `cursor-mcp-config.example.json`
5. Reemplazar placeholders con credenciales **sandbox** (no producción)
6. Reiniciar Cursor o recargar MCP servers

`.gitignore` ignora `cursor-mcp-config.json` y `*.mcp.json` — el archivo global de Cursor no debe versionarse.

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
