/* ───────── mappa isometrica dei processi ─────────
   Una figura sola, calcolata dal manifest: ogni processo è una postazione su un banco; sulla postazione,
   in fila (a serpentina), un pezzo per ogni passo — persona, persona + assistente, automatico, bivio,
   sottoprocesso, inizio e fine. I pezzi sono quelli della vista sintetica (le serie di passi automatici
   sono un pezzo solo, più alto). Nessun numero è inventato: i conteggi sono quelli del manifest.
   Il kit è `ISO` (assets/iso/iso-kit.mjs, dalla skill «anatomy», MIT: vedi assets/iso/ORIGINE.md). */
var ISO_TONE={human:'blue',ai:'violet',auto:'green',gw:'amber',call:'hi',start:'hi',end:'hi'};
var ISO_NAME={human:'Persona',ai:'Persona + assistente',auto:'Automatico',gw:'Bivio',call:'Sottoprocesso'};
var ISO_MONO='ui-monospace,"SF Mono",Menlo,Consolas,monospace';
/* La tavolozza vive qui, una volta: la pagina ne ricava gli stili, l'esportazione la stessa in chiaro.
   V = i colori della pagina (nella pagina sono riferimenti var(--…), nell'esportazione i valori veri). */
function isoPalette(theme,V){
  var base={'--anatomy-weight':'.6px','--anatomy-mono':ISO_MONO,'--anatomy-ease':'cubic-bezier(.32,.72,0,1)',
    '--anatomy-blue':V['--human-bd'],'--anatomy-violet':V['--ai-bd'],'--anatomy-green':V['--auto-bd'],'--anatomy-amber':V['--gw-bd'],
    '--anatomy-card':V['--surface'],'--anatomy-paper':V['--surface'],'--anatomy-page':V['--bg'],'--anatomy-text':V['--muted'],'--anatomy-strong':V['--fg']};
  var light={'--anatomy-muted':'#8c8c90','--anatomy-face':'#ffffff','--anatomy-top':'#ffffff','--anatomy-shade-0':'#dcdcd9','--anatomy-shade-1':'#e5e5e2','--anatomy-shade-2':'#ededea','--anatomy-shade-3':'#f4f4f1',
    '--anatomy-lit-top':'#ffffff','--anatomy-lit-shade':'#eeeeeb','--anatomy-hi':'#26262a','--anatomy-mid':'#8a8a8f','--anatomy-lo':'#b4b4b8','--anatomy-faint':'#d4d4d6','--anatomy-lit':'#000000',
    '--anatomy-halo':'#8a8a80','--anatomy-halo-opacity':'.32','--anatomy-dot':'#3a3a3e','--anatomy-red':'#e5484d'};
  var dark={'--anatomy-muted':'#6e6e6e','--anatomy-face':'#262c33','--anatomy-top':'#2a3139','--anatomy-shade-0':'#11151a','--anatomy-shade-1':'#151a20','--anatomy-shade-2':'#1a2027','--anatomy-shade-3':'#20262e',
    '--anatomy-lit-top':'#323a44','--anatomy-lit-shade':'#272e36','--anatomy-hi':'#d4d4d4','--anatomy-mid':'#7a838d','--anatomy-lo':'#4a525b','--anatomy-faint':'#2f363e','--anatomy-lit':'#ffffff',
    '--anatomy-halo':'#050505','--anatomy-halo-opacity':'.9','--anatomy-dot':'#e6e6e6','--anatomy-red':'#ff6b6b'};
  var out={},src=theme==='dark'?dark:light,k;
  for(k in base)out[k]=base[k];for(k in src)out[k]=src[k];
  return out;
}
function isoVarsText(o){return Object.keys(o).map(function(k){return k+':'+o[k];}).join(';');}
(function(){
  var V={};['--bg','--surface','--fg','--muted','--human-bd','--ai-bd','--auto-bd','--gw-bd'].forEach(function(k){V[k]='var('+k+')';});
  var st=document.createElement('style');st.id='isopal';
  st.textContent='.iso.iso-bpm{'+isoVarsText(isoPalette('light',V))+'}'+
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .iso.iso-bpm{'+isoVarsText(isoPalette('dark',V))+'}}'+
    ':root[data-theme="dark"] .iso.iso-bpm{'+isoVarsText(isoPalette('dark',V))+'}';
  document.head.appendChild(st);
})();

