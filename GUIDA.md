# FLOOR 05 — base esplorabile

Apri https://albertogigantelligabriele.github.io/floor-05/ con un browser che supporta WebGL 2 e l'accelerazione grafica.

- Clic nella scena: cattura il puntatore e avvia l'audio ambientale.
- WASD: cammina. Il movimento diagonale ha la stessa velocità.
- Mouse: guarda intorno.
- Maiusc: accelera.
- Esc: libera il puntatore e interrompe il movimento.
- M: attiva/disattiva l'audio.

Non ci sono elementi di interfaccia durante l'esplorazione. Questa versione è pensata per un computer con tastiera e mouse.

La pianta ha 26 ambienti: ingresso e zona centrale gialli, ala ospedaliera a sinistra, piscine a destra. Tutti i passaggi sono aperti. Le vasche hanno un bordo percorribile; le collisioni impediscono di cadere nell'acqua. Le due stanze riservate al futuro finale sono vuote e accessibili.

## Sorgenti

- `layout.js`: stanze, corridoi, colonne, vasche e collisioni.
- `architecture.js`: geometria e illuminazione precalcolata.
- `materials.js`: texture, materiali e shader dell'acqua.
- `engine.js`: visualizzazione, comandi e audio.
- `base.css` e `index.html`: pagina a tutto schermo.
- `vendor/`: Three.js r170 e relativa licenza MIT.

Il sito è statico, pubblicato da `main` tramite GitHub Pages. I vecchi `world.js`, `style.css` e gli strumenti di cifratura sono conservati ma non caricati nella pagina attuale. Non pubblicare foto o lettere in chiaro: la parte privata verrà integrata in un secondo momento.

## Verifiche

`node verify-layout.mjs` verifica che il giocatore possa raggiungere tutte le stanze con un margine di collisione reale. Le immagini in `docs/previews` sono render di controllo locali, non screenshot del browser. Gli shader sono stati compilati e renderizzati con Mesa EGL. Il browser remoto di prova non permette la creazione di un contesto WebGL; la resa e la fluidità interattiva su dispositivi reali richiedono ancora una prova nel browser dell'utente.
