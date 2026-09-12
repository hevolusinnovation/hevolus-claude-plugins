# BluePrints — manuale d'uso

Configurare un ambiente XRCopilotLab da un file, invece che a mano nell'interfaccia.

Un **blueprint** descrive in un unico file tutto ciò che serve a rendere operativo un contesto —
un cliente, un reparto, una materia: il topic, i ruoli con le persone dentro, gli agenti con le
loro istruzioni, i processi. Il plugin lo scrive con te, ti mostra cosa farebbe, e lo applica solo
dopo il tuo sì.

Non serve essere sviluppatori, non serve scaricare il codice di XRCopilotLab, e non serve
installare niente a mano.

---

## Indice

1. [Cosa ti serve prima](#1-cosa-ti-serve-prima)
2. [Installare il plugin](#2-installare-il-plugin)
3. [Il primo avvio](#3-il-primo-avvio)
3-bis. [Dove si lavora: ambiente e cliente](#3-bis-dove-si-lavora-ambiente-e-cliente)
4. [Creare un blueprint](#4-creare-un-blueprint)
4-bis. [Se il cliente ha dei documenti](#4-bis-se-il-cliente-ha-dei-documenti)
5. [I comandi, uno per uno](#5-i-comandi-uno-per-uno)
6. [Quando qualcosa non va](#6-quando-qualcosa-non-va)
7. [Cambiare un blueprint già applicato](#7-cambiare-un-blueprint-già-applicato)
8. [Aggiornare e disinstallare](#8-aggiornare-e-disinstallare)
9. [Cosa il plugin non fa](#9-cosa-il-plugin-non-fa)

---

## 1. Cosa ti serve prima

Tre cose, e due sono probabilmente già a posto.

**Claude Code.** Se stai leggendo questo manuale dentro Claude Code, ce l'hai. Altrimenti si
installa da [code.claude.com](https://code.claude.com).

**Accesso a GitHub dell'organizzazione Hevolus.** Serve per scaricare il plugin e, al primo avvio,
la CLI. Verifica così:

```bash
gh auth status
```

Se risponde che non sei autenticato, oppure se il comando `gh` non esiste:

```bash
# macOS
brew install gh && gh auth login

# Windows
winget install GitHub.cli
gh auth login
```

**Accesso ad Azure**, con due ruoli sull'utenza aziendale: *App Configuration Data Reader* e
*Key Vault Secrets User*. Non li puoi darti da solo: se non li hai, chiedili al team che gestisce
gli ambienti, indicando l'ambiente su cui devi lavorare. Il plugin ti dirà chiaramente se mancano.

Non devi installare Azure CLI: al primo comando che ha bisogno di Azure si apre il browser e ti fa
accedere. Se hai già fatto `az login` per altri motivi, il plugin usa quello e non ti chiede nulla.

---

## 2. Installare il plugin

Due righe dentro Claude Code. Il primo comando registra il catalogo dei plugin Hevolus, il secondo
installa questo.

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

Il catalogo si aggiunge una volta sola: i plugin Hevolus che arriveranno in futuro si installeranno
senza ripetere il primo comando.

Per verificare che sia attivo:

```
/plugin
```

Trovi `blueprints` fra quelli installati. Da lì si disattiva e si riattiva senza disinstallarlo.

> **Per un intero progetto.** Se vuoi che chi apre un certo repository se lo trovi già pronto,
> si dichiara nel `.claude/settings.json` di quel repository. Chiedi a chi lo mantiene, oppure
> apri una richiesta al team: è una modifica di tre righe.

---

## 3. Il primo avvio

La prima volta che chiedi qualcosa al plugin succedono due cose, una sola volta ciascuna.

**Si scarica la CLI.** Una cinquantina di megabyte, dalla release del repository di XRCopilotLab.
Vedi comparire:

```
Prima esecuzione: scarico la CLI (xrcopilotlab-bp-osx-arm64, ~52 MB) dalla release bp-v2.1.2.
CLI pronta in /Users/tuonome/.claude/plugins/data/blueprints/bin/...
```

Da lì in poi è già sul disco e non si riscarica più, finché non esce una versione nuova.

**Si apre il browser per l'accesso ad Azure**, se non hai già una credenziale sulla macchina.
Accedi con l'utenza aziendale e chiudi la pagina: il token resta in memoria per le volte
successive.

Se qualcosa si blocca qui, salta al [punto 6](#6-quando-qualcosa-non-va).

> **Verificato.** Il giro completo — installazione, download del binario, controllo dell'impronta
> ed esecuzione — è stato provato su una macchina senza la CLI e senza il repository di prodotto.

---

## 3-bis. Dove si lavora: ambiente e cliente

Due domande a cui rispondi una volta per sessione, e a cui il plugin ti aiuta a rispondere.

**L'ambiente** è dove finisce il lavoro. Sono tre, già dentro la CLI — non devi configurare niente:

| `--env` | Cos'è |
|---|---|
| `staging` | L'ambiente di prova. È quello che si usa quasi sempre |
| `preview` | L'anteprima |
| `prod` | **La produzione.** Da qui dipendono le demo e chi lavora |

Senza `--env`, e solo dentro un clone del repository di prodotto, si usa l'ambiente di sviluppo.

**Il cliente** non lo scrivi: il plugin te lo chiede scegliendolo da un elenco di nomi.

```
  Per quale tenant, in Staging?

   1. Confindustria Como
   2. Studio Polis
   3. Hevolus Innovation

  Numero (1-3), oppure vuoto per annullare:
```

Prima di ogni comando che scrive qualcosa, vedi sempre una riga che dice dove sei. In produzione
non è una riga: è un riquadro.

> **In produzione si lavora solo sul tenant di Hevolus.** Gli ambienti dei clienti non compaiono
> nell'elenco, e non si raggiungono nemmeno scrivendo il loro identificativo. Non è un permesso che
> ti manca: è una scelta. L'ambiente di un cliente si configura dall'interfaccia di XRCopilotLab,
> non da qui.

---

## 4. Creare un blueprint

Non devi imparare il formato del file: lo scrive il plugin intervistandoti. Chiedi in linguaggio
naturale.

```
Crea un blueprint per lo studio legale Rossi: gestione degli avvisi di udienza,
con un referente che verifica e un avvocato che conferma.
```

Il plugin ti farà **una domanda per volta**: chi fa cosa, in che ordine, dove si decide, quali dati
servono a ogni passo, quanto tempo può restare fermo un compito prima che qualcuno venga avvisato.

Rispondi come parleresti a un collega. «Il referente controlla e se non torna si richiede alla
cancelleria» diventa un bivio con due strade, senza che tu debba dirlo in altro modo.

Alla fine il plugin ti mostra **il disegno del processo**:

```
  [start] Start · Avviso ricevuto · 4 campi
  [estrai] Task · Estrai gli estremi · Automated · task «BP-ROSSI-Estrazione avviso»
  [verifica] Task · Verifica del referente · HumanOnly · lane «BP-ROSSI-Referente» · 7 campi · soglia 480 min

  start → estrai
  estrai → verifica
  verifica → esito
  esito → registra se confermato eq true
  esito → estrai (da rifare)
```

**Leggilo davvero.** È il momento in cui ci si accorge di un caso che manca, e correggerlo adesso
costa una frase; dopo costa una versione nuova del file.

Poi il plugin ti mostra **il piano**: l'elenco di ciò che verrebbe creato sul tenant. Da lì non va
avanti finché non dici di sì.

---

## 4-bis. Se il cliente ha dei documenti

Quasi sempre ce li ha: un file di mapping, uno schema, delle estrazioni, dei registri. Perché un
agente possa leggerli servono **tre cose distinte**, e confonderle è il modo più comune di ritrovarsi
con un agente che risponde a vuoto:

| | |
|---|---|
| Il **topic** | Il magazzino dei file. Un file caricato qui non è ancora leggibile da nessuno |
| Il **profilo** | La parte che li indicizza e li rende interrogabili. È questo che si collega all'agente — e ogni profilo attivo consuma una licenza |
| L'**agente** | Non vede il magazzino: vede i profili che gli hai collegato |

Il passaggio che salta più spesso è quello in mezzo. «Ho caricato i file nel topic dell'agente» sono
in realtà due operazioni, e se manca la seconda l'agente non sa che quei documenti esistono.

**A quale agente collegare quali documenti** è una decisione, e il plugin ti aiuta a prenderla:

```
Ho questi documenti in una cartella: a quali agenti li collego?
```

Dietro le quinte lancia `suggest`, che propone **un profilo per agente** e assegna ogni file dove il
nome lo giustifica. Quello che ti lascia da decidere lo dice esplicitamente, invece di indovinare.

Due cose che conviene sapere, perché cambiano il risultato e non sono ovvie:

**Il nome del file conta davvero.** Quando l'agente cerca fra i documenti, sceglie quelli il cui
nome contiene una parola della domanda — e se qualcuno corrisponde, **gli altri li scarta**. È
giusto così: il registro di una società non deve rispondere per un'altra. Ma vuol dire due cose:

- nel nome ci va ciò che distingue il file: società, anno, periodo. `registro.xlsx` non basta,
  `rossi-registro-2026.xlsx` sì;
- un documento «di riferimento» che nessuno nomina mai — uno schema, una tabella di conversione —
  viene scartato appena un file più specifico corrisponde. Va tenuto **in un profilo suo**.

**Un profilo con tutto dentro, collegato a tutti gli agenti, è la scelta che sembra comoda e non lo
è.** Ogni agente si carica anche i documenti degli altri, e nelle catene di agenti — dove il secondo
riceve il lavoro del primo — il file che gli serve finisce scavalcato da quelli che non gli servono.
Il sintomo non è un errore: è una risposta incompleta, che sembra colpa delle istruzioni dell'agente.

### Il modello di ciascun agente

Ogni agente gira su un modello, e la scelta non dipende da quanto è «importante» ma da **cosa deve
tenere in testa**. Un passo che classifica una richiesta e la instrada sta bene su un modello snello
e costa una frazione; un passo che deve leggere documenti e ricucirne i pezzi, no — e lì risparmiare
significa ottenere numeri sbagliati.

Il plugin propone un modello per agente e ti dice **su cosa si basa**, così puoi non essere
d'accordo. Se non ne scegli nessuno, l'agente nasce su quello predefinito: funziona, ma è una scelta
che nessuno ha fatto.

---

## 5. I comandi, uno per uno

Normalmente non li scrivi tu: li esegue il plugin mentre lavorate insieme. Sono qui perché tu
possa capire cosa sta succedendo, e perché a volte è comodo lanciarli a mano.

| Comando | Cosa fa |
|---|---|
| `suggest <file>` | Propone come dividere i documenti fra i profili e quale modello dare a ciascun agente. `--files <cartella>` indica dove sono i documenti. Non scrive niente |
| `validate <file>` | Verifica il file. Non tocca la rete: funziona anche senza credenziali |
| `push <file>` | Registra la versione del file. Da qui in poi esiste come artefatto |
| `plan --tag <TAG>` | Mostra cosa verrebbe creato, cosa manca e cosa si scontra. Non crea niente |
| `apply --tag <TAG>` | Esegue il piano, dopo la conferma |
| `status` | Elenco dei blueprint e delle esecuzioni sul tenant |
| `status --run <id>` | Dettaglio di un'esecuzione: chi ha approvato, cosa è stato creato |
| `rollback --run <id>` | Smonta ciò che quell'esecuzione ha creato |
| `delete --tag <TAG> --confirm <TAG>` | Cancella il blueprint dall'archivio. Con `--with-entities` smonta prima il tenant |
| `--help` | L'elenco aggiornato di comandi e opzioni, per la versione che hai installata |

Un giro completo, se vuoi rifarlo a mano:

```bash
xrcopilotlab-bp validate blueprints/rossi-udienze.yml --graph
xrcopilotlab-bp push     blueprints/rossi-udienze.yml --env staging
xrcopilotlab-bp plan     --tag ROSSI --env staging          # il cliente te lo chiede
xrcopilotlab-bp apply    --tag ROSSI --env staging --yes
```

Due cose da sapere su questi comandi.

**`--company` è l'identificativo del tenant**, quello lungo con i trattini. Se è già scritto nel
file, puoi ometterlo nei primi due comandi.

**`--yes` non è una scorciatoia.** Registra che una persona ha approvato quel piano, con nome e
ora, e resta scritto nell'esecuzione. Va usato dopo aver letto il piano, non per saltare la
domanda.

**Su `delete` il `--yes` non vale affatto.** Cancellare non ha marcia indietro — spariscono le
versioni del file, i documenti esportati e l'elenco di ciò che era stato creato — quindi il comando
ti mostra un riquadro rosso con tutto ciò che sparisce e ti chiede di **scrivere il tag** del
blueprint. Se scrivi un tag diverso non cancella niente e te lo dice: serve proprio a fermare il
comando di un altro blueprint riusato con una modifica sola.

---

## 6. Quando qualcosa non va

### «per scaricare la CLI serve l'accesso a GitHub»

Non sei autenticato. Fai `gh auth login` e riprova. Se in azienda `gh` non si può installare,
scarica il file a mano dalla
[release](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet/releases) scegliendo
quello della tua piattaforma, e indicalo così:

```bash
# macOS e Linux
chmod +x ~/Downloads/xrcopilotlab-bp-osx-arm64
export XRCOPILOTLAB_BP_BIN=~/Downloads/xrcopilotlab-bp-osx-arm64
```

```powershell
# Windows
$env:XRCOPILOTLAB_BP_BIN = "$HOME\Downloads\xrcopilotlab-bp-win-x64.exe"
```

### «Nessun ambiente da cui partire»

Il plugin non sa a quale ambiente parlare. Dentro un clone del repository di XRCopilotLab lo
deduce da solo; fuori, serve un profilo. Chiedilo al team: è un file di poche righe da mettere in
`~/.xrcopilotlab-bp/profiles.json`, e contiene l'indirizzo della configurazione dell'ambiente, non
credenziali.

### «App Configuration non leggibile» oppure «Key Vault ... non è leggibile»

Ti mancano i ruoli. Il messaggio dice quale serve. Vanno chiesti a chi gestisce l'ambiente: non è
qualcosa che puoi sistemare tu.

### Il piano si ferma dicendo che un nome esiste già

Non è un guasto: il blueprint **non sovrascrive mai** quello che trova. Se un agente o un processo
con quel nome c'è già, si ferma prima di toccare qualsiasi cosa. Tre strade, e la scelta è tua:
cambiare il nome nel file, cambiare il tag del blueprint, oppure rimuovere l'entità che c'è già.

### L'esecuzione si è fermata a metà

Quello che era stato creato fino a quel punto è registrato. Due possibilità: riprendere da dove si
era fermata, oppure smontare tutto. Il plugin te lo dice con l'identificativo giusto; a mano sono

```bash
xrcopilotlab-bp apply    --tag <TAG> --company <id> --yes --resume <id-esecuzione>
xrcopilotlab-bp rollback --run <id-esecuzione> --company <id>
```

### Numeri che vedi uscire

| Numero | Vuol dire |
|---|---|
| `0` | Fatto |
| `2` | Il file ha errori |
| `3` | Il piano è bloccato: nomi già occupati, persone o skill che non esistono |
| `4` | L'esecuzione è fallita a metà |
| `6` | Il piano va bene ma nessuno l'ha approvato |

---

## 7. Cambiare un blueprint già applicato

Il blueprint **crea, non aggiorna**. Riapplicarlo dopo averlo modificato si ferma sui nomi che già
esistono, ed è voluto: un aggiornamento silenzioso cambierebbe il comportamento di un agente che
qualcuno sta usando in quel momento.

Quindi, a seconda di cosa devi cambiare:

**Aggiungere persone a un ruolo, correggere l'etichetta di un campo, sistemare un testo.** Si fa
**dall'interfaccia di XRCopilotLab**. Quello che il blueprint ha creato sono entità normali, e da
lì in poi si toccano come tutte le altre.

**Aggiungere un passo, un ramo, un agente.** Si modifica il file, si alza il numero di versione, si
smonta l'esecuzione precedente e si riapplica. Il plugin ti guida.

**Provare una variante senza disfare quella che c'è.** Si cambia il tag — da `ROSSI` a `ROSSI2` — e
si applica. Nasce tutto in parallelo con un nome diverso, e le due versioni convivono.

**Buttare via del tutto un blueprint**, per esempio la variante di prova che non è piaciuta:

```bash
xrcopilotlab-bp delete --tag ROSSI2 --confirm ROSSI2 --company <id-del-tenant> --with-entities
```

Senza `--with-entities` cancella solo l'archivio, e se sul tenant ci sono ancora agenti o processi
creati da quel blueprint si ferma: quell'elenco è l'unica cosa che sa come si chiamano, e buttarlo
via mentre esistono vorrebbe dire doverli poi cercare a mano uno per uno.

---

## 8. Aggiornare e disinstallare

Il plugin si aggiorna da solo quando esce una versione nuova. Per forzare il controllo:

```
/plugin marketplace update hevolus
```

Se una versione nuova del plugin porta con sé una CLI nuova, verrà riscaricata al comando
successivo: te ne accorgi dal messaggio, dura qualche decina di secondi.

Per toglierlo:

```
/plugin uninstall blueprints@hevolus
```

Il binario scaricato resta in cache. Per liberare anche quello, cancella la cartella che il plugin
ti ha indicato al primo avvio.

---

## 9. Cosa il plugin non fa

Meglio saperlo prima di prometterlo a un cliente.

**Non crea persone.** Gli utenti che metti nei ruoli devono già esistere sul tenant. Il blueprint
li aggiunge a un ruolo, non li fa nascere.

**Non crea skill.** Le skill del catalogo (ricerca giuridica, analisi documentale, e le altre) si
assegnano a un agente, ma devono già essere disponibili sul tenant.

**Non configura i clienti in produzione.** In produzione si lavora sul solo tenant di Hevolus: gli
ambienti dei clienti si configurano dall'interfaccia di XRCopilotLab. È una scelta, non un limite
tecnico.

**Non reagisce nell'istante in cui arriva una mail.** Può leggere una casella e far partire un
processo, ma guardando a intervalli — ogni cinque minuti, per dire. Il *push*, cioè reagire
nell'attimo, richiede infrastruttura fuori dalla piattaforma e un'autorizzazione che una persona
deve dare di persona: resta un passo manuale.

**Non eredita fra blueprint.** Un blueprint che ne estende un altro (`extends`) si può scrivere ma
non viene ancora applicato.

**Non decide da solo quali documenti servono a quale agente.** Propone, e dove il nome del file non
basta a decidere te lo dice invece di inventare: quella scelta richiede di sapere che lavoro fa
ciascun agente, e quello lo sai tu.

**Non calcola niente al posto tuo.** Se un processo deve tenere conto di termini, scadenze o
regole di calcolo, quelle restano una valutazione di chi lavora: il plugin le raccoglie in un
campo, non le deduce.

---

## Se ti serve una mano

Il riferimento completo di ogni campo del file e di ogni opzione dei comandi è dentro il plugin,
accanto alla skill, in `references/`. Per tutto il resto, il canale è il team AI di Hevolus.
