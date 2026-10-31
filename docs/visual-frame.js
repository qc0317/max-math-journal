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
  logo.style.top=(bounds.top-box.top+bounds.height/2)+'px';
 };
 align();
 logo.addEventListener('load',align);
 window.addEventListener('resize',align,{passive:true});
 document.fonts?.ready.then(align);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(align).observe(brand);
})();
/* Logo text bounds alignment end */
/* Async data adapter beneath the unchanged v1.2.0 DOM/renderers. Classic script scope. */
(async()=>{const bridge=window.parent.visualBridge,loadedExams=new Set(),bankRows=new Map();let bankPromise,printPromise,serial=0;
 const ensureExam=async id=>{if(loadedExams.has(id))return;const e=await bridge.exam(id);for(const q of e.questions){const i=D.questions.findIndex(x=>x.id===q.id);if(i>=0)D.questions[i]=q}const i=D.paper_analyses.findIndex(a=>a.paper_id===id);if(i>=0)D.paper_analyses[i]=e.analysis;else D.paper_analyses.push(e.analysis);loadedExams.add(id)};
 const allExams=()=>Promise.all(D.papers.map(p=>ensureExam(p.paper_id)));
 const script=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('模块加载失败'));document.body.append(s)});
 const busy=async(fn,target=document.querySelector('.view:not(.hidden)'))=>{target?.setAttribute('aria-busy','true');try{return await fn()}finally{target?.removeAttribute('aria-busy')}};
 const oldPaper=renderPaper,oldQuestions=renderQuestions,oldQuestion=openQuestion,oldNode=openNode,oldHistory=openHistoryQuestions,oldCard=card;
 window.card=(...args)=>oldCard(...args).replace(/<img src="([^"]+)"/g,'<img data-visual-src="$1"');
 window.renderPaper=()=>busy(async()=>{await ensureExam(selectedPaperId);oldPaper()});window.renderQuestions=()=>busy(async()=>{await allExams();oldQuestions()});window.openQuestion=id=>busy(async()=>{await ensureExam(id.split('-')[0]);oldQuestion(id)});window.openNode=id=>busy(async()=>{await Promise.all([...new Set(D.questions.filter(q=>q.primary_node===id).map(q=>q.paper_id))].map(ensureExam));oldNode(id)});window.openHistoryQuestions=(id,paper)=>busy(async()=>{await ensureExam(paper);oldHistory(id,paper)});
 const hydrate=async ids=>{await Promise.all([...new Set(ids)].filter(id=>bankRows.has(id)).map(async id=>{const q=await bridge.question(id,bankRows.get(id));B[id]=q;const i=BANK.findIndex(x=>x.id===id);if(i>=0)BANK[i]=q}));};
 window.installLegacyBankAdapters=()=>{const original={render:renderBank,open:openBankQuestion,composer:openComposer,preview:renderComposePreview,save:saveComposer,run:runTraining};
 window.bankFiltered=()=>{const word=$('#bankSearch').value.trim().toLowerCase(),node=$('#bankNode').value,level=$('#bankLevel').value,ready=$('#bankReady').value,paper=$('#bankPaper').value;return BANK.filter(q=>{const row=bankRows.get(q.id);return(!node||q.primary_node===node||(q.tags?.knowledge||[]).includes(node))&&(!level||(level==='pending'?q.difficulty==null:String(q.difficulty)===level))&&(!ready||q.readiness===ready)&&(!paper||q.source.paper_id===paper)&&(!word||row.search.includes(word))})};
 window.renderBank=()=>busy(async()=>{const current=++serial,qs=bankFiltered(),pages=Math.max(1,Math.ceil(qs.length/50));bankPage=Math.min(bankPage,pages);await hydrate(qs.slice((bankPage-1)*50,bankPage*50).map(q=>q.id));if(current===serial)original.render()});window.openBankQuestion=id=>busy(async()=>{await hydrate([id]);if(B[id]?.legacy_id)await ensureExam(B[id].legacy_id.split('-')[0]);original.open(id)});window.openComposer=(node='',ids=[],...args)=>busy(async()=>{await hydrate(ids);original.composer(node,ids,...args);await window.renderComposePreview()});window.renderComposePreview=()=>busy(async()=>{await hydrate(composeIds);original.preview()});window.saveComposer=e=>{e.preventDefault();return busy(async()=>{await hydrate(composeIds);original.save(e)})};window.runTraining=id=>busy(async()=>{const t=trainingStore.sessions.find(t=>t.id===id);if(t)await hydrate(t.question_ids);original.run(id)});
 const originalImages=bankDetailImages;window.bankDetailImages=(...args)=>originalImages(...args).replace(/<img src="([^"]+)"/g,'<img data-visual-src="$1"');};
 const ensureBank=()=>bankPromise??=busy(async()=>{await allExams();const rows=await bridge.bank();for(const r of rows)bankRows.set(r.id,r);D.question_bank={questions:[]};D.question_bank_staging={questions:rows.map(r=>({id:r.id,title:r.title,statement:r.title,legacy_id:r.legacy_id,primary_node:r.primary_node,difficulty:r.difficulty,readiness:r.readiness,tags:{knowledge:r.knowledge,topic:[],method:[]},source:{title:r.source,paper_id:r.paper}}))};D.question_bank_review=[];await bridge.training();D.training_sessions=await bridge.trainingBackup();await script('visual-baseline/bank-training.js');await window.renderBank()});
 const originalRoute=route;window.route=()=>busy(async()=>{let id=window.parent.location.hash.slice(1)||'evaluation';const params=new URLSearchParams(window.parent.location.search);if(params.get('section')==='exams'){const u=new URL(window.parent.location.href);u.searchParams.delete('section');u.hash='analysis';window.parent.history.replaceState(null,'',u);id='analysis'}if(id==='analysis')await renderPaper();if(id==='questions')await renderQuestions();if(id==='bank'||id==='practice')await ensureBank();originalRoute();if(id==='evaluation')renderMap()});
 document.addEventListener('click',e=>{const compose=e.target.closest('[data-compose-node]');if(compose&&!bankPromise){e.preventDefault();e.stopImmediatePropagation();ensureBank().then(()=>openComposer(compose.dataset.composeNode)).catch(err=>bridge.failed(err.message));return}const b=e.target.closest('[data-print-training]');if(!b||printPromise)return;e.preventDefault();e.stopImmediatePropagation();const id=b.dataset.printTraining;printPromise=busy(async()=>{const t=trainingStore.sessions.find(t=>t.id===id);if(t)await hydrate(t.question_ids);await script('visual-baseline/training-print.js');const originalPrint=openTrainingPrint;window.openTrainingPrint=id=>busy(async()=>{const t=trainingStore.sessions.find(t=>t.id===id);if(t)await hydrate(t.question_ids);originalPrint(id)});await openTrainingPrint(id)}).catch(err=>{$('#trainingNotice').textContent=err.message;printPromise=null})},true);
 const resolveImages=()=>document.querySelectorAll('img[data-visual-src]').forEach(img=>{const p=img.getAttribute('data-visual-src');img.removeAttribute('data-visual-src');bridge.assetURL(p).then(url=>{if(img.isConnected)img.src=url}).catch(()=>{img.alt+='（资源未能载入）'})});new MutationObserver(resolveImages).observe(document.body,{childList:true,subtree:true});resolveImages();window.parent.addEventListener('hashchange',window.route);window.parent.addEventListener('popstate',window.route);await window.route();bridge.ready();})().catch(e=>window.parent.visualBridge.failed(e.message));
