import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const limit=16_000_000;
export async function readEnvelope(folder,name){
 const envelope=JSON.parse(await readFile(resolve(folder,name),'utf8'));
 if(!envelope.parts)return envelope;
 if(!envelope.parts.every(p=>/^[a-f0-9]{64}\.enc\.\d{3}$/.test(p)))throw new Error('Invalid archive parts.');
 return JSON.parse((await Promise.all(envelope.parts.map(p=>readFile(resolve(folder,p),'utf8')))).join(''));
}
export async function writeEnvelope(folder,name,envelope){
 const text=JSON.stringify(envelope);
 if(text.length<=limit){await writeFile(resolve(folder,name),text);return;}
 const parts=[];
 for(let i=0;i<text.length;i+=limit){const part=name+'.'+String(parts.length).padStart(3,'0');parts.push(part);await writeFile(resolve(folder,part),text.slice(i,i+limit));}
 await writeFile(resolve(folder,name),JSON.stringify({format:'chunked-json-v1',parts}));
}
