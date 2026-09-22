# Collaudare dalla UI, nel browser

La suite prova il prodotto **attraverso l'API**: è ripetibile, veloce e non dipende da come è
disegnata una pagina. Ma il cliente non usa l'API. Fra ciò che l'API risponde e ciò che lui vede c'è
uno strato — la chat, il form di avvio di un processo, la coda dei compiti — che sa rompersi per
conto suo, e quando lo fa la suite resta verde.

Questa pagina dice quando vale la pena aprire il browser, come lo si apre e cosa se ne riporta.

## Quando vale, e quando no

| Caso | Dove si collauda |
|---|---|
| L'agente risponde male, cita la knowledge sbagliata, sceglie la skill sbagliata | **suite** — è più veloce e ripetibile |
| Il processo non avanza, un gateway prende il ramo sbagliato | **suite** |
| Il messaggio di benvenuto dell'orchestratore non compare all'apertura della chat | **browser** — l'endpoint lo restituisce, la pagina può non mostrarlo |
| Il campo allegato non appare nel form di avvio, o non accetta il file | **browser** |
| Una voce di menu, un pulsante disabilitato, una chiave di localizzazione mancante | **browser** |
| «Da noi non funziona», detto dal cliente senza altro | **browser**, per riprodurre ciò che fa lui |

La regola pratica: **la suite prima, il browser dopo**. Aprire il browser per qualcosa che la suite
sa già dire è tempo speso a guardare una pagina invece che un log.

## Cosa serve

- **Google Chrome** (o Edge, Brave, Arc, Vivaldi, Opera) con l'estensione **Claude in Chrome**
  installata e attiva.
- Un piano Anthropic diretto: Pro, Max, Team o Enterprise.
- Di essere **già autenticati** in XRCopilotLab su quel browser: Claude usa la sessione che c'è, non
  ne apre una propria. Davanti a una pagina di accesso o a un CAPTCHA si ferma e chiede.

Funziona in tutt'e due i posti da cui si collauda:

- **Claude Code** — da terminale `claude --chrome`, oppure `/chrome` per collegarsi e vedere lo
  stato («Status: Enabled», «Extension: Installed»). Nella **scheda Code dell'app Claude** vale lo
  stesso comando: non serve un terminale.
- **Claude Desktop** — la scheda Chat usa lo stesso browser attraverso l'estensione. Di lì si
  guarda, si legge e si riferisce; **non** si applica niente, perché applicare vuole la CLI.

Se l'estensione non risponde: `/chrome` → «Reconnect extension». Il service worker dell'estensione
va in pausa nelle sessioni lunghe, ed è la causa più comune di un browser che smette di rispondere a
metà collaudo.

## Dove si va

| Ambiente | Indirizzo |
|---|---|
| staging | `https://xrcopilotlab-staging.hevolus.it` |
| produzione | `https://xrcopilotlab.hevolus.it` |

`xrcopilotlab-preview.hevolus.it` è un **secondo nome host della produzione**, non un ambiente di
prova: quello che si fa lì si fa in produzione.

## Le regole, che sono più strette di quelle della suite

1. **Il collaudo guarda, non cambia.** Nel browser si apre, si legge, si scrive in una chat, si
   avvia un processo di prova. Non si modificano agenti, non si cancella niente, non si tocca la
   configurazione: quelle cose si fanno dal manifest, e farle a mano fa divergere il tenant da ciò
   che il blueprint dice.
2. **Mai su un tenant di un cliente in produzione.** Vale qui come per la CLI, e per la stessa
   ragione: una chat di prova dentro l'ambiente di qualcuno è una cosa che quel qualcuno vede.
3. **Niente pulsanti che aprono una conferma del browser** (`alert`, `confirm`): una finestra
   modale blocca ogni comando successivo, e l'unico modo di uscirne è chiuderla a mano.
4. **Una scheda nuova**, non quella dell'utente: si lascia dove l'ha lasciata lui.

## Cosa si riporta

Il browser produce evidenze che la suite non ha, e sono le più convincenti in una segnalazione:

- una **GIF** dell'interazione — è ciò che rende una issue riproducibile senza spiegazioni;
- gli **errori di console** filtrati su un motivo (non tutto il log, che è illeggibile);
- le **richieste di rete** fallite, con il codice: distinguono «la pagina non lo mostra» da
  «l'API non lo ha dato», che è la prima biforcazione del triage;
- uno **screenshot** della pagina nello stato sbagliato.

Una GIF o uno screenshot di una pagina autenticata contiene i dati che c'erano a schermo — nomi,
indirizzi, contenuti del cliente. Prima di allegarli a una issue o a una consegna si guarda cosa
riprendono, esattamente come per le trascrizioni ([`segnalazione.md`](segnalazione.md)).

Nel triage, l'evidenza del browser vale per un componente solo: **la webapp**. Un difetto visto qui
che l'API serve correttamente è un difetto della UI, e va nel repository della webapp. Se invece la
richiesta di rete torna già sbagliata, il browser ha fatto il suo lavoro — ha mostrato dove
guardare — e il resto del triage prosegue come sempre ([`triage.md`](triage.md)).

## Se il browser qui non c'è

Chi collauda da una postazione senza estensione, senza piano adatto o senza accesso al tenant non si
ferma: descrive il caso nella consegna a chi può guardarlo, dicendo **cosa si vedrebbe** e da quale
indirizzo ([`consegna-dev.md`](consegna-dev.md)). Un caso che si sa riprodurre vale più di uno
verificato male.
