/* ───────── grafici: i numeri del manifest, in figure ─────────
   Tre grafici, tutti calcolati dal manifest (nessun dato inventato), costruiti con le regole della skill `dataviz`:
   1. «Come sono fatti i flussi»: barre impilate, una per flusso, per tipo di passo.
   2. «Chi lavora di più»: passi svolti da una persona, per ruolo.
   3. «La settimana tipo»: quante volte al giorno e a che ora partono le attività che girano da sole.
   I colori sono validati con `validate_palette.js` (chiaro e scuro, categorica a 4 + neutro): il blu/viola
   della pagina da soli non reggono la prova (non si distinguono con la visione dei colori alterata), quindi qui
   il viola è più chiaro e il blu più scuro, e l'identità non sta mai nel solo colore: legenda, etichette, tabella.
   Chiaro: #2f5fd0 #b08af5 #2a9d5c #b45309 — il viola ha contrasto 2,6:1, da qui etichette visibili e tabella.
   Scuro: #3260cc #9d7de4 #2f9f63 #c07a28 — verde/ambra a ΔE 7,6 (zona «solo con codifica secondaria»). */
var VIZ_PAL={
  light:{'--vz-human':'#2f5fd0','--vz-ai':'#b08af5','--vz-auto':'#2a9d5c','--vz-gw':'#b45309','--vz-call':'#8a8f98','--vz-empty':'#eceee9',
    '--vz-on-human':'#ffffff','--vz-on-ai':'#1c2127','--vz-on-auto':'#ffffff','--vz-on-gw':'#ffffff','--vz-on-call':'#ffffff'},
  dark:{'--vz-human':'#3260cc','--vz-ai':'#9d7de4','--vz-auto':'#2f9f63','--vz-gw':'#c07a28','--vz-call':'#7a838d','--vz-empty':'#232a31',
    '--vz-on-human':'#ffffff','--vz-on-ai':'#1c2127','--vz-on-auto':'#1c2127','--vz-on-gw':'#1c2127','--vz-on-call':'#1c2127'}
};
var VIZ_CSS=
  '.viz{font-family:var(--font-body)}'+
  '.viz text{font-family:var(--font-body)}'+
  '.vz-lab{fill:var(--fg);font-size:12px}.vz-sub{fill:var(--muted);font-size:11px}.vz-val{font-size:11px;font-weight:600}'+
  '.vz-grid{stroke:var(--line);stroke-width:1;fill:none}'+
  '.vz-human{fill:var(--vz-human)}.vz-ai{fill:var(--vz-ai)}.vz-auto{fill:var(--vz-auto)}.vz-gw{fill:var(--vz-gw)}.vz-call{fill:var(--vz-call)}.vz-empty{fill:var(--vz-empty)}'+
  '.vz-on-human{fill:var(--vz-on-human)}.vz-on-ai{fill:var(--vz-on-ai)}.vz-on-auto{fill:var(--vz-on-auto)}.vz-on-gw{fill:var(--vz-on-gw)}.vz-on-call{fill:var(--vz-on-call)}'+
  '.viz [data-tip]{cursor:default}.viz [data-tip]:hover{opacity:.82}'+
  '.viz-tip{position:fixed;z-index:20;pointer-events:none;background:var(--fg);color:var(--bg);font:500 12px var(--font-body);padding:5px 9px;border-radius:4px;max-width:320px;display:none}'+
  '.viz-box{border:1px solid var(--line);border-radius:4px;background:var(--surface);padding:12px 16px;margin:0 0 12px}'+
  '.viz-box h3{font-family:var(--font-display);font-size:17px;margin:0 0 2px}.viz-box .hint{margin:0 0 8px}'+
  '.viz-box svg{display:block;width:100%;height:auto}'+
  '.viz-box details{margin-top:6px}.viz-box summary{cursor:pointer;color:var(--muted);font-size:12px}'+
  '.viz-box .tw{margin:6px 0 0}';
