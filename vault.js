/* Encrypted media vault. No passphrase, derived key, or plaintext asset is stored. */
window.FloorVault = (() => {
  const decoder = new TextDecoder();
  const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  let envelope = null, key = null, index = null;

  async function load() {
    try {
      const response = await fetch('assets/manifest.json', { cache: 'no-store' });
      if (!response.ok) return false;
      const candidate = await response.json();
      if (candidate.version !== 1 || candidate.kdf !== 'PBKDF2-SHA256' || !candidate.salt || !candidate.nonce || !candidate.ciphertext) throw new Error('Archivio non valido');
      envelope = candidate;
      return true;
    } catch (error) {
      // An absent manifest means the public, empty prototype. A malformed one is not an unlock.
      console.warn('Archivio non disponibile:', error.message);
      return false;
    }
  }
  async function unlock(passphrase) {
    if (!envelope) throw new Error('Archivio non disponibile');
    const input = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const derived = await crypto.subtle.deriveKey(
      { name:'PBKDF2', salt:bytes(envelope.salt), iterations:envelope.iterations, hash:'SHA-256' },
      input, { name:'AES-GCM', length:256 }, false, ['decrypt']
    );
    const clear = await crypto.subtle.decrypt({ name:'AES-GCM', iv:bytes(envelope.nonce) }, derived, bytes(envelope.ciphertext));
    const data = JSON.parse(decoder.decode(clear));
    if (!Array.isArray(data.photos)) throw new Error('Frase non valida');
    key = derived; index = data;
    return data.photos.length;
  }
  async function photo(number) {
    if (!key || !index?.photos?.length) return null;
    const item = index.photos[number % index.photos.length];
    if (!/^[a-f0-9]{32}\.bin$/.test(item.file)) throw new Error('File non valido');
    const response = await fetch(`assets/${item.file}`);
    if (!response.ok) throw new Error('Foto non disponibile');
    const raw = new Uint8Array(await response.arrayBuffer());
    const clear = await crypto.subtle.decrypt({ name:'AES-GCM', iv:raw.slice(0,12) }, key, raw.slice(12));
    return { url:URL.createObjectURL(new Blob([clear], {type:'image/jpeg'})), caption:item.caption || '' };
  }
  return { load, unlock, photo, get hasArchive(){return !!envelope;}, get unlocked(){return !!key;} };
})();
