import {readEnvelope,writeEnvelope} from './envelopes.mjs';
import {readFile,writeFile,mkdir,rename,rm,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,pbkdf2Sync,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const catalogPath=resolve(process.argv[2]||resolve(root,'.private/catalog.json'));
const seedPath=process.argv[3]?resolve(process.argv[3]):null;
// stdin contains only the password. Never store a password in argv or a file.
let password='';for await(const chunk of process.stdin)password+=chunk;
password=password.replace(/[\r\n]+$/,'');
if(!password)throw new Error('A password is required on stdin.');
const docs=resolve(root,'docs'),dataPath=resolve(docs,'data.enc');
function derive(s){return pbkdf2Sync(password,Buffer.from(s,'base64'),600000,32,'sha256');}
function decrypt(e,k){const packed=Buffer.from(e.data,'base64');const d=createDecipheriv('aes-256-gcm',k,Buffer.from(e.iv,'base64'));d.setAuthTag(packed.subarray(-16));return Buffer.concat([d.update(packed.subarray(0,-16)),d.final()]);}
function encrypt(buffer,k,s){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',k,iv);return {version:1,kdf:'PBKDF2-SHA256',iterations:600000,salt:s,iv:iv.toString('base64'),data:Buffer.concat([c.update(buffer),c.final(),c.getAuthTag()]).toString('base64')};}
let old,oldKey;
try{old=JSON.parse(await readFile(dataPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let db={schemaVersion:1,papers:[],reviews:[],archives:[]};
if(old){oldKey=derive(old.salt);try{db=JSON.parse(decrypt(old,oldKey));}catch{throw new Error('Existing data could not be unlocked; no files changed.');}}
const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
const seed=seedPath?JSON.parse(await readFile(seedPath,'utf8')):[];
db.archives ||= [];
const salt=randomBytes(16).toString('base64'),key=derive(salt);
const staged=resolve(root,'.private/staged');await mkdir(resolve(staged,'files'),{recursive:true});
for(const item of catalog){
 const content=await readFile(item.path);
 if(createHash('sha256').update(content).digest('hex')!==item.id)throw new Error('Source changed since inventory; run catalog again.');
 if(item.kind==='source'){
  if(!db.archives.some(p=>p.id===item.id))db.archives.push({id:item.id,title:item.title,pages:item.pages});
 }else if(!db.papers.some(p=>p.id===item.id)){
  const match=seed.find(s=>s.sourceTitle===item.title)||{};
  db.papers.push({id:item.id,title:item.title,shortTitle:item.title,kind:'practice',pages:item.pages,score:null,maxScore:100,date:null,confirmed:false,topics:[],note:'新导入资料，等待核对。',...match});
  delete db.papers.at(-1).sourceTitle;
 }
 await writeEnvelope(resolve(staged,'files'),item.id+'.enc',encrypt(content,key,salt));
}
// Retain archived sources even when removed from the local input folder.
for(const paper of [...db.papers,...db.archives].filter(p=>!catalog.some(c=>c.id===p.id))){
 if(!oldKey)throw new Error('Missing archive source.');
 const envelope=await readEnvelope(resolve(docs,'files'),paper.id+'.enc');
 await writeEnvelope(resolve(staged,'files'),paper.id+'.enc',encrypt(decrypt(envelope,oldKey),key,salt));
}
db.updatedAt=new Date().toISOString();
await writeFile(resolve(staged,'data.enc'),JSON.stringify(encrypt(Buffer.from(JSON.stringify(db)),key,salt)));
// All source reads and encryptions succeed before replacing the deployable files.
await mkdir(resolve(docs,'files'),{recursive:true});
for(const name of await readdir(resolve(staged,'files')))await rename(resolve(staged,'files',name),resolve(docs,'files',name));
await rename(resolve(staged,'data.enc'),dataPath);
await rm(staged,{recursive:true,force:true});
console.log(`Built ${db.papers.length} encrypted PDFs and encrypted learning records. No plaintext copied to docs.`);
