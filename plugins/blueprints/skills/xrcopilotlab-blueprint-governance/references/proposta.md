# Dalla superficie alla proposta

Ogni riga della superficie (`assets/superficie.py`) porta a una scelta. La tabella dice **quale** e **perché**: il
perché va scritto nella proposta accanto a ogni voce, con le parole di chi la legge (l'AI Team, poi il cliente).

## I punti di controllo che la governance vede oggi

| Operazione | Attributi su cui una regola può decidere | Che cosa NON vede |
|---|---|---|
| `tool.invoke` | `tool_name`, `tool_provider`, `agent_id`, `actor_kind` | l'host del server MCP: un tool MCP si governa **per nome** |
| `action.email` | `recipient_domain`, `recipient_count`, `action_provider`, `agent_id` | il testo della mail |
| `action.webhook` | `host`, `http_method`, `action_provider`, `agent_id` | il corpo della chiamata |
| `action.script` | `action_provider`, `agent_id` | che cosa fa lo script |

**Le skill degli agenti oggi non passano dalla governance** (#1701): un agente con `skills:` produce file e
contenuti senza che una regola li veda. Non si scrive una regola per loro: si dice nella proposta, fra i limiti.

**Le risposte in chat non sono azioni**: un agente aperto alle persone che non chiama tool e non manda niente non
ha regole da proporre, ha una **scheda** (classificazione `people_facing`).

## Le regole di base valgono già

Su ogni tenant con la governance accesa valgono le regole di base Hevolus (`Templates/spike.yaml`), per tutti gli
agenti: ogni chiamata, email, webhook e script finisce nel registro; i tool con un nome da cancellazione sono negati,
quelli con un nome da scrittura avvisano; i webhook `DELETE` sono negati; le email a più di 20 destinatari avvisano.
La proposta **non le ripete**: aggiunge solo ciò che il blueprint ha di suo.

## Dalla superficie alla scelta

| Nella superficie | Proposta | Perché (da scrivere così, adattato) |
|---|---|---|
| Email verso **domini esterni** (indirizzi, variabili) | regolamento `perimetro-comunicazioni`, e una regola che **completa** `perimetro-comunicazioni-destinatari-fuori-perimetro` con i domini ammessi | «Le email partono da sole: il perimetro dice a chi possono arrivare, e un destinatario fuori elenco si vede nel registro prima di diventare un'abitudine.» Domanda al cliente: **quali domini**. |
| Email solo a **ruoli o utenti del tenant** (`role:`, `user:`) | nessun regolamento; una nota | I destinatari sono persone del cliente: il perimetro non aggiunge niente. Basta il registro delle regole di base. |
| Webhook verso **sistemi esterni** (host) | regolamento `uscite-di-rete`, e una regola che completa `uscite-di-rete-host-fuori-elenco` con gli host delle connessioni del manifest | Gli host li dichiara già il manifest: sono i soli verso cui il blueprint deve chiamare. |
| Webhook verso **un processo del blueprint** (`processes.<chiave>.webhook`) | nessuna regola | È una chiamata dentro il tenant, che il blueprint stesso ha creato. |
| Tool MCP che **scrivono** (`POST`, `PUT`, `PATCH`, `DELETE`) su un sistema **del cliente** | una regola `tool.invoke` con `tool_name in [...]`, `warn` di norma, `deny` per ciò che cancella o non si può annullare; `agent:` l'agente che li usa | Le regole di base guardano il nome del tool: quelli del blueprint non sempre lo dicono (`prenota`, `disdici`). Si nominano. |
| Tool MCP che scrivono **dentro il tenant** (un processo, un foglio di lavoro del blueprint) | nessuna regola, o `log` | Il danno resta nel tenant ed è nel registro. |
| Agent task con `trigger: scheduled` o `webhook` che **mandano qualcosa fuori** | la regola dell'uscita con `agent:` l'agent task, un gradino più severa (`warn` → `deny` per i domini, `log` → `warn` per gli host) | Nessuno lo guarda mentre agisce: il primo controllo è la regola. |
| Agente con `chatEndpoints` o `embed` | scheda `systems.<agente>` con `classification: people_facing` | Parla con persone fuori dal team: la scheda lo dice a chi controlla. |
| Agente che **propone una decisione su una persona** in un ambito dell'Allegato III dell'AI Act (merito di credito di persone fisiche, prezzo di assicurazioni vita e salute, valutazione di studenti o candidati, accesso a servizi pubblici essenziali) | scheda con `classification: high_risk` **proposta come domanda**, mai decisa dalla skill | La classificazione la decide l'AI Team con il cliente. La skill dice perché la solleva. |
| Ogni altro agente con tool o uscite | scheda `systems.<agente>` con `classification: internal`, `purpose` dalla `description`, `alternative` (la procedura senza l'agente) | Chi controlla trova lo scopo di ogni agente senza leggere le istruzioni. |
| Dati personali (nomi, pratiche, pazienti, studenti, clienti) | regolamento di riferimento `riferimento-gdpr` | Raccoglie in un posto le regole Hevolus che citano il GDPR: evidenze, non conformità. |
| Azioni che una persona deve poter fermare (cancellare, pubblicare, pagare) | regolamento di riferimento `riferimento-ai-act`, ristretto con `agents:` agli agenti che le fanno | Raggruppa le regole sul controllo umano. |
| Tool che leggono fonti aperte (web, normative) | regolamento di riferimento `riferimento-owasp` sugli agenti che le leggono | I rischi tipici sono i contenuti che arrivano dall'esterno. |

Regolamenti di riferimento `riferimento-soc2` e `riferimento-cis` si propongono solo se il cliente li chiede (un
audit SOC 2, un programma CIS): non aggiungono controlli, raggruppano evidenze.

## Modello del catalogo o blueprint di un cliente

| | Modello del catalogo | Blueprint su un tenant del cliente |
|---|---|---|
| `owner` | **mai**: lo indica chi installa | l'email di un **amministratore del tenant**, data dal cliente (`BP170`) |
| `ownerNotices` | assente | `denies` di norma; `all` se il cliente vuole anche gli avvisi |
| Domini ammessi, host di sistemi del cliente | **assenti**: il piano di chi installa li dice «da completare» (`BP156`) | dal cliente, con `completes` |
| Host di servizi pubblici del modello (`api.linkedin.com`, `graph.microsoft.com`) | sì, con `completes` | sì |
| `systems` | sì, generici | sì, con l'alternativa del cliente |
| `publish` | `true` | `true`, ma il piano si ferma se il tenant ha modifiche di governance non pubblicate di altri |

## Forma della proposta

Per ogni voce: **che cosa** (in YAML, pronto per `governance:`), **perché** (una frase), **domanda** (se serve un
valore del cliente). In fondo: i **limiti** (skill fuori governance, risposte in chat non controllate, ciò che il
punto di controllo non vede) e il **piano di collaudo** (§5 della skill). Nessuna voce dice «conforme», «a norma»,
«certificato»: la governance dà evidenze.
