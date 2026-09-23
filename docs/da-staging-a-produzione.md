# Da staging a produzione, passo per passo

Questa pagina porta un blueprint **collaudato su staging** fino a **applicato in produzione**, e
dice per ogni passo chi lo può fare: chi ha il repository di prodotto («dev») e chi ha solo il
plugin («non dev»). Dove serve, dice anche cosa chiedere e a chi.

> **Leggi prima il passo 0.** Due cose possono fermare tutto il resto, e nessuna delle due si
> risolve riprovando. Meglio scoprirle adesso che a metà.

---

## 0. Le due cose che fermano tutto

### 0.1 I ruoli Azure sulla produzione

Ogni comando della CLI legge la configurazione dell'ambiente. Per la produzione servono, sulla
**tua** utenza `hevolus.it`:

| Ruolo | Su | Serve a |
|---|---|---|
| **App Configuration Data Reader** | `appcs-xrcopilotlab-prod-01` | leggere le coordinate dell'ambiente |
| **Key Vault Secrets User** | `kv-xrcopilotlab-prod-01` | risolvere i segreti citati dal manifest |
| **Key Vault Secrets Officer** | `kv-xrcopilotlab-prod-01` | solo se devi **scrivere** un segreto (`secrets set`) |

Verifica in un comando, senza rischiare niente:

```bash
xrcopilotlab-bp environments
```

