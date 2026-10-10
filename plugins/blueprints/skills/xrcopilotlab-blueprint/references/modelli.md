# Il modello di un agente

Ogni agente di un blueprint gira su un modello, e finora la scelta non veniva fatta: il campo
esisteva e non veniva letto. Questa pagina dice come si scrive, come si sceglie, e dove la scelta
non va indovinata.

## Si dichiara sempre

```yaml
agents:
  - key: classificatore
    name: agente-classificatore
    model: gpt-5.4-nano
```

Il modello vive sull'**endpoint di default** dell'agente, non sull'agente: è il motivo per cui va
risolto alla creazione, ed è il motivo per cui prima veniva perso. Omettere il campo è lecito —
l'agente nasce su `gpt-5.4` — ma produce un avviso `BP015`, perché rileggendo il manifest non si
distingue una scelta consapevole da una dimenticanza.

Il nome deve essere **a catalogo**: il preflight lo verifica contro `_Models` e rifiuta con `BP065`
un nome che non c'è, elencando i disponibili. Il blueprint non aggiunge modelli a catalogo — quello
è un'altra operazione, e passa dalla skill `xrcopilotlab-add-model`.

## Il catalogo si legge, non si ricorda

```bash
xrcopilotlab-bp suggest <manifest> --env staging
```

Il catalogo cambia — a settembre 2026 ha una ventina di righe, da `gpt-4.1` a `claude-opus-5`, e due
modelli dismessi (`grok-4-fast-reasoning`, `DeepSeek-R1`) ne sono appena usciti — e ogni riga porta
una **descrizione** che dice a cosa serve: «classificazioni rapide e instradamento», «analisi
contestuali rapide», «elaborazioni avanzate, creatività, comprensione contestuale profonda». Quelle
descrizioni sono scritte per questa decisione: vanno lette, non sostituite con un ricordo di quali
modelli esistevano.

Non scrivere in un manifest un nome ricordato a memoria. Un `gpt-5.4-mini` c'è; un
`gpt-5.4-mini-high` no, e il piano si fermerebbe.

## Due famiglie, e come dichiarano il proprio taglio

Dalla v3.2.0 il catalogo ospita **due famiglie**, e la cosa importante è che dichiarano la fascia in
due modi diversi:

| Famiglia | Dove sta il taglio | Esempi |
|---|---|---|
| **GPT** | in un **suffisso** | `gpt-5.4-nano`, `gpt-5.4-mini`, `gpt-5.4` |
| **Claude** | in una **parola dentro il nome** | `claude-haiku-4-5`, `claude-sonnet-5`, `claude-opus-5` |

I tre nomi Claude a catalogo sono **esattamente** questi. `claude-fable-5-1` **non** c'è: non è
deployato sulla risorsa, e chi lo scegliesse otterrebbe un errore.

## Le fasce, e come si scelgono

La fascia **non è una classifica di qualità**: è il compromesso fra capacità, latenza e costo.

| Fascia | GPT | Claude | Quando |
|---|---|---|---|
| **nano** | `-nano` | — | Classificare un intento, instradare, estrarre un campo da un testo breve, decidere fra poche alternative. Costa una frazione e risponde subito. |
| **mini** | `-mini` | `haiku` | Risposte conversazionali, riformulazioni, estrazioni strutturate da un documento breve, scegliere quali strumenti chiamare. |
| **piena** | `gpt-N` / `gpt-N.M` lisci | `sonnet`, `opus` | Ragionare su contenuto recuperato dai documenti — che arriva a pezzi e va ricucito — logica di dominio, analisi, qualunque cosa produca numeri di cui qualcuno si fida. |

**Claude non ha un profilo `nano`.** Haiku è il taglio economico della famiglia, ma regge strumenti e
conversazione: sta con i `mini`. Per un passo che classifica e instrada e basta, il candidato giusto
resta un `-nano` GPT — `suggest` non inventa un Claude che non c'è.

**Fra `sonnet` e `opus` la differenza non è la fascia, è il prezzo.** Entrambi sono fascia piena e
portano 1M token di contesto; Opus è il più costoso dei tre di oltre un ordine di grandezza rispetto
a Haiku. Su un passo eseguito a ogni chat, la differenza non è marginale: si parte da Sonnet e si
sale a Opus quando il passo lo chiede davvero — analisi lunghe, tool a più passi, risposte su cui non
si vuole tornare.

**Attenzione al contesto, che non segue più il prezzo.** Opus e Sonnet portano 1M token, Haiku 200K.
Fra le famiglie la correlazione «più costoso = più contesto» non vale: vanno guardati come due assi
separati.

**Sbagliare verso il basso e verso l'alto non costa lo stesso.** Verso l'alto si spende di più; verso
il basso si ottengono numeri sbagliati in un bilancio, o una riclassifica che salta le scritture di
chiusura. Nel dubbio su un passo che produce cifre, fascia piena.

### I nomi che non dichiarano la fascia

`gpt-5.3-codex`, `gpt-5.6-luna`, `grok-4-1-fast-non-reasoning`, `DeepSeek-V3.2`, `Llama-4-Scout`:
qui il nome non dice il compromesso, e **non si deduce per esclusione**. Trattare come «piena» un
modello che si dichiara `fast-non-reasoning` significherebbe proporlo per il passo che deve ragionare
di più — l'errore peggiore possibile in questa classificazione. Per questi si legge la descrizione a
catalogo, e la decisione è di una persona. `suggest` non li propone mai.

La regola vale **anche dentro una famiglia riconosciuta**: un `claude-` che non porti uno dei tre
tagli non viene indovinato.

## Come si decide, agente per agente

La domanda utile non è «quanto è importante questo agente» ma **che cosa deve tenere in testa**:

| Il passo… | Fascia |
|---|---|
| legge documenti da un profilo | **piena** — il contenuto recuperato arriva frammentato e va ricucito |
| riceve l'output di un altro agente in una catena | **piena** — lavora su un contesto lungo che non ha scritto lui |
| chiama server MCP e scegli tool e argomenti | **mini** |
| ha un prompt articolato ma niente documenti né strumenti | **mini** |
| niente documenti, niente strumenti, prompt breve | **nano** |

`xrcopilotlab-bp suggest` applica questa rubrica e stampa, per ogni agente, la fascia **con i
segnali su cui si basa**. I segnali sono fatti del manifest; la fascia è un'inferenza su quei fatti.

**Va confermata, non recepita.** Un agente senza knowledge e senza MCP può essere il passo più
difficile della catena — l'agente di normalizzazione dei giornali di FinLogic ha un prompt di 2.600
caratteri di logica contabile e, prima che gli si collegasse un profilo, per la rubrica era `mini`.
Per questo la proposta viaggia con i segnali: senza il perché non si può né accettare né rifiutare.

## Cosa dire all'utente

Quando si propone un modello, dire **cosa cambia**: fascia, perché, e che la differenza di costo fra
nano e piena su un passo eseguito a ogni chat non è marginale. Quando si propone di *abbassare* la
fascia di un passo che produce cifre, non farlo senza dirlo — il risparmio è visibile subito, lo
sbaglio no.

Quando in una fascia ci sono candidati di **entrambe** le famiglie, non scegliere per conto
dell'utente su una preferenza: dire che ci sono, con la differenza che conta per quel passo
(contesto, costo, latenza). Un'azienda con un proprio contratto Anthropic può far passare le
risposte dei suoi agenti dal proprio endpoint — quello **non** si dichiara nel manifest: è
configurazione del tenant, come le registrazioni applicative, e va chiesta a chi amministra
l'azienda.
