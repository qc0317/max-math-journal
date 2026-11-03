/* Logo text bounds alignment begin */
(()=>{
 if(!document.createRange)return;
 const brand=document.querySelector('.gate-brand,.brand');
 const title=brand?.classList.contains('gate-brand')?brand:brand?.querySelector(':scope > span');
 const logo=brand?.querySelector(':scope > img.visual-brand-logo');
 const text=title&&Array.from(title.childNodes).find(node=>node.nodeType===3&&node.textContent.includes('拾级'));
 if(!text||!logo||!document.createRange)return;
 const range=document.createRange(),start=text.textContent.indexOf('拾级');
 range.setStart(text,start);range.setEnd(text,start+2);
 const align=()=>{
  const bounds=range.getBoundingClientRect(),box=brand.getBoundingClientRect();
  if(!(bounds.height>0))return;
  const ratio=logo.naturalWidth&&logo.naturalHeight?logo.naturalWidth/logo.naturalHeight:1;
  logo.style.height=bounds.height+'px';
  logo.style.width=bounds.height*ratio+'px';
  logo.style.left=Math.min(0,bounds.left-box.left-bounds.height*ratio-8)+'px';
  logo.style.top=(bounds.top-box.top+bounds.height/2)+'px';
 };
 align();
 logo.addEventListener('load',align);
 window.addEventListener('resize',align,{passive:true});
 document.fonts?.ready.then(align);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(align).observe(brand);
})();
/* Logo text bounds alignment end */
import {PlainLRU,verifiedCipher} from './cache.mjs';
const $=s=>document.querySelector(s),frame=$('#portal'),memory=new PlainLRU(),pending=new Map(),urls=new Map();let key,core,boot,epoch=0,vault;const requests=[];window.lazyDiagnostics={requests,memory};
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const sessionId='shiji-unlock:'+location.pathname;
const progress=document.createElement('div');
progress.hidden=true;
progress.setAttribute('role','status');
progress.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#fff;color:#222;padding:12px;border:1px solid #ccc;border-radius:8px;z-index:10000';
document.body.append(progress);
function loading(message, retry=false){
  progress.hidden=!message;
  progress.textContent=message;
  if(retry){
    const button=document.createElement('button');
    button.textContent='重试';
    button.onclick=()=>location.reload();
    progress.append(' ',button);
  }
}
function savedSession(value){
  try{
    if(value===undefined)return JSON.parse(sessionStorage.getItem(sessionId));
    if(value===null)sessionStorage.removeItem(sessionId);
    else sessionStorage.setItem(sessionId,JSON.stringify(value));
  }catch{}
}
async function load(id,meta=core.manifest[id]){const cached=memory.get(id);if(cached)return cached;if(pending.has(id))return pending.get(id);const current=epoch,p=(async()=>{const cache=await globalThis.caches?.open('shiji-cipher-'+boot.releaseId).catch(()=>null),url=new URL(meta.path,location.href),b=await verifiedCipher({cache,url,hash:meta.cipherSha256,fetcher:u=>{requests.push(id);return fetch(u,{cache:'reload',signal:AbortSignal.timeout(30000)})},digest:async b=>hex(await crypto.subtle.digest('SHA-256',b))});const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12),additionalData:new TextEncoder().encode(JSON.stringify(['shiji-modular-v1',boot.releaseId,id,1]))},key,b.slice(12)),plain=await new Response(new Blob([decrypted]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();if(current!==epoch)throw Error('已锁定');if(plain.byteLength!==meta.plainBytes)throw Error('分片大小错误');const value=JSON.parse(new TextDecoder().decode(plain));memory.set(id,value,plain.byteLength);return value})();pending.set(id,p);try{return await p}finally{pending.delete(id)}}
const resourceMeta=new Map();function register(value){if(!value||typeof value!=='object')return;for(const [p,m]of Object.entries(value._assets||{}))resourceMeta.set(p,m);if(Array.isArray(value))value.forEach(register);else for(const [k,v]of Object.entries(value))if(k!=='_assets')register(v)}
async function assetURL(p){p=decodeURI(p).split('#')[0];if(urls.has(p))return urls.get(p);const d=await load('resource/'+p,resourceMeta.get(p)),data=bytes(d.base64),url=URL.createObjectURL(new Blob([data],{type:d.mime}));urls.set(p,url);return url}
async function training(){if(!vault){const {prepareVault}=await import('./vault.mjs'),current=epoch;vault=await prepareVault({key,valid:()=>current===epoch,demo:new URLSearchParams(location.search).get('demo')==='1'});window.mathTrainingVault=vault}await vault.flush?.().catch(()=>{});return vault}
async function openPDF(request){const p=core.visual.context.papers.find(p=>p.id===request.id||p.paper_id===request.id);if(!p)return;$('#pdfTitle').textContent=p.title;$('#pdfStatus').textContent='正在打开原卷…';$('#pdfDialog').showModal();try{const url=await assetURL(p.local_pdf);$('#pdfFrame').src=url+'#page='+Math.max(1,Number(request.page)||1);$('#pdfDownload').href=url;$('#pdfDownload').download=p.file;$('#pdfDownload').hidden=false;$('#pdfStatus').textContent=''}catch{$('#pdfStatus').textContent='原卷未能打开，请稍后重试。'}}
async function unlock(resume){$('#unlockButton').disabled=true;$('#message').textContent='正在打开…';const current=++epoch;try{loading('正在加载页面…');boot=await(await fetch('bootstrap.json',{cache:'no-store',signal:AbortSignal.timeout(30000)})).json();if(resume?.release===boot.releaseId){key=await crypto.subtle.importKey('raw',bytes(resume.key),'AES-GCM',false,['encrypt','decrypt']);}else{if(resume)throw Error('版本已更新');const material=await crypto.subtle.importKey('raw',new TextEncoder().encode($('#password').value),'PBKDF2',false,['deriveKey']);$('#password').value='';key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(boot.salt),iterations:boot.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);}core=await load('core',boot.core);if(current!==epoch)return;if(!core.visual)throw Error('视觉壳缺失');if(!resume){const raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));savedSession({release:boot.releaseId,key:btoa(String.fromCharCode(...raw))});}register(core.visual.context.papers);window.visualBridge={context:core.visual.context,bankStats:core.visual.bankStats,exam:async id=>{const d=await load('exam/'+id);register(d);return d},loading,bank:async()=>{const rows=[];const ids=core.routes.bank;for(let i=0;i<ids.length;i++){loading('正在加载题库 '+Math.floor(i/ids.length*100)+'%');rows.push(...(await load(ids[i])).rows);}loading('正在加载题库 100% · 整理页面…');return rows},question:async(id,row)=>{const q=(await load(row.detail,row.meta)).question;register(q);return q},training,trainingBackup:async()=>{const sessions=[];for(const id of core.routes.practice)sessions.push(...(await load(id)).rows);return {version:1,sessions}},assetURL,ready(){if(current===epoch){frame.hidden=false;$('#gate').hidden=true;$('#lock').hidden=false;$('#message').textContent=''}},failed(){loading('页面未能加载，请重试。',true)}};const controller=core.visual.controller.replace(/(?<![\w.])location\.hash\b/g,"window.parent.location.hash").replace(/<\/script/gi,'<\\/script');frame.hidden=false;$('#gate').hidden=true;$('#lock').hidden=false;frame.srcdoc=core.visual.html.replace('</body>','<script src="visual-baseline/vendor/d3.v7.9.0.min.js"></script><script src="visual-baseline/force-tree.js"></script><script src="visual-baseline/charts.js"></script><script>'+controller+'</script><script src="visual-frame.js"></script></body>');}catch{loading('');if(resume)savedSession(null);$('#message').textContent=resume?'请重新输入家庭口令。':'未能解锁，请核对口令或稍后重试。';key=null;core=null;memory.clear()}finally{$('#unlockButton').disabled=false}}
$('#unlock').onsubmit=e=>{e.preventDefault();unlock()};
const resume=savedSession();
if(resume)unlock(resume);
async function exportRecord(name){const ids=core.visual.exports?.[name];if(!ids)return;const chunks=[];for(const id of ids)chunks.push((await load(id)).text);const url=URL.createObjectURL(new Blob(chunks,{type:name.endsWith('.json')?'application/json':'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#pdfClose').onclick=()=>{$('#pdfDialog').close();$('#pdfFrame').src='about:blank'};$('#lock').onclick=()=>{savedSession(null);loading('');epoch++;try{frame.contentWindow.stopKnowledgeTree?.();window.removeEventListener('hashchange',frame.contentWindow.route);window.removeEventListener('popstate',frame.contentWindow.route)}catch{}frame.srcdoc='';frame.hidden=true;$('#gate').hidden=false;$('#lock').hidden=true;key=null;core=null;vault=null;memory.clear();pending.clear();resourceMeta.clear();for(const u of urls.values())URL.revokeObjectURL(u);urls.clear();delete window.mathTrainingVault;delete window.visualBridge;$('#password').value='';$('#message').textContent=''};window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||!core||e.origin!==location.origin)return;if(e.data?.type==='math-open-paper')openPDF(e.data);if(e.data?.type==='math-export-record')exportRecord(e.data.name).catch(()=>{$('#message').textContent='导出未完成，请重试'})});
