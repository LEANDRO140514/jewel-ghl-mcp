# Manual de Usuario — Cursor + JEWEL GHL MCP

Documento operativo para uso controlado de Cursor como consola de ingeniería sobre GoHighLevel.  
Complementa [ARCHITECTURE.md](./ARCHITECTURE.md) y [TOOL-PROFILES.md](./TOOL-PROFILES.md).

---

## 1. Propósito del manual

Este manual define **cómo usar Cursor de forma segura y disciplinada** mientras se audita, aprende y asiste la configuración de GoHighLevel (GHL).

Cursor es una **consola técnica temporal**:

- Para entender cómo está armado GHL en campo.
- Para documentar patrones que luego alimentarán **jewel-ghl** (SaaS futuro).
- Para ejecutar lecturas y diagnósticos **con reglas**, no improvisación.

Cursor **no reemplaza**:

- GHL como CRM operacional.
- La SaaS futura como producto comercial.
- El criterio humano de aprobación.

Si no está en este manual o en un runbook aprobado, **no se hace**.

---

## 2. Principio rector

**GHL es el frontend operacional único.**

Todo insight que afecte operación comercial debe terminar **visible en GHL**, no solo en chat, Supabase o notas internas:

| Destino en GHL | Uso |
| --- | --- |
| **Note** | Contexto, hallazgos, resúmenes |
| **Task** | Siguiente acción con responsable |
| **Custom Field** | Señal estructurada (score, etapa, flags) |
| **Opportunity Note** | Contexto ligado a un deal de admisión |
| **Señal visible mínima** | Cualquier artefacto que el equipo vea sin abrir otra app |

**Cursor no es CRM.**  
**Cursor no es operación diaria.**  
**Cursor no es fuente de verdad.**

---

## 3. Componentes

| Término | Definición |
| --- | --- |
| **Cursor** | IDE con agente IA. Consola de ingeniería, aprendizaje y asistencia controlada. |
| **jewel-ghl-mcp** | Motor soberano de herramientas GHL (`C:\dev\jewel-ghl-mcp`). Expone tools MCP vía stdio. |
| **jewel-ghl-readonly** | Entrada MCP en Cursor. Servidor stdio con perfil restrictivo. |
| **GHL_API_KEY** | Private Integration Token (PIT) de GHL. Secreto — solo en `mcp.json` local o gestor de secretos. |
| **GHL_LOCATION_ID** | Identificador de subcuenta/location. Debe coincidir siempre con el token. |
| **GHL_TOOL_PROFILE** | Variable que filtra tools visibles. En Cursor: `jewel_readonly`. |
| **Subcuenta / Location** | Unidad operativa en GHL (cliente, campus, entorno). |
| **Sandbox** | Cuenta o location de laboratorio. Datos ficticios o desechables. |
| **Cuenta real** | Producción o semi-producción con datos reales. Máxima cautela. |
| **Cuenta de cliente** | Location de un cliente en operación. Cursor no es canal habitual. |
| **Nivel 4 — Puente de Aprendizaje Gestionado** | Modo del arquitecto: aprender en campo con reglas estrictas antes de productizar en SaaS. |

**InsForge / Supabase** = estado técnico (tokens, logs, tenants). **No** es frontend comercial.

---

## 4. Configuración MCP en Cursor

### Archivo global

```
C:\Users\vonde\.cursor\mcp.json
```

### Entrada recomendada (fusionar, no reemplazar archivo completo)

```json
{
  "mcpServers": {
    "jewel-ghl-readonly": {
      "command": "node",
      "args": ["C:/dev/jewel-ghl-mcp/dist/server.js"],
      "env": {
        "GHL_API_KEY": "REPLACE_WITH_PRIVATE_INTEGRATION_TOKEN",
        "GHL_LOCATION_ID": "REPLACE_WITH_LOCATION_ID",
        "GHL_BASE_URL": "https://services.leadconnectorhq.com",
        "GHL_API_VERSION": "2021-07-28",
        "GHL_TOOL_PROFILE": "jewel_readonly"
      }
    }
  }
}
```

