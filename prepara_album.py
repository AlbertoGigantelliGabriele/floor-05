"""Crea uno ZIP da estrarre localmente. Carica su GitHub solo i file in assets/."""
import argparse
import base64
import getpass
import io
import json
from pathlib import Path
import secrets
import shutil
import tempfile
import zipfile

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from PIL import Image, ImageOps


def prepare(source, output, phrase):
    photos = sorted(p for p in source.iterdir() if p.is_file() and
                    p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'})
    if not photos:
        raise ValueError("Nessuna foto JPEG, PNG o WebP nella cartella.")
    salt = secrets.token_bytes(16)
    iterations = 600_000
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt,
                     iterations=iterations).derive(phrase.encode('utf-8'))
    cipher = AESGCM(key)
    def encrypted(payload):
        nonce = secrets.token_bytes(12)
        return nonce + cipher.encrypt(nonce, payload, None)

    def b64(payload):
        return base64.b64encode(payload).decode('ascii')

    items = []
    with tempfile.TemporaryFile() as temporary:
        with zipfile.ZipFile(temporary, 'w') as archive:
            for path in photos:
                with Image.open(path) as image:
                    frame = ImageOps.exif_transpose(image).convert('RGB')
                    frame.thumbnail((1800, 1800))
                    jpeg = io.BytesIO()
                    frame.save(jpeg, format='JPEG', quality=86)
                name = secrets.token_hex(16) + '.bin'
                archive.writestr('assets/' + name, encrypted(jpeg.getvalue()))
                items.append({'file': name})
            index = encrypted(json.dumps({'photos': items}).encode())
            manifest = dict(version=1, kdf='PBKDF2-SHA256', iterations=iterations,
                            salt=b64(salt), nonce=b64(index[:12]), ciphertext=b64(index[12:]))
            archive.writestr('assets/manifest.json', json.dumps(manifest))
        temporary.seek(0)
        with output.open('xb') as destination:
            shutil.copyfileobj(temporary, destination)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cartella', type=Path)
    parser.add_argument('zip', type=Path)
    args = parser.parse_args()
    phrase = getpass.getpass('Scegli una frase segreta (consigliate sei parole casuali): ')
    if len(phrase) < 16 or phrase != getpass.getpass('Ripeti la frase: '):
        parser.exit(1, 'Servono almeno 16 caratteri e due frasi identiche.\n')
    prepare(args.cartella, args.zip, phrase)
    print('Album pronto:', args.zip)