function isoOrder(g){ /* i passi nell'ordine in cui il processo li incontra: in ampiezza dall'inizio, senza i giri di ritorno */
  var out={},byId={};g.nodes.forEach(function(n){byId[n.id]=n;out[n.id]=[];});
  g.edges.forEach(function(e){if(out[e.from]&&byId[e.to])out[e.from].push(e.to);});
  var seen={},order=[],q=g.nodes.filter(function(n){return n.shape==='start';}).map(function(n){return n.id;});
  if(!q.length&&g.nodes.length)q=[g.nodes[0].id];
  while(q.length){var id=q.shift();if(seen[id])continue;seen[id]=1;order.push(byId[id]);out[id].forEach(function(t){if(!seen[t])q.push(t);});}
  g.nodes.forEach(function(n){if(!seen[n.id])order.push(n);});
  return order;
}
function isoKind(n){
  if(n.shape==='start')return 'start';if(n.shape==='end')return 'end';if(n.shape==='gw')return 'gw';if(n.shape==='call')return 'call';
  return n.cls==='ai'?'ai':n.cls==='human'?'human':'auto';
}
/* Un pezzo: i solidi del kit, appoggiati alla postazione a quota z0, centrati in (x,y). */
function isoPiece(x,y,z0,p,kind,stack){
  var K=ISO,S=K.solidSvg,o=[];
  if(kind==='start'){o.push(S(K.cylinder(x,y,3.4,z0,1.8,p,24,0.3),{tone:'hi'}));}
  else if(kind==='end'){o.push(S(K.cylinder(x,y,3.4,z0,1.8,p,24,0.3),{tone:'hi'}));o.push(K.lineSvg(K.ring(x,y,1.7,z0+1.8,p,18),{tone:'hi'}));}
  else if(kind==='human'){
    o.push(S(K.cylinder(x,y,3.2,z0,7,p,24,0.4),{tone:'blue'}));
    o.push(S(K.cylinder(x,y,2.3,z0+7,2.8,p,20,0.3),{tone:'blue'}));
  }else if(kind==='ai'){
    o.push(S(K.slabOf({x:x-4.4,y:y-4.4,w:8.8,d:8.8,r:1.4},z0,6,p,6,0.5),{tone:'violet'}));
    o.push(S(K.slabOf({x:x-2.4,y:y-2.4,w:4.8,d:4.8,r:0.8},z0+6,3,p,4,0.3),{tone:'violet'}));
    o.push(K.dotsSvg([K.iso([x,y,z0+9.6],p)],{size:0.6,tone:'hi'}));
  }else if(kind==='auto'){
    var n=Math.max(1,Math.min(3,stack||1));
    for(var i=0;i<n;i++){o.push(S(K.cylinder(x,y,4.1,z0+i*2.6,2.4,p,28,0.3),{tone:'green'}));}
    o.push(K.lineSvg(K.knurl(x,y,4.1,z0+(n-1)*2.6,z0+(n-1)*2.6+2.4,10,p,0.3),{tone:'green'}));
  }else if(kind==='gw'){
    o.push(S(K.extrude([[x-5,y],[x,y-5],[x+5,y],[x,y+5]],z0,3.4,p,{convex:true,bevel:0.3}),{tone:'amber'}));
  }else{ /* call */
    var plan={x:x-4.4,y:y-4.4,w:8.8,d:8.8,r:1.2};
    o.push(S(K.slabOf(plan,z0,2.6,p,5,0.3),{tone:'hi'}));
    o.push(K.lineSvg(K.planOutline(K.insetPlan(plan,2),z0+2.6,p),{tone:'mid'}));
  }
  return o.join('');
}
function isoMapBuild(){
  var flows=graphs.filter(function(g){return g.kind==='Processo'||g.kind==='Orchestratore';});if(!flows.length)return null;
  var K=ISO,PER=7,PX=13,PY=17,Z=10,GAP=24,MAXP=28,nP=0,nO=0;
  var items=flows.map(function(g0,i){
    var proc=g0.kind==='Processo',g=proc?collapse(g0):g0,ord=isoOrder(g),cnt={human:0,ai:0,auto:0,gw:0,call:0};
    g0.nodes.forEach(function(n){var k=isoKind(n);if(cnt[k]!=null)cnt[k]++;});
    var pcs=ord.map(function(n){return {kind:isoKind(n),stack:n.collapsed?(n.ids||[]).length:1};});
    var more=Math.max(0,pcs.length-MAXP);if(more)pcs=pcs.slice(0,MAXP);
    return {i:i,gi:graphs.indexOf(g0),orch:!proc,code:proc?'P'+(++nP):'O'+(++nO),key:g0.key,title:g0.title,pcs:pcs,more:more,cnt:cnt,n:g0.nodes.length};
  });
  var N=items.length,cols=N<=3?N:Math.ceil(Math.sqrt(N));
  var W=Math.max.apply(null,items.map(function(it){return Math.min(PER,it.pcs.length);}))*PX+18;W=Math.max(W,62);
  items.forEach(function(it){it.rows=Math.max(1,Math.ceil(it.pcs.length/PER));it.D=it.rows*PY+24;});
  var rowsN=Math.ceil(N/cols),rowD=[],r,c;
  for(r=0;r<rowsN;r++){rowD[r]=Math.max.apply(null,items.slice(r*cols,r*cols+cols).map(function(it){return it.D;}));}
  var TW=cols*W+(cols-1)*GAP,TD=rowD.reduce(function(a,b){return a+b;},0)+(rowsN-1)*GAP,oy=-TD/2,y0=[];
  for(r=0;r<rowsN;r++){y0[r]=oy;oy+=rowD[r]+GAP;}
  items.forEach(function(it,j){it.c=j%cols;it.r=Math.floor(j/cols);it.x=-TW/2+it.c*(W+GAP);it.y=y0[it.r];it.W=W;});
  var base={x:-TW/2-14,y:-TD/2-30,w:TW+28,d:TD+44,r:6},fitPts=K.boxCorners(base,-13,0);
  items.forEach(function(it){K.boxCorners({x:it.x,y:it.y,w:W,d:it.D},0,Z+16).forEach(function(q){fitPts.push(q);});});
  /* vista frontale (azimut 90): la fila dei pezzi corre in orizzontale; l'altezza segue le proporzioni del banco */
  var AZ=90,EL=34,VW=1000,unit={origin:[0,0],scale:1,azimuth:AZ,elevation:EL},sx=fitPts.map(function(q){return K.iso(q,unit);}),
    bw=Math.max.apply(null,sx.map(function(q){return q[0];}))-Math.min.apply(null,sx.map(function(q){return q[0];})),
    bh=Math.max.apply(null,sx.map(function(q){return q[1];}))-Math.min.apply(null,sx.map(function(q){return q[1];})),
    VH=Math.round(Math.max(300,Math.min(640,(VW-44)*bh/bw+44)));
  var P=K.fitProjection(fitPts,VW,VH,{pad:22,azimuth:AZ,elevation:EL});
  var at=function(q){return K.iso(q,P);},S=K.solidSvg,L=K.lineSvg,o=[];
  /* il banco: ombra, quattro piedi, lastra, riquadro inciso, viti agli angoli */
  o.push('<path class="iso-halo" d="'+K.haloOf(base,-13,13,P)+'"/>');
  K.corners(base,12).slice().sort(function(a,b){return K.depthOf([a[0],a[1],0],P)-K.depthOf([b[0],b[1],0],P);}).forEach(function(q){
    o.push(S(K.cylinder(q[0],q[1],6,-13,1.6,P,24),{tone:'lo'}));o.push(S(K.cylinder(q[0],q[1],4.6,-11.4,3.4,P,24),{tone:'mid'}));});
  o.push(S(K.slabOf(base,-8,8,P,8,1.2),{tone:'mid'}));
  o.push(L(K.planOutline(K.insetPlan(base,5),0,P),{tone:'faint'}));
  var scr=K.corners(base,9);o.push(L(scr.map(function(q){return K.ring(q[0],q[1],2,0,P,14);}).join(''),{tone:'lo'}));o.push(K.dotsSvg(scr.map(function(q){return at([q[0],q[1],0]);}),{size:0.5}));
  /* le postazioni, dalla più lontana alla più vicina */
  items.slice().sort(function(a,b){return K.depthOf([a.x+W/2,a.y+a.D/2,0],P)-K.depthOf([b.x+W/2,b.y+b.D/2,0],P);}).forEach(function(it){
    var g=['<g class="iso-station" data-i="'+it.i+'" data-key="'+esc(it.key)+'" tabindex="0" role="button" aria-label="'+(it.orch?'Orchestratore ':'Processo ')+it.code+': '+esc(it.title)+'"><title>'+esc(it.title)+'</title>'];
    var plan={x:it.x,y:it.y,w:W,d:it.D,r:4};
    g.push(S(K.slabOf(plan,0,Z,P,6,0.8),{tone:'mid',className:'st-slab'}));
    g.push(L(K.planOutline(K.insetPlan(plan,3.5),Z,P),{tone:'faint'}));
    g.push(K.faceTextSvg(K.topMatrix([it.x+6,it.y+it.D-7],Z,P,'x'),it.code,{size:6.5,tone:'hi'}));
    var pos=it.pcs.map(function(pc,j){
      var row=Math.floor(j/PER),col=j%PER,inRow=Math.min(PER,it.pcs.length-row*PER);
      if(row%2)col=inRow-1-col; /* la serpentina: la riga dispari torna indietro */
      return [it.x+9+col*PX+PX/2-2,it.y+10+row*PY+PY/2-2];
    });
    pos.slice(1).forEach(function(q,j){g.push(L(K.segment([pos[j][0],pos[j][1],Z+0.3],[q[0],q[1],Z+0.3],P),{tone:'mid'}));});
    it.pcs.map(function(pc,j){return {pc:pc,q:pos[j]};}).sort(function(a,b){return K.depthOf([a.q[0],a.q[1],0],P)-K.depthOf([b.q[0],b.q[1],0],P);}).forEach(function(e){
      g.push(isoPiece(e.q[0],e.q[1],Z,P,e.pc.kind,e.pc.stack));});
    /* la pratica che scorre: un puntino percorre la fila dei pezzi e ognuno si illumina quando ci passa sopra. Solo a video:
       nelle esportazioni i nodi .iso-anim si tolgono (PDF e Word non si muovono) */
    var dur=Math.max(5,it.pcs.length*0.6),begin=-((it.i*1.3)%dur),n=it.pcs.length,anim=[];
    if(n>1){
      var tops=pos.map(function(q){return at([q[0],q[1],Z+9]);});
      anim.push('<circle r="4.6" fill="#c2410c" opacity=".30"><animateMotion dur="'+dur+'s" begin="'+begin+'s" repeatCount="indefinite" path="M'+tops.map(function(q){return q[0].toFixed(1)+' '+q[1].toFixed(1);}).join(' L')+'" calcMode="linear"/></circle>');
      anim.push('<circle r="2.2" fill="#c2410c"><animateMotion dur="'+dur+'s" begin="'+begin+'s" repeatCount="indefinite" path="M'+tops.map(function(q){return q[0].toFixed(1)+' '+q[1].toFixed(1);}).join(' L')+'" calcMode="linear"/></circle>');
      tops.forEach(function(q,j){
        var a=j/n,m=(j+0.5)/n,b=(j+1)/n;
        anim.push('<circle cx="'+q[0].toFixed(1)+'" cy="'+q[1].toFixed(1)+'" r="6.4" fill="none" stroke="#c2410c" stroke-width="1.5" opacity="0"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;'+a.toFixed(3)+';'+m.toFixed(3)+';'+b.toFixed(3)+';1" dur="'+dur+'s" begin="'+begin+'s" repeatCount="indefinite"/></circle>');
      });
      g.push('<g class="iso-anim" pointer-events="none">'+anim.join('')+'</g>');
    }
    g.push('</g>');o.push(g.join(''));
  });
  var tot={human:0,ai:0,auto:0,gw:0,call:0,n:0};
  items.forEach(function(it){['human','ai','auto','gw','call'].forEach(function(k){tot[k]+=it.cnt[k];});tot.n+=it.n;});
  return {W:VW,H:VH,body:o.join(''),items:items,tot:tot};
}
var isoMapData=null;
function isoCaption(m){
  var np=m.items.filter(function(it){return !it.orch;}).length,no=m.items.length-np,t=m.tot,out=[];
  if(np)out.push(np+(np===1?' processo':' processi'));if(no)out.push(no+(no===1?' orchestratore':' orchestratori'));
  return out.join(' · ')+' · '+(t.human+t.ai+t.auto+t.gw+t.call)+' passi';
}
function isoLegendHtml(m){
  var t=m.tot,rows=[['human','Persona'],['ai','Persona + assistente'],['auto','Automatico'],['gw','Bivio'],['call','Sottoprocesso']].filter(function(r){return t[r[0]];});
  return rows.map(function(r){return '<span class="mk"><svg viewBox="0 0 18 12" aria-hidden="true"><path d="M2 6h14" style="stroke:var(--anatomy-'+({human:'blue',ai:'violet',auto:'green',gw:'amber',call:'mid'}[r[0]])+')"/></svg>'+r[1]+' · '+t[r[0]]+'</span>';}).join('');
}
function isoLegendText(m){
  var t=m.tot;return [['human','Persona'],['ai','Persona + assistente'],['auto','Automatico'],['gw','Bivio'],['call','Sottoprocesso']].filter(function(r){return t[r[0]];}).map(function(r){return r[1]+' '+t[r[0]];}).join(', ');
}
/* la legenda a colori per PDF e Word: gli stessi colori del diagramma (riempimento chiaro, bordo pieno) */
var ISO_COL={human:['dbeafe','2563eb','Persona'],ai:['ede9fe','7c3aed','Persona + assistente'],auto:['dcfce7','16a34a','Automatico'],gw:['fef3c7','b45309','Bivio'],call:['ffffff','374151','Sottoprocesso']};
function isoKinds(m){return ['human','ai','auto','gw','call'].filter(function(k){return m.tot[k];});}
function isoPdfLegend(pdf,x,y,m){
  pdf.setFont('helvetica','normal');pdf.setFontSize(9);
  isoKinds(m).forEach(function(k){
    var c=ISO_COL[k],t=c[2]+' '+m.tot[k];
    pdf.setFillColor.apply(pdf,hex3(c[0]));pdf.setDrawColor.apply(pdf,hex3(c[1]));pdf.setLineWidth(0.5);
    if(k==='gw')pdf.lines([[2.5,2.5],[-2.5,2.5],[-2.5,-2.5],[2.5,-2.5]],x+2.5,y,[1,1],'FD',true);else pdf.roundedRect(x,y,6,4,1,1,'FD');
    pdf.setTextColor(89,99,110);pdf.text(t,x+8,y+3.2);x+=8+pdf.getTextWidth(t)+7;
  });
}
function isoDocxLegend(D,m){
  var runs=[];
  isoKinds(m).forEach(function(k){var c=ISO_COL[k];
    runs.push(new D.TextRun({text:'\u25A0 ',color:c[1].toUpperCase(),size:22}));
    runs.push(new D.TextRun({text:c[2]+' '+m.tot[k]+'     ',color:'59636E',size:18}));});
  return new D.Paragraph({spacing:{after:120},children:runs});
}
function mappaHtml(m){
  return '<div class="iso iso-bpm iso-live"><figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true">'+
    '<span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title">La mappa dei flussi</span>'+
    '<span class="iso-plate-corner" data-corner="hint">Tocca una postazione per aprire il flusso</span><span class="iso-plate-corner" data-corner="readout">'+esc(isoCaption(m))+'</span></div>'+
    ISO.figureSvg({width:m.W,height:m.H,label:'Mappa isometrica dei flussi del blueprint ('+isoCaption(m)+')',body:m.body})+'</div>'+
    '<figcaption class="iso-legend mappa-leg">'+isoLegendHtml(m)+'</figcaption></figure>'+
    '<ol class="mappa-list">'+m.items.map(function(it){return '<li><b>'+it.code+'</b><button type="button" data-i="'+it.i+'">'+esc(it.title)+'</button> <span class="hint">'+it.n+' passi'+(it.more?' · nella mappa i primi '+it.pcs.length:'')+'</span></li>';}).join('')+'</ol></div>';
}
function mountMappa(open){
  var host=document.getElementById('mappa');if(!host)return;
  isoMapData=isoMapBuild();if(!isoMapData){host.innerHTML='';return;}
  host.innerHTML='<details class="mappa-box"'+(open?' open':'')+'><summary>La mappa del blueprint: flussi, persone e assistenti in una figura</summary>'+mappaHtml(isoMapData)+'</details>';
  function go(i){var it=isoMapData.items[i];if(!it)return;show(it.gi);document.getElementById('tabs').scrollIntoView({block:'nearest'});}
  [].forEach.call(host.querySelectorAll('.iso-station'),function(s){
    s.addEventListener('click',function(){go(+s.getAttribute('data-i'));});
    s.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(+s.getAttribute('data-i'));}});
  });
  [].forEach.call(host.querySelectorAll('.mappa-list button'),function(b){b.addEventListener('click',function(){go(+b.getAttribute('data-i'));});});
}
/* per PDF e Word: una figura isometrica con i colori della versione chiara, come per il diagramma */
function isoStatica(svg){ /* PDF e Word: via le animazioni (nodi .iso-anim e elementi animate*), resta il disegno a riposo */
  [].slice.call(svg.querySelectorAll('.iso-anim,animate,animateTransform,animateMotion')).forEach(function(x){if(x.parentNode)x.parentNode.removeChild(x);});
  return svg;
}
function isoToCanvas(svg,W,H,scale){
  svg=isoStatica(svg.cloneNode(true));
  var css=document.getElementById('isocss').textContent;
  return toCanvas(svg,W,H,scale,{css:css,cls:'iso-svg iso iso-bpm',vars:isoVarsText(Object.assign(isoPalette('light',LIGHT),{'--anatomy-weight':(0.6*scale*1.5).toFixed(2)+'px'}))}); /* il tratto si misura in pixel dell'immagine: sulla pagina stampata deve restare visibile */
}
function isoExportCanvas(scale){
  var m=isoMapData;if(!m)return Promise.resolve(null);
  var host=document.createElement('div');host.innerHTML=ISO.figureSvg({width:m.W,height:m.H,label:'Mappa dei processi',body:m.body});
  return isoToCanvas(host.firstChild,m.W,m.H,scale);
}