Risponde ambiente per ambiente: *accessibile*, *manca il ruolo*, *nessun accesso ad Azure*, *non
raggiungibile*. Se `prod` non è accessibile, la richiesta dei ruoli si fa a chi amministra la
sottoscrizione — il modello del messaggio è in [§ L'accesso ad Azure](accesso-azure.md).

### 0.2 In produzione si lavora solo sul tenant di Hevolus

Questa è la sorpresa che costa di più, e **non è un permesso che manca**: è una protezione scritta
apposta. In produzione l'elenco dei tenant lo filtra il server, e la CLI **rifiuta con exit 3**
anche un `--company` scritto a mano che non sia in quell'elenco. Oggi passa il solo tenant di
Hevolus.

Quindi: **un blueprint destinato al tenant di un cliente non si applica in produzione da riga di
comando.** Le strade, in ordine di preferenza:

| | Strada | Chi decide |
|---|---|---|
| a | Restare su **staging**, su un tenant di prova e con caselle nostre, finché il giro non è verde | il team |
| b | **Allargare il filtro** in produzione al tenant del cliente: è una modifica deliberata alla protezione, richiede *App Configuration Data Owner* su prod | chi presidia quella regola — non si fa di lato per sbloccare un apply |
| c | Costruire l'ambiente **dall'interfaccia** | chi configura il cliente |

Se il blueprint è per un contesto **di Hevolus**, niente di tutto questo ti riguarda: passa oltre.

---

## 1. Avere la CLI e l'accesso

| Passo | Dev | Non dev |
|---|---|---|
| Installare | clone del repository di prodotto, oppure il plugin come tutti | app Claude → scheda **Code** → le due righe di [§ Installare](installare.md) |
| Primo accesso ad Azure | `az login` o un comando qualsiasi dal terminale | **un comando, una volta, da un terminale** — vedi qui sotto |
| Verificare | `xrcopilotlab-bp environments` | lo stesso, chiedendolo a Claude |

L'unico passo che oggi vuole un terminale vero è il **primo accesso ad Azure** su quella macchina:
senza un terminale il ramo che apre il browser è disattivato di proposito, perché il comando
resterebbe appeso ad aspettare una pagina che nessuno vede.

```bash
xrcopilotlab-bp status --env staging
```

Si apre il browser, si accede con l'utenza aziendale, e da lì in poi **tutti** i comandi — compresi
quelli che lancia Claude per te — usano il token in cache. Succede una volta per macchina.

---

## 2. Collaudare su staging, prima

Non si porta in produzione ciò che non è stato provato. Con il blueprint già applicato su staging:

```bash
xrcopilotlab-bp test run blueprints/tests/<nome>.tests.yml --tag <TAG> --env staging
```

Il giudizio sulle risposte lo dà la skill `xrcopilotlab-blueprint-test`: si chiede a parole
(«collauda il blueprint STUDIOPOLIS su staging») e lei esegue, legge i log, giudica e — solo dopo
un sì — apre le issue dei fallimenti.

**Il verde qui è la condizione per il passo 3.** Un collaudo saltato si paga in produzione, dove
l'errore lo vede il cliente.

---

## 3. Copiare la versione nell'archivio di produzione

Un manifest collaudato **non si riscrive** per applicarlo altrove: si copia. Ogni ambiente ha il
proprio archivio, e dentro l'archivio ogni tenant il suo.

```bash
xrcopilotlab-bp promote --tag <TAG> --version <n> \
    --from-env staging --from-company <guid-staging> \
    --to-env   prod    --to-company   <guid-produzione>
```

Quattro cose da sapere, perché sono le quattro che sorprendono:

1. **Non crea niente sul tenant.** La copia è solo in archivio: dopo servono ancora `plan` e
   `apply`, con la loro approvazione.
2. **Il testo non viene riscritto**: arriva byte per byte, quindi l'impronta SHA-256 resta la stessa
   ed è la prova che in produzione gira ciò che è stato collaudato.
3. **Ripeterlo non fa danni.** Stessa versione con lo stesso contenuto alla destinazione → non
   scrive niente e lo dice. Se si ferma dicendo «contenuto diverso», **non** aggiungere
   `--overwrite`: vuol dire che qualcuno ha modificato il manifest, e la strada giusta è alzare
   `version:`.
4. **I segreti non viaggiano** — nel manifest ci sono solo i nomi. Quelli che la produzione non ha,
   `promote` li elenca: si impostano con `secrets set --env prod` **prima** del `plan`.

---

## 4. Il piano, e l'approvazione

```bash
xrcopilotlab-bp plan --tag <TAG> --env prod --company <guid-produzione>
```

Il piano dice cosa verrebbe creato, cosa manca sul tenant e cosa collide. **Si legge prima di dire
di sì**, ed è il momento in cui ci si accorge di un nome già occupato o di una skill che su quel
tenant non c'è.

Un nome che esiste già è un **rilievo bloccante**: il blueprint non sovrascrive niente, mai. Se
succede, si decide — cambiare tag, o rimuovere ciò che c'era — ma non si forza.

---

## 5. Applicare

```bash
xrcopilotlab-bp apply --tag <TAG> --env prod --company <guid-produzione>
```

Stampa il piano e **chiede conferma**. Dove non c'è un terminale — cioè nella scheda Code — si
ferma con exit **6** e serve `--yes`: in quel caso la conferma la dà l'utente **a parole in chat**,
e Claude passa `--yes` solo dopo quel sì. Un `--yes` che dichiara un'approvazione mai avvenuta
registra il falso nel run.

Se qualcosa va storto a metà, il lavoro non resta appeso:

```bash
xrcopilotlab-bp status --run <runId>          # dove si è fermato
xrcopilotlab-bp apply --tag <TAG> --resume <runId>   # riprende
xrcopilotlab-bp rollback --run <runId>        # smonta ciò che quel run ha creato
```

---

## 6. Verificare che in produzione ci sia ciò che è stato collaudato

Due controlli, uno tecnico e uno di sostanza:

```bash
# 1. lo stesso testo di manifest nei due archivi
xrcopilotlab-bp pull --tag <TAG> --env staging --out /tmp/staging.yml
xrcopilotlab-bp pull --tag <TAG> --env prod    --out /tmp/prod.yml
diff /tmp/staging.yml /tmp/prod.yml            # vuoto = stesso blueprint

# 2. la suite di collaudo, contro la produzione
xrcopilotlab-bp test run blueprints/tests/<nome>.tests.yml --tag <TAG> --env prod
```

E infine il controllo che nessun comando sa fare: **aprire il prodotto e guardare**, con la scheda
Code e l'estensione Claude in Chrome. La chat come la vede il cliente, il form di avvio di un
processo, la coda dei compiti — è lo strato che sa rompersi da solo lasciando la suite verde.

---

## Se ti blocchi

| Cosa vedi | Cosa vuol dire |
|---|---|
| `environments` dice «manca il ruolo» su prod | i ruoli si chiedono a chi amministra la sottoscrizione: [§ L'accesso ad Azure](accesso-azure.md) |
| exit **3** «il tenant non è fra quelli su cui si può intervenire» | è il passo 0.2: in produzione passa solo il tenant di Hevolus |
| exit **6** «serve --yes» | non c'è un terminale a cui chiedere: la conferma la dà una persona, a parole |
| «il segreto X non esiste in produzione» | `promote` li aveva elencati: `secrets set --env prod` prima del `plan` |
| un nome esiste già | il blueprint non sovrascrive: si decide, non si forza |

Per tutto il resto: `xrcopilotlab-bp --help` è l'unica fonte che non può essere in ritardo rispetto
al binario che hai installato.
