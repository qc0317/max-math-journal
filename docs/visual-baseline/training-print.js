/* A4 student copy. Uses saved problem snapshots; never reads responses or solutions. */
let paperTraining=null,paperReturnFocus=null,paperOldTitle='',paperInert=[];
const paperImageCache=new Map();
function paperFigurePaths(q){return [...new Set([q.figure_asset,...(q.figure_assets||[])].filter(v=>typeof v==='string'&&v.startsWith('assets/')&&!v.split('/').includes('..')))];}
async function paperLoadFigures(training){await Promise.all(training.question_ids.flatMap(id=>paperFigurePaths(training.question_snapshots?.[id]||B[id]||{})).map(async path=>{if(paperImageCache.has(path))return;const im=new Image();im.src=encodeURI(path);await im.decode();paperImageCache.set(path,im);}));}
function paperFigure(path){const fig=paperElement('figure','paper-original-figure'),im=paperImageCache.get(path)?.cloneNode(true);if(!im)throw Error('题图尚未载入');im.alt='题目配图';im.style.cssText='display:block;max-width:100%;max-height:60mm;width:auto;height:auto;object-fit:contain';fig.style.cssText='margin:4mm 0;break-inside:avoid';fig.append(im);return fig;}
const paperMode=document.createElement('div');
paperMode.id='trainingPrintMode';paperMode.hidden=true;paperMode.setAttribute('role','dialog');paperMode.setAttribute('aria-modal','true');paperMode.setAttribute('aria-labelledby','paperModeTitle');
paperMode.innerHTML='<div class="paper-toolbar"><div><strong id="paperModeTitle">试卷打印模式</strong><span id="paperPageCount" aria-live="polite"></span></div><div class="paper-tools"><label>作答空间 <select id="paperSpacing"><option value="24">紧凑</option><option value="42" selected>标准</option><option value="65">宽松</option></select></label><button id="paperPrint" class="primary-action">打印 / 保存PDF</button><button id="paperClose">返回练习</button></div></div><div class="paper-tip">A4纵向 · 仅题目与作答区 · 答案、提示和历史作答不打印。打印窗口中可关闭浏览器页眉页脚。</div><div id="paperPages" class="paper-pages"></div>';
document.body.append(paperMode);
function paperElement(tag,cls,text){const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el}
function paperNewPage(first){
 const sheet=paperElement('section','paper-sheet'),header=paperElement('header',first?'paper-first-header':'paper-continuation-header');
 if(first){header.append(paperElement('p','paper-brand','拾级 · 数学练习'));header.append(paperElement('h1','paper-title',paperTraining.title));header.append(paperElement('p','paper-meta',`${paperTraining.question_ids.length}题　建议用时 ${paperTraining.minutes} 分钟${paperTraining.planned_date?'　计划日期 '+paperTraining.planned_date:''}${paperTraining.status==='draft'?'　草稿':''}`));header.append(paperElement('p','paper-student','姓名：________________　日期：________________'))}
 else{header.append(paperElement('span','paper-running-title',paperTraining.title));header.append(paperElement('span','paper-running-name','姓名：____________'))}
 const body=paperElement('div','paper-body'),footer=paperElement('footer','paper-footer');footer.append(paperElement('span','','拾级 · 数学练习'));footer.append(paperElement('span','paper-page-number',''));
 sheet.append(header,body,footer);document.querySelector('#paperPages').append(sheet);return body;
}
function paperBlock(number,text,continued=false,answerHeight=0){
 const box=paperElement('article','paper-question'),stem=paperElement('div','paper-question-stem');stem.append(paperElement('strong','paper-number',`${number}.${continued?'（续）':''}`));const rendered=paperElement('div','paper-question-text');rendered.innerHTML=bankMathText(text);stem.append(rendered);box.append(stem);
 if(answerHeight){const space=paperElement('div','paper-answer-space');space.style.height=answerHeight+'mm';space.setAttribute('aria-label','作答区');box.append(space)}
 return box;
}
function paperFits(body){return body.scrollHeight<=body.clientHeight+1}
function renderPaperPages(){
 if(!paperTraining)return;const pages=document.querySelector('#paperPages');pages.replaceChildren();const spacing=Number(document.querySelector('#paperSpacing').value);let body=paperNewPage(true);
 paperTraining.question_ids.forEach((id,index)=>{
  const q=paperTraining.question_snapshots?.[id]||B[id];if(!q)return;const paths=paperFigurePaths(q),text=q.statement;
  const full=paperBlock(index+1,text,false,spacing),space=full.querySelector('.paper-answer-space');for(const path of paths)full.insertBefore(paperFigure(path),space);body.append(full);
  if(paperFits(body))return;full.remove();if(body.children.length)body=paperNewPage(false);body.append(full);if(paperFits(body))return;full.remove();
  // Keep every character of long text, then place every necessary diagram and answer area.
  let rest=Array.from(text),continued=false,last=null;
  while(rest.length){const candidate=paperBlock(index+1,rest.join(''),continued,0);body.append(candidate);
   if(paperFits(body)){last=candidate;rest=[];break;}
   const box=candidate.querySelector('.paper-question-text');let lo=1,hi=rest.length,best=0;
   while(lo<=hi){const mid=Math.floor((lo+hi)/2);box.innerHTML=bankMathText(rest.slice(0,mid).join(''));if(paperFits(body)){best=mid;lo=mid+1}else hi=mid-1;}
   if(!best){candidate.remove();if(body.children.length){body=paperNewPage(false);continue;}throw Error('当前题目无法排入A4页面，请检查单行内容。');}
   const prefix=rest.slice(0,best).join(''),paragraph=prefix.lastIndexOf('\n');if(paragraph>prefix.length*.65)best=Array.from(prefix.slice(0,paragraph+1)).length;
   box.innerHTML=bankMathText(rest.slice(0,best).join(''));rest=rest.slice(best);continued=true;body=paperNewPage(false);
  }
  if(!last){last=paperBlock(index+1,'',true,0);body.append(last);}
  for(const path of paths){const fig=paperFigure(path);last.append(fig);if(!paperFits(body)){fig.remove();body=paperNewPage(false);last=paperBlock(index+1,'题图',true,0);last.append(fig);body.append(last);if(!paperFits(body))throw Error('题图超出A4页面');}}
  const answer=paperElement('div','paper-answer-space');answer.style.height=spacing+'mm';answer.setAttribute('aria-label','作答区');last.append(answer);if(!paperFits(body)){answer.remove();body=paperNewPage(false);body.append(paperBlock(index+1,'作答区',true,spacing));}
 });
 const sheets=[...pages.children];sheets.forEach((sheet,i)=>sheet.querySelector('.paper-page-number').textContent=`第 ${i+1} 页 / 共 ${sheets.length} 页`);document.querySelector('#paperPageCount').textContent=`${paperTraining.question_ids.length}题 · ${sheets.length}页`;
}
async function openTrainingPrint(id){
 const training=trainingStore.sessions.find(t=>t.id===id);if(!training)return;
 if(runnerId===id)saveRunner();if(document.querySelector('#recordDialog').open)document.querySelector('#recordDialog').close();
 paperTraining=training;paperReturnFocus=document.activeElement;paperOldTitle=document.title;document.title='拾级-'+training.title;
 paperMode.hidden=false;document.body.classList.add('training-print-open');paperInert=[...document.body.children].filter(e=>e!==paperMode).map(e=>[e,e.inert]);paperInert.forEach(([e])=>e.inert=true);
 try{document.querySelector('#paperPrint').disabled=true;document.querySelector('#paperPageCount').textContent='正在载入题图…';await paperLoadFigures(training);if(paperTraining!==training)return;renderPaperPages();document.querySelector('#paperPrint').disabled=false;document.querySelector('#paperPrint').focus()}catch(error){closeTrainingPrint();document.querySelector('#trainingNotice').textContent='排版未完成：'+error.message}
}
function closeTrainingPrint(){paperMode.hidden=true;document.body.classList.remove('training-print-open');document.title=paperOldTitle;paperInert.forEach(([e,inert])=>e.inert=inert);paperInert=[];paperTraining=null;paperReturnFocus?.focus()}
document.querySelector('#paperClose').onclick=closeTrainingPrint;document.querySelector('#paperSpacing').onchange=()=>{try{renderPaperPages()}catch(error){document.querySelector('#paperPageCount').textContent=error.message}};
document.querySelector('#paperPrint').onclick=()=>window.print();
paperMode.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeTrainingPrint()}if(e.key==='Tab'){const buttons=[...paperMode.querySelectorAll('button,select')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-print-training]');if(b)openTrainingPrint(b.dataset.printTraining)});
