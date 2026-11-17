export const readingRoutes=['evaluation','analysis','questions','sources'];
export function examImages(q){return [...new Set([q.source_image,q.answer_image,q.definition_figure,...(['P8','P9'].includes(q.paper_id)&&q.math_format==='tex'?[q.figure_asset,...(q.figure_assets||[])]:[])].filter(p=>typeof p==='string'&&p.startsWith('assets/')&&!p.split('/').includes('..')))]}
export function questionFilter(qs,{paper='',node='',status='wrong',word=''}={},nodes={}){word=word.trim().toLowerCase();return qs.filter(q=>(!paper||q.paper_id===paper)&&(!node||q.primary_node===node)&&(status==='all'||status==='wrong'&&q.points_lost>0||status==='correct'&&q.points_lost===0)&&(!word||[q.statement,q.knowledge,nodes[q.primary_node]?.name||'',q.id].join(' ').toLowerCase().includes(word)))}
export function historyWindow(papers,offset=0,size=5){const sorted=[...papers].sort((a,b)=>a.date.localeCompare(b.date)||a.paper_id.localeCompare(b.paper_id)),maxOffset=Math.max(0,sorted.length-size),actual=Math.min(Math.max(0,offset),maxOffset),end=sorted.length-actual;return {papers:sorted.slice(Math.max(0,end-size),end),offset:actual,maxOffset}}
export function paperTerm(p){if(p.term)return p.term;const y=Number(p.date.slice(0,4)),m=Number(p.date.slice(5,7));return m>=8?`${y}—${y+1}学年 · 上学期`:m<=1?`${y-1}—${y}学年 · 上学期`:`${y-1}—${y}学年 · 下学期`}
export function domainStats(curriculum,counts,stage='all'){return curriculum.domains.map(d=>{const ns=curriculum.nodes.filter(n=>n.domain_id===d.id&&(stage==='all'||n.stages.includes(stage))),c={correct:0,wrong:0,practice_correct:0,practice_wrong:0};for(const n of ns)for(const k in c)c[k]+=counts[n.id]?.[k]||0;return {...d,...c,nodes:ns}})}
export function rate(c){return c.correct+c.wrong?Math.round(c.correct/(c.correct+c.wrong)*100):null}
export function attention(c){const r=rate(c);return r==null?'unseen':r<70?'danger':r<80?'warning':'normal'}
export function routeIntent(location){const p=new URLSearchParams(location.search),raw=location.hash.slice(1);let route=raw||'home';if(p.get('section')==='exams')route='analysis';return {route,paper:p.get('paper_id')||p.get('paper')||p.get('exam')||'',question:p.get('question_id')||'',node:p.get('node')||''}}

// Large question-to-node maps are carried in bounded model parts, then merged losslessly.
export function partitionReadingModel(model,maxBytes=400000){
 const encoder=new TextEncoder(),size=v=>encoder.encode(JSON.stringify(v)).length;
 const {trainingNodeIndex={},questions,...base}=model,parts=[{...base,trainingNodeIndex:{},...(questions===undefined?{}:{questions:[]})}];
 if(size(parts[0])>maxBytes)throw Error('Reading model base exceeds budget');
 let index={},bytes=2;
 const flush=()=>{if(Object.keys(index).length)parts.push({trainingNodeIndex:index});index={};bytes=2;};
 for(const [id,node] of Object.entries(trainingNodeIndex)){
  const added=size({[id]:node})-2+(bytes>2?1:0);
  if(bytes+added>maxBytes-32)flush();
  if(size({[id]:node})>maxBytes-32)throw Error('Reading model index entry exceeds budget');
  index[id]=node;bytes+=size({[id]:node})-2+(bytes>2?1:0);
 }
 flush();
 if(questions!==undefined){
  if(!Array.isArray(questions))throw Error('Reading questions must be an array');
  let rows=[];const flushQuestions=()=>{if(rows.length)parts.push({questions:rows});rows=[]};
  for(const question of questions){if(size({questions:[question]})>maxBytes)throw Error('Reading question exceeds budget');if(size({questions:[...rows,question]})>maxBytes)flushQuestions();rows.push(question)}
  flushQuestions();
 }
 return parts;
}
export function mergeReadingModels(parts){
 const model=structuredClone(parts[0]||{});
 for(const part of parts.slice(1)){const previous=model.trainingNodeIndex,questions=model.questions;Object.assign(model,part);if(part.trainingNodeIndex)model.trainingNodeIndex={...previous,...part.trainingNodeIndex};if(part.questions)model.questions=[...(questions||[]),...part.questions];}
 return model;
}
