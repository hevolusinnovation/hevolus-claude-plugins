# Layout: le varianti da proporre (passo 5)

Al passo 5 la skill mostra **2 o 3 varianti di layout** della stessa app, come mock-up in un artifact,
costruiti con il `testData` del manifest. Chi le guarda sceglie, e da lì si raffina.

## Che cosa rende diverse due varianti

Due varianti sono diverse quando **cambia il modo di lavorare**, non il colore o la disposizione dei
riquadri. Sono assi validi:

- **dove sta il lavoro**: una conversazione (chat al centro), un elenco di pratiche (cruscotto), un
  modulo che si compila un passo alla volta (procedura), un widget dentro un sito che esiste già;
- **chi la usa**: un'app per una persona sola, oppure due viste per due ruoli (cittadino e operatore,
  cliente e consulente);
- **quanto dice la piattaforma**: tutto visibile (stati, scadenze, chi deve fare cosa), oppure solo
  il risultato.

Tre varianti che differiscono solo nell'aspetto sono una variante sola. In quel caso se ne mostrano due.

## Il 3D: al massimo una variante, e solo se serve

**Fra le varianti proposte, al più una è una scena 3D.** Mai due varianti 3D per lo stesso blueprint:
cambiare inquadratura o metafora alla stessa scena non è una variante, è la stessa idea tre volte.
Il primo mock-up di SANITA (25/10/2026) ne aveva tre, e due erano inutili.

La variante 3D si propone solo se **tutte** queste cose sono vere:

1. **Esiste un luogo o un oggetto vero** in cui l'utente lavora o in cui si trova: una sala, uno
   sportello, un impianto, un magazzino, un prodotto. Il segnale viene dal manifest (ruoli che
   lavorano in un posto, passi di processo che sono postazioni fisiche, glb fra i file di
   knowledge) o dall'intervista.
2. **Ogni oggetto della scena che conta è un comando** collegato a un'entità del blueprint, con il
   suo modo d'integrazione (A–F, [`integrazioni.md`](integrazioni.md)). Se non si riesce a dire,
   per ogni oggetto, «toccandolo succede questo, e lo fa questa entità», la scena è decorativa e
   non si propone.
3. **Gli esiti tornano nella scena**: un posto cambia colore, una persona compare e va allo
   sportello, una pratica entra in una corsia. Se il risultato di un'azione si vede solo nel
   pannello, il 3D non sta aggiungendo niente.

Se una di queste manca, le varianti sono solo 2D, e lo si dice: «per questo blueprint il 3D non
aggiunge niente, perché …».

### Le regole della scena

- **Gli oggetti del luogo vero, non metafore.** Il totem, il monitor dei tempi, l'agenda sul muro,
  l'URP. Mai «stazioni», «percorsi», «tappe» o grafi tridimensionali di un flusso: non esistono nel
  posto in cui la persona lavora, e nessuno li capisce.
- **Camera ferma sul punto di vista della persona.** Rotazione stretta (±20°), niente pan, zoom
  limitato, **nessun volo automatico**. Un pulsante «Ricentra». Cambiare persona cambia il punto di
  vista, senza animazione lunga.
- **Passaggio e tocco.** Al passaggio l'oggetto si evidenzia e un tooltip dice che cosa fa, con un
  verbo («registra la disdetta di questo posto»). Al tocco apre l'azione nel pannello accanto.
- **La persona decide che cosa è cliccabile.** Con due ruoli nella stessa scena, ognuno tocca solo
  i propri oggetti.
- **Ogni comando ha il suo equivalente 2D** nel pannello: tastiera, lettore di schermo, telefono.
- **Una scena per app.** Con due ruoli, la stessa scena vista da due punti, non due scene.

### Esempio di riferimento: la sala del CUP di SANITA

| Persona | Oggetto | Al tocco | Entità | Esito nella scena |
|---|---|---|---|---|
| Cittadino | Totem | chat dello sportello informativo | `accoglienza-cup` (D) | il totem segnala la risposta |
| Cittadino | Monitor «Tempi e priorità» | domanda sulla classe della ricetta | `accoglienza-cup` (D) | — |
| Cittadino | URP | reclamo indirizzato all'URP | `accoglienza-cup` (D) | — |
| Operatore | Posto sull'agenda | registra la disdetta | processo `disdetta-riallocazione` (E) | il posto diventa ambra, tre candidati in sala |
| Operatore | Candidato in sala | esito della chiamata | compito «Offerta del posto» | accetta: posto verde, il candidato va allo sportello |
| Operatore | Sportello 2 | verifica dei tempi della ricetta | `copilot-cup` (D) | fuori tempo: pratica nella corsia della tutela |

Le altre varianti dello stesso blueprint sono 2D: per esempio la chat dell'accoglienza da mettere
nel sito dell'azienda sanitaria (widget, modo A), e un cruscotto dell'operatore con l'elenco dei
posti liberati e delle pratiche di tutela.

## Il controllo della CLI

Le stesse regole le verifica `AppLayoutRules` (libreria `XRCopilotLab.BluePrints`, funzione pura)
sul brief prima di `app plan` e `app create`. La skill non le aggira: se la CLI ferma il brief, si
corregge il brief.

| Codice | Bloccante | Quando |
|---|---|---|
| più di una variante `scene3d` nella proposta | sì | due o tre varianti 3D per lo stesso blueprint, fra le app proposte e create dalla skill (senza `origin`); le app adottate da un collega non contano |
| variante `scene3d` senza oggetti | sì | la scena non dichiara nessun oggetto interattivo |
| oggetto senza azione | sì | un oggetto non è collegato a un'entità del manifest con il suo modo |
| oggetto su un'entità che non esiste | sì | la chiave non è nel manifest |
| oggetto senza esito nella scena | avviso | l'azione non cambia nulla nella scena |
| persona senza punto di vista | sì | un ruolo della scena non ha la sua camera |

I codici si assegnano quando si scrive il controllo, dopo il massimo in `BlueprintIssues.cs` su
`origin/main` **e** sugli altri branch aperti (regola della numerazione in `database-dapper.md`,
che vale anche qui). Il 25/10/2026 su `main` il massimo era `BP142`.
