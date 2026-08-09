# JEWEL GHL MCP Server 💎

**Claude construye, clona, adapta y despliega **todo** tu ecosistema de GoHighLevel en lenguaje natural.**

El copiloto definitivo para agencias y consultores que quieren dejar de perder horas en la UI de GHL.

## ¿Qué es JEWEL GHL?

JEWEL GHL convierte a **Claude** en tu mentor personal de GHL.  
Dile en español normal y Claude lo hace completo:

- “Clona el workflow de follow-up de dentistas y adáptalo para gimnasios con membresías recurrentes”
- “Crea una secuencia completa de email marketing para leads de Meta Ads”
- “Diseña y publica una landing page de high-conversion para encuestas de satisfacción”
- “Automatiza todo el flujo de Meta → Landing → Encuesta → Pipeline”

**Áreas que domina JEWEL GHL:**
- **Workflows & Automatizaciones** (el foco principal y lo que más duele)
- **Snapshots** completos (clonación y adaptación)
- **Meta Ads** + automatizaciones de Facebook/Instagram
- **Landing Pages / Funnels / Websites**
- **Email Marketing** (secuencias, broadcasts, templates)
- **Encuestas, Forms y Quizzes**
- Pipelines, Agent Studio, calendarios, SMS, voice, etc.

## Características actuales

- **834 tools MCP** (la mayor cobertura del mercado)
- Soporte completo para **workflows, snapshots, Meta, landings, email marketing y encuestas**
- Transports: stdio + Streamable HTTP + SSE (funciona en Claude Desktop, Web y Móvil)
- Preparado para multi-tenant SaaS (Next.js + Supabase)
- Enfoque estratégico: automatizaciones + flujos completos de adquisición y retención
- Daily auto-update con la API oficial de GHL

## Multi-tenant Architecture

JEWEL GHL soporta dos modos de credenciales, controlados por `REQUIRE_TENANT_HEADERS` en Railway:

- **Single-tenant** (`REQUIRE_TENANT_HEADERS=false`, default): `GHL_API_KEY` y `GHL_LOCATION_ID` salen de las variables de entorno de Railway. Una sola credencial por proceso — útil para desarrollo y uso propio.
- **Multi-tenant** (`REQUIRE_TENANT_HEADERS=true`): cada request a `/mcp` o `/execute` debe traer las credenciales del cliente por header (`x-ghl-access-token`, `x-ghl-location-id`). Un solo MCP corriendo en Railway sirve a múltiples subcuentas de GHL sin mezclar datos entre clientes.

**Flujo por cliente en modo multi-tenant:**

```
Cliente A → su API Key + Location ID → MCP → GHL subcuenta A
Cliente B → su API Key + Location ID → MCP → GHL subcuenta B
```

**Perfil de tools recomendado en producción SaaS:** `GHL_TOOL_PROFILE=jewel_operator` (417 tools) para el flujo completo, o `curated` (43 tools) para un MVP más acotado.

**Nota sobre `GHL_API_VERSION`:** siempre `2023-02-21` — es el header `Version` oficial actual de HighLevel, no el año del proyecto. Nunca lo cambies a la fecha actual.

## Instalación rápida (para desarrollo)

```bash
git clone https://github.com/LEANDRO140514/jewel-ghl-mcp.git
cd jewel-ghl-mcp
npm install
cp .env.example .env
# Edita .env con tus credenciales GHL
npm run build
npm run start:stdio
