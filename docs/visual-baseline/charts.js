function attentionClass(c){const n=c.correct+c.wrong;return !n?'attention-empty':c.correct/n<.7?'attention-red':c.correct/n<.8?'attention-yellow':'attention-neutral'}
function attentionColor(c){return {'attention-red':'#b54b42','attention-yellow':'#b99025','attention-empty':'#bdbdbd','attention-neutral':'#222'}[attentionClass(c)]}
/* Default: accumulated performance. Knowledge structure uses the selected monochrome D3 force tree. */
let chartMode=new URLSearchParams((window.parent!==window?window.parent.location.search:location.search)).get('chart')==='force'?'force':'bars',chartEventsReady=false;
const domainIntroductions={number:'研究数的性质、运算，以及代数式的表示与变形。',equation:'用等式与不等式描述关系，求解并讨论条件。',function:'研究变量间的对应关系、变化规律及其图像。',geometry:'研究图形性质、空间关系与几何证明。',statistics:'从数据中提取信息，分析随机现象与不确定性。',application:'综合运用数学工具，完成建模、计数与推理论证。'};

const domainIntroductionLines={number:['研究数的性质、运算，','以及代数式的表示与变形。'],equation:['用等式与不等式描述关系，','求解并讨论条件。'],function:['研究变量间的对应关系，','变化规律及其图像。'],geometry:['研究图形性质、空间关系','与几何证明。'],statistics:['从数据中提取信息，','分析随机现象与不确定性。'],application:['综合运用数学工具，','完成建模、计数与推理论证。']};
function domainCorrectRate(c){const n=c.correct+c.wrong;return n?(100*c.correct/n).toFixed(1).replace(/\.0$/,'')+'%':'—'}

const networkIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 2M7 7l3 11m7-9l-7 9"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="9" r="3"/><circle cx="10" cy="19" r="3"/></svg>';
const performanceIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h12M4 19h8"/></svg>';
function renderOverview(){
 const eligible=C.nodes.filter(allowed),tot=countFor(eligible);
 document.querySelector('#scopeCorrect').textContent=tot.correct;document.querySelector('#scopeWrong').textContent=tot.wrong;
 document.querySelector('#totalOverview').textContent=`累计 ${D.papers.length} 份试卷 · ${D.questions.length} 道编号题`;
 document.querySelector('#chartTitle').textContent=chartMode==='force'?'知识结构':'掌握情况';
 const toggle=document.querySelector('#structureToggle');toggle.innerHTML=(chartMode==='force'?performanceIcon:networkIcon)+`<span>${chartMode==='force'?'掌握情况':'知识结构'}</span>`;toggle.setAttribute('aria-label',chartMode==='force'?'掌握情况':'知识结构');toggle.title=chartMode==='force'?'返回掌握情况':'知识结构';toggle.setAttribute('aria-pressed',String(chartMode==='force'));
 document.querySelector('#barsView').classList.toggle('hidden',chartMode!=='bars');document.querySelector('#forceView').classList.toggle('hidden',chartMode!=='force');
 const records=domains.map(d=>({...d,counts:countFor(eligible.filter(n=>n.domain_id===d.id))})),max=Math.max(1,...records.map(d=>d.counts.correct+d.counts.wrong));
 document.querySelector('#domains').innerHTML=records.map((d,i)=>{const c=d.counts,total=c.correct+c.wrong;return `<button data-domain="${d.id}" class="mastery-row ${attentionClass(c)} ${selectedDomain===d.id?'active':''}" aria-label="${d.name}，正确${c.correct}题，错误${c.wrong}题"><span class="domain-index">${String(i+1).padStart(2,'0')}</span><span class="domain-editorial"><span class="domain-title"><i class="attention-dot ${attentionClass(c)}"></i>${d.name}</span><span class="domain-description" title="${domainIntroductions[d.id]}">${domainIntroductionLines[d.id].map(esc).join('<br>')}</span></span><span class="domain-distribution"><span class="domain-total">${total?`已收录 ${total} 题`:'暂无作答记录'}</span><span class="domain-rate" title="正确率＝正确题数÷已收录题数"><small>正确率</small><b>${domainCorrectRate(c)}</b></span><span class="distribution-track"><span class="distribution-correct" style="width:${c.correct/max*100}%"></span><span class="distribution-wrong" style="width:${c.wrong/max*100}%"></span></span></span><span class="domain-numbers"><span class="correct-number"><small>正确</small><b>${total?c.correct:'—'}</b></span><span class="wrong-number"><small>错误</small><b>${total?c.wrong:'—'}</b></span></span></button>`}).join('');
 if(!chartEventsReady){toggle.addEventListener('click',()=>{chartMode=chartMode==='bars'?'force':'bars';renderOverview()});chartEventsReady=true}
 if(chartMode==='force')renderKnowledgeTree();else stopKnowledgeTree();
 renderNodes();
}

const grouping={
 number:[['数与运算',['rational','arithmetic','powers']],['绝对值',['distance','absolute','absolute-min','nonnegative']],['式的运算',['polynomial','factor','fraction','radical']],['整数与数论',['divisibility','divisors','gcd','congruence']],['数列与代数拓展',['telescoping','products','sets','complex','sequence','recursion']]],
 equation:[['基础方程',['linear','systems','definition','quadratic','fraction-eq']],['含参与特殊方程',['parameter','integer','absolute-eq','identity','floor','structured']],['不等式与最值',['linear-ineq','quadratic-ineq','inequalities','equality-case','parameter-range']]],
 function:[['初中函数',['coordinate','linear-fn','inverse','quadratic-fn']],['高中函数',['properties','exponential','trig','transform','derivative']],['竞赛函数',['functional-eq']]],
 geometry:[['平面几何',['lines','triangles','quadrilaterals','similarity','circle','transform-geo','trig-geo','construction']],['向量与空间',['vectors','solid','space-vectors']],['解析几何',['analytic','conics']],['几何拓展',['advanced-plane','geometry-method']]],
 statistics:[['数据与统计',['data','summary','sampling','regression']],['随机与概率',['probability','counting-prob','conditional','distributions','expectation']]],
 application:[['应用与实践',['model','exploration']],['组合与证明',['counting','inclusion','pigeonhole','constructive','invariant','graph']]]
};
function chartGroups(){return domains.flatMap(d=>(grouping[d.id]||[]).map(([name,ids],i)=>({id:`group:${d.id}:${i}`,name,domain_id:d.id,nodes:C.nodes.filter(n=>ids.includes(n.id.split('.')[1])&&n.domain_id===d.id&&allowed(n))}))).filter(g=>g.nodes.length)}