/* ───────── figure d'autore (facoltative) ─────────
   Una figura per processo, disegnata da Claude con il kit (assets/iso/esempi/) e consegnata come
   <chiave-del-processo>.svg a `assembla.sh`, che la mette in un <template id="fig-<chiave>">. Titolo,
   didascalia e dato di lettura stanno in spiegazioni.yml, sotto `figura:` del processo. */
var figCount=0,figNum={};
function figuraOf(gf){
  var t=document.getElementById('fig-'+gf.key);if(!t)return null;
  var host=document.createElement('div');host.innerHTML=t.innerHTML;var svg=host.querySelector('svg');if(!svg)return null;
  var vb=(svg.getAttribute('viewBox')||'0 0 1000 560').split(/\s+/).map(Number),e=entryOf(gf).figura||{};
  if(!figNum[gf.key])figNum[gf.key]=2+(figCount++);
  return {svg:svg,W:vb[2],H:vb[3],n:figNum[gf.key],titolo:flat(e.titolo)||gf.title,didascalia:flat(e.didascalia),dato:flat(e.dato)};
}
function figuraBox(gf){
  var f=figuraOf(gf);if(!f)return '';
  return '<div class="iso iso-bpm figbox iso-live"><figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true">'+
    '<span class="iso-plate-corner" data-corner="fig">Fig '+f.n+'</span><span class="iso-plate-corner" data-corner="title">'+esc(vzCut(f.titolo,48))+'</span>'+
    (f.dato?'<span class="iso-plate-corner" data-corner="readout">'+esc(f.dato)+'</span>':'')+'</div>'+f.svg.outerHTML+'</div>'+
    (f.didascalia?'<figcaption class="iso-legend"><span class="iso-caption">'+esc(f.didascalia)+'</span></figcaption>':'')+'</figure></div>';
}
