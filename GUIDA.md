# FLOOR 05 — base esplorabile

Apri https://albertogigantelligabriele.github.io/floor-05/ con un browser che supporta WebGL 2 e l'accelerazione grafica.

- Clic nella scena: cattura il puntatore e avvia l'audio ambientale.
- WASD: cammina. Il movimento diagonale ha la stessa velocità.
- Mouse: guarda intorno.
- Maiusc: accelera.
- Barra spaziatrice: salta.
- Esc: libera il puntatore e interrompe il movimento.
- M: attiva/disattiva l'audio.

Su iPhone/iPad: tieni premuto **Cammina** o **Corri** in basso a sinistra; trascina un altro dito nella scena per orientare la visuale. **Salta** è in basso a destra. Puoi muoverti e guardare contemporaneamente. Rilasciando il pulsante ti fermi; cambiare app o ruotare il dispositivo interrompe i comandi. Il primo tocco avvia anche il suono. I pulsanti compaiono solo sui dispositivi touch e rispettano i margini di sicurezza dello schermo. Su computer senza touch l'interfaccia resta invisibile.

La pianta ha 26 ambienti: ingresso e zona centrale gialli, ala ospedaliera a sinistra, piscine a destra. Tutti i passaggi sono aperti. Le vasche hanno un bordo percorribile; le collisioni impediscono di cadere nell'acqua. Le due stanze riservate al futuro finale sono vuote e accessibili.

## Sorgenti

- `layout.js`: stanze, corridoi, colonne, vasche e collisioni.
- `architecture.js`: geometria e illuminazione precalcolata.
- `materials.js`: texture, materiali e shader dell'acqua.
- `engine.js`: visualizzazione, comandi e audio.
- `controls.js`: gesti multitouch e fisica del salto; `node verify-controls.mjs` esegue i test.
- `base.css` e `index.html`: pagina a tutto schermo.
- `vendor/`: Three.js r170 e relativa licenza MIT.

## Foto private

Scarica prepara_album.py sul PC. Metti i JPEG, PNG o WebP in una cartella locale, fuori dal repository. Esegui nella cartella dello script:

```sh
python -m pip install cryptography Pillow
python prepara_album.py "foto-originali" "album.zip"
```

Scegli una frase lunga e casuale nel terminale. Estrai lo ZIP sul PC e carica in assets/ i file .bin e manifest.json insieme. Il sito chiede il passcode a ogni apertura. Puoi entrare anche lasciando vuoto il campo. Le foto appaiono durante il percorso solo con la frase dell’album. Conserva gli originali e la frase sul tuo dispositivo.

## Verifiche

`node verify-layout.mjs` verifica che il giocatore possa raggiungere tutte le stanze con un margine di collisione reale. Le immagini in `docs/previews` sono render di controllo locali, non screenshot del browser. Gli shader sono stati compilati e renderizzati con Mesa EGL. Il browser remoto di prova non permette la creazione di un contesto WebGL; la resa e la fluidità interattiva su dispositivi reali richiedono ancora una prova nel browser dell'utente.