### Reglas de instalación

1. **No pegar este JSON encima del archivo completo.** Fusionar solo el bloque dentro de `mcpServers`.
2. **Preservar** servidores existentes (`insforge`, `obsidian-vault`, etc.).
3. **No borrar InsForge ni Obsidian.**
4. **Siempre hacer backup** antes de editar.
5. Compilar el motor antes: `npm run build` en `C:\dev\jewel-ghl-mcp`.
6. Referencia adicional: [`cursor-mcp-config.example.json`](../cursor-mcp-config.example.json).

### Backup

```powershell
Copy-Item "$env:USERPROFILE\.cursor\mcp.json" "$env:USERPROFILE\.cursor\mcp.json.bak"
```

Con timestamp (recomendado):

```powershell
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item "$env:USERPROFILE\.cursor\mcp.json" "$env:USERPROFILE\.cursor\mcp.json.backup-$ts"
```

### Validación JSON

```powershell
node -e "JSON.parse(require('fs').readFileSync(process.env.USERPROFILE + '/.cursor/mcp.json','utf8')); console.log('mcp.json OK')"
```

Tras editar: reiniciar Cursor o recargar servidores MCP.

---

## 5. Admisión de API KEY y Location ID

Antes de conectar cualquier cuenta a Cursor, completar este flujo:

1. **Identificar** la subcuenta GHL (nombre visible en UI).
2. **Confirmar** el nombre con el responsable de la cuenta.
3. **Copiar** el Location ID (Settings → Business Profile o URL de location).
4. **Crear o seleccionar** un Private Integration Token con scopes mínimos para el nivel declarado.
5. **Verificar** que el token pertenece a **esa misma** Location (no mezclar).
6. **Clasificar** la cuenta por nivel (1–4) antes de usarla.
7. **Registrar** la cuenta en la tabla de control (plantilla abajo).
8. **Nunca** mezclar token de una subcuenta con Location ID de otra.
9. **Nunca** usar producción como sandbox.

### Plantilla — registro de cuenta

```
Nombre de subcuenta:
Location ID:
Tipo de cuenta:        [ sandbox | real | cliente ]
Nivel:                 [ 1 | 2 | 3 | 4 ]
Token creado por:
Fecha:
Propósito:
Permitido:
Prohibido:
Perfil MCP:            jewel_readonly (salvo excepción documentada)
Responsable:
Notas:
```

---

## 6. Niveles de uso

### Nivel 1 — REAL READONLY

Para cuentas reales o semi-reales que **solo se observan**.

| Campo | Valor |
| --- | --- |
| Perfil permitido | `jewel_readonly` |

**Permitido:** metadata mínima, overview de location, lectura de configuración general con aprobación explícita.

**Prohibido:** contactos, oportunidades, conversaciones, workflows profundos, snapshots, campañas, cualquier write.

---

### Nivel 2 — SANDBOX

Para laboratorio controlado.

**Uso:** snapshots demo, workflows demo, pipelines demo, formularios, custom fields, pruebas, smoke tests.

| Campo | Valor |
| --- | --- |
| Perfil inicial | `jewel_readonly` |
| Writes | Solo con runbook y aprobación explícita |

---

### Nivel 3 — PRODUCTION CLIENT

Cliente real en operación estable.

**Regla:** Cursor **no** es el canal normal de operación. La operación vive en GHL y, en el futuro, en jewel-ghl SaaS.

**Permitido:** auditoría con aprobación, diagnóstico controlado.

**Prohibido:** cambios directos sin runbook, bulk updates, mensajes, pagos, workflow triggers.

---

### Nivel 4 — PUENTE DE APRENDIZAJE GESTIONADO

Nivel especial del arquitecto. Aplica a:

