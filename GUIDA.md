# Floor 05 — prima stanza

Un'anteprima esplorabile di una backroom romantica e liminale. La stanza gialla è volutamente enorme e vuota; al centro c'è una catasta irregolare di mobili. Gli indizi delle città sono mescolati tra i mobili. Le foto sono assenti finché non viene preparato l'archivio cifrato.

## Esplorazione

- `W A S D`: cammina; `Shift`: cammina più veloce.
- Mouse: clicca nella scena per controllare lo sguardo; `Esc` libera il cursore.
- `E`: esamina l'oggetto indicato. Su telefono usa i tasti a schermo e trascina per guardare.
- L'audio ambientale parte soltanto se si sceglie **AUDIO ON**.

## Foto e frase di accesso

Apri `studio.html` in un browser moderno. Seleziona le foto originali sul tuo computer, scegli una frase di almeno 14 caratteri e scarica `floor-05-archivio-cifrato.zip`. Lo strumento ridimensiona ogni foto a massimo 1800 px, ricodifica in JPEG per eliminare i metadati del file e cifra le copie con AES-GCM. La chiave viene ricavata dalla frase tramite PBKDF2-SHA256 (310.000 iterazioni, salt casuale). La frase e la chiave non sono salvate nel repository o nello ZIP.

Estrai lo ZIP. Carica i file della cartella `assets/` nella cartella `assets/` del repository. Non caricare le foto originali, né il file `COME_CARICARE.txt`. Quando `assets/manifest.json` esiste, la pagina chiede la frase prima di aprire la scena. Le foto restano cifrate sul server e vengono decifrate nel browser dopo l'accesso. Le prime due vengono mostrate nei punti fotografici della prima stanza; le altre sono pronte per le stanze future.

Per cambiare frase o aggiungere foto, rifai l'esportazione selezionando **tutte** le foto da conservare; sostituisci per intero la cartella `assets/`. Attenzione: i vecchi file cifrati possono restare nella cronologia Git anche dopo averli eliminati dalla versione attuale. Una vecchia frase potrebbe ancora aprire una vecchia versione dell'archivio. Conserva la frase in modo affidabile: non esiste recupero.

Questa protezione riguarda l'archivio delle foto. Il codice, la geometria, i testi degli oggetti e la schermata di ingresso sono pubblici su GitHub Pages. Chi conosce la frase può vedere e salvare le foto decifrate; non è un sistema di account personali.

## Pubblicazione gratuita

GitHub Pages va attivato solo dopo aver caricato `assets/manifest.json`. Nelle impostazioni del repository, **Pages → Build and deployment → Deploy from a branch → main / (root)**. La prima apertura va verificata sia con frase errata sia con frase corretta. Il sito non contiene tracker né dipendenze esterne.

## Stato del progetto

Questa è una prima stanza giocabile. Restano da progettare le altre zone dei cinque anni, la lettera e lo scatolino finale. I testi attuali sono provvisori e vanno rivisti prima di consegnare il sito al destinatario.
