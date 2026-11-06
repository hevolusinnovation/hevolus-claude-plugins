# L'accesso: `login`, e nient'altro

**Per chi usa il plugin `blueprints` su Claude Code.** Dalla CLI **3.0.0** (4 novembre 2026) lo
strumento lavora con il **tuo account**, e basta: niente ruoli Azure, niente Azure CLI, niente
chiavi. Questa pagina tiene il nome di prima — era «L'accesso ad Azure» — perché molte altre la
citano; il contenuto di prima non vale più, e in fondo c'è scritto che cosa è cambiato.

L'assessment su Claude Desktop non tocca niente di tutto questo: lì non serve nessun accesso.

## Come si entra

Una volta per ambiente, dal terminale o chiedendolo a Claude:

```bash
xrcopilotlab-bp login --env staging     # si apre il browser: un clic con l'account aziendale hevolus.it
xrcopilotlab-bp whoami --env staging    # chi sei, su quali tenant, con quale ruolo
```

Si apre il browser di sistema; scegli l'account **`hevolus.it`** — lo stesso della posta — e chiudi
la pagina. Il comando aspetta fino a cinque minuti; se il browser non si apre, stampa l'indirizzo da
aprire a mano. Da lì ogni comando parla con l'API dell'ambiente **con il tuo token**. La sessione
resta nel portachiavi del sistema (Keychain, DPAPI, libsecret) e si rinnova da sola finché non fai
`logout`.

**La sessione è per ambiente**: quella di staging non vale in produzione. Per la produzione,
`login --env prod`; `promote` fra i due le vuole entrambe. `xrcopilotlab-bp environments` dice su
quali ambienti la sessione c'è già.

**Anche quando il comando lo lancia Claude**, il browser si apre sulla tua macchina ed è tu a
completare l'accesso: non c'è più un primo passo «da terminale vero».

**L'account con cui usi Claude non c'entra niente.** Conta solo quello aziendale `hevolus.it`: per
ora la CLI è per lo staff Hevolus. L'accesso con l'identità di XRCopilotLab (`--b2c`, anche Google)
esiste nel comando ma non è ancora attivo.

## Che cosa puoi fare

Lo decide **il prodotto, tenant per tenant** — gli stessi tenant che vedi nell'interfaccia:

| Chi | Che cosa |
|---|---|
| `validate` e gli altri comandi che non toccano la rete | **niente** |
| **utente** di un tenant | legge: `status`, `plan`, `pull`, `catalog list`, `files ls`, `test reports`… |
| **amministratore** del tenant | scrive su quel tenant: `push`, `apply`, `rollback`, `delete`, `secrets set`, `test run`, `knowledge`, `mcp`… |
| **operatore di piattaforma** (super-amministratore del prodotto, l'AI Team) | tutto, su ogni tenant, più il catalogo e l'archivio intero. Ogni accesso è registrato |

In produzione le scritture possono essere riservate a un elenco di persone, e un 403 lo dice con
parole sue.

**Un permesso che manca non si chiede ad Azure.** Se `whoami` dice «nessun tenant», o un tenant non
compare, te lo assegna chi amministra quel tenant **nel prodotto**, dall'interfaccia — come si
farebbe per usare XRCopilotLab. Il ruolo di operatore di piattaforma lo dà il team. Non c'è un
messaggio da mandare a chi amministra la sottoscrizione, né un ruolo da assegnare su una risorsa.

## Le persone nel manifest

Dove gli utenti del prodotto contano da sempre è **dentro il manifest**: i membri dei ruoli
aziendali, gli owner di un processo e i destinatari di un passo di approvazione devono già esistere
sul tenant. Il blueprint aggiunge le persone ai ruoli, non le crea — e se un indirizzo non esiste il
piano si ferma prima di toccare qualsiasi cosa (`BP062`).

Quegli indirizzi sono **utenti del tenant**, cercati nella directory del prodotto (B2C, anche
Google), non identità aziendali:

- `mario@gmail.com`, registrato su XRCopilotLab con Google → membro di ruolo **valido**;
- un collega con un ottimo account `hevolus.it` che nel prodotto non è mai entrato → **non valido**,
  e il piano si ferma.

Prima di scrivere un indirizzo in un manifest, la domanda non è «ha un account Hevolus?» ma «**è già
un utente di quel tenant?**».

## Che cosa è cambiato, e perché

Fino alla 2.30.0 la CLI si presentava all'API con una **chiave** letta da App Configuration, e per
leggerla servivano due ruoli Azure del piano dati sulla tua utenza (*App Configuration Data Reader*
e *Key Vault Secrets User*; altri due per `secrets set`). Il tuo ruolo dentro XRCopilotLab non
contava: il cancello era Azure, e *Data Reader* — che suona innocuo — dava la chiave con cui si
comanda il backend.

Dalla 3.0.0 (#1333, #1772) è il contrario, ed è la cosa giusta: ogni comando passa dalle rotte
`cli/*` dell'API con il **token della persona**, l'API legge archivio, segreti e tenant con la
**propria** identità, e autorizza per tenant in base a chi sei **nel prodotto**. I run registrano
l'email verificata di chi ha approvato, non il nome utente del sistema operativo. I segreti dei
blueprint stanno nella piattaforma, cifrati per tenant (#1798): Key Vault e App Configuration non si
toccano più, e i ruoli assegnati allora si possono togliere.

Se una pagina o un messaggio ti chiede ancora un ruolo Azure, è vecchia — o lo è il binario, e
`xrcopilotlab-bp version` lo dice.