- Cuentas propias.
- Clientes personales.
- Cuentas reales controladas.
- Cuentas usadas para aprendizaje extremo antes de dar acceso a la SaaS.

**Objetivo:**

- Aprender patrones reales en GHL.
- Auditar en campo.
- Documentar problemas.
- Convertir experiencia en snapshots, workflows, checklists y features de JEWEL SaaS.

| Campo | Valor |
| --- | --- |
| Perfil inicial | `jewel_readonly` |

**Permitido:** auditoría, diagnóstico, lectura controlada, diseño de mejora, documentación, preparación de cambios en sandbox.

**Prohibido:**

- Experimentar destructivamente.
- Usar `full`, `raw` o `jewel_operator` desde Cursor.
- Enviar SMS/email.
- Borrar datos.
- Bulk actions.
- Payments/rebilling.
- Activar/desactivar workflows sin runbook.

**Regla de oro:**

> Cursor analiza.  
> El humano aprueba.  
> GHL muestra.  
> La lección se documenta.  
> La SaaS futura absorbe el patrón.

---

## 7. Flujo de trabajo por intervención

Cada intervención en Cursor + GHL debe seguir esta secuencia:

1. Declarar **subcuenta**.
2. Declarar **Location ID**.
3. Declarar **nivel** (1–4).
4. Declarar **objetivo** (una sola intención).
5. Declarar **perfil MCP** (`jewel_readonly` por defecto).
6. Confirmar **prohibiciones** del nivel.
7. Ejecutar **una sola tool** si aplica.
8. Revisar resultado.
9. Documentar hallazgo.
10. Definir si el insight debe escribirse en GHL (GHL-first).
11. Crear lección aprendida o patrón reusable.

Sin los pasos 1–6, **no se ejecuta ninguna tool**.

---

## 8. Plantilla de intervención

```
Fecha:
Cuenta:
Location ID:
Nivel:
Objetivo:
Perfil usado:
Tools autorizadas:
Tools ejecutadas:
Resultado:
Riesgo detectado:
Acción recomendada:
¿Debe quedar visible en GHL?  Sí / No
Dónde se registró:
Lección aprendida:
Patrón reusable:
Feature candidata para SaaS:
```

---

## 9. Reglas de seguridad

| # | Regla |
| --- | --- |
| 1 | No imprimir tokens en chat, commits ni capturas. |
| 2 | No commitear `.env` ni `mcp.json` real. |
| 3 | No usar perfil `full`. |
| 4 | No usar perfil `raw`. |
| 5 | No usar `jewel_operator` en Cursor. |
| 6 | No ejecutar más de una tool sin aprobación explícita. |
| 7 | No tocar contactos reales sin permiso documentado. |
| 8 | No tocar oportunidades reales sin permiso documentado. |
| 9 | No enviar mensajes desde Cursor. |
| 10 | No activar workflows desde Cursor. |
| 11 | No modificar snapshots desde Cursor. |
| 12 | No tocar pagos ni rebilling. |
| 13 | No tocar SaaS mode / configuración de agencia sin runbook. |
| 14 | No mezclar subcuentas (token ↔ Location ID). |
| 15 | No llamar a GHL sin clasificar la cuenta primero. |

---

## 10. Pruebas permitidas

### Primera prueba — inventario (sin GHL)

- Verificar que `jewel-ghl-readonly` está conectado en Cursor.
- Confirmar ~387 tools con perfil readonly.
- Confirmar ausencia de tools peligrosas (`delete`, `update`, `send`, side-effects).
- **No llamar a GHL.**

### Segunda prueba — lectura mínima

- Una sola lectura de location/metadata.
- **No** contactos, oportunidades ni conversaciones.
- Cuenta clasificada y token validado.

### Tercera prueba — configuración

- Lectura de pipelines, custom fields o workflows.
- Solo si la cuenta está clasificada (Nivel 2 o 4 con aprobación).
- Documentar hallazgos en plantilla de intervención.

