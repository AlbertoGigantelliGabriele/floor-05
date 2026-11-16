import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';

const passphrase = 'Una frase lunga di prova 2026';
const enc = new TextEncoder();
const b64 = bytes => Buffer.from(bytes).toString('base64');
const salt = webcrypto.getRandomValues(new Uint8Array(16));
const keyMaterial = await webcrypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
const key = await webcrypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations:310000, hash:'SHA-256' }, keyMaterial, { name:'AES-GCM', length:256 }, false, ['encrypt']);
const nonce = webcrypto.getRandomValues(new Uint8Array(12));
const file = '0123456789abcdef0123456789abcdef.bin';
const manifestPlain = enc.encode(JSON.stringify({ check:'FLOOR05-V1', photos:[{ file, caption:'Ricordo di prova' }] }));
const manifestCipher = new Uint8Array(await webcrypto.subtle.encrypt({ name:'AES-GCM', iv:nonce }, key, manifestPlain));
const manifest = { version:1, kdf:'PBKDF2-SHA256', iterations:310000, salt:b64(salt), nonce:b64(nonce), ciphertext:b64(manifestCipher) };
const photoNonce = webcrypto.getRandomValues(new Uint8Array(12));
const photoCipher = new Uint8Array(await webcrypto.subtle.encrypt({ name:'AES-GCM', iv:photoNonce }, key, enc.encode('fake-jpeg-payload')));
const photoRaw = new Uint8Array(12 + photoCipher.length);photoRaw.set(photoNonce);photoRaw.set(photoCipher,12);

const window = {};
const context = { window, crypto:webcrypto, TextEncoder, TextDecoder, atob, Blob, URL,
  console, fetch: async path => path.endsWith('manifest.json')
    ? new Response(JSON.stringify(manifest))
    : path.endsWith(file) ? new Response(photoRaw) : new Response('',{status:404}) };
runInNewContext(await readFile(new URL('./vault.js', import.meta.url), 'utf8'), context);
assert.equal(await window.FloorVault.load(), true);
await assert.rejects(window.FloorVault.unlock('sbagliata'), /decrypt|operation/i);
assert.equal(await window.FloorVault.unlock(passphrase), 1);
const photo = await window.FloorVault.photo(0);
assert.equal(photo.caption, 'Ricordo di prova');
assert.equal(await (await fetch(photo.url)).text(), 'fake-jpeg-payload');
URL.revokeObjectURL(photo.url);
console.log('Vault: frase errata respinta, frase corretta accettata, foto decifrata.');