(function(){
  function vars(o){return Object.keys(o).map(function(k){return k+':'+o[k];}).join(';');}
  var st=document.createElement('style');st.id='vizpal';
  st.textContent=VIZ_CSS+'.viz-scope{'+vars(VIZ_PAL.light)+'}'+
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .viz-scope{'+vars(VIZ_PAL.dark)+'}}'+
    ':root[data-theme="dark"] .viz-scope{'+vars(VIZ_PAL.dark)+'}';
  document.head.appendChild(st);
})();

function vzCut(s,n){s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s;}
function vzRect(x,y,w,h,rl,rr){ /* barra con la fine rotonda (4px) e la base quadra */
  rl=Math.min(rl,w/2,h/2);rr=Math.min(rr,w/2,h/2);
  return 'M'+(x+rl)+' '+y+'H'+(x+w-rr)+(rr?'a'+rr+' '+rr+' 0 0 1 '+rr+' '+rr:'')+'V'+(y+h-rr)+(rr?'a'+rr+' '+rr+' 0 0 1 '+(-rr)+' '+rr:'')+'H'+(x+rl)+(rl?'a'+rl+' '+rl+' 0 0 1 '+(-rl)+' '+(-rl):'')+'V'+(y+rl)+(rl?'a'+rl+' '+rl+' 0 0 1 '+rl+' '+(-rl):'')+'Z';
}
function vzLegend(kinds,x,y){
  var o='',cx=x;
  kinds.forEach(function(k){var t=ISO_NAME[k]||k;o+='<rect class="vz-'+k+'" x="'+cx+'" y="'+(y-8)+'" width="10" height="10" rx="2"/><text class="vz-sub" x="'+(cx+15)+'" y="'+y+'">'+esc(t)+'</text>';cx+=15+t.length*6+22;});
  return o;
}
function vzSvg(W,H,label,body){return '<svg class="viz" xmlns="'+NS+'" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(label)+'">'+body+'</svg>';}

/* 1 ─ come sono fatti i flussi */
function vzComposition(){
  var m=isoMapData;if(!m||!m.items.length)return null;
  var kinds=['human','ai','auto','gw','call'].filter(function(k){return m.tot[k];});
  var W=960,L=250,R=70,top=40,rowH=30,bar=20,H=top+m.items.length*rowH+14,max=Math.max.apply(null,m.items.map(function(it){return kinds.reduce(function(a,k){return a+it.cnt[k];},0);}))||1;
  var sc=(W-L-R)/max,o=vzLegend(kinds,L,18),table=[];
  m.items.forEach(function(it,r){
    var y=top+r*rowH,x=L,tot=kinds.reduce(function(a,k){return a+it.cnt[k];},0),last=-1;
    kinds.forEach(function(k,j){if(it.cnt[k])last=j;});
    o+='<text class="vz-lab" x="0" y="'+(y+bar*0.72)+'"><tspan style="font-weight:600">'+it.code+'</tspan>  '+esc(vzCut(it.title,34))+'</text>';
    kinds.forEach(function(k,j){
      var v=it.cnt[k];if(!v)return;
      var w=v*sc,gap=j<last?2:0,tip=it.code+' · '+it.title+' — '+(ISO_NAME[k])+': '+v+(v===1?' passo':' passi')+' su '+tot;
      o+='<path class="vz-'+k+'" data-tip="'+esc(tip)+'" d="'+vzRect(x,y,Math.max(1,w-gap),bar,0,j===last?4:0)+'"/>';
      if(w-gap>=String(v).length*7+12)o+='<text class="vz-val vz-on-'+k+'" x="'+(x+(w-gap)/2)+'" y="'+(y+bar*0.72)+'" text-anchor="middle">'+v+'</text>';
      x+=w;
    });
    o+='<text class="vz-sub" x="'+(x+8)+'" y="'+(y+bar*0.72)+'">'+tot+'</text>';
    table.push([it.code+' · '+it.title].concat(kinds.map(function(k){return it.cnt[k];})).concat([tot]));
  });
  return {id:'comp',title:'Come sono fatti i flussi',sub:'Passi di ogni flusso, per chi li fa. Il numero in fondo alla barra è il totale.',svg:vzSvg(W,H,'Passi di ogni flusso per tipo',o),W:W,H:H,
    head:['Flusso'].concat(kinds.map(function(k){return ISO_NAME[k];})).concat(['Totale']),rows:table};
}
/* 2 ─ chi lavora di più */
function vzRoles(){
  var by={},order=[];
  graphs.forEach(function(g){if(g.kind!=='Processo')return;g.nodes.forEach(function(n){
    if(n.shape!=='task'||(n.cls!=='human'&&n.cls!=='ai'))return;
    var l=n.lane||'Senza ruolo';if(!by[l]){by[l]=0;order.push(l);}by[l]++;});});
  if(!order.length)return null;
  order.sort(function(a,b){return by[b]-by[a];});
  var rows=order.slice(0,9).map(function(l){return [l,by[l]];}),rest=order.slice(9).reduce(function(a,l){return a+by[l];},0);
  if(rest)rows.push(['Altri ruoli ('+(order.length-9)+')',rest]);
  var W=960,L=250,R=60,rowH=30,bar=20,top=8,H=top+rows.length*rowH+8,max=rows[0][1],sc=(W-L-R)/max,o='';
  rows.forEach(function(r,i){
    var y=top+i*rowH,w=r[1]*sc;
    o+='<text class="vz-lab" x="0" y="'+(y+bar*0.72)+'">'+esc(vzCut(r[0],36))+'</text>'+
      '<path class="vz-human" data-tip="'+esc(r[0]+': '+r[1]+(r[1]===1?' passo':' passi'))+'" d="'+vzRect(L,y,Math.max(2,w),bar,0,4)+'"/>'+
      '<text class="vz-val" style="fill:var(--fg)" x="'+(L+w+8)+'" y="'+(y+bar*0.72)+'">'+r[1]+'</text>';
  });
  return {id:'ruoli',title:'Chi lavora di più',sub:'Passi che svolge una persona (anche con l’aiuto dell’assistente), per ruolo, in tutti i processi.',svg:vzSvg(W,H,'Passi per ruolo',o),W:W,H:H,head:['Ruolo','Passi'],rows:rows};
}
/* 3 ─ la settimana tipo */
function vzWeek(){
  var cells=[],k,h,d,any=0,tasks=(doc.agentTasks||[]).filter(function(t){return t.trigger==='scheduled'&&t.schedule&&t.schedule.cron;});
  for(d=0;d<7;d++){cells[d]=[];for(h=0;h<24;h++)cells[d][h]=0;}
  tasks.forEach(function(t){
    var f=String(t.schedule.cron).trim().split(/\s+/);if(f.length!==5||f[2]!=='*'||f[3]!=='*')return;
    var mins=expand(f[0],0,59),hrs=expand(f[1],0,23),dow=(f[4]==='*'?[0,1,2,3,4,5,6]:expand(f[4],0,7).map(function(x){return x%7;}));
    hrs.forEach(function(hh_){dow.forEach(function(dd){cells[dd][hh_]+=mins.length;any+=mins.length;});});
  });
  if(!any)return null;
  var days=[1,2,3,4,5,6,0],h0=23,h1=0,max=0;
  days.forEach(function(dd){for(h=0;h<24;h++)if(cells[dd][h]){h0=Math.min(h0,h);h1=Math.max(h1,h);max=Math.max(max,cells[dd][h]);}});
  h0=Math.max(0,h0-1);h1=Math.min(23,h1+1);
  var cw=36,ch=26,gap=2,L=52,top=34,W=L+(h1-h0+1)*cw+24,H=top+7*ch+46,o='',buckets=4;
  for(h=h0;h<=h1;h++)if((h-h0)%2===0||h1-h0<8)o+='<text class="vz-sub" x="'+(L+(h-h0)*cw+cw/2)+'" y="'+(top-10)+'" text-anchor="middle">'+hh(h)+'</text>';
  var table=[];
  days.forEach(function(dd,r){
    var y=top+r*ch;o+='<text class="vz-lab" x="0" y="'+(y+ch*0.68)+'">'+DAYS3[dd]+'</text>';
    var tot=0;
    for(h=h0;h<=h1;h++){
      var v=cells[dd][h],x=L+(h-h0)*cw;tot+=v;
      if(!v){o+='<rect class="vz-empty" x="'+x+'" y="'+y+'" width="'+(cw-gap)+'" height="'+(ch-gap)+'" rx="3"/>';continue;}
      var b=Math.ceil(buckets*v/max),op=(0.28+0.72*b/buckets).toFixed(2);
      o+='<rect class="vz-human" data-tip="'+esc(DAYS[dd]+' alle '+hh(h)+': '+v+(v===1?' giro':' giri'))+'" x="'+x+'" y="'+y+'" width="'+(cw-gap)+'" height="'+(ch-gap)+'" rx="3" fill-opacity="'+op+'"/>';
      if(v===max)o+='<text class="vz-val vz-on-human" x="'+(x+(cw-gap)/2)+'" y="'+(y+ch*0.62)+'" text-anchor="middle">'+v+'</text>';
    }
    table.push([DAYS[dd].charAt(0).toUpperCase()+DAYS[dd].slice(1),tot]);
  });
  var ly=top+7*ch+22;o+='<text class="vz-sub" x="0" y="'+ly+'">Giri per ora</text>';
  for(var b2=1;b2<=buckets;b2++){var lx=92+(b2-1)*84;o+='<rect class="vz-human" x="'+lx+'" y="'+(ly-11)+'" width="14" height="14" rx="3" fill-opacity="'+(0.28+0.72*b2/buckets).toFixed(2)+'"/><text class="vz-sub" x="'+(lx+19)+'" y="'+ly+'">'+(b2===buckets?'fino a '+max:'≤ '+Math.max(1,Math.round(max*b2/buckets)))+'</text>';}
  return {id:'settimana',title:'La settimana tipo',sub:'Quante volte, a che ora e in che giorno partono le attività che girano da sole (orari del manifest; il numero è il massimo in un’ora).',svg:vzSvg(W,H,'Settimana tipo delle attività schedulate',o),W:W,H:H,head:['Giorno','Giri nel giorno'],rows:table};
}
var vizData=null;
function vzBuild(){return [vzComposition(),vzRoles(),vzWeek()].filter(Boolean);}
function mountGrafici(){
  var host=document.getElementById('numeri');if(!host)return;
  vizData=vzBuild();if(!vizData.length){host.innerHTML='';return;}
  host.innerHTML='<details class="mappa-box"><summary>I numeri del blueprint: passi, ruoli e settimana tipo</summary><div class="viz-scope">'+
    vizData.map(function(c){
      return '<div class="viz-box" data-id="'+c.id+'"><h3>'+esc(c.title)+'</h3><p class="hint">'+esc(c.sub)+'</p>'+c.svg+
        '<details><summary>I numeri in tabella</summary>'+tableHtml(c.head,c.rows.map(function(r){return r.map(function(x,i){return i?String(x):esc(x);});}))+'</details></div>';}).join('')+'</div></details>';
  var tip=document.getElementById('viztip');if(!tip){tip=document.createElement('div');tip.id='viztip';tip.className='viz-tip';document.body.appendChild(tip);}
  host.addEventListener('mouseover',function(e){var t=e.target.closest&&e.target.closest('[data-tip]');if(!t){tip.style.display='none';return;}tip.textContent=t.getAttribute('data-tip');tip.style.display='block';});
  host.addEventListener('mousemove',function(e){tip.style.left=Math.min(window.innerWidth-tip.offsetWidth-8,e.clientX+12)+'px';tip.style.top=(e.clientY+14)+'px';});
  host.addEventListener('mouseleave',function(){tip.style.display='none';});
}
/* per PDF e Word: il grafico a colori della versione chiara */
function vizExportCanvas(c,scale){
  var host=document.createElement('div');host.innerHTML=c.svg;
  var vars=Object.keys(VIZ_PAL.light).map(function(k){return k+':'+VIZ_PAL.light[k];}).join(';');
  return toCanvas(host.firstChild,c.W,c.H,scale,{css:VIZ_CSS,vars:vars});
}
