/* ───────── la scena di un processo: una scheda per passo, con una piccola animazione che dice che cosa succede ─────────
   Ogni processo (e ogni orchestratore) ha la sua figura, costruita da sola dal manifest. È volutamente semplice: i passi del
   caso scelto sono schede grandi, in fila (a serpentina se sono molte), con i colori del diagramma BPMN (azzurro persona,
   viola persona + assistente, verde sistema, ambra bivio), un numero, un'icona, il nome del passo e chi lo fa.
   «Avvia la simulazione» fa muovere una pratica da una scheda all'altra: la scheda in corso si illumina, la sua icona si
   anima (una persona che spunta, un documento letto da un raggio, un ingranaggio che gira, un deviatore che sceglie…) e
   sotto compare che cosa succede, con le parole di `passi` di spiegazioni.yml o, se mancano, quelle calcolate dal manifest.
   Il caso si sceglie dal menu (i `percorsi` di spiegazioni.yml; «Tutti i passi» li mostra tutti, nell'ordine del manifest).
   Non inventa niente: ogni scheda è un passo del manifest, e l'ordine è quello del caso. Con «riduci movimento» le icone
   restano ferme e la pratica salta da una scheda all'altra. */
var SC_HOT='#c2410c';
var SC_KIND={human:{bg:'--human-bg',bd:'--human-bd',fg:'--human-fg'},ai:{bg:'--ai-bg',bd:'--ai-bd',fg:'--ai-fg'},auto:{bg:'--auto-bg',bd:'--auto-bd',fg:'--auto-fg'},gw:{bg:'--gw-bg',bd:'--gw-bd',fg:'--gw-fg'}};
function scIcon(kind,c){ /* un'icona semplice, centrata in (0,0), larga circa 60; i colori sono quelli della scheda */
  var st='fill="var('+c.bg+')" stroke="var('+c.bd+')" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"',ln='fill="none" stroke="var('+c.bd+')" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  if(kind==='human')return '<g class="a-nod"><circle cx="-6" cy="-14" r="9" fill="var(--surface)" stroke="var('+c.bd+')" stroke-width="2.2"/></g>'+
    '<path d="M-24 22C-24 6-16 0-6 0S12 6 12 22Z" fill="var(--surface)" stroke="var('+c.bd+')" stroke-width="2.2" stroke-linejoin="round"/>'+
    '<rect x="14" y="-6" width="20" height="28" rx="3" fill="var(--surface)" stroke="var('+c.bd+')" stroke-width="2"/><path class="a-tick" d="M19 6l4 4 8-9" '+ln+' pathLength="1"/>';
  if(kind==='ai')return '<rect x="-17" y="-26" width="34" height="46" rx="4" fill="var(--surface)" stroke="var('+c.bd+')" stroke-width="2.2"/>'+
    '<path d="M-10 -14h20M-10 -6h20M-10 2h13M-10 10h9" '+ln+' opacity=".7"/>'+
    '<rect class="a-scan" x="-19" y="-26" width="38" height="5" rx="2" fill="var('+c.bd+')" opacity="0"/>'+
    '<path class="a-spark" d="M24 -24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" '+st+'/>';
  if(kind==='auto')return '<g class="a-spin"><circle r="16" fill="none" stroke="var('+c.bd+')" stroke-width="9" stroke-dasharray="7.2 7.2"/><circle r="12" '+st+'/><circle r="4.5" fill="var(--surface)" stroke="var('+c.bd+')" stroke-width="2"/></g>';
  if(kind==='gw')return '<path d="M0 -28L28 0 0 28-28 0Z" '+st+'/><g class="a-arm"><path d="M0 0L17 -9" '+ln+' stroke-width="3.4"/><path d="M12 -15l7 3-3 7" '+ln+'/></g><circle r="3.4" fill="var('+c.bd+')"/>';
  if(kind==='call')return '<rect x="-24" y="-22" width="34" height="34" rx="4" fill="var(--surface)" stroke="var(--call-bd)" stroke-width="2"/><g class="a-pop"><rect x="-10" y="-12" width="34" height="34" rx="4" fill="var(--surface)" stroke="var(--call-bd)" stroke-width="2.4"/><path d="M7 0v18M-2 9h18" fill="none" stroke="var(--call-bd)" stroke-width="2.4" stroke-linecap="round"/></g>';
  if(kind==='end')return '<circle r="22" fill="var(--surface)" stroke="var(--edge)" stroke-width="4.5"/><path class="a-tick" d="M-10 1l7 7 13-15" fill="none" stroke="var(--edge)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>';
  /* start: un foglio che arriva */
  return '<circle r="22" fill="var(--surface)" stroke="var(--edge)" stroke-width="1.8"/><g class="a-drop"><rect x="-10" y="-13" width="20" height="26" rx="2.5" fill="var(--surface)" stroke="var(--edge)" stroke-width="2"/><path d="M-6 -5h12M-6 1h12M-6 7h7" fill="none" stroke="var(--edge)" stroke-width="1.8" stroke-linecap="round"/></g>';
}
function scWho(nd,kind){ /* una riga corta: il ruolo, non la frase */
  if(kind==='start')return 'Si comincia';if(kind==='end')return 'Si finisce';
  if(kind==='gw')return 'Qui si decide';if(kind==='call')return 'Parte un altro processo';
  if(kind==='human')return nd.lane==='Persona scelta al momento'?'Persona scelta al momento':nd.lane;
  if(kind==='ai')return 'Persona + assistente';
  return 'Il sistema';
}
function scBuild(g,caso){
  var n=caso.steps.length,cols=n<=4?Math.max(1,n):(n<=8?4:5),VW=1030,PADX=28,PADY=18,GX=40,GY=60,CH=176;
  var CW=Math.floor((VW-2*PADX-(cols-1)*GX)/cols),rows=Math.ceil(n/cols),VH=PADY*2+rows*CH+(rows-1)*GY;
  var out=['<defs><marker id="sc-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5 0 10z" fill="var(--edge)"/></marker></defs>'];
  var pos=caso.steps.map(function(s,i){var row=Math.floor(i/cols),col=i%cols;if(row%2)col=cols-1-col;return {row:row,col:col,x:PADX+col*(CW+GX),y:PADY+row*(CH+GY)};});
  /* le frecce fra una scheda e la successiva */
  var arrows=[];
  pos.forEach(function(p,i){
    var q=pos[i+1];if(!q)return;
    var d;
    if(q.row===p.row){var ltr=q.col>p.col;d=ltr?'M'+(p.x+CW)+' '+(p.y+CH/2)+'H'+(q.x-3):'M'+p.x+' '+(p.y+CH/2)+'H'+(q.x+CW+3);}
    else d='M'+(p.x+CW/2)+' '+(p.y+CH)+'V'+(q.y-3);
    arrows.push('<path class="sc-arrow" data-i="'+i+'" d="'+d+'" fill="none" stroke="var(--edge)" stroke-width="2.2" marker-end="url(#sc-ah)"/>');
  });
  out.push(arrows.join(''));
  var texts=testiPassi(g),cards=[];
  caso.steps.forEach(function(s,i){
    var nd=s.node,kind=isoKind(nd),p=pos[i],c=SC_KIND[kind]||null,w=plWho(nd),x=p.x,y=p.y,cx=x+CW/2;
    var bg=c?'var('+c.bg+')':'var(--surface)',bd=c?'var('+c.bd+')':(kind==='call'?'var(--call-bd)':'var(--edge)'),fg=c?'var('+c.fg+')':'var(--fg)';
    var nm=wrap(nd.name,Math.max(14,Math.floor(CW/8.2)),3),who=scWho(nd,kind),
        nx=caso.steps[i+1],ch=(nd.shape==='gw'&&nx&&nx.via&&nx.via.label)?'Poi: «'+wrap(nx.via.label,Math.max(14,Math.floor(CW/7.2)),1)[0]+'»':'';
    cards.push('<g class="sc-st" data-i="'+i+'"><title>'+esc(nd.name)+'</title>'+
      '<rect class="sc-card" x="'+x+'" y="'+y+'" width="'+CW+'" height="'+CH+'" rx="14" fill="'+bg+'" stroke="'+bd+'" stroke-width="2"/>'+
      '<circle cx="'+(x+17)+'" cy="'+(y+17)+'" r="11.5" class="sc-num"/><text x="'+(x+17)+'" y="'+(y+21)+'" class="sc-numt">'+(i+1)+'</text>'+
      '<g transform="translate('+cx+' '+(y+54)+')">'+scIcon(kind,c||{bg:'--surface',bd:'--edge'})+'</g>'+
      nm.map(function(t,k){return '<text x="'+cx+'" y="'+(y+100+k*16)+'" class="sc-name" fill="'+fg+'">'+esc(t)+'</text>';}).join('')+
      (who?'<text x="'+cx+'" y="'+(y+CH-(ch?24:10))+'" class="sc-who">'+esc(vzCut(who,Math.floor(CW/6)))+'</text>':'')+
      (ch?'<text x="'+cx+'" y="'+(y+CH-8)+'" class="sc-choice">'+esc(ch)+'</text>':'')+
      '<g class="sc-vis" transform="translate('+(x+CW-17)+' '+(y+17)+')"><circle r="9" fill="var(--auto-bd)"/><path d="M-4 0l3 3 5-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></g>');
  });
  out.push(cards.join(''));
  /* la pratica: un foglietto che si sposta da una scheda all'altra, lungo il bordo d'ingresso */
  var entry=pos.map(function(p,i){var prev=pos[i-1];if(!prev)return [p.x+14,p.y+CH/2];if(prev.row!==p.row)return [p.x+CW/2,p.y];return [prev.col<p.col?p.x:p.x+CW,p.y+CH/2];});
  var path=[];
  pos.forEach(function(p,i){
    var prev=pos[i-1];
    if(prev&&prev.row===p.row){path.push([prev.col<p.col?prev.x+CW:prev.x,prev.y+CH/2]);}
    path.push(entry[i]);
  });
  var idx=[],k=0;entry.forEach(function(e,i){while(k<path.length&&(path[k][0]!==e[0]||path[k][1]!==e[1]))k++;idx.push(k);k++;});
  var l0=path[0];
  out.push('<g id="sc-letter" transform="translate(0 0)"><g transform="translate('+l0[0]+' '+l0[1]+')"><rect x="-13" y="-9" width="26" height="18" rx="2.5" fill="var(--surface)" stroke="'+SC_HOT+'" stroke-width="2"/><path d="M-13 -9l13 10 13-10" fill="none" stroke="'+SC_HOT+'" stroke-width="2" stroke-linejoin="round"/></g></g>');
  return {W:VW,H:VH,body:out.join(''),path:path,idx:idx,l0:l0};
}
function scSvg(sc,label){return '<svg class="sc-svg" xmlns="'+NS+'" viewBox="0 0 '+sc.W+' '+sc.H+'" width="'+sc.W+'" height="'+sc.H+'" role="img" aria-label="'+esc(label)+'">'+sc.body+'</svg>';}
(function(){
  var st=document.createElement('style');st.id='sccss';
  st.textContent=
    '.sc-box{margin:0 0 12px}.sc-stage{border:1px solid var(--line);border-radius:4px;background:var(--surface);padding:6px;overflow:auto}'+
    '.sc-svg{display:block;width:100%;height:auto;min-width:640px}'+
    '.sc-bar{display:flex;gap:8px 10px;flex-wrap:wrap;align-items:center;margin:0 0 8px}'+
    '.sc-bar label{display:inline-flex;gap:6px;align-items:center;color:var(--muted);font-size:12px}'+
    '.sc-bar select{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:3px 6px;max-width:100%}'+
    '.sc-bar .pl-main{background:var(--accent);color:var(--bg);border-color:var(--accent);font-weight:600;padding:5px 14px}'+
    '.sc-name{font-size:14.5px;font-weight:600;text-anchor:middle}.sc-who{fill:var(--muted);font-size:11.5px;text-anchor:middle}.sc-choice{fill:var(--gw-fg);font-size:12px;font-weight:700;text-anchor:middle}'+
    '.sc-num{fill:var(--accent)}.sc-numt{fill:var(--bg);font-size:12px;font-weight:700;text-anchor:middle}'+
    '.sc-vis{opacity:0}.sc-st.vis .sc-vis{opacity:1}'+
    '.sc-st .sc-card{transition:stroke-width .2s}'+
    '.sc-st.act .sc-card{stroke:'+SC_HOT+';stroke-width:4;filter:drop-shadow(0 0 7px '+SC_HOT+')}'+
    '.sc-st.act .sc-num{fill:'+SC_HOT+'}'+
    '.sc-arrow.on{stroke:'+SC_HOT+';stroke-width:3}'+
    '.a-tick{stroke-dasharray:1;stroke-dashoffset:0}'+
    '.sc-st .a-tick{stroke-dashoffset:0}'+
    '.sc-st.act .a-tick{animation:scTick 1.6s ease-in-out infinite}'+
    '.sc-st.act .a-nod{animation:scNod 1.1s ease-in-out infinite}'+
    '.sc-st.act .a-scan{animation:scScan 1.5s linear infinite}'+
    '.sc-st.act .a-spark{transform-box:fill-box;transform-origin:center;animation:scSpark 1.2s ease-in-out infinite}'+
    '.sc-st.act .a-spin{animation:scSpin 2.4s linear infinite}'+
    '.sc-st .a-spin{transform-box:view-box}'+
    '.sc-st.act .a-arm{animation:scArm 1.8s ease-in-out infinite alternate}'+
    '.sc-st.act .a-pop{animation:scPop 1.6s ease-in-out infinite}'+
    '.sc-st.act .a-drop{animation:scDrop 1.6s ease-in infinite}'+
    '@keyframes scTick{0%,20%{stroke-dashoffset:1}60%,100%{stroke-dashoffset:0}}'+
    '@keyframes scNod{50%{transform:translateY(-4px)}}'+
    '@keyframes scScan{0%{opacity:.8;transform:translateY(0)}100%{opacity:.1;transform:translateY(42px)}}'+
    '@keyframes scSpark{50%{transform:scale(1.35) rotate(25deg)}}'+
    '@keyframes scSpin{to{transform:rotate(360deg)}}'+
    '@keyframes scArm{from{transform:rotate(-30deg)}to{transform:rotate(30deg)}}'+
    '@keyframes scPop{0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-6px)}}'+
    '@keyframes scDrop{0%{transform:translateY(-16px);opacity:0}45%{transform:translateY(0);opacity:1}100%{transform:translateY(0);opacity:1}}'+
    '@media (prefers-reduced-motion:reduce){.sc-st.act *{animation:none!important}.sc-st .sc-card{transition:none}}';
  document.head.appendChild(st);
})();
var scKill=function(){};
function scTutti(g){return {nome:'Tutti i passi',descrizione:'',steps:isoOrder(g).map(function(n){return {node:n,via:null};}),incompleto:''};}
function mountScena(g,host){
  if(!host)return;
  var casi=percorsiOf(g);if(g.nodes.length>2)casi.push(scTutti(g));
  var reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  host.innerHTML='<div class="sc-box"><div class="sc-bar"><label>Il caso <select id="sc-case" aria-label="Il caso">'+casi.map(function(c,i){return '<option value="'+i+'">'+esc(c.nome)+'</option>';}).join('')+'</select></label>'+
    '<button class="tool pl-main" id="sc-play" type="button">Avvia la simulazione</button><button class="tool" id="sc-step" type="button">Un passo</button><button class="tool" id="sc-reset" type="button">Da capo</button>'+
    '<label>Velocità <select id="sc-speed" aria-label="Velocità"><option value="0.6">lenta</option><option value="1" selected>normale</option><option value="1.8">veloce</option></select></label>'+
    '<label>Video <select id="sc-vscope" aria-label="Che video"><option value="caso">del caso scelto</option><option value="tutto">di tutto il processo, con tutte le diramazioni</option></select></label>'+
    '<button class="tool pl-main" id="sc-video" type="button">Scarica il video</button><span class="hint" id="sc-vstat" role="status">Si registra nel browser e dura quanto il video.</span></div><div id="sc-vbox"></div>'+
    '<div class="sc-stage" id="sc-stage"></div><div class="pl-cap" id="sc-cap" aria-live="polite"></div></div>';
  var vscope=host.querySelector('#sc-vscope'),videoB=host.querySelector('#sc-video'),vstat=host.querySelector('#sc-vstat'),vbox=host.querySelector('#sc-vbox'),caseS=host.querySelector('#sc-case'),play=host.querySelector('#sc-play'),stepB=host.querySelector('#sc-step'),resetB=host.querySelector('#sc-reset'),speedS=host.querySelector('#sc-speed'),stage=host.querySelector('#sc-stage'),cap=host.querySelector('#sc-cap');
  var caso,passi,sc,svg,letter,cur=-1,playing=false,moving=false,timer=null,raf=null,done=false;
  function speed(){return +speedS.value||1;}
  function clear(){if(timer){clearTimeout(timer);timer=null;}if(raf){cancelAnimationFrame(raf);raf=null;}moving=false;done=false;playing=false;cur=-1;play.textContent='Avvia la simulazione';}
  function render(){
    clear();caso=casi[+caseS.value||0];passi=casoPassi(g,caso);sc=scBuild(g,caso);
    stage.innerHTML=scSvg(sc,'Scena del caso «'+caso.nome+'»: '+g.title);svg=stage.querySelector('svg');letter=svg.querySelector('#sc-letter');
    cap.innerHTML='<span class="hint">Premi «Avvia la simulazione»: una pratica percorre i passi del caso. La scheda in corso si illumina e si anima, e qui sotto compare che cosa succede.</span>';
    cur=0;setLetter(sc.path[sc.idx[0]]);
  }
  function setLetter(q){letter.setAttribute('transform','translate('+(q[0]-sc.l0[0]).toFixed(1)+' '+(q[1]-sc.l0[1]).toFixed(1)+')');}
  function mark(i){
    [].forEach.call(svg.querySelectorAll('.sc-st'),function(x,k){x.classList.toggle('act',k===i);if(k<=i)x.classList.add('vis');});
    [].forEach.call(svg.querySelectorAll('.sc-arrow'),function(a,k){a.classList.toggle('on',k<i);});
    var p=passi[i],w=p.cls?'<span class="who '+p.cls+'">'+esc(p.who)+'</span>':'';
    cap.innerHTML='<span class="n">'+p.i+'</span><div class="t"><strong>'+esc(p.name)+'</strong>'+w+(p.scelta?'<p class="hint">Scelta fatta: «'+esc(p.scelta)+'»</p>':'')+(p.text?'<p>'+esc(p.text)+'</p>':'')+'</div>';
  }
  function place(i){cur=i;setLetter(sc.path[sc.idx[i]]);mark(i);}
  function finish(){done=true;playing=false;play.textContent='Rivedi la simulazione';var t=cap.querySelector('.t');if(t){var e=document.createElement('p');e.className='hint';e.textContent='Fine del caso: '+caso.steps.length+(caso.steps.length===1?' passo.':' passi.');t.appendChild(e);}}
  function after(){if(cur>=caso.steps.length-1){finish();return;}if(playing)timer=setTimeout(function(){timer=null;advance();},3000/speed());}
  function advance(){
    if(moving||done)return;
    if(cur>=caso.steps.length-1){finish();return;}
    var a=sc.idx[cur],b=sc.idx[cur+1],seg=sc.path.slice(a,b+1),len=0,sl=[],k;
    for(k=1;k<seg.length;k++){var l=Math.hypot(seg[k][0]-seg[k-1][0],seg[k][1]-seg[k-1][1]);sl.push(l);len+=l;}
    [].forEach.call(svg.querySelectorAll('.sc-st.act'),function(x){x.classList.remove('act');});
    if(reduced||len<1){place(cur+1);after();return;}
    moving=true;var t0=null,dur=Math.max(500,len/(240*speed())*1000);
    function frame(ts){
      if(t0==null)t0=ts;var u=Math.min(1,(ts-t0)/dur),e=u<0.5?2*u*u:1-Math.pow(-2*u+2,2)/2,dist=e*len,j=0;
      while(j<sl.length-1&&dist>sl[j]){dist-=sl[j];j++;}
      var f=sl[j]?Math.min(1,dist/sl[j]):1;setLetter([seg[j][0]+(seg[j+1][0]-seg[j][0])*f,seg[j][1]+(seg[j+1][1]-seg[j][1])*f]);
      if(u<1)raf=requestAnimationFrame(frame);else{raf=null;moving=false;place(cur+1);after();}
    }
    raf=requestAnimationFrame(frame);
  }
  scKill=function(){clear();};
  play.addEventListener('click',function(){
    if(done)render();
    if(playing){playing=false;if(timer){clearTimeout(timer);timer=null;}play.textContent='Riprendi';return;}
    playing=true;play.textContent='Pausa';
    if(!svg.querySelector('.sc-st.act')){place(0);after();}else if(!moving&&!timer)after();
  });
  stepB.addEventListener('click',function(){
    if(done)render();playing=false;if(timer){clearTimeout(timer);timer=null;}play.textContent='Riprendi';
    if(!svg.querySelector('.sc-st.act')){place(0);return;}
    advance();
  });
  /* il video: il tasto c'è sempre. Se il video di quella scelta è già stato registrato lo salva subito, altrimenti lo registra e poi lo salva */
  var vcache={},recording=false,real=casi.filter(function(c){return c.nome!=='Tutti i passi';});
  videoB.addEventListener('click',async function(){
    if(recording)return;
    if(typeof creaVideo!=='function'){vstat.textContent='Il video non è disponibile in questa pagina.';return;}
    var all=vscope.value==='tutto',ci=+caseS.value||0,key=all?'tutto':'caso|'+ci,c=casi[ci];
    async function salva(v){
      var dl=await downloadsCap();
      if(!dl){vstat.textContent='Il download è disponibile dalla pagina pubblicata, aperta in claude.ai.';return;}
      try{await dl.save({filename:slugOf(document.title||'flussi-bpm')+'-'+slugOf(g.key)+'-'+(all?'tutto-il-processo':slugOf(c.nome))+v.ext,data:v.blob});vstat.textContent='Video salvato ('+Math.round(v.total)+' s, '+(v.blob.size/1048576).toFixed(1).replace('.',',')+' MB).';}
      catch(e){vstat.textContent=e&&e.code==='declined'?'Download annullato.':'Non sono riuscito a salvare il video: '+((e&&e.message)||e);}
    }
    if(vcache[key]){await salva(vcache[key]);return;}
    clear();recording=true;videoB.disabled=true;vscope.disabled=true;caseS.disabled=true;
    try{
      var v=await creaVideo(g,{casi:all?real:[c],tutto:all,status:vstat,box:vbox});
      vcache[key]=v;vbox.innerHTML='';recording=false;videoB.disabled=false;vscope.disabled=false;caseS.disabled=false;
      await salva(v);
    }catch(e){vbox.innerHTML='';recording=false;videoB.disabled=false;vscope.disabled=false;caseS.disabled=false;vstat.textContent=(e&&e.message)||'Non sono riuscito a registrare il video.';}
  });
  resetB.addEventListener('click',render);caseS.addEventListener('change',render);
  render();
}
/* per PDF e Word: la scena a riposo, con i passi numerati */
function scenaCanvas(g,caso,scale){
  var sc=scBuild(g,caso),host=document.createElement('div');host.innerHTML=scSvg(sc,'Scena');
  var svg=host.firstChild;[].forEach.call(svg.querySelectorAll('#sc-letter'),function(x){x.parentNode.removeChild(x);});
  return toCanvas(svg,sc.W,sc.H,scale,{css:document.getElementById('svgcss').textContent+document.getElementById('sccss').textContent}).then(function(cv){return {cv:cv,W:sc.W,H:sc.H};});
}
