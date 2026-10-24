import {readEnvelope,writeEnvelope} from './envelopes.mjs';
import {readFile,writeFile,mkdir,rename,rm,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,pbkdf2Sync,createCipheriv,createDecipheriv} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),docs=resolve(root,'docs');
let input='';for await(const c of process.stdin)input+=c;
const {oldPassword,newPassword}=JSON.parse(input);
if(!oldPassword||!newPassword||newPassword.length<16)throw new Error('New password must have at least 16 characters.');
const derive=(p,s)=>pbkdf2Sync(p,Buffer.from(s,'base64'),600000,32,'sha256');
function dec(e,k){const b=Buffer.from(e.data,'base64'),d=createDecipheriv('aes-256-gcm',k,Buffer.from(e.iv,'base64'));d.setAuthTag(b.subarray(-16));return Buffer.concat([d.update(b.subarray(0,-16)),d.final()]);}
function enc(b,k,s){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',k,iv);return {version:1,kdf:'PBKDF2-SHA256',iterations:600000,salt:s,iv:iv.toString('base64'),data:Buffer.concat([c.update(b),c.final(),c.getAuthTag()]).toString('base64')};}
const env=JSON.parse(await readFile(resolve(docs,'data.enc'),'utf8')),oldKey=derive(oldPassword,env.salt);
const data=dec(env,oldKey),db=JSON.parse(data),salt=randomBytes(16).toString('base64'),key=derive(newPassword,salt);
const staging=resolve(root,'.private/rekey');await mkdir(resolve(staging,'files'),{recursive:true});
for(const p of [...db.papers,...(db.archives||[])]){const e=await readEnvelope(resolve(docs,'files'),p.id+'.enc');await writeEnvelope(resolve(staging,'files'),p.id+'.enc',enc(dec(e,oldKey),key,salt));}
await writeFile(resolve(staging,'data.enc'),JSON.stringify(enc(data,key,salt)));
for(const name of await readdir(resolve(staging,'files')))await rename(resolve(staging,'files',name),resolve(docs,'files',name));
await rename(resolve(staging,'data.enc'),resolve(docs,'data.enc'));await rm(staging,{recursive:true,force:true});
console.log('Re-encrypted all current records and PDFs. Publish the entire docs folder together. Older Git history retains old ciphertext.');
