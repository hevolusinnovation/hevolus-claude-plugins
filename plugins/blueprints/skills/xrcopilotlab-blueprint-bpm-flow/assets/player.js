/* ───────── «Segui una pratica»: una pallina percorre il diagramma e racconta ogni passo ─────────
   Sul diagramma BPMN di un flusso: la pallina parte dall'inizio, si ferma a ogni passo (si illumina e sotto compare
   che cosa succede, con le parole di `passi` di spiegazioni.yml o, se mancano, quelle calcolate dal manifest) e
   segue le frecce. Dove la strada si divide compaiono i pulsanti con le condizioni del manifest: sceglie chi guarda.
   Non inventa niente: percorre gli stessi archi che il diagramma disegna. Con «riduci movimento» la pallina salta
   da un passo all'altro senza scorrere. */
(function(){
  var st=document.createElement('style');st.id='plcss';
  st.textContent=
    '.player{margin:0 0 10px;padding:10px 12px;border:1px solid var(--line);border-radius:4px;background:var(--surface)}'+
    '.pl-bar{display:flex;gap:8px 10px;flex-wrap:wrap;align-items:center}'+
    '.pl-bar .pl-main{background:var(--accent);color:var(--bg);border-color:var(--accent);font-weight:600;padding:5px 14px}'+
    '.pl-bar label{display:inline-flex;gap:6px;align-items:center;color:var(--muted);font-size:12px}'+
    '.pl-bar select{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:4px;padding:3px 6px}'+
    '.pl-cap{margin:8px 0 0;min-height:44px;display:flex;gap:10px;align-items:flex-start}'+
    '.pl-cap .n{flex:none;width:26px;height:26px;border-radius:50%;background:var(--accent);color:var(--bg);font-size:12px;font-weight:600;text-align:center;line-height:26px}'+
    '.pl-cap .t{min-width:0}.pl-cap strong{font-family:var(--font-display);font-size:16px}'+
    '.pl-cap .who{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:600;border:1px solid var(--line);color:var(--muted)}'+
    '.pl-cap .who.human{background:var(--human-bg);border-color:var(--human-bd);color:var(--human-fg)}'+
    '.pl-cap .who.ai{background:var(--ai-bg);border-color:var(--ai-bd);color:var(--ai-fg)}'+
    '.pl-cap .who.auto{background:var(--auto-bg);border-color:var(--auto-bd);color:var(--auto-fg)}'+
    '.pl-cap .who.gw{background:var(--gw-bg);border-color:var(--gw-bd);color:var(--gw-fg)}'+
    '.pl-cap p{margin:2px 0 0}'+
    '.pl-choice{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 0}'+
    '.pl-choice:empty{display:none}'+
    '.pl-choice button{font:500 13px var(--font-body);color:var(--gw-fg);background:var(--gw-bg);border:1.5px solid var(--gw-bd);border-radius:4px;padding:5px 12px;cursor:pointer;text-align:left}'+
    '.pl-choice button small{display:block;font-weight:400;font-size:11px;opacity:.85}'+
    '.pl-choice button:focus-visible,.pl-bar button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}'+
    '.pl-ask{flex-basis:100%;color:var(--muted);font-size:12px;margin:0}'+
    '.node.act .shape{stroke:var(--edge-hot);stroke-width:3.5}'+
    '.node.act{filter:drop-shadow(0 0 5px var(--edge-hot))}'+
    '.pl-dot{fill:var(--edge-hot);stroke:var(--surface);stroke-width:2}'+
    '.pl-halo{fill:var(--edge-hot);opacity:.28;transform-box:fill-box;transform-origin:center;animation:plpulse 1.3s ease-in-out infinite}'+
    '@keyframes plpulse{50%{transform:scale(1.7);opacity:.1}}'+
    '@media (prefers-reduced-motion:reduce){.pl-halo{animation:none}}';
  document.head.appendChild(st);
})();
var plKill=function(){};
function plWho(n){
  if(n.shape==='start')return null;if(n.shape==='end')return null;
  if(n.shape==='gw')return {c:'gw',t:'Qui si decide'};
  if(n.shape==='call')return {c:'gw',t:'Parte un altro processo'};
  var r=n.raw||{};
  if(n.cls==='human')return {c:'human',t:n.lane==='Persona scelta al momento'?'Lo fa una persona scelta al momento':'Lo fa '+n.lane};
  if(n.cls==='ai')return {c:'ai',t:'Persona con l’assistente'};
  return {c:'auto',t:n.collapsed?'Il sistema lavora da solo':'Lo fa il sistema da solo'};
}
function mountPlayer(g,d,canvas){
  var host=document.getElementById('player');if(!host)return;
  var reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var text=testiPassi(g),casi=percorsiOf(g);
  host.innerHTML='<div class="pl-bar"><button class="tool pl-main" id="pl-play" type="button">Segui una pratica</button>'+
    '<button class="tool" id="pl-step" type="button">Un passo</button><button class="tool" id="pl-reset" type="button">Da capo</button>'+
    '<label>Velocità <select id="pl-speed" aria-label="Velocità"><option value="0.6">lenta</option><option value="1" selected>normale</option><option value="1.8">veloce</option></select></label></div>'+
    '<div class="pl-cap" id="pl-cap" aria-live="polite"><span class="hint">Premi «Segui una pratica»: una pallina percorre il diagramma e racconta che cosa succede a ogni passo. Dove la strada si divide scegli tu.</span></div>'+
    '<div class="pl-choice" id="pl-choice"></div>';
  var play=host.querySelector('#pl-play'),stepB=host.querySelector('#pl-step'),resetB=host.querySelector('#pl-reset'),speedS=host.querySelector('#pl-speed'),cap=host.querySelector('#pl-cap'),choice=host.querySelector('#pl-choice');
  var svg=d.svg,NSx='http://www.w3.org/2000/svg',plan=null,pi=0,cur=null,playing=false,moving=false,timer=null,raf=null,done=false,count=0,waiting=false;
  var tok=document.createElementNS(NSx,'g');tok.setAttribute('class','pl-token');tok.style.display='none';
  var halo=document.createElementNS(NSx,'circle');halo.setAttribute('r',10);halo.setAttribute('class','pl-halo');
  var dot=document.createElementNS(NSx,'circle');dot.setAttribute('r',5.5);dot.setAttribute('class','pl-dot');
  tok.appendChild(halo);tok.appendChild(dot);svg.appendChild(tok);
  function speed(){return +speedS.value||1;}
  function start(){var s=g.nodes.filter(function(n){return n.shape==='start';});return s[0]||g.order[0];}
  function setTok(x,y){tok.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+')');tok.style.display='';}
  function look(n){
    [].forEach.call(canvas.querySelectorAll('.node.act'),function(x){x.classList.remove('act');});
    var el=d.nodeEls[n.id];if(el)el.classList.add('act');
    var w=plWho(n),t=text[n.num]||(n.shape==='end'?'Fine.':'');
    cap.innerHTML='<span class="n">'+n.num+'</span><div class="t"><strong>'+esc(n.name)+'</strong>'+(w?'<span class="who '+w.c+'">'+esc(w.t)+'</span>':'')+(t?'<p>'+esc(t)+'</p>':'')+'</div>';
    var left=n.cx*scale-canvas.clientWidth/2;
    try{canvas.scrollTo({left:Math.max(0,left),behavior:reduced?'auto':'smooth'});}catch(e){canvas.scrollLeft=Math.max(0,left);}
  }
  function outs(n){return d.edgeEls.filter(function(x){return x.e.from===n.id;});}
  function finish(){
    done=true;playing=false;waiting=false;play.textContent='Rivedi dall’inizio';
    var extra=document.createElement('p');extra.textContent='La pratica è arrivata alla fine, passando per '+count+(count===1?' passo.':' passi.');
    var t=cap.querySelector('.t');if(t)t.appendChild(extra);
  }
  function arrive(n){
    cur=n;count++;look(n);
    if(n.shape==='end'||!outs(n).length){finish();return;}
    var o=outs(n);
    if(o.length>1&&!plan){showChoice(o);return;}
    if(playing)timer=setTimeout(function(){timer=null;next();},1700/speed());
  }
  function showChoice(o){
    waiting=true;
    choice.innerHTML='<p class="pl-ask">'+(playing?'Si ferma qui: scegli la strada.':'Scegli la strada:')+'</p>';
    o.forEach(function(x){
      var b=document.createElement('button');b.type='button';
      var to=g.byId[x.e.to];
      b.innerHTML=esc(x.e.label||'avanti')+'<small>poi: '+esc(to?to.name:'')+'</small>';
      b.addEventListener('click',function(){choice.innerHTML='';waiting=false;go(x);});
      choice.appendChild(b);
    });
  }
  function go(x){
    var pts=x.pts,len=0,seg=[],i;
    for(i=1;i<pts.length;i++){var l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);len+=l;}
    x.p.classList.add('done');
    var target=g.byId[x.e.to];
    if(reduced||len<1){setTok(target.cx,target.cy);arrive(target);return;}
    moving=true;var t0=null,dur=Math.max(350,len/(240*speed())*1000);
    function frame(ts){
      if(t0==null)t0=ts;var k=Math.min(1,(ts-t0)/dur),e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2,dist=e*len,j=0;
      while(j<seg.length-1&&dist>seg[j]){dist-=seg[j];j++;}
      var f=seg[j]?Math.min(1,dist/seg[j]):1;
      setTok(pts[j][0]+(pts[j+1][0]-pts[j][0])*f,pts[j][1]+(pts[j+1][1]-pts[j][1])*f);
      if(k<1)raf=requestAnimationFrame(frame);else{raf=null;moving=false;arrive(target);}
    }
    raf=requestAnimationFrame(frame);
  }
  function next(){
    if(moving||waiting||done)return;
    if(!cur){cur=start();count=0;setTok(cur.cx,cur.cy);count=1;look(cur);if(playing)timer=setTimeout(function(){timer=null;next();},1500/speed());return;}
    var o=outs(cur);
    if(!o.length){finish();return;}
    if(plan){
      var want=plan.steps[++pi];if(!want){finish();return;}
      var hit=o.filter(function(x){return x.e===want.via;})[0];if(!hit){finish();return;}
      go(hit);return;
    }
    if(o.length>1){showChoice(o);return;}
    go(o[0]);
  }
  function clear(){
    if(timer){clearTimeout(timer);timer=null;}if(raf){cancelAnimationFrame(raf);raf=null;}
    moving=false;waiting=false;done=false;cur=null;count=0;plan=null;pi=0;choice.innerHTML='';
    [].forEach.call(canvas.querySelectorAll('.node.act'),function(x){x.classList.remove('act');});
    d.edgeEls.forEach(function(x){x.p.classList.remove('done');});
    tok.style.display='none';
  }
  plKill=function(){clear();playing=false;};
  play.addEventListener('click',function(){
    if(done){clear();play.textContent='Pausa';playing=true;next();return;}
    if(playing){playing=false;if(timer){clearTimeout(timer);timer=null;}play.textContent='Riprendi';return;}
    playing=true;play.textContent='Pausa';
    if(!waiting&&!moving)next();
  });
  stepB.addEventListener('click',function(){
    if(done){clear();}
    playing=false;if(timer){clearTimeout(timer);timer=null;}play.textContent=cur?'Riprendi':'Segui una pratica';
    next();
  });
  resetB.addEventListener('click',function(){clear();playing=false;play.textContent='Segui una pratica';cap.innerHTML='<span class="hint">Premi «Segui una pratica» per ripartire dall’inizio.</span>';});
}
