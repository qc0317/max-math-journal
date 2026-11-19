// Stable local handbook. Live counters belong to the cockpit, not this document.
const wikiSections=[
['项目是什么','拾级是Max的数学学习档案与训练系统。保留原始考试和作答，分析失分，再从独立题库组卷训练。题库内容不等于学生成绩，训练结果也不能覆盖原始考试。'],
['模块如何连接','原卷与原答 → 错题事实 → 知识点与错因分析 → 从题库选题 → 练习、打印及作答 → 新的学习记录。每条分析应能回到具体作答；题库修订保留稳定题号，历史练习保留当时题目版本。'],
['来源与范围','当前题库覆盖资优生练习册、奥数精讲与测试、交大之星等独立资源。资优生教材本不属于已批准的题库来源，不能把误录教材题送给用户反复核验。题目总量按有效唯一ID计算，重复与非题目另列；未录入部分用原题页覆盖表示，不猜全书题数。'],
['录入怎么做','小欧定位原题和书答，录入可检索题干、清楚详解、来源及必要图形，完成自检后直接更新同一个DEV。原题截图只作折叠证据，不替代文字；图形必须正确对应，不能为文本化而删除。普通批次不等待QA前置批准。'],
['修复怎么做','小欧二号依据具体问题清单核对当前题目，修题干、答案映射、推导、公式和配图，及时同步DEV。先排除OCR、映射、模型与计算错误，再判断原书矛盾；不能把排版候选全当内容错误。已有人工裁定保留依据，不能静默推翻。'],
['QA怎么做','小磊只读核验真实DEV：先全量机械检查，再普通题分层抽查、高风险逐题深验，按同页和自然章节连续处理。普通题不强制单独脚本和截图；复杂证明、图形、跨页及冲突保留必要证据。集中交付题号、问题、依据、建议和受测版本，不自行修改数据或派修。'],
['用户如何裁定','在“我的裁定”查看具体题目、问题、建议方向，选择或填写其他意见后提交。制作人落实修订并回填结果；题干、答案、必要图和解法齐全后同步DEV与资格。未处理的内容冲突保持可查看、不可组题，不能用反复确认代替修复。'],
['DEV、管理台与GitHub','DEV为http://127.0.0.1:8781/，是及时可见的题目工作现场。管理台为8771，记录任务、裁定和进度。GitHub是用户批准后发布的稳定快照；线上/project/也是发布快照，不自动随本地更新。当前工作根目录D:/AI/Projects/LevelUp-Pilot，源码与工具在LevelUP，课程资源在Curriculum。'],
['协作与并行','小欧录入、小欧二号修复、小磊QA可并行。更新DEV从最新共享源构建，不能用旧快照覆盖另一条线；检测到别人的未完成新增时协调自然批次合并。完成或真实阻塞后主动通知制作人并回填管理台，保存点不能冒称完成。'],
['统计必须怎么读','DEV有效题=可组题+待核；可组题是运行资格，不等于独立QA通过。QA内容覆盖、独立通过、问题与尚未完成分别记录，并绑定受测版本。修复记录与显示候选有交叉，不能相加成错误题总数。历史问题并集不能当当前未解决数。'],
['任务如何真正启动','网页提交派发请求只创建持久化收件项，尚未直接唤醒Codex聊天。制作人在本聊天领取后发送完整任务，并核实际接管证据；只改status不算启动。当前未接入常驻聊天执行桥，不增加定时空转。任务完成须有实际成果、版本和证据，管理台回读确认后才闭环。'],
['磁盘、工时与成本','DEV构建、激活、启动和清理使用统一生命周期锁。仅保留当前和一个最近实际消费者验收的回退；新候选未验不挤掉已验版本，无合格回退则不删。重启读取已激活记录，不按目录时间猜。DEV先交付、QA后置不变。原书、源码、QA和正式Release不作临时备份误删。工时、费用仅在有真实记录时登记，不编造提速比例。'],
['全库数学展示检查规范',{kind:'presentation-standards'}],
['正式页面只呈现结果',{kind:'result-presentation'}]
];
const presentationRuleRows=[
 ['幂与上下标','检查正负指数、多位指数、上下标和括号作用范围；底数与完整指数保持为一个数学单元，不能在换行时拆散。'],
 ['分数与带分数','检查上下分式、完整分子与分母、复合分式及带分数；保留原题未约分形式、整数部分、正负号和运算顺序，不为排版擅自约分或改值。'],
 ['根式','检查根号实际覆盖范围、根次数和多层根号；根号内外的分数、指数、括号及符号必须对应原题，不能只确认根号存在。'],
 ['数学符号','检查负号、绝对值、不等号、乘除号、几何与数列记号；区分负数与减法、绝对值与线段或行列式竖线，保留数学含义。'],
 ['公式结构','检查方程组、分段函数、矩阵、连等式及长公式换行；行列、条件、括号、对齐和推导次序完整，禁止丢行、截断或错误拆分。'],
 ['题面与图表','检查题干、选项、小问、表格和必要配图的完整性与对应关系；正文文字与整页截图不要重复展示，原页留作折叠证据；必要几何图不能因去重复而删除。'],
 ['实际呈现','检查字号、裁切、溢出、裸露公式代码及阅读顺序；桌面、手机和A4都应完整可读，题目与必要图一致，学生版A4不泄露答案、详解或历史作答。']
];
const wikiList=items=>'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
function wikiPresentationStandards(){return `<p class="ops-warning"><b>当前本轮已完成并上线v2.7.2：</b>七类覆盖按规定方法完成，方法待补0、确认待修0。采用全量结构检查、证据继承与分层/高风险补检，非每题逐设备逐子规则重新深验。<a href="article13-coverage.html">查看最终覆盖表</a></p>
 <p>统一检查覆盖所有现有书系和年级，以及题干、选项、答案、完整详解等实际展示字段。不能只检查幂和分数。此前用户已确认的规则持续有效，不要求重复确认；本规范也不自动授权改写原题条件或发布GitHub。</p>
 <h3>完整检查清单</h3><dl>${presentationRuleRows.map(([name,rule])=>`<dt><b>${esc(name)}</b></dt><dd>${esc(rule)}</dd>`).join('')}</dl>
 <h3>执行顺序</h3><ol>
 <li><b>整理统一检查清单。</b>先归并已有用户要求和已验证案例，明确每条规则的适用条件、字段、消费者入口和例外；不反复新增相互冲突的标准。</li>
 <li><b>只读扫描全部现有书系和年级。</b>固定实际DEV、稳定题号与内容指纹，全量检查适用展示字段；按书系、年级和风险选择真实页面样本，机械扫描与人工语义核对分别记录。</li>
 <li><b>核实疑似问题。</b>源码写成 ^2 或 1/2 不一定代表最终显示错误。核当前渲染器和真实页面，区分合法单位、URL、日期、比例或标签；隐藏审计字段的命中不直接算学习页面缺陷。</li>
 <li><b>按类型批量修复。</b>只处理已确认缺陷，保留原题含义、完整解法和未受影响的QA结论；保留原文、原图与改动审计，修源后同步唯一DEV，QA只复验变化字段及必要受影响范围。个别争议单列，不阻塞可确定修复。</li>
 </ol>
 <h3>覆盖表与统计口径</h3>
 <p>当前覆盖结果见 <a href="article13-coverage.html">七类规则覆盖表</a>和 <a href="?task=T-ARTICLE13-COVERAGE-20261119">覆盖检查与修回总账</a>；历史依据见 <a href="?task=T-PRESENTATION-CANDIDATES-20261118">候选核实总账</a>和 <a href="?task=T-PRESENTATION-REPAIR-1715-20261118">1715项修复验收</a>。固定问题已闭合不等于所有子规则或设备均已合格；未查范围继续明确保留。</p>
 <p>每轮交付必须包含“规则—适用题数—已检查—需修复—未检查”覆盖表，并关联具体题号、实际版本与证据。以下为固定模板，数值由当轮证据填写，不自动轮询实时进度。</p>
 <div class="table-wrap"><table class="wiki-coverage-template"><thead><tr><th>规则</th><th>适用题数</th><th>已检查</th><th>需修复</th><th>未检查</th></tr></thead><tbody>${presentationRuleRows.map(([name])=>`<tr><td>${esc(name)}</td><td>按适用ID登记</td><td>按证据登记</td><td>仅确认失败ID</td><td>适用减已检查</td></tr>`).join('')}</tbody></table></div>
 ${wikiList(['同一题可适用多条规则；规则行不能直接相加成错误题总数，总数按稳定ID去重。','自动机械检查、真实页面样本、语义或数学复核分别注明覆盖，不能把有字段或零merror当作整条规则通过。','适用范围或深层结构没有核清时写unknown或未核定，不能写0；候选、确认需修复和已经修复待验收分开。','只有当前版本的合格证据才能退出需修复；单次修改或ready不等于独立复验通过，已有有效QA的未变内容继续继承。','公共消费者或环境开关作为公共实现问题记录一次，另列潜在影响题数；不乘成数千张逐题修单。'])}
 <p>适用入口包括题库列表与详情、练习编辑及预览、学生作答、答案与详解展开、学生A4。无法完成的入口明确列为未检查，不把一个截图外推为所有题、所有设备均通过。</p>`;}