---

## 11. Universidad Latino — caso actual

| Campo | Valor |
| --- | --- |
| **Nombre visible** | UNIVERSIDAD LATINO |
| **Location ID** | `uPgYIVj3v4nLWNRc5SQq` |
| **Clasificación actual** | Nivel 4 — Puente de Aprendizaje Gestionado *(o Nivel 1 — Real Readonly si aún no hay autorización de intervención)* |

### Uso permitido inicial

- Perfil: `jewel_readonly`
- Lectura mínima y auditoría gradual
- Diseño de admisiones (documentación, no writes)
- **Sin writes** hasta runbook aprobado

### Contexto operativo

Esta cuenta recibirá leads de admisiones. El tratamiento debe diseñarse usando artefactos nativos de GHL:

- Contact
- Opportunity
- Pipeline
- Conversations
- Tasks
- Notes
- Custom Fields
- Tags controlados
- Workflows simples

El diseño se documenta en GHL y en este repositorio; la ejecución masiva queda para sandbox o SaaS futura.

---

## 12. Tratamiento de leads en GHL

| Artefacto GHL | Rol |
| --- | --- |
| **Contacto** | Persona (identidad, datos de contacto) |
| **Opportunity** | Proceso de admisión (deal en pipeline) |
| **Pipeline** | Tablero operativo de etapas |
| **Conversation** | Comunicación (SMS, email, WA) |
| **Task** | Siguiente acción humana |
| **Note** | Contexto libre del equipo |
| **Custom Field** | Dato estructurado (score, carrera, beca) |
| **Tag** | Segmentación — **no** sustituye estado de pipeline |
| **Workflow** | Automatización simple y auditable |

---

## 13. Contrato de campos de admisiones

### Core

- `firstName`, `lastName`, `email`, `phone`, `tags`

### Atribución

- `fbclid`, `gclid`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `landing_source`, `first_page_seen`, `last_page_seen`
- `origen`, `lead_type`, `funnel`, `interest`, `pwa_stage`

### Test Vocacional

- `sector_principal`, `carrera_recomendada`, `match_percent`
- `lead_score`, `lead_class`, `beca_elegible`, `promedio`, `urgencia`
- `oq_resumen`, `dictamen_url`, `test_completed_at`, `test_version`

### Carreras y Beca

- `career_name`, `career_id`, `modality`, `average_range`
- `scholarship_level`, `scholarship_percent`, `enrollment_discount_percent`
- `tuition_base`, `tuition_final`, `enrollment_base`, `enrollment_final`

### WhatsApp Eva

- `wa_last_intent`, `wa_last_message_at`, `wa_needs_human`, `wa_summary`
- `wa_source`, `wa_last_inbound_text`, `wa_last_outbound_text`, `wa_stage`

### Conflicto crítico — naming

| Regla | Detalle |
| --- | --- |
| **Landing** | No usar `wa_stage`. Usar `pwa_stage` o `landing_stage`. |
| **Eva WA** | `wa_stage` reservado exclusivamente para WhatsApp Eva. |

Violaciones de naming generan datos cruzados y reportes incorrectos. Documentar y corregir en sandbox antes de producción.

---

## 14. Cierre

> **Cursor es una escuela técnica y una consola de aprendizaje gestionado.**  
> **GHL es el lugar donde vive la operación.**  
> **JEWEL SaaS nacerá de patrones reales documentados, no de suposiciones.**

---

## Referencias

- [ARCHITECTURE.md](./ARCHITECTURE.md) — mapa de productos y GHL-first
- [TOOL-PROFILES.md](./TOOL-PROFILES.md) — perfiles MCP y configuración Cursor
- [tool-profiles-audit.md](./tool-profiles-audit.md) — auditoría de exposición de tools
- [UPSTREAM-SYNC.md](./UPSTREAM-SYNC.md) — plan de sync upstream
