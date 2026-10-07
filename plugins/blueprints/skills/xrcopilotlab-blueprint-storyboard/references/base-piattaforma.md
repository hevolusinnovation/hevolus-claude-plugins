# La parte basilare: conoscenza e skill di un assistente

Ogni storyboard la contiene. Chi guarda il video capisce *che cosa* fa lo scenario soltanto se ha
visto *da che cosa è fatto*: un assistente che sa le cose giuste (knowledge) e sa fare le cose giuste
(skill). Sono quattro riquadri, circa un quarto della durata (20 s su 80), subito dopo il problema.

Il modello è quello della piattaforma ([`manifest-reference.md`](../../xrcopilotlab-blueprint/references/manifest-reference.md),
sezioni `knowledge` e `agents`): non si inventa un'immagine più semplice del vero.

## Le quattro scene

| Codice | Che cosa si vede | Fatto del manifest da rispettare | Parola introdotta |
|---|---|---|---|
| **B1** | I documenti dello scenario (norme, schede, tabelle) cadono in un **contenitore** | I file stanno in un topic: caricati lì, nessuno li può interrogare | *archivio* |
| **B2** | Dal contenitore, una **selezione** di documenti si illumina e diventa un **profilo di knowledge**; si «indicizza» (sfoglia veloce, indice che si forma) | Il profilo ne seleziona un sottoinsieme e lo indicizza; un profilo per compito è la forma consigliata | *knowledge* |
| **B3** | Una persona **crea un assistente**: gli dà un nome, scrive le sue istruzioni in due righe, sceglie come deve rispondere | L'assistente ha nome, istruzioni (system message), modello, lingua | *assistente* |
| **B4** | All'assistente si **collegano** il profilo di knowledge (fascio di luce dai documenti) e le **skill** (due o tre icone che si agganciano come moduli) | L'agente vede **i profili collegati**, non l'archivio intero; le skill sono capacità a catalogo | *skill* |

Se c'è spazio, un quinto riquadro **B5**: l'assistente risponde a una domanda e la risposta **cita il
documento** da cui viene. È la prova visiva che il collegamento funziona, e va solo se la fonte
dello scenario mostra una risposta con citazione.

## Come si ricavano dal manifest

1. **Un solo assistente come esempio**, il più rappresentativo: quello che ha più `knowledge` e
   `skills` dichiarati, oppure quello al centro del processo principale. Non si mostrano tutti.
2. **I documenti di B1/B2** sono i **tipi** di file dei profili (`knowledge[].files`): «norme»,
   «schede», «tabelle di mapping». Mai i nomi veri dei file se identificano un cliente.
3. **Le skill di B4** sono quelle di `agents[].skills`, dette con la funzione in italiano («legge una
   PEC», «scrive un documento»), non con l'identificativo. Se `skills: []`, B4 mostra solo il
   profilo e si dichiara in copertura che lo scenario non usa skill; non se ne inventano.
4. **I collegamenti esterni** (`mcp`) sono una terza «presa» dell'assistente (posta, calendario):
   si accennano in B4 solo se il processo li usa nelle scene successive.
5. **Il conteggio** («quattordici assistenti») si prende da `agents[]` e compare solo se il video
   lo dice.

## Se il manifest non usa knowledge né skill

Succede (la prova su Studio Polis lo ha mostrato: 14 assistenti, nessun profilo, nessuna skill, solo
collegamenti a posta e calendario). La parte basilare **non salta**, ma cambia natura:

- **B1, B2 e la parte skill di B4 diventano didattiche**: «come si costruisce un assistente in
  XRCopilot», con documenti d'esempio generici (norme, schede). Lo schizzo porta in un angolo
  l'etichetta *«esempio»*, e la voce parla della **piattaforma** («In XRCopilot…», «Un assistente
  può avere…»), mai dello scenario («lo studio ha caricato…»), perché lo scenario non lo fa.
- **B3 e la parte «collegamenti» di B4 restano vere**: l'assistente scelto è uno reale del manifest
  (nome e compito), e le prese sono i suoi collegamenti reali (`mcp`: posta, calendario, pratiche).
- La **copertura** lo dice: «knowledge: non usata dallo scenario; B1-B2 didattiche».
- Il **messaggio finale** lo ripete all'utente, che può togliere le scene didattiche o chiedere di
  aggiungere un profilo al manifest.

Mai mostrare come «dello scenario» ciò che il manifest non contiene.

## La voce di queste scene

Introduce ogni parola una volta, con la sua spiegazione, e poi la riusa. Esempio di tono:

- B1 «I documenti dello studio vanno in un archivio.»
- B2 «Ne scegliamo quelli che servono a un compito: è la sua knowledge.»
- B3 «Poi creiamo l'assistente: un nome, delle istruzioni, un compito solo.»
- B4 «Gli diamo la knowledge e le skill: le capacità che gli servono per quel compito.»

Se la durata non permette quattro riquadri, **si accorcia il resto del video**, non questa parte.

## Copertura

Una tabella che resta nella sezione interna dell'artifact e **non** va nel video: per ogni sezione
del manifest, il riquadro che la rappresenta.

| Sezione | Rappresentata da | Se non c'è |
|---|---|---|
| `knowledge` | B1, B2 | obbligatoria |
| `agents` (con `skills`, `knowledge`) | B3, B4 | obbligatoria |
| `businessRoles` | le persone nelle scene del processo (colore azzurro) | dichiarare |
| `processes` | scene del flusso | obbligatoria se il manifest ne ha |
| `agentTasks` | scena del controllo periodico (orologio, riepilogo) | dichiarare |
| `connections` / `mcpServers` | prese in B4 e scene con posta/calendario | dichiarare |
| `orchestrators` | scena della catena di assistenti | dichiarare |
| `external` | — | fuori dal video, dirlo nel messaggio finale |

«Dichiarare» vuol dire una riga: «non rappresentata: <motivo>», per esempio «non c'è nello
scenario» o «sforava la durata».
