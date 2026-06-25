# Tests upstream en cuarentena

Estos tests provienen del upstream [BusyBee3333/Go-High-Level-MCP-2026-Complete](https://github.com/BusyBee3333/Go-High-Level-MCP-2026-Complete) y se portaron en Fase 1C.

## Por qué están aquí

Están en cuarentena porque validan CLI, scripts y configuración que **JEWEL aún no ha portado**:

- Flags avanzados de `scripts/ghl-mcp.mjs` (`--write`, `--profile`, `--json` extendido)
- Scripts npm de onboarding upstream (`setup`, `connect`, `first-run`, `reset-local`, …)
- Convenciones de `.env.example` upstream (`MCP_SERVER_PORT`, `GHL_API_VERSION=2023-02-21`)
- Documentación y CI de onboarding BusyBee

No se eliminan: sirven como **contrato futuro** para cuando el motor JEWEL absorba esas capacidades de forma controlada.

## Cómo ejecutarlos manualmente (opcional)

Jest los excluye vía `testPathIgnorePatterns` en `jest.config.js`. Para correr uno aislado:

```bash
npx jest tests/upstream-pending/scripts/ghl-mcp-cli.test.ts --testPathIgnorePatterns=[]
```

Esperado: fallos hasta completar el port del CLI.

## Condiciones de reactivación

Volverán a `tests/scripts/` cuando:

1. **`scripts/ghl-mcp.mjs`** tenga los flags y comandos upstream necesarios (sin perder aliases JEWEL).
2. **`package.json`** tenga los scripts definitivos acordados (no solo alias parciales).
3. **`.env.example` y versión de API** estén decididos para JEWEL (no copia ciega de upstream).
4. **Docs de onboarding** (`AGENT_SETUP.md`, `QUICKSTART.md`, etc.) estén adaptadas a identidad JEWEL.

Tras mover de vuelta, quitar la entrada `/tests/upstream-pending/` de `testPathIgnorePatterns` y actualizar `docs/UPSTREAM-SYNC.md`.

## Archivos en cuarentena

| Archivo | Valida |
| --- | --- |
| `scripts/ghl-api-coverage-generation.test.ts` | Pipeline de cobertura API y lock de fuentes |
| `scripts/ghl-live-smoke.test.ts` | Script `ghl-live-smoke.mjs` |
| `scripts/ghl-mcp-cli.test.ts` | CLI onboarding upstream |
| `scripts/onboarding-docs.test.ts` | Scripts npm, `.env.example`, docs y Docker |
