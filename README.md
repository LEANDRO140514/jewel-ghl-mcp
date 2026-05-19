# JEWEL GHL MCP Server 💎

**Claude construye, clona, adapta y despliega tus workflows, automatizaciones y snapshots de GoHighLevel en lenguaje natural.**

El copiloto definitivo para agencias y consultores que odian perder horas en la UI de GHL.

## ¿Qué es JEWEL GHL?

JEWEL GHL convierte a **Claude** en tu mentor personal de GHL.  
Dile en español normal:  
> “Clona el workflow de follow-up de dentistas y adáptalo para gimnasios con membresías recurrentes”  

…y Claude lo hace completo (crea workflows, snapshots, pipelines, triggers, etc.).

**Enfoque principal**: Workflows + Automatizaciones + Snapshots (exacto lo que los gurus más guardan).

**Próximamente (Fase 2)**: Integración nativa con nuestro sistema vertical de atención multicanal → la verdadera magia.

## Características actuales
- 834 tools MCP (576 endpoints oficiales de GHL + 32 tools curados de alto nivel)
- Soporte completo para **workflows, snapshots, pipelines y Agent Studio**
- Transports: stdio + Streamable HTTP + SSE
- Preparado para multi-tenant SaaS (Next.js + Supabase)
- Daily auto-update de la API oficial de GHL

## Instalación rápida (para desarrollo)

```bash
git clone https://github.com/LEANDRO140514/jewel-ghl-mcp.git
cd jewel-ghl-mcp
npm install
cp .env.example .env
# Edita .env con tus credenciales GHL
npm run build
npm run start:stdio
