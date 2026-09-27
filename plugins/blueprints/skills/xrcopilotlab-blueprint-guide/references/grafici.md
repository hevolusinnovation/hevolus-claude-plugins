# I disegni della guida

**Un disegno si usa solo se mostra qualcosa che una lista o una tabella non possono**: di solito
l'ordine dei passi e chi fa ciascuno. Riquadri con dentro una frase, frecce che collegano frasi, una
linea del tempo fatta di etichette: sono testo impaginato male. In quei casi si scrive la lista o la
tabella, e basta.

Nella guida per il cliente il disegno è **uno solo**: il flusso. Il ciclo del progetto è un elenco
numerato, le versioni sono una tabella, i ruoli sono le tre colonne.

## Niente Mermaid

Nessun blocco Mermaid, né nella guida per il cliente né in quella tecnica. Nel Markdown un blocco
Mermaid è codice, non un disegno; nella pagina web, se non viene trasformato, il cliente vede il
codice; e quando viene trasformato, dà riquadri generici che non dicono niente più del testo accanto.

## Il flusso: scritto come elenco, disegnato dalla pagina

Nel Markdown il flusso è un **elenco numerato**, un passo per riga, con in testa **chi lo fa**:

```markdown
1. **Persona** · Un avvocato scrive, o detta in chat
2. **Posta** · Oppure arriva una PEC o una mail della cancelleria
3. **AI** · L'assistente legge e propone gli estremi
4. **Persona** · Il referente verifica e sceglie il professionista
5. **AI** · L'impegno entra nel calendario comune
6. **Persona** · Il professionista conferma
7. **Persona** · Dopo l'udienza scrive l'esito
8. **Regola** · Se è un rinvio, la pratica riparte dal passo 3
```

Si legge così com'è, anche senza pagina. La pagina web e il deck lo **disegnano**: un riquadro per
passo, nell'ordine, colorato per chi lo fa, con il numero del passo; l'ultimo, se rimanda a uno
precedente, lo dice.

Le quattro etichette, sempre le stesse, e i loro colori:

| Etichetta | Chi | Colore (fondo / bordo / testo) |
|---|---|---|
| **Persona** | chi chiede, verifica, decide | `#dbeafe` / `#2563eb` / `#1e3a8a` |
| **AI** | un assistente che legge, propone, scrive | `#ede9fe` / `#7c3aed` / `#4c1d95` |
| **Posta** (o il nome della fonte: **Archivio**, **Registro**) | un archivio o un servizio | `#dcfce7` / `#16a34a` / `#14532d` |
| **Regola** | una regola fissa, un «se… allora…» | `#f3f4f6` / `#6b7280` / `#111827` |

Regole:

- **Al massimo otto passi**, e ogni passo è qualcosa che il cliente riconosce. Niente nomi di passi
  del manifest, niente id, niente simboli BPMN: il cliente non deve vedere uno switch.
- **Il primo e l'ultimo passo sono una persona**, o una regola che rimanda a una persona: il disegno
  deve dire da solo che si comincia e si finisce con qualcuno che decide.
- **Una frase per passo**, di quattro-otto parole.
- Sotto, nella pagina, una legenda di una riga con i colori.

## Nella guida tecnica

Niente disegni: la mappa dei componenti sono le **tabelle** (agenti, task, processi con i passi,
orchestratori, server MCP) e il **ponte**. Un percorso di processo si scrive come elenco di passi
con, per ciascuno, il tipo (compito umano, agent task, regola) e il ruolo.

## Grafici di numeri

Nessuno nella guida per il cliente (niente risultati di collaudo). Nella guida tecnica, se serve un
numero, si scrive il numero con la sua data: «flusso 13/13 al 24/09».
