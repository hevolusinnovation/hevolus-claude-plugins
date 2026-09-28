# Il registro degli scenari già realizzati

Le schede qui sotto sono **già anonime**: si copiano nel brief così come sono, nella forma breve, e
si aggiornano qui quando uno scenario cambia. Per te, non per l'agenzia, ogni voce ha la fonte e i
mattoni ([`scenari.md`](scenari.md)).

Aggiornato al **28/09/2026**.

| Scenario | Stato | Fonte (solo per te) | Mattoni |
|---|---|---|---|
| Agenda e scadenze di uno studio legale | Realizzato per un cliente | `blueprints/studiopolis-agenda.yml`, `hevolus-assessment/customers/studiopolis/` | M-POSTA, M-CALENDARIO, M-CHAT, M-PRATICA, M-CONTROLLO |
| Conoscere un'azienda in una domanda | Realizzato per un cliente | `blueprints/como-conoscenza-associati.yml`, `hevolus-assessment/customers/confindustria-como/` | M-CHAT, M-ARCHIVIO, M-RICERCHE, M-FONTI-PUBBLICHE, M-MAPPA |
| Il bilancio del gruppo dai libri giornale | Realizzato per un cliente | `blueprints/finlogic-bilancio-aggregato.yml`, `hevolus-assessment/customers/finlogic/` | M-CHAT, M-ARCHIVIO, M-CONTI |
| Assistente legale sul diritto italiano | Pronto da installare | `blueprints/catalogo/legal-suite.yml` (branch della #1185 finché non è in `main`; nel catalogo di staging), `hevolus-assessment/customers/hevolus-legal/` | M-CHAT, M-ARCHIVIO, M-RICERCHE, M-FONTI-PUBBLICHE, M-TESTI-LEGALI |

Non sono scenari, e non vanno nel brief: `blueprints/test-agenda.yml` e
`blueprints/marketing-campagne.yml` sono manifest di prova dei costrutti, non applicati per un
cliente.

---

## Agenda e scadenze di uno studio legale

**Titolo** — La comunicazione arriva, la pratica è già pronta, l'udienza è in calendario
**Per chi** — studi legali associati, da 20 professionisti in su · decide il socio che coordina
l'organizzazione · lo usano la segreteria dell'agenda, i referenti e gli avvocati.
**Il problema di oggi** — Le comunicazioni di cancellerie e colleghi arrivano in una casella e una
persona le ricopia in agenda. L'assegnazione si decide in riunione e resta sulla carta; i rinvii
mancanti vivono nelle bozze di qualcuno.
**Com'è dopo** — Ogni comunicazione, o una frase dettata al telefono, diventa una pratica con i dati
già letti. La referente verifica e sceglie chi ci va; l'udienza compare nel calendario comune;
l'esito si scrive una volta sola, e un rinvio riapre la pratica da solo.
**Come funziona** — 1. arriva la mail, la PEC o il dettato · 2. l'assistente prepara la pratica ·
3. la referente verifica e assegna · 4. l'udienza entra nel calendario comune; dopo l'udienza il
professionista scrive l'esito.
**Dove decide la persona** — Niente entra in calendario senza la verifica della referente; chi va
in udienza lo decide lei; i termini li scrive il professionista.
**Il messaggio** — Nessuno ricopia più un'udienza, e ogni sera sapete di quali udienze non si sa
ancora niente.
**Fatti citabili** — la casella si legge ogni minuto · ogni sera alle 18:30 il riepilogo delle
udienze del giorno senza esito · ogni venerdì posta e calendario si confrontano da soli · in due
settimane l'ambiente è stato migliorato 32 volte, un pezzo alla volta.
**Da non dire** — «legge il contenuto dei PDF allegati» · «calcola i termini processuali» ·
«funziona con Gmail o con il calendario Google» · «risponde alla cancelleria».

## Conoscere un'azienda in una domanda

**Titolo** — Chiedete di un'azienda, e in pochi minuti avete la sua scheda completa
**Per chi** — associazioni di imprese, e chiunque debba conoscere bene un'azienda prima di
incontrarla · decide la direzione · lo usano gli uffici che seguono le aziende.
**Il problema di oggi** — Ciò che si sa di un'azienda è sparso: il gestionale interno, il sito, il
registro europeo delle partite IVA, i social, dossier e bilanci in archivio. Prepararsi a un incontro
vuol dire aprire tutto, uno per uno.
**Com'è dopo** — Si scrive il nome in chat. Partono insieme le ricerche su tutte le fonti, e torna una
scheda sola, per temi, con la fonte di ogni informazione, la sede sulla mappa e ciò che manca.
**Come funziona** — 1. si chiede in chat · 2. l'assistente trova l'azienda nei vostri dati, e se il
nome è ambiguo chiede quale · 3. le ricerche partono tutte insieme · 4. un assistente scrive la
scheda, e si può continuare a chiedere.
**Dove decide la persona** — Fra nomi simili sceglie la persona; la scheda è un punto di partenza, e
che cosa farne lo decide chi la legge.
**Il messaggio** — Tutto ciò che si sa di un'azienda, in un testo solo, e con scritto che cosa manca.
**Fatti citabili** — la scheda arriva in circa tre minuti (misurato in demo) · sei ricerche partono
nello stesso momento · ogni informazione dice da dove viene.
**Da non dire** — «dà un rating o un giudizio di affidabilità» · «cerca fra tutte le aziende di un
settore» · «si collega al vostro gestionale» · «legge i post dei social».

## Il bilancio del gruppo dai libri giornale

**Titolo** — Il bilancio del gruppo si chiede in una frase, dai libri giornale delle società
**Per chi** — gruppi con molte società e gestionali diversi · decide il direttore amministrativo o il
CFO · lo usano l'amministrazione e il controllo di gestione.
**Il problema di oggi** — Ogni mese i bilanci di verifica delle società si riportano a mano su un
piano dei conti comune, con un file di corrispondenze da tenere aggiornato. Giorni di lavoro
qualificato spesi a ricopiare, non ad analizzare.
**Com'è dopo** — Si caricano i libri giornale e il file delle corrispondenze che l'azienda ha già. In
chat si chiede il prospetto per il perimetro che serve, e i conti che non tornano sono elencati a
parte, con una proposta da confermare.
**Come funziona** — 1. si caricano i libri giornale e le corrispondenze · 2. un assistente li porta su
un tracciato comune · 3. un secondo li riporta sul piano dei conti del gruppo · 4. un terzo somma sul
perimetro chiesto.
**Dove decide la persona** — I conti senza corrispondenza li conferma l'amministrazione; una rettifica
entra solo se motivata.
**Il messaggio** — Cambiare perimetro è una frase, non un file da rifare.
**Fatti citabili** — si parte dal file di corrispondenze che l'azienda ha già · il dettaglio resta: da
una voce si scende alle registrazioni.
**Da non dire** — «fa il consolidato» (è l'aggregato: le partite fra società del gruppo non si
elidono) · «si collega al gestionale» · «spiega gli scostamenti».

## Assistente legale sul diritto italiano

**Titolo** — Ricerca, analisi e bozze legali, con le fonti accanto
**Per chi** — studi legali, uffici legali d'impresa, società di consulenza · decide il responsabile
legale · lo usano avvocati e giuristi.
**Il problema di oggi** — Una ricerca su legge e giurisprudenza vuol dire interrogare più banche dati
pubbliche una alla volta; un contratto si rilegge clausola per clausola; una bozza si parte ogni
volta da capo.
**Com'è dopo** — Si pone la domanda in chat: la ricerca parte sulle fonti pubbliche e torna un memo con
i riferimenti. Nello stesso ambiente si analizza un contratto, si mette alla prova una posizione, si
prepara una bozza, si traduce in inglese.
**Come funziona** — 1. si scrive la domanda o si incolla il testo · 2. la domanda viene ripulita dai
dati personali · 3. le ricerche partono sulle fonti · 4. torna un memo, una bozza o un'analisi, fase
per fase.
**Dove decide la persona** — Fra una fase e l'altra decide l'avvocato se proseguire; ogni risultato è
materiale di supporto per un professionista.
**Il messaggio** — Il lavoro di preparazione lo fa l'assistente, il parere resta dell'avvocato.
**Fatti citabili** — cerca sulla legge nazionale, sulla Cassazione e sul diritto europeo · quando
una fonte non restituisce il testo, lo dice e dà il
rimando al portale ufficiale.
**Da non dire** — «citazioni verificate» (si controlla la forma, non sempre l'esistenza della
decisione) · «caricate il documento» (oggi si incolla il testo) · «protegge i dati sensibili dei
clienti» (oggi va usato su casi anonimizzati) · «è una consulenza legale» · «cerca anche su TAR, Consiglio di Stato e Corte Costituzionale».
