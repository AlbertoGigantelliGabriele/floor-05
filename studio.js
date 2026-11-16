(() => {
  const $ = selector => document.querySelector(selector);
  const encoder = new TextEncoder();
  const b64 = array => {let s='';for(let i=0;i<array.length;i+=32768)s+=String.fromCharCode(...array.subarray(i,i+32768));return btoa(s);};
  const random = n => crypto.getRandomValues(new Uint8Array(n));
  const hex = array => [...array].map(v=>v.toString(16).padStart(2,'0')).join('');
  const concat = (...arrays) => {const result=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){result.set(a,offset);offset+=a.length;}return result;};

  async function prepareImage(file) {
    const image=await createImageBitmap(file,{imageOrientation:'from-image'});
    const factor=Math.min(1,1800/Math.max(image.width,image.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*factor);canvas.height=Math.round(image.height*factor);
    canvas.getContext('2d',{alpha:false}).drawImage(image,0,0,canvas.width,canvas.height);
    image.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
    if(!blob)throw new Error(`Impossibile convertire ${file.name}`);
    return new Uint8Array(await blob.arrayBuffer());
  }
  function crc32(data) {
    let crc=-1;
    for(const byte of data){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    return (crc^-1)>>>0;
  }
  function zip(files) {
    const local=[],central=[];let offset=0;
    for(const {name,data} of files) {
      const nameBytes=encoder.encode(name),crc=crc32(data);
      const head=new Uint8Array(30+nameBytes.length),h=new DataView(head.buffer);
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(8,0,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);
      h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nameBytes.length,true);head.set(nameBytes,30);
      local.push(head,data);
      const dir=new Uint8Array(46+nameBytes.length),d=new DataView(dir.buffer);
      d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);
      d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,nameBytes.length,true);
      d.setUint32(42,offset,true);dir.set(nameBytes,46);central.push(dir);offset+=head.length+data.length;
    }
    const directory=concat(...central),end=new Uint8Array(22),e=new DataView(end.buffer);
    e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
    e.setUint32(12,directory.length,true);e.setUint32(16,offset,true);
    return new Blob([...local,...central,end],{type:'application/zip'});
  }
  $('#form').addEventListener('submit',async event=>{
    event.preventDefault();
    const selected=[...$('#photos').files],password=$('#password').value,button=$('#generate');
    if(password!==$('#repeat').value){$('#status').textContent='Le due frasi sono diverse.';return;}
    if(!selected.length||password.length<14)return;
    button.disabled=true;
    try {
      const salt=random(16),iterations=310000;
      const input=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
      const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},input,{name:'AES-GCM',length:256},false,['encrypt']);
      const files=[],photos=[];
      for(let i=0;i<selected.length;i++) {
        $('#status').textContent=`Preparo ${i+1} di ${selected.length}…`;
        await new Promise(resolve=>setTimeout(resolve,0));
        const jpeg=await prepareImage(selected[i]);
        const nonce=random(12),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,jpeg));
        const filename=`${hex(random(16))}.bin`;
        files.push({name:`assets/${filename}`,data:concat(nonce,cipher)});
        photos.push({file:filename,caption:$('#caption').value.trim()});
      }
      const nonce=random(12),plain=encoder.encode(JSON.stringify({check:'FLOOR05-V1',photos}));
      const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,plain));
      const manifest={version:1,kdf:'PBKDF2-SHA256',iterations,salt:b64(salt),nonce:b64(nonce),ciphertext:b64(cipher)};
      files.push({name:'assets/manifest.json',data:encoder.encode(JSON.stringify(manifest))});
      files.push({name:'COME_CARICARE.txt',data:encoder.encode('FLOOR 05\n\n1. Estrai lo ZIP.\n2. Carica la cartella assets nel repository floor-05, sostituendo la precedente.\n3. Conserva la frase di accesso in un posto sicuro.\n4. Controlla il sito con la frase.\n\nNello ZIP ci sono soltanto foto cifrate e il manifesto cifrato. Non caricare mai gli originali.\n')});
      const result=zip(files),url=URL.createObjectURL(result),a=document.createElement('a');
      a.href=url;a.download='floor-05-archivio-cifrato.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
      $('#status').textContent=`Pronto: ${selected.length} foto cifrate (${(result.size/1048576).toFixed(1)} MB).`;
      $('#password').value='';$('#repeat').value='';
    } catch(error) {$('#status').textContent=`Errore: ${error.message}`;}
    finally {button.disabled=false;}
  });
})();
