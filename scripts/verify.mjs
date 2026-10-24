import {readEnvelope} from './envelopes.mjs';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pbkdf2Sync,createDecipheriv,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
let password='';for await(const c of process.stdin)password+=c;password=password.replace(/[\r\n]+$/,'');
const envelope=JSON.parse(await readFile(resolve(root,'docs/data.enc'),'utf8'));
const derive=p=>pbkdf2Sync(p,Buffer.from(envelope.salt,'base64'),600000,32,'sha256');
const key=derive(password);
function dec(e,k){const b=Buffer.from(e.data,'base64'),d=createDecipheriv('aes-256-gcm',k,Buffer.from(e.iv,'base64'));d.setAuthTag(b.subarray(-16));return Buffer.concat([d.update(b.subarray(0,-16)),d.final()]);}
assert.throws(()=>dec(envelope,derive(password+'-incorrect')));
const db=JSON.parse(dec(envelope,key));assert.equal(db.schemaVersion,1);
const ids=new Set(db.papers.map(p=>p.id));assert.equal(ids.size,db.papers.length);
for(const r of db.reviews)assert.ok(ids.has(r.paperId),'Every review must link to an archived paper.');
for(const p of [...db.papers,...(db.archives||[])]){
 const env=await readEnvelope(resolve(root,'docs/files'),p.id+'.enc');
 const plain=dec(env,key);assert.equal(plain.subarray(0,5).toString(),'%PDF-');
 assert.equal(createHash('sha256').update(plain).digest('hex'),p.id,'Decryption must reproduce the exact source PDF.');
 const tampered={...env,data:env.data.slice(0,-8)+'AAAAAAAA'};assert.throws(()=>dec(tampered,key));
}
console.log(`Verified ${db.papers.length} papers, ${(db.archives||[]).length} original archives, ${db.reviews.length} linked reviews. Wrong passwords and modified ciphertext rejected.`);
