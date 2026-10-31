/* Force-directed hierarchy using D3 v7; visual reference: D3 / Mike Bostock. */
let knowledgeSimulation=null,knowledgeTreeState=null,knowledgeZoom=null,treeManualCamera=false,treeEventsBound=false;
let treeCollapsed=new Set(),treeExpanded=new Set(),treePositions=new Map();
function createKnowledgeTreeData(){
 const groups=chartGroups();
 return {id:'math',name:'数学',kind:'root',counts:countFor(C.nodes.filter(allowed)),children:domains.map(d=>({id:'domain:'+d.id,name:d.name,kind:'domain',domain_id:d.id,counts:countFor(C.nodes.filter(n=>n.domain_id===d.id&&allowed(n))),children:groups.filter(g=>g.domain_id===d.id).map(g=>({id:g.id,name:g.name,kind:'group',domain_id:d.id,counts:countFor(g.nodes),children:g.nodes.map(n=>({id:'node:'+n.id,name:n.name,kind:'leaf',node_id:n.id,domain_id:d.id,counts:D.node_counts[n.id]}))}))}))};
}
function createTreeSimulation(nodes,links){
 return d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(n=>n.id).distance(l=>l.target.depth===1?105:l.target.depth===2?66:32).strength(.9)).force('charge',d3.forceManyBody().strength(n=>n.depth===0?-180:n.depth===1?-150:n.depth===2?-95:-42)).force('x',d3.forceX().strength(.025)).force('y',d3.forceY().strength(.025)).force('collision',d3.forceCollide(n=>n.depth===0?24:n.depth===1?23:n.depth===2?14:5).iterations(2)).alphaDecay(.035).velocityDecay(.38);
}
function stopKnowledgeTree(){if(knowledgeSimulation)knowledgeSimulation.stop()}
function treeReadout(n){const data=n.data||n,c=data.counts;document.querySelector('#treeSelectionName').textContent=data.name;document.querySelector('#treeSelectionStats').textContent=c.correct+c.wrong?`正确 ${c.correct} / 错误 ${c.wrong} · 正确率 ${domainCorrectRate(c)}`:'暂无作答记录'}
function fitKnowledgeTree(animate=true){
 if(!knowledgeTreeState)return;const {svg,nodes}=knowledgeTreeState;if(!nodes.length)return;
 const minX=d3.min(nodes,n=>n.x)-45,maxX=d3.max(nodes,n=>n.x)+100,minY=d3.min(nodes,n=>n.y)-35,maxY=d3.max(nodes,n=>n.y)+35;
 const scale=Math.min(1.5,1000/Math.max(1,maxX-minX),570/Math.max(1,maxY-minY)),transform=d3.zoomIdentity.translate(550-(minX+maxX)/2*scale,325-(minY+maxY)/2*scale).scale(scale);
 treeManualCamera=false;if(animate)svg.transition().duration(300).call(knowledgeZoom.transform,transform);else svg.call(knowledgeZoom.transform,transform);
}
function renderKnowledgeTree(){
 stopKnowledgeTree();if(typeof d3==='undefined'){document.querySelector('#treeMessage').textContent='本地图表库加载失败，请刷新页面。';return}
 const svg=d3.select('#knowledgeTree'),viewport=svg.select('#knowledgeViewport'),level=Number(document.querySelector('#treeDepth').value),root=d3.hierarchy(createKnowledgeTreeData());
 root.descendants().forEach(n=>{n.id=n.data.id});
 const layout=d3.tree().size([2*Math.PI,280]);layout(root);root.descendants().forEach(n=>{const angle=n.x-Math.PI/2,r=n.y,prev=treePositions.get(n.id);n.x=prev?.x??Math.cos(angle)*r;n.y=prev?.y??Math.sin(angle)*r});
 const nodes=root.descendants().filter(n=>(n.depth<=level||n.ancestors().slice(1).some(p=>treeExpanded.has(p.id)))&&!n.ancestors().slice(1).some(p=>treeCollapsed.has(p.id))),ids=new Set(nodes.map(n=>n.id)),links=root.links().filter(l=>ids.has(l.source.id)&&ids.has(l.target.id));
 viewport.selectAll('*').remove();
 const link=viewport.append('g').attr('class','knowledge-links').selectAll('line').data(links).join('line');
 const node=viewport.append('g').attr('class','knowledge-nodes').selectAll('g').data(nodes,n=>n.id).join('g').attr('class',n=>'knowledge-node depth-'+n.depth+(treeCollapsed.has(n.id)?' collapsed':'')).attr('data-tree-node',n=>n.id).attr('role','button').attr('tabindex',0).attr('aria-expanded',n=>n.children?.length?String(!treeCollapsed.has(n.id)&&nodes.some(child=>child.parent===n)):null).attr('aria-label',n=>`${n.data.name}，正确${n.data.counts.correct}，错误${n.data.counts.wrong}`);
 node.append('circle').attr('class','node-hit-area').attr('r',13).attr('fill','transparent');
 node.append('circle').attr('class','tree-dot').attr('r',n=>n.depth===0?6:n.depth===1?4.7:n.depth===2?3.3:2.4).attr('fill',n=>attentionColor(n.data.counts)).attr('stroke',n=>treeCollapsed.has(n.id)?attentionColor(n.data.counts):'none').attr('stroke-width',n=>treeCollapsed.has(n.id)?1:0);
 node.append('title').text(n=>`${n.data.name}\n正确 ${n.data.counts.correct} / 错误 ${n.data.counts.wrong}${n.data.kind==='leaf'?'\n查看题目':'\n点击展开或收起分支'}`);
 node.append('text').attr('class','tree-label').attr('x',n=>n.x<0?-9:9).attr('y',-4).attr('text-anchor',n=>n.x<0?'end':'start').text(n=>n.data.name);
 node.append('text').attr('class','tree-count').attr('x',n=>n.x<0?-9:9).attr('y',10).attr('text-anchor',n=>n.x<0?'end':'start').text(n=>n.data.counts.correct+n.data.counts.wrong?`${n.data.counts.correct} / ${n.data.counts.wrong}`:'—');
 function activate(event,n){event.stopPropagation();treeReadout(n);if(n.data.kind==='leaf'){openNode(n.data.node_id);return}if(n.data.domain_id){selectedDomain=n.data.domain_id;renderNodes()}const hasVisibleChildren=nodes.some(child=>child.parent===n);if(hasVisibleChildren){treeCollapsed.add(n.id);treeExpanded.delete(n.id)}else{treeCollapsed.delete(n.id);treeExpanded.add(n.id)}renderKnowledgeTree()}
 node.on('pointerenter',(event,n)=>treeReadout(n)).on('click',(event,n)=>{if(event.defaultPrevented)return;activate(event,n)}).on('keydown',(event,n)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(event,n)}});
 knowledgeZoom=d3.zoom().scaleExtent([.2,5]).on('zoom',event=>{if(event.sourceEvent)treeManualCamera=true;viewport.attr('transform',event.transform);document.querySelector('#treeZoomValue').textContent=Math.round(event.transform.k*100)+'%';updateTreeLabels()});
 svg.call(knowledgeZoom).on('dblclick.zoom',null);
 knowledgeSimulation=createTreeSimulation(nodes,links).stop();for(let i=0;i<160;i++)knowledgeSimulation.tick();
 function tick(){link.attr('x1',l=>l.source.x).attr('y1',l=>l.source.y).attr('x2',l=>l.target.x).attr('y2',l=>l.target.y);node.attr('transform',n=>`translate(${n.x},${n.y})`);nodes.forEach(n=>treePositions.set(n.id,{x:n.x,y:n.y}));}
 knowledgeTreeState={svg,viewport,node,nodes,links,tick};tick();
 node.call(d3.drag().container(viewport.node()).on('start',(event,n)=>{treeManualCamera=true;if(!event.active)knowledgeSimulation.alphaTarget(.25).restart();n.fx=n.x;n.fy=n.y;treeReadout(n)}).on('drag',(event,n)=>{n.fx=event.x;n.fy=event.y}).on('end',(event,n)=>{n.fx=null;n.fy=null;if(!event.active)knowledgeSimulation.alphaTarget(0);treeManualCamera=!document.querySelector('#treeAutoFit').checked}));
 knowledgeSimulation.on('tick',tick).on('end',()=>{if(document.querySelector('#treeAutoFit').checked&&!treeManualCamera)fitKnowledgeTree(true)});
 if(document.querySelector('#treeAutoFit').checked&&!treeManualCamera)fitKnowledgeTree(false);else{const t=d3.zoomTransform(svg.node());viewport.attr('transform',t)}
 updateTreeLabels();treeReadout(root);document.querySelector('#treeMessage').textContent='';knowledgeSimulation.alpha(.23).restart();
 if(!treeEventsBound){bindKnowledgeTreeControls();treeEventsBound=true}
}
function treeLabelCollision(){
 let nodes=[];
 function force(alpha){
  const k=knowledgeTreeState?d3.zoomTransform(knowledgeTreeState.svg.node()).k:1;
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const a=nodes[i],b=nodes[j],ra=a.labelBox||{x:-6,y:-6,width:12,height:12},rb=b.labelBox||{x:-6,y:-6,width:12,height:12};
   const ax=(a.x+a.vx)*k+ra.x,ay=(a.y+a.vy)*k+ra.y,bx=(b.x+b.vx)*k+rb.x,by=(b.y+b.vy)*k+rb.y;
   const ox=Math.min(ax+ra.width,bx+rb.width)-Math.max(ax,bx)+5,oy=Math.min(ay+ra.height,by+rb.height)-Math.max(ay,by)+5;
   if(ox<=0||oy<=0)continue;
   const strength=Math.min(.45,alpha*2),sx=ax+ra.width/2<bx+rb.width/2?-1:1,sy=ay+ra.height/2<by+rb.height/2?-1:1;
   if(ox<oy){const d=ox/k*strength;a.vx+=sx*d;b.vx-=sx*d}else{const d=oy/k*strength;a.vy+=sy*d;b.vy-=sy*d}
  }
 }
 force.initialize=value=>{nodes=value};return force;
}
function updateTreeLabels(){
 if(!knowledgeTreeState)return;
 const {node,svg}=knowledgeTreeState,t=d3.zoomTransform(svg.node()),all=document.querySelector('#treeLabels').checked;
 node.selectAll('text').attr('transform',`scale(${1/t.k})`);
 node.classed('labels-visible',n=>n.depth<=1||(n.depth===2&&t.k>=1.15)||all||(n.depth===3&&t.k>=2));
 node.each(function(n){
  if(!this.classList.contains('labels-visible')){n.labelBox=null;return}
  const boxes=[...this.querySelectorAll('text')].map(e=>e.getBBox()),x=Math.min(-6,...boxes.map(b=>b.x)),y=Math.min(-6,...boxes.map(b=>b.y));
  n.labelBox={x,y,width:Math.max(6,...boxes.map(b=>b.x+b.width))-x,height:Math.max(6,...boxes.map(b=>b.y+b.height))-y};
 });
 if(knowledgeSimulation){knowledgeSimulation.force('labels',treeLabelCollision());if(treeManualCamera)knowledgeSimulation.alpha(Math.max(.12,knowledgeSimulation.alpha())).restart()}
}
function bindKnowledgeTreeControls(){
 document.querySelector('#treeDepth').addEventListener('change',()=>{treeCollapsed.clear();treeExpanded.clear();renderKnowledgeTree()});
 document.querySelector('#treeLabels').addEventListener('change',updateTreeLabels);
 document.querySelector('#treeAutoFit').addEventListener('change',e=>{if(e.target.checked)fitKnowledgeTree(true)});
 document.querySelector('#treeFit').addEventListener('click',()=>fitKnowledgeTree(true));
 document.querySelector('#treeExpand').addEventListener('click',()=>{treeCollapsed.clear();treeExpanded.clear();document.querySelector('#treeDepth').value='3';renderKnowledgeTree()});
 document.querySelector('#treeZoomIn').addEventListener('click',()=>{treeManualCamera=true;knowledgeTreeState.svg.transition().duration(200).call(knowledgeZoom.scaleBy,1.3)});
 document.querySelector('#treeZoomOut').addEventListener('click',()=>{treeManualCamera=true;knowledgeTreeState.svg.transition().duration(200).call(knowledgeZoom.scaleBy,1/1.3)});
}
