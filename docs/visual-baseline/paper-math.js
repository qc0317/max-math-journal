function bankMathText(value){

 // Explicit pipe tables are rendered from escaped cells; ordinary text stays literal.

 const tableLines=String(value??'').split(/\r?\n/);

 const tableCells=line=>/^\s*\|.*\|\s*$/.test(line)?line.trim().slice(1,-1).split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|')):null;

 const tableStart=at=>{const h=tableCells(tableLines[at]||''),d=tableCells(tableLines[at+1]||'');return h&&d&&h.length===d.length&&d.every(c=>/^:?-{3,}:?$/.test(c))?h:null;};

 if(tableLines.some((_,at)=>tableStart(at))){

  let rendered='',plain=[];

  const flush=()=>{if(plain.length){rendered+=bankMathText(plain.join('\n'));plain=[];}};

  for(let at=0;at<tableLines.length;){const header=tableStart(at);if(!header){plain.push(tableLines[at++]);continue;}flush();

   const cellStyle='border:1px solid #bbb;padding:6px 8px;white-space:normal;overflow-wrap:anywhere;text-align:center';

   rendered+='<div class="bank-math-table-wrap" style="max-width:100%;overflow-x:auto;margin:10px 0"><table class="bank-math-table" style="width:100%;border-collapse:collapse;font-size:inherit;break-inside:avoid"><thead><tr>'+header.map(c=>'<th scope="col" style="'+cellStyle+'">'+bankMathText(c)+'</th>').join('')+'</tr></thead><tbody>';at+=2;

   for(;at<tableLines.length;at++){const row=tableCells(tableLines[at]);if(!row||row.length!==header.length)break;rendered+='<tr>'+row.map(c=>'<td style="'+cellStyle+'">'+bankMathText(c)+'</td>').join('')+'</tr>';}

   rendered+='</tbody></table></div>';

  }flush();return rendered;

 }



 const superscripts={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'−','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i'};

 const input=String(value??'').replace(/\^\\circ/g,'°').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]+/g,s=>'^{'+[...s].map(c=>superscripts[c]).join('')+'}');

 const wrap=body=>`<span class="bank-math-unit" style="display:inline-block;max-width:100%;vertical-align:middle;overflow-x:auto;overflow-y:hidden;padding:0.15em 0"><math xmlns="http://www.w3.org/1998/Math/MathML" style="font-size:1.15em;vertical-align:middle;max-width:none;overflow:visible"><mrow>${body}</mrow></math></span>`;

 function group(s,p){if(s[p]!=='{')return null;let depth=1;for(let j=p+1;j<s.length;j++){if(s[j]==='{')depth++;if(s[j]==='}'&&!--depth)return{body:s.slice(p+1,j),end:j+1};}return null;}

 function argument(s,p){while(p<s.length&&/\s/.test(s[p]))p++;if(p>=s.length)return null;const g=group(s,p);if(g)return{html:math(g.body),body:g.body,end:g.end};if(s[p]==='\\'){const c=command(s,p);if(c)return c;}return{html:math(s[p]),body:s[p],end:p+1};}

 const symbols={pi:'π',times:'×',div:'÷',cdot:'·',pm:'±',le:'≤',leq:'≤',ge:'≥',geq:'≥',ne:'≠',neq:'≠',infty:'∞',ldots:'…',cdots:'⋯',triangle:'△',angle:'∠',circ:'°',cong:'≌',perp:'⊥',parallel:'∥',Rightarrow:'⇒',mapsto:'↦',in:'∈',to:'→'};

 function command(s,p){

  const m=/^\\([a-zA-Z]+)/.exec(s.slice(p));if(!m)return null;const name=m[1];let at=p+m[0].length;

  if(symbols[name])return{html:`<mo>${esc(symbols[name])}</mo>`,end:at};

  if(name==='begin'){
   const env=group(s,at);if(!env||env.body!=='vmatrix')return null;
   const closer='\\end{vmatrix}',stop=s.indexOf(closer,env.end);if(stop<0)return null;
   const body=s.slice(env.end,stop);if(body.includes('\\begin'))return null;
   const rows=body.split('\\\\').map(row=>row.split('&'));
   if(!rows.length||rows.length>8||!rows[0].length||rows[0].length>8||rows.some(row=>row.length!==rows[0].length))return null;
   const cells=rows.map(row=>'<mtr>'+row.map(cell=>'<mtd><mrow>'+math(cell.trim())+'</mrow></mtd>').join('')+'</mtr>').join('');
   return{html:'<mrow><mo stretchy="true">|</mo><mtable columnspacing="0.8em" rowspacing="0.35em">'+cells+'</mtable><mo stretchy="true">|</mo></mrow>',end:stop+closer.length};
  }
  if(name==='substack'){const a=group(s,at);if(!a)return null;const rows=[];let level=0,start=0;for(let j=0;j<a.body.length;j++){if(a.body[j]==='{')level++;if(a.body[j]==='}')level--;if(level===0&&a.body.startsWith(String.fromCharCode(92)+'cr ',j)){rows.push(a.body.slice(start,j));start=j+4;j+=3;}}rows.push(a.body.slice(start));if(!rows.length||rows.length>20)return null;return{html:'<mtable displaystyle="false" columnalign="left" rowspacing="0.25em">'+rows.map(row=>'<mtr><mtd style="padding:0"><mrow>'+math(row)+'</mrow></mtd></mtr>').join('')+'</mtable>',end:a.end};}
  if(name==='left'||name==='right')return{html:'',end:at};

  if(name==='quad'||name==='qquad')return{html:`<mspace width="${name==='quad'?1:2}em"/>`,end:at};

  if(name==='frac'||name==='tfrac'||name==='dfrac'){const a=argument(s,at);if(!a)return null;const b=argument(s,a.end);if(!b)return null;return{html:`<mfrac><mrow>${a.html}</mrow><mrow>${b.html}</mrow></mfrac>`,end:b.end};}

  if(name==='sqrt'){let index=null;if(s[at]==='['){const end=s.indexOf(']',at+1);if(end<0)return null;index=s.slice(at+1,end);at=end+1;}const a=argument(s,at);if(!a)return null;return{html:index===null?`<msqrt><mrow>${a.html}</mrow></msqrt>`:`<mroot><mrow>${a.html}</mrow><mrow>${math(index)}</mrow></mroot>`,end:a.end};}

  if(name==='mathrm'||name==='text'){const a=group(s,at);if(!a)return null;return{html:`<mtext>${esc(a.body)}</mtext>`,end:a.end};}

  if(name==='underbrace'){const a=group(s,at);if(!a)return null;let end=a.end,label=null;while(/\s/.test(s[end]||''))end++;if(s[end]==='_'){const b=group(s,end+1);if(!b)return null;label=math(b.body);end=b.end;}const brace=`<munder accentunder="true"><mrow>${math(a.body)}</mrow><mo stretchy="true">⏟</mo></munder>`;return{html:label===null?brace:`<munder><mrow>${brace}</mrow><mrow>${label}</mrow></munder>`,end};}

  if(name==='vec'||name==='overrightarrow'){const a=argument(s,at);if(!a)return null;return{html:`<mover accent="true"><mrow>${a.html}</mrow><mo stretchy="true">→</mo></mover>`,end:a.end};}

  if(name==='overline'||name==='bar'){const a=group(s,at);if(!a)return null;return{html:`<mover accent="true" style="border-top:0.06em solid currentColor;padding-top:0.08em"><mrow>${math(a.body)}</mrow><mo style="display:none">¯</mo></mover>`,end:a.end};}

  if(name==='dot'||name==='underline'){const a=group(s,at);if(!a)return null;const tag=name==='underline'?'munder':'mover';return{html:`<${tag} accent="true"><mrow>${math(a.body)}</mrow><mo>${name==='dot'?'˙':name==='underline'?'_':'¯'}</mo></${tag}>`,end:a.end};}

  return null;

 }

 function math(s){let parts=[],i=0;while(i<s.length){if(s[i]==='\\'){const c=command(s,i);if(c){parts.push(c.html);i=c.end;continue;}}

   if((s[i]==='^'||s[i]==='_')&&parts.length){const sub=s[i]==='_';const g=group(s,i+1);let body,end;if(g){body=g.body;end=g.end;}else{const m=/^[−-]?\d+|^[a-zA-Z]/.exec(s.slice(i+1));if(!m){parts.push(`<mo>${esc(s[i++])}</mo>`);continue;}body=m[0];end=i+1+body.length;}const base=parts.pop();parts.push(`<${sub?'msub':'msup'}>${base}<mrow>${math(body)}</mrow></${sub?'msub':'msup'}>`);i=end;continue;}

   const number=/^\d+(?:\.\d+)?/.exec(s.slice(i));if(number){parts.push(`<mn>${number[0]}</mn>`);i+=number[0].length;continue;}const ch=s[i++];parts.push(/[a-zA-Zπ]/.test(ch)?`<mi>${esc(ch)}</mi>`:/\s/.test(ch)?'<mspace width="0.12em"/>':`<mo>${esc(ch)}</mo>`);

  }return parts.join('');}

 const fractions={'½':['1','2'],'⅓':['1','3'],'⅔':['2','3'],'¼':['1','4'],'¾':['3','4'],'⅕':['1','5'],'⅖':['2','5'],'⅗':['3','5'],'⅘':['4','5'],'⅙':['1','6'],'⅚':['5','6'],'⅛':['1','8'],'⅜':['3','8'],'⅝':['5','8'],'⅞':['7','8']};

 let out='',i=0;while(i<input.length){if(input.startsWith('\\(',i)||input.startsWith('\\[',i)){const closer=input[i+1]==='('? '\\)':'\\]';const end=input.indexOf(closer,i+2);if(end>=0){out+=wrap(math(input.slice(i+2,end)));i=end+2;continue;}}

  if(input[i]==='\\'){const c=command(input,i);if(c){out+=wrap(c.html);i=c.end;continue;}}

  if(fractions[input[i]]){const[n,d]=fractions[input[i++]];out+=wrap(`<mfrac><mn>${n}</mn><mn>${d}</mn></mfrac>`);continue;}

  if(input[i]==='^'||input[i]==='_'){const sub=input[i]==='_';const g=group(input,i+1);const m=g?null:/^[−-]?\d+|^[a-zA-Z]/.exec(input.slice(i+1));if(g||m){const body=g?g.body:m[0];out+=`<${sub?'sub':'sup'}>${wrap(math(body))}</${sub?'sub':'sup'}>`;i=g?g.end:i+1+m[0].length;continue;}}

  out+=esc(input[i++]);

 }return out;

}