function wikiResultPresentation(){return `<p class="ops-warning"><b>当前本轮已完成并上线v2.7.2：</b>正式学习页面结果化，制作过程留独立审计；完整解法、必要图及原始作答评分保留。后续新增内容仍须遵守此规则。</p><p><b>GitHub正式页面以结果为中心，去过程化。</b>学习页面直接呈现清晰题目、必要配图、简洁出处、明确答案和完整可复算解法；答案与详解默认收起。资源进度首先回答当前结果、未结数量和下一步，不用制作日志或首轮过程数代替最终验收。</p>
 ${wikiList(['学习页面正文移出OCR、制作自检、批次、置信度、旧书答对照、修复过程、用户裁定过程、指纹和DEV核验等内部旁白；正确数学推导、必要条件、有效校订标识及完整步骤保留。','内部信息进入独立审计字段或记录，DEV中按需折叠查看；正式题库不展示整块制作审计、原页对照和答案原页浏览入口。用明确构建环境开关隔离，不靠猜域名或删除源数据。','原题、原图、原书答案、有效裁定和修订历史保留；原始数据模块的原卷PDF、学生原答与分数证据继续正常查看和下载。','数学验收、呈现检查、DEV同步和正式发布分开记录。已入库全部OK不表示新增展示规则已全量验收；制作保存点也不等于最终完成。','规则确认不等于恢复发布。已有暂停决定持续有效，只有用户明确恢复并确认范围后才更新GitHub；不能把本地修复说成已经上线。'])}`;}
