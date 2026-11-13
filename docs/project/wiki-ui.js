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
['磁盘、工时与成本','DEV仅保留当前和一个最近成功回退版本，不为普通题更新复制全项目。原书、源码和QA证据不能当临时备份误删。工时、费用仅在有真实记录时登记，不能以聊天时长估算工时，也不能编造提速比例。']
];
playbookView=function(){return `<section class="panel"><p class="eyebrow">LOCAL WIKI / 项目说明</p><h2>拾级：项目工作手册</h2><p>这是稳定的本地知识库，说明目标、边界和工作方法。版本：2026-11-08。仅规则或分工改变时维护，不定时刷新。</p><div class="wiki-index">${wikiSections.map(([title],i)=>`<a href="#wiki-${i}">${i+1}. ${esc(title)}</a>`).join('')}</div></section>${wikiSections.map(([title,text],i)=>`<article class="panel wiki-article" id="wiki-${i}"><h2>${i+1}. ${esc(title)}</h2><p>${esc(text)}</p></article>`).join('')}`};
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
orgView=function(){const active=['小欧','小欧2号','小磊','小磊二号'];const show=r=>{const d=[r.role,r.owns,r.boundary];return `<article class="panel wiki-member"><h2>${esc(r.name)}${r.current_work_label?'：'+esc(r.current_work_label):''}</h2><p class="eyebrow">${esc(d[0])}</p><h3>负责什么</h3><p>${esc(d[1])}</p><h3>工作边界</h3><p>${esc(d[2])}</p>${recordButton('roles',r.id)}</article>`};return `<section class="panel"><p class="eyebrow">LOCAL WIKI / 团队说明</p><h2>团队职责手册</h2><p>这里记录稳定的职责、能力和边界，不轮询或重绘。实际进度与任务执行情况请看驾驶舱和任务页；分工变化后主动维护此手册。</p></section><h2>当前执行成员</h2><section class="ops-lines">${state.roles.filter(r=>active.includes(r.name)).map(show).join('')}</section><h2>管理、支持与历史成员</h2><section class="ops-lines">${state.roles.filter(r=>!active.includes(r.name)).map(show).join('')}</section>`};
// Poll only operational pages; leave long-form documentation and forms undisturbed.
const liveViews=new Set(['overview','library','work','todos']);
scheduleRefresh=function(){if(refreshTimer)clearInterval(refreshTimer);refreshTimer=document.hidden?null:setInterval(()=>{if(liveViews.has(view)&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))load()},30000)};
load=async function(){try{const docs=['org','playbook'].includes(view);const nextState=window.CONTROL_CENTER_STATE||await api(readOnly?'./state.json':'/api/state');state=nextState;if(!docs&&!readOnly){try{operationsData=await api('/api/operations');opsError=''}catch(e){opsError='工作线证据暂不可读取：'+e.message}}if(view==='library'){pipelineRuntime=await api(readOnly?'./library-facts.json':'/api/library-facts')}if(view==='releases'){try{versionProgress=await api(readOnly?'./version-progress.json':'/api/version-progress')}catch{}}$('#connection').textContent=readOnly?'只读快照':'已连接';$('#connection').className='dot ok';$('#lastSync').textContent='记录 '+opsDate(state.meta.updated_at);$('#environment').textContent=readOnly?'公开发布快照':state.meta.environment+' · '+state.meta.release_state;if(!document.querySelector('dialog[open]'))render();const hint=$('.ops-sync-hint');if(hint)hint.textContent=docs?'本地WIKI · 按需读取 · 不定时刷新':liveViews.has(view)?'工作数据 · 每30秒读取最新证据 · 不把聊天状态当成果':'记录页面 · 按需读取，点击刷新可更新';}catch(e){$('#connection').textContent='读取失败';$('#lastSync').textContent=e.message}};
opsGoto=function(v){view=v;$$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));render();if(['library','releases'].includes(v)){if(v==='library'&&!pipelineRuntime?.course_progress)$('#content').insertAdjacentHTML('afterbegin','<p class="ops-warning" role="status">正在加载实际DEV题量和QA报告，请稍候…</p>');load();}const hint=$('.ops-sync-hint');if(hint)hint.textContent=['org','playbook'].includes(v)?'本地WIKI · 按需读取 · 不定时刷新':liveViews.has(v)?'工作数据 · 每30秒读取最新证据':'记录页面 · 按需读取';};
$('#refresh').onclick=()=>load();scheduleRefresh();load();
