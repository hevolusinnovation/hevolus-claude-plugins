# Fonti dati italiane ricorrenti — vie di accesso per gli MCP

Riferimento verificato (luglio 2026) per non rifare la ricerca da zero. Aggiorna alla data
dell'assessment se necessario: prezzi e listini cambiano.

## Registro Imprese / InfoCamere → `registro-imprese-mcp`

Gestito da InfoCamere (portali registroimprese.it / italianbusinessregister.it). Non esiste
un'API pubblica gratuita: l'accesso è a pagamento. Tre vie:

- **Via A — InfoCamere ABDO (ufficiale).** `accessoallebanchedati.registroimprese.it/abdo`
  espone i documenti Telemaco in JSON. Auth **SPID/CIE/CNS + credito Telemaco**, pay-per-documento.
  Criticità per un MCP: SPID è auth **interattiva umana**, non machine-to-machine → verificare se
  esiste una credenziale applicativa. Adatta a enrichment **on-demand**, non massivo.
- **Via B — Reseller REST (di solito la più pratica per un MCP).** openapi.it, bizapis.com,
  registroapi.it, Cerved re-espongono i dati via REST/JSON con **API key** (machine-to-machine).
  Perfetto per il vincolo "MCP = URL + API key". Verificare licenza sull'uso derivato dei dati e costi.
- **Via C — PDND.** Interoperabilità OAuth2+PKCE, ma di fatto riservata alle Pubbliche
  Amministrazioni (principio "once-only"). Un ente privato difficilmente è fruitore ammissibile.
  Da escludere salvo convenzione specifica.

Esito tipico: 🟢 Via B (o ABDO con credenziale applicativa) → `lookup_company(vat|cf)`,
`search_company`. 🟡 solo ABDO/SPID → on-demand con budget per-visura. 🔴 nessun contratto →
open data parziali o inserimento manuale.

GDPR: i dati d'impresa in gran parte non sono personali, ma soci/titolari/cariche (persone
fisiche) sì → DPIA + minimizzazione.

## Cribis / CRIF → `cribis-mcp`

CRIBIS è del Gruppo CRIF, che espone un developer portal (`developer.crif.com`) con auth
**machine-to-machine** — canale developer-friendly, a differenza di ABDO.

- **API mirata: Margò** (`developer.crif.com/apis/margo`) — dati su 6M+ imprese con data packet
  flessibili (anagrafica/registro, bilanci, open data, marketing/analytics), ricerca per
  P.IVA/CF, posizionata come *"enrich your CRM database with completed and updated company data"*:
  coincide con l'obiettivo tipico "profili aziendali arricchiti".
- Alternative: *Report Impresa* CRIBIS via API/A2A (più orientato a rischio/credito); visure
  CRIF via reseller (openapi.com).

Esito tipico: 🟢 onboarding Margò → `enrich_company(vat|cf)`. 🟡 solo abbonamento web o data
packet costoso → enrichment on-demand. 🔴 nessuna API → fallback su registro-imprese-mcp + web.

Nota: gli agenti devono funzionare anche **senza** Cribis (degradazione graziosa). Margò e
Registro Imprese sono in parte ridondanti sull'anagrafica di base → scegliere una fonte primaria
e una di verifica in base a costo e ricchezza dei campi.

## Come valutare una fonte nuova (non in questo elenco)

1. Cerca il **developer portal ufficiale** del fornitore.
2. Determina il tipo di **auth**: machine-to-machine (API key/OAuth) = fattibile per un MCP;
   interattiva (SPID/CIE/login umano) = problematica, valuta reseller o modalità on-demand.
3. Verifica **formato** (REST/JSON preferibile), **quota/costo** (impatta l'uso massivo vs
   on-demand) e **licenza** sull'uso derivato/indicizzazione dei dati.
4. Esegui un **test reale**: una chiamata per una entità nota, controlla campi e latenza.