function wikiBody(text){return typeof text==='string'?'<p>'+esc(text)+'</p>':text.kind==='presentation-standards'?wikiPresentationStandards():wikiResultPresentation();}
playbookView=function(){return `<section class="panel"><p class="eyebrow">LOCAL WIKI / 项目说明</p><h2>拾级：项目工作手册</h2><p>这是稳定的本地知识库，说明目标、边界和工作方法。版本：2026-11-19。仅规则或分工改变时维护，不定时刷新。</p><div class="wiki-index">${wikiSections.map(([title],i)=>`<a href="#wiki-${i}">${i+1}. ${esc(title)}</a>`).join('')}</div></section>${wikiSections.map(([title,text],i)=>`<article class="panel wiki-article" id="wiki-${i}"><h2>${i+1}. ${esc(title)}</h2>${wikiBody(text)}</article>`).join('')}`};
const teamDuties={
'小岛':['项目制作人','维护项目目标与优先级，派发完整任务，确认实际接管，验收交付并同步后台。负责跨线DEV冲突协调、用户裁定落实和授权发布。','不能以消息发送成功冒充开始，不能以ready冒充QA通过，不能未经用户授权发布。'],
'小欧':['内容生产负责人','当前负责交大之星八、九年级；原书逐页提取、书答定位、独立解法、必要配图、生产自检，直接同步DEV。','不擅自改写原题条件或把书答矛盾放行；生产自检不代替独立QA。'],
'小欧2号':['内容修复负责人','当前负责奥精六至八年级；根据QA清单修复确定问题、排除显示误报、补全详解与配图，直接更新DEV并留待复验。','原书矛盾和题意歧义单列用户裁定；不自行发布GitHub。'],
'小磊':['独立QA负责人','当前负责资优生七年级整资源收尾，继承已有通过结论，快检新增或缺证据题；现有问题交修后只复验改动。','只读题库和DEV，不自行修题、放行、派修；核验结论绑定实际被测版本。'],
'用户':['项目负责人','决定优先级、人工裁定及正式发布；通过DEV看内容，通过管理台掌握进度和待办。','只将确实无法自行解决的具体争议交用户，不能转交可确定的普通修复。'],
'小姆':['历史内容修复成员','保留资优生修复与重复关系核对的历史交付；当前未分配独立执行任务。','无新任务不创建待命Goal，不重复检查已完成批次。'],
'小拉':['内容助理','可承担依据明确的批量整理和机械检查；当前未分配独立执行任务。','不是录入或DEV更新的前置审批人，不擅自裁定数学争议。'],
'小马':['架构与程序支持','公共接口、构建和技术问题需要时接入；当前未分配独立执行任务。','不成为日常内容更新必经环节，正式发布需用户授权。'],
'小丁':['历史QA成员','保留首轮资优生QA证据；本次总账工作已按用户要求移交小磊二号。','停止本项执行，避免重复写入；旧总账初稿未验收。'],
'玛丽':['试卷与作答支持','新考试接入时负责原卷、原答、分值与完整页覆盖；当前未分配独立执行任务。','必须核对所有页及跨页续题，不凭题号清单声称完整。']};
orgView=function(){const active=['小欧','小欧2号','小磊','小磊二号'];const show=r=>{const d=[r.role,r.owns,r.boundary];return `<article class="panel wiki-member"><h2>${esc(r.name)}${r.current_work_label?'：'+esc(r.current_work_label):''}</h2><p class="eyebrow">${esc(d[0])}</p><h3>负责什么</h3><p>${esc(d[1])}</p><h3>工作边界</h3><p>${esc(d[2])}</p>${recordButton('roles',r.id)}</article>`};return `<section class="panel"><p class="eyebrow">LOCAL WIKI / 团队说明</p><h2>团队职责手册</h2><p>这里记录稳定的职责、能力和边界，不轮询或重绘。实际进度与任务执行情况请看驾驶舱和任务页；分工变化后主动维护此手册。</p></section><h2>内容与QA成员（职责名单，不代表正在执行）</h2><section class="ops-lines">${state.roles.filter(r=>active.includes(r.name)).map(show).join('')}</section><h2>管理、支持与历史成员</h2><section class="ops-lines">${state.roles.filter(r=>!active.includes(r.name)).map(show).join('')}</section>`};
// Poll only operational pages; leave long-form documentation and forms undisturbed.
const liveViews=new Set(['overview','library','work','todos','activity','releases']);
scheduleRefresh=function(){if(refreshTimer)clearInterval(refreshTimer);refreshTimer=(document.hidden||readOnly)?null:setInterval(()=>{if(liveViews.has(view)&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))load()},10000)};
let controlLoadPromise=null,controlLoadView=null;
const controlLoadWarnings=new Map();
function controlPaint(){
 if(!state||document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const opened=[...document.querySelectorAll('#content details[open]')].map(d=>d.id||d.querySelector('summary')?.textContent);
 render();
 document.querySelectorAll('#content details').forEach(d=>{if(opened.includes(d.id||d.querySelector('summary')?.textContent))d.open=true});
 if(controlLoadWarnings.size){const warning=document.createElement('p');warning.className='ops-warning';warning.setAttribute('role','alert');warning.textContent=[...controlLoadWarnings.values()].join('；')+' 点击刷新重试。';$('#content').prepend(warning)}
}
async function controlLoadOnce(target){
 controlLoadWarnings.clear();
 try{
  state=window.CONTROL_CENTER_STATE||await api(readOnly?'./state.json':'/api/state');
  $('#connection').textContent=readOnly?'只读快照':'已连接';$('#connection').className='dot ok';
  $('#lastSync').textContent='记录 '+opsDate(state.meta.updated_at)+' · 正在读取页面数据…';
  $('#stage').textContent=state.overview.current_stage;
  $('#environment').textContent=readOnly?'公开发布快照':state.meta.environment+' · '+state.meta.release_state;
  controlPaint();
  const jobs=[];
  function optional(name,path,accept){jobs.push((async()=>{try{accept(await api(path))}catch(e){controlLoadWarnings.set(name,name+'读取失败：'+e.message);if(name==='工作线证据')opsError=controlLoadWarnings.get(name)}controlPaint()})())}
  if(!['org','playbook'].includes(target)&&!readOnly)optional('工作线证据','/api/operations',data=>{operationsData=data;opsError=''});
  if(target==='library')optional('课程进度',readOnly?'./library-facts.json':'/api/library-facts',data=>{pipelineRuntime=data});
  if(target==='releases')optional('版本记录',readOnly?'./version-progress.json':'/api/version-progress',data=>{versionProgress=data});
  await Promise.all(jobs);
  $('#connection').textContent=controlLoadWarnings.size?'已连接 · 部分读取失败':readOnly?'只读快照':'已连接';
  $('#lastSync').textContent='记录 '+opsDate(state.meta.updated_at)+(controlLoadWarnings.size?' · 点击刷新重试':' · 已读取 '+new Date().toLocaleTimeString('zh-CN',{hour12:false}));
  if(requestedDecisionTask&&!requestedDecisionOpened){const task=state.tasks.find(t=>t.id===requestedDecisionTask);if(task){requestedDecisionOpened=true;view='work';controlPaint();openTask(task)}}
 }catch(e){
  $('#connection').textContent='读取失败';$('#connection').className='dot';
  $('#lastSync').textContent=e.message+' 点击刷新重试。';
  if(!state)$('#content').textContent='暂时无法读取管理台记录。请点击右上角刷新重试。';
 }
}
load=function(){
 if(controlLoadPromise)return controlLoadPromise;
 controlLoadPromise=(async()=>{do{controlLoadView=view;await controlLoadOnce(controlLoadView)}while(controlLoadView!==view)})().finally(()=>{controlLoadPromise=null});
 return controlLoadPromise;
};
opsGoto=function(v){view=v;$$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));controlPaint();if(!['org','playbook'].includes(v)||!state){if(v==='library'&&!pipelineRuntime?.course_progress)$('#content').insertAdjacentHTML('afterbegin','<p class="ops-warning" role="status">正在加载实际DEV题量和QA报告，请稍候…</p>');load();}const hint=$('.ops-sync-hint');if(hint)hint.textContent=['org','playbook'].includes(v)?'本地WIKI · 按需读取 · 不定时刷新':liveViews.has(v)?'工作数据 · 每10秒读取最新证据 · 切换页面和返回窗口立即读取':'记录页面 · 按需读取';};
if(new URLSearchParams(location.search).get('view')==='playbook'){view='playbook';$$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));}
window.addEventListener('focus',()=>{if(liveViews.has(view))load()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&liveViews.has(view))load()});
$('#refresh').onclick=()=>load();scheduleRefresh();load();
