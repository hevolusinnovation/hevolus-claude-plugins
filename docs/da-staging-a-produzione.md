# Da staging a produzione, passo per passo

Questa pagina porta un blueprint **collaudato su staging** fino a **applicato in produzione**, e
dice per ogni passo chi lo può fare: chi ha il repository di prodotto («dev») e chi ha solo il
plugin («non dev»). Dove serve, dice anche cosa chiedere e a chi.

> **Leggi prima il passo 0.** Due cose possono fermare tutto il resto, e nessuna delle due si
> risolve riprovando. Meglio scoprirle adesso che a metà.

---

## 0. Le due cose che fermano tutto

### 0.1 Una sessione sulla produzione

La sessione della CLI è **per ambiente**: quella di staging non vale in produzione. Prima di tutto,
sulla **tua** macchina:

```bash
xrcopilotlab-bp login --env prod
```

Si apre il browser, un clic con l'utenza `hevolus.it`, e la sessione resta. Niente ruoli Azure: dalla
3.0.0 la CLI lavora con il tuo account, e che cosa puoi fare lo decide il prodotto, tenant per tenant
([§ L'accesso](accesso-azure.md)). Verifica in un comando, senza rischiare niente:

```bash
xrcopilotlab-bp environments
```

Risponde ambiente per ambiente: *n tenant*, *senza sessione* (serve `login`), *non sei un utente*,
*non raggiungibile*. Se su `prod` sei entrato ma non vedi il tenant del cliente, la richiesta si fa a
chi amministra quel tenant nel prodotto, non ad Azure.

### 0.2 In produzione si lavora sui tenant a cui appartieni

**Dalla 2.13.0** la riga di comando offre i tenant della **persona** che lancia il comando: chiede
alla piattaforma l'utente con le sue company, la stessa domanda che l'interfaccia fa dopo il login.
Due colleghi con diritti diversi vedono elenchi diversi, e un tenant fuori dal proprio viene
rifiutato con exit **3** anche scrivendolo a mano con `--company`.

Quindi la domanda da farsi prima di cominciare è una sola: **sei censito nel prodotto su quel
tenant di produzione?** Se sì, puoi lavorarci. Se no, non è un ruolo Azure che manca e non c'è un
flag che aggiri: chiedi di essere aggiunto a quel tenant, come si farebbe per usare l'interfaccia.

Se non si riesce a stabilire chi sei — nessuna sessione, o un'utenza che il prodotto non conosce —
il comando **si ferma** con 8, in ogni ambiente: `login`, oppure chiedi di essere aggiunto al tenant.

> Fino alla 2.12.1 la regola era un'altra: in produzione passava il solo tenant di Hevolus, per
> tutti, perché l'elenco veniva da una chiave di configurazione condivisa. Se leggi ancora quella
> frase da qualche parte, la pagina è vecchia — o lo è il binario, e `xrcopilotlab-bp version` lo
> dice.

---

## 1. Avere la CLI e l'accesso

| Passo | Dev | Non dev |
|---|---|---|
| Installare | clone del repository di prodotto, oppure il plugin come tutti | app Claude → scheda **Code** → le due righe di [§ Installare](installare.md) |
| Entrare | `xrcopilotlab-bp login --env prod` | lo stesso, chiedendolo a Claude: il browser si apre sulla tua macchina, il clic è tuo |
| Verificare | `xrcopilotlab-bp whoami --env prod` | lo stesso, chiedendolo a Claude |

Non c'è più un passo che vuole un terminale vero: `login` apre il browser anche quando lo lancia
Claude, e aspetta fino a cinque minuti che tu scelga l'account. Fatto una volta per ambiente, tutti i
comandi successivi — compresi quelli che lancia Claude per te — usano la sessione.

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
| `environments` dice «senza sessione» su prod | è il passo 0.1: `xrcopilotlab-bp login --env prod`, il clic nel browser è tuo — [§ L'accesso](accesso-azure.md) |
| exit **8** «non sei un utente di XRCopilotLab», o un 403 sul tenant | è il passo 0.2: non sei censito su quel tenant nel prodotto. Non è un ruolo Azure che manca |
| exit **6** «serve --yes» | non c'è un terminale a cui chiedere: la conferma la dà una persona, a parole |
| «il segreto X non esiste in produzione» | `promote` li aveva elencati: `secrets set --env prod` prima del `plan` |
| un nome esiste già | il blueprint non sovrascrive: si decide, non si forza |

Per tutto il resto: `xrcopilotlab-bp --help` è l'unica fonte che non può essere in ritardo rispetto
al binario che hai installato.
