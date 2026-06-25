# Plan de sync upstream — jewel-ghl-mcp

Documento de auditoría Fase 1B. **No autoriza merge**; define divergencia y reglas antes de absorber cambios técnicos.

---

## Referencia

| Campo | Valor |
| --- | --- |
| **Upstream** | [BusyBee3333/Go-High-Level-MCP-2026-Complete](https://github.com/BusyBee3333/Go-High-Level-MCP-2026-Complete.git) |
| **Remote** | `upstream` → `https://github.com/BusyBee3333/Go-High-Level-MCP-2026-Complete.git` |
| **Rama local** | `phase-1/upstream-audit` |
| **Commit local** | `75c446a` (`docs: define JEWEL GHL MCP architecture and tool profiles`) |
| **Upstream HEAD** | `bfc2bbe` (`feat: add easy setup commands and CRM agent tools`) |
| **Origin** | `LEANDRO140514/jewel-ghl-mcp` |

### Merge-base

```
N/A — historias no relacionadas
```

`git merge-base HEAD upstream/main` no devuelve ancestro común. Los repos comparten mensajes de commit equivalentes pero **hashes distintos** desde la raíz:

| Repo | Commit raíz (mensaje idéntico) |
| --- | --- |
| Local | `6fb4287` — Improve route execution handling and main entry point |
| Upstream | `883f7df` — Improve route execution handling and main entry point |

**Implicación:** un merge normal o `git diff upstream/main...HEAD` (tres puntos) falla. La comparación válida es `git diff upstream/main HEAD` (dos puntos). Cualquier integración futura requerirá estrategia explícita (`--allow-unrelated-histories`, cherry-pick por commit, o patch por directorio) con revisión manual.

---

## Divergencia de commits

### Solo en upstream (`HEAD..upstream/main`) — 14 commits

Incluye trabajo que JEWEL aún no tiene:

| Commit | Resumen |
| --- | --- |
| `bfc2bbe` | Easy setup commands y CRM agent tools |
| `d830668` | Onboarding y agent setup mejorado |
| `e80faeb` | Refresh API coverage + atribución Codex |
| `837318b` | Crédito contributor tool names |
| `22a5c2e` | Merge PR #7 toolname fix |
| `29f0a12` | Cap generated official tool names |
| `472fbfa`–`883f7df` | Historial compartido en contenido, no en SHA |

### Solo en local (`upstream/main..HEAD`) — 15 commits

Incluye branding y blindaje JEWEL:

| Commit | Resumen |
| --- | --- |
| `75c446a` | docs ARCHITECTURE + TOOL-PROFILES + .gitignore |
| `2f76b9e` | **JEWEL:** GHL_API_KEY opcional + CORS Vercel en `main.ts` |
| `58c7324` | **JEWEL:** typescript en dependencies (Railway) |
| `5579526` | **JEWEL:** `.env.example` personalizado |
| `18a0665` | **JEWEL:** branding `package.json` |
| `265d442` / `823b3e3` | **JEWEL:** README profesional |
| `928076c`–`6fb4287` | Historial compartido en contenido, no en SHA |

---

## Resumen de diff (`git diff --stat upstream/main HEAD`)

```
64 files changed, 1565 insertions(+), 7088 deletions(-)
```

Interpretación: upstream ha avanzado en onboarding, CLI, tests, Docker, docs operativos y artefactos generados. JEWEL tiene menos líneas netas porque upstream añadió mucho contenido que el fork no incluye o simplificó.

### Archivos con conflicto probable (alta prioridad)

| Archivo | Motivo |
| --- | --- |
| `README.md` | Branding JEWEL vs upstream BusyBee/Codex |
| `package.json` | Nombre `jewel-ghl-mcp`, bins, scripts onboarding upstream |
| `package-lock.json` | Desincronizado con package.json JEWEL |
| `.env.example` | Plantilla JEWEL vs upstream |
| `src/main.ts` | **Crítico:** multi-tenant headers + CORS Vercel JEWEL |
| `.gitignore` | Patrones defensivos JEWEL + reglas upstream |
| `docs/ARCHITECTURE.md` | Solo JEWEL — upstream no tiene |
| `docs/TOOL-PROFILES.md` | JEWEL extendido vs upstream (si existe versión distinta) |
| `scripts/ghl-mcp.mjs` | Upstream +548 líneas (setup, onboarding, más comandos) |
| `src/tool-registry.ts` | Perfiles y registro de tools |
| `src/tools/official-spec-*.ts/json` | Artefactos generados — regenerar, no mergear a ciegas |
| `docs/tool-inventory.json` | ~2785 líneas de diff — regenerable |
| `docs/ghl-api-coverage.json` | Regenerable vía `scan:ghl-api` |

### Archivos protegidos JEWEL (conservar en sync)

Estos archivos **no deben sobrescribirse** con la versión upstream sin revisión explícita:

1. `README.md` — identidad y posicionamiento JEWEL
2. `package.json` — nombre, bins `jewel-ghl-mcp` / `jewel-ghl`
3. `package-lock.json` — alinear después de resolver package.json
4. `.env.example` — plantilla JEWEL
5. `src/main.ts` — HTTP multi-tenant, CORS `*.vercel.app`, headers `x-ghl-*`
6. `.gitignore` — patrones `*.mcp.json`, `*.pem`, `*.key`, etc.
7. `docs/ARCHITECTURE.md` — mapa de productos y regla GHL-first
8. `docs/TOOL-PROFILES.md` — perfiles JEWEL y matriz canal → perfil

### Contenido upstream a absorber (sin tocar protegidos aún)

| Área | Archivos / cambios |
| --- | --- |
| Onboarding | `AGENT_SETUP.md`, `QUICKSTART.md`, `.github/workflows/onboarding.yml` |
| Setup fácil | Commits `bfc2bbe`, `d830668` — scripts npm `configure:cursor`, `doctor`, etc. |
| Docker | `Dockerfile`, `docker-compose.yml`, `.dockerignore` |
| Docs operativos | `docs/SETUP.md`, `docs/SAFETY.md`, `docs/TROUBLESHOOTING.md`, `docs/USAGE.md`, … |
| CLI / tests | `scripts/validate-api-source-lock.mjs`, `tests/scripts/*.test.ts` |
| Tool fixes | `29f0a12` cap tool names, `src/tools/users-tools.ts`, `email-tools.ts` |
| API drift | `e80faeb` refresh coverage, `docs/api-sources.lock.json` |

### Contenido solo JEWEL (no perder)

| Área | Detalle |
| --- | --- |
| HTTP deploy | `src/main.ts` — tenant per-request, CORS Vercel |
| Branding | `package.json`, `README.md`, `.env.example` |
| Blindaje doc | `docs/ARCHITECTURE.md`, `docs/TOOL-PROFILES.md`, `docs/UPSTREAM-SYNC.md` |
| `.gitignore` | Patrones defensivos Fase 1A |

---

## Política de integración

1. **Motor técnico upstream se absorbe** — tools, scans, tests, onboarding CLI, fixes de API, workflows CI.
2. **Identidad JEWEL se conserva** — nombre npm, README, bins, posicionamiento comercial.
3. **`src/main.ts` multi-tenant/CORS no se pierde** — en conflicto, mantener bloques JEWEL y portar mejoras upstream alrededor.
4. **`full` no debe ser default productivo** — al absorber defaults upstream, forzar `GHL_TOOL_PROFILE=curated` o perfiles `jewel_*` en despliegue.
5. **No se aceptan cambios destructivos sin revisión** — deletes masivos, snapshot push, downgrades de CORS, eliminación de headers `x-ghl-*`.
6. **Artefactos generados** — preferir `npm run scan:ghl-api` post-merge sobre resolver conflictos en JSON/TS generados a mano.
7. **Historias no relacionadas** — cualquier merge requiere aprobación explícita y plan de rollback.

---

## Comandos de auditoría (ejecutados Fase 1B)

```bash
git fetch upstream                    # sin merge
git log --oneline HEAD..upstream/main
git log --oneline upstream/main..HEAD
git diff --stat upstream/main HEAD  # dos puntos (válido sin merge-base)
git diff --name-only upstream/main HEAD
```

**No ejecutar sin aprobación:**

```bash
git merge upstream/main
git rebase upstream/main
git merge upstream/main --allow-unrelated-histories
```

---

## Fases siguientes

| Fase | Objetivo |
| --- | --- |
| **1C** | Cherry-pick o patch selectivo de commits upstream (`bfc2bbe`, `d830668`, `e80faeb`, `29f0a12`); alinear `package-lock.json`; scripts npm faltantes |
| **1D** | Implementar perfiles `jewel_readonly` / `jewel_operator` en registry |
| **Merge** | Solo tras checklist de archivos protegidos y smoke HTTP multi-tenant |

---

## Checklist pre-merge (futuro)

- [ ] `src/main.ts` conserva CORS Vercel y headers `x-ghl-*`
- [ ] `README.md` y `package.json` mantienen branding JEWEL
- [ ] `docs/ARCHITECTURE.md` y `docs/TOOL-PROFILES.md` intactos o extendidos
- [ ] `.gitignore` conserva patrones defensivos Fase 1A
- [ ] `npm run scan:ghl-api` ejecutado y artefactos commiteados
- [ ] Tests upstream importados pasan
- [ ] `GHL_TOOL_PROFILE` default de producción ≠ `full`
