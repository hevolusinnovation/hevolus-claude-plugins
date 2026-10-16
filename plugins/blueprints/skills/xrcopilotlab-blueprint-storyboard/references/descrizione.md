# La descrizione della scena

Lo storyboard **non disegna**. Ogni scena è **scritta per esteso**, come in una sceneggiatura: chi la
realizza — un'agenzia, un illustratore, un generatore di video, chi registra lo schermo — deve poterla
girare leggendo solo la descrizione, senza indovinare. Uno schizzo fatto con forme base diceva poco e
sembrava più finito di quanto fosse; una descrizione precisa dice di più e non si scambia per il video.

## I campi, sempre tutti

| Campo | Che cosa scrivere | Misura |
|---|---|---|
| **Inquadratura** | Che cosa si vede all'apertura della scena: il luogo o la schermata, i soggetti e dove stanno (sinistra, centro, destra, primo piano, sfondo) | 2–3 frasi |
| **Azione** | Che cosa succede, **in ordine**, con i tempi interni quando contano («a 1 s… poi…»): chi entra, che cosa si muove, che cosa cambia | 3–5 frasi o un elenco numerato |
| **Chi agisce** | Per ogni azione, se la fa l'**AI** (viola: un assistente legge, propone, scrive, si chiude da solo) o una **persona** (azzurro: conferma, decide, scrive l'esito) | una riga per attore |
| **Schermate e scritte** | Le schermate dell'applicazione che compaiono (quale pagina, quali campi, che valori di esempio) e le scritte sovrapposte in montaggio | elenco |
| **Camera e transizione** | Il movimento (push-in lento, carrello laterale, ferma, orbita, crane up) e come si entra e si esce dalla scena (stacco, dissolvenza, continuità con la precedente) | 1–2 frasi |
| **Suono** | Voce (la battuta), pause, eventuale effetto («click», «notifica»); mai musica scelta da noi | 1 riga |
| **Fonte** | Da dove viene il fatto mostrato: il passo del processo, l'assistente, il compito automatico, la slide della guida, il punto di demo `Dn`, il clip registrato se esiste | 1 riga |
| **Note per chi realizza** | Che cosa evitare (nomi veri, dati del cliente, l'AI che decide al posto di una persona), che cosa non è ancora provato, alternative se una ripresa non riesce | 1–3 righe |

Una scena tipica è di **80–150 parole** fra tutti i campi. Le scene della parte basilare e quelle in cui
decide una persona possono essere più lunghe: sono quelle che il video deve far capire bene.

## Come si scrive

- **Si vede, non si spiega.** «Il referente apre il compito, legge la bozza e preme Conferma» e non
  «il referente verifica la correttezza». Ogni frase deve poter diventare un'inquadratura.
- **Valori d'esempio, mai veri.** Nelle schermate si scrivono dati inventati e coerenti fra le scene
  («causa Rossi c. Bianchi, RG 4521/2025»); mai nomi, numeri o indirizzi della fonte.
- **Il colore dice chi agisce.** Viola dove lavora l'AI, azzurro dove decide una persona, ambra per una
  differenza o un'attenzione. Se il manifest fa decidere una persona, la descrizione non può far decidere
  l'AI: è un errore, non una licenza narrativa.
- **Coerenza fra scene.** Lo stesso caso, gli stessi nomi d'esempio, la stessa schermata vista da un'altra
  angolazione: chi realizza deve poter montare le scene in fila senza salti.
- **Solo ciò che il manifest fa.** Una funzione non provata non si descrive come funzionante: o si toglie
  la scena, o la nota per chi realizza dice «non ancora provato, da girare dopo la prova».
- **Le scene didattiche lo dicono.** Se la parte basilare mostra la piattaforma e non lo scenario (nessuna
  knowledge nel manifest), l'inquadratura comincia con «Esempio della piattaforma:» e la scena porta
  l'etichetta *esempio* nella tavola.
- Niente nomi di strumenti di generazione né prompt tecnici: è prosa da sceneggiatura.

## Nella tavola

La descrizione **sta dove prima stava il disegno**: il riquadro mostra codice scena, titolo, tempi,
battuta e poi i campi uno sotto l'altro, con l'etichetta in maiuscoletto. Il bordo sinistro è viola o
azzurro secondo chi decide nella scena. Se esiste un **clip registrato** o un **fotogramma vero**
dell'applicazione per quella scena, si mostra in cima al riquadro: è l'unica immagine ammessa, ed è
l'applicazione vera.

## Controlli

- Ogni scena ha **tutti i campi** compilati; «—» solo per il suono di una scena muta.
- La descrizione si capisce **senza la battuta**: la voce accompagna, non spiega.
- Nessuna azione dell'AI dove nel manifest decide una persona.
- Nessun nome proprio, numero o indirizzo della fonte nelle schermate e nelle scritte.
