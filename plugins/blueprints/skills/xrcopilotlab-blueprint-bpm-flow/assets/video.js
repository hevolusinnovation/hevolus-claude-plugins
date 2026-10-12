/* ───────── il video di un caso, o di tutto il processo ─────────
   Un video muto, con le parole scritte sotto: il titolo, poi una pallina che percorre il diagramma fermandosi a ogni passo
   (con la frase di `passi`, chi lo fa e la scelta fatta ai bivi). A ogni bivio c'è una sequenza dedicata: le strade possibili
   come pulsanti, quella presa in evidenza e le altre tratteggiate sul diagramma.
   Due modi: «il caso» (il solo caso scelto, dall'inizio alla fine) e «tutto il processo» (il primo caso intero e poi, uno per
   uno, solo la parte nuova di ogni altro caso, da dove si separa a dove si ricongiunge: tutte le diramazioni e tutte le decisioni).
   Si registra nel browser di chi lo chiede: il diagramma si disegna una volta sola su un canvas, a ogni fotogramma si aggiungono
   strada percorsa, passo in evidenza, pallina e testo, e MediaRecorder lo scrive in MP4 (o WebM). Dura quanto il video: serve
   tenere aperta la scheda. Niente voce: il browser non può registrarla (la voce si aggiunge con la CLI, fuori dalla pagina).
   `creaVideo(g,{casi,tutto,status,box})` restituisce una promessa con {blob,ext,total}; chi la chiama decide come salvarlo. */
function creaVideo(g,o){
  var casi=o.casi||[],tutto=!!o.tutto,box=o.box;
  return new Promise(function(resolve,reject){
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){reject(new Error('Questo browser non sa registrare video: prova con Chrome, Edge o Firefox.'));return;}
  var mime='';['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].forEach(function(m){if(!mime&&MediaRecorder.isTypeSupported(m))mime=m;});
  if(!mime){reject(new Error('Questo browser non sa scrivere un file video.'));return;}
  var ext=/mp4/.test(mime)?'.mp4':'.webm';
  var VW=1280,VH=720,HEAD=58,CAPH=176,AREA=VH-HEAD-CAPH,Z=1.2,INK='#1c2127',MUT='#59636e',ACC='#1f4e6b',HOT='#c2410c',BG='#f6f6f3',ALT='#9ca3af';
  var FB="'IBM Plex Sans',system-ui,sans-serif",FD="'Newsreader',Georgia,serif";
  var host=document.createElement('div'),d=draw(g,host,function(){}),text=testiPassi(g);
  function ptsOf(e){var r=null;d.edgeEls.forEach(function(x){if(x.e===e)r=x.pts;});return r||[];}
  function len(p){var l=0,i;for(i=1;i<p.length;i++)l+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return l;}
  function at(p,k){var L=len(p),dist=k*L,i=1;if(p.length<2)return p[0]||[0,0];for(;i<p.length-1;i++){var s=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(dist<=s)break;dist-=s;}var a=p[i-1],b=p[i],s2=Math.hypot(b[0]-a[0],b[1]-a[1])||1,f=Math.min(1,dist/s2);return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}
  function outsOf(n){return g.edges.filter(function(e){return e.from===n.id;});}
  function info(n){var w=plWho(n);return {num:n.num,name:n.name,who:w?w.t:'',cls:w?w.c:'',text:text[n.num]||''};}
  /* i pezzi del video: il caso intero, oppure il primo caso e poi solo la parte nuova di ciascun altro */
  var items=[],shown={};
  function mk(caso,from,to,variant){
    var list=caso.steps.slice(from,to+1).map(function(s,j){return {node:s.node,via:j===0?null:s.via};});
    list.forEach(function(s){shown[s.node.id]=1;});
    items.push({caso:caso,steps:list,variant:variant});
  }
  if(!tutto){if(casi[0])mk(casi[0],0,casi[0].steps.length-1,false);}
  else casi.forEach(function(c,ci){
    if(!ci){mk(c,0,c.steps.length-1,false);return;}
    var di=-1,i,j;for(i=0;i<c.steps.length;i++){if(!shown[c.steps[i].node.id]){di=i;break;}}
    if(di<0)return;
    var from=Math.max(0,di-1),to=c.steps.length-1;
    for(j=di;j<c.steps.length;j++){if(shown[c.steps[j].node.id]){to=j;break;}}
    mk(c,from,to,true);
  });
  if(!items.length){reject(new Error('Non c’è nessun caso da registrare.'));return;}
  /* la linea del tempo: ogni segmento ha un tipo (kind), il pezzo (it) e, per i passi, l'indice nel pezzo (si) */
  var segs=[],t=0;
  function add(kind,dur,x){var s={kind:kind,t0:t,t1:t+dur};for(var p in (x||{}))s[p]=x[p];t+=dur;segs.push(s);}
  add('title',2.8);
  items.forEach(function(it){
    if(it.variant)add('chapter',2.6,{it:it});
    it.steps.forEach(function(s,si){
      var inf=info(s.node),words=String(inf.text).split(/\s+/).filter(Boolean).length,nx=it.steps[si+1];
      add('step',Math.max(2.2,1.0+words/3.4),{it:it,si:si});
      if(nx&&s.node.shape==='gw'&&outsOf(s.node).length>1)add('decide',3.6,{it:it,si:si});
      if(nx){var p=ptsOf(nx.via);add('move',Math.max(0.8,len(p)/320),{it:it,si:si,pts:p});}
    });
  });
  add('end',tutto?6:4.5);
  var total=t,cancelled=false,recorder=null,chunks=[],bivi=0;
  g.nodes.forEach(function(n){if(n.shape==='gw'&&outsOf(n).length>1)bivi++;});
  toCanvas(d.svg,g.W,g.H,Z).then(function(bmp){
    var cv=document.createElement('canvas');cv.width=VW;cv.height=VH;cv.style.cssText='width:100%;max-width:640px;border:1px solid var(--line);border-radius:4px;display:block;margin:8px 0';
    var ctx=cv.getContext('2d');box.innerHTML='';box.appendChild(cv);
    var cancelB=document.createElement('button');cancelB.type='button';cancelB.className='tool';cancelB.textContent='Annulla';box.appendChild(cancelB);
    var cam=null,last=0;
    function wrapText(txt,w,font,maxLines){ctx.font=font;var words=String(txt||'').split(/\s+/),lines=[],cur='';words.forEach(function(wd){var tst=cur?cur+' '+wd:wd;if(ctx.measureText(tst).width>w&&cur){lines.push(cur);cur=wd;}else cur=tst;});if(cur)lines.push(cur);if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=lines[maxLines-1].replace(/\s*\S{0,3}$/,'…');}return lines;}
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
    function bar(tt){ctx.fillStyle='#d6d8d2';ctx.fillRect(0,VH-5,VW,5);ctx.fillStyle=HOT;ctx.fillRect(0,VH-5,VW*Math.min(1,tt/total),5);}
    function cardTitle(){
      ctx.fillStyle=ACC;ctx.fillRect(0,0,VW,VH);ctx.fillStyle='#ffffff';ctx.textBaseline='alphabetic';
      var l=wrapText(g.title,VW-200,'600 56px '+FD,3);ctx.font='600 56px '+FD;l.forEach(function(s,i){ctx.fillText(s,100,250+i*68);});
      ctx.font='500 30px '+FB;ctx.fillStyle='#cfe0ea';
      ctx.fillText(tutto?'Tutto il processo: il caso principale e le varianti':'Un caso: '+items[0].caso.nome,100,250+l.length*68+30);
      ctx.font='400 20px '+FB;ctx.fillText([doc.blueprint,doc.version&&'versione '+doc.version].filter(Boolean).join(' · '),100,VH-70);
    }
    function cardChapter(it){
      ctx.fillStyle='#fef3c7';ctx.fillRect(0,0,VW,VH);ctx.textBaseline='alphabetic';
      ctx.fillStyle='#78350f';ctx.font='500 26px '+FB;ctx.fillText('Una variante',100,230);
      ctx.fillStyle=INK;ctx.font='600 54px '+FD;wrapText(it.caso.nome,VW-200,'600 54px '+FD,2).forEach(function(s,i){ctx.fillText(s,100,300+i*64);});
      ctx.fillStyle=MUT;ctx.font='400 24px '+FB;ctx.fillText('Si separa dal caso principale al bivio «'+wrapText(it.steps[0].node.name,VW-420,'400 24px '+FB,1)[0]+'»',100,VH-110);
    }
    function cardEnd(){
      ctx.fillStyle=BG;ctx.fillRect(0,0,VW,VH);ctx.textBaseline='alphabetic';
      if(tutto){
        ctx.fillStyle=ACC;ctx.font='600 44px '+FD;ctx.fillText('Il processo in sintesi',100,150);
        ctx.fillStyle=MUT;ctx.font='400 24px '+FB;ctx.fillText(bivi+(bivi===1?' bivio':' bivi')+' con più strade possibili; '+casi.length+(casi.length===1?' caso mostrato:':' casi mostrati:'),100,196);
        var y=250;casi.slice(0,8).forEach(function(c,i){ctx.fillStyle=ACC;ctx.beginPath();ctx.arc(116,y-8,15,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 15px '+FB;ctx.textAlign='center';ctx.fillText(String(i+1),116,y-3);ctx.textAlign='left';
          ctx.fillStyle=INK;ctx.font='500 26px '+FB;ctx.fillText(wrapText(c.nome,VW-260,'500 26px '+FB,1)[0],148,y);y+=48;});
      }else{
        var it=items[0],ch=[];it.steps.forEach(function(s,i){if(s.via&&s.via.label&&it.steps[i-1]&&it.steps[i-1].node.shape==='gw')ch.push({gw:it.steps[i-1].node.name,l:s.via.label});});
        ctx.fillStyle=ACC;ctx.font='600 44px '+FD;ctx.fillText('La pratica è arrivata alla fine',100,150);
        ctx.fillStyle=MUT;ctx.font='400 24px '+FB;ctx.fillText('Passi percorsi in questo caso: '+it.steps.length+(ch.length?' · scelte fatte: '+ch.length:''),100,196);
        var y2=262;ch.slice(0,7).forEach(function(c){ctx.fillStyle='#fef3c7';rr(100,y2-26,VW-200,42,8);ctx.fill();ctx.strokeStyle='#b45309';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#78350f';ctx.font='500 21px '+FB;ctx.fillText(wrapText(c.gw,420,'500 21px '+FB,1)[0]+'  →  «'+wrapText(c.l,520,'600 21px '+FB,1)[0]+'»',118,y2+2);y2+=54;});
      }
    }
    function ring(n,lw,alpha,glow,col){
      ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=col||HOT;ctx.lineWidth=lw*Z;if(glow){ctx.shadowColor=col||HOT;ctx.shadowBlur=14;}
      var x=n.cx*Z,y=n.cy*Z,w=n.w*Z,h=n.h*Z;
      if(n.shape==='start'||n.shape==='end'){ctx.beginPath();ctx.arc(x,y,w/2+3,0,7);ctx.stroke();}
      else if(n.shape==='gw'){ctx.beginPath();ctx.moveTo(x,y-h/2-3);ctx.lineTo(x+w/2+3,y);ctx.lineTo(x,y+h/2+3);ctx.lineTo(x-w/2-3,y);ctx.closePath();ctx.stroke();}
      else{rr(x-w/2-3,y-h/2-3,w+6,h+6,10);ctx.stroke();}
      ctx.restore();
    }
    function polyline(p,upto){var L=len(p),dist=(upto==null?1:upto)*L,i;ctx.beginPath();ctx.moveTo(p[0][0]*Z,p[0][1]*Z);for(i=1;i<p.length;i++){var s=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(dist>=s){ctx.lineTo(p[i][0]*Z,p[i][1]*Z);dist-=s;}else{var f=s?dist/s:0;ctx.lineTo((p[i-1][0]+(p[i][0]-p[i-1][0])*f)*Z,(p[i-1][1]+(p[i][1]-p[i-1][1])*f)*Z);break;}}ctx.stroke();}
    function frame(tt,dt){
      var seg=segs[segs.length-1],i;for(i=0;i<segs.length;i++){if(tt<segs[i].t1){seg=segs[i];break;}}
      ctx.setTransform(1,0,0,1,0,0);ctx.textAlign='left';
      if(seg.kind==='title'){cardTitle();bar(tt);return;}
      if(seg.kind==='chapter'){cardChapter(seg.it);bar(tt);return;}
      if(seg.kind==='end'){cardEnd();bar(tt);return;}
      var it=seg.it,si=seg.si,step=it.steps[si],n=step.node,pos,u=0;
      if(seg.kind==='move'){u=Math.min(1,(tt-seg.t0)/(seg.t1-seg.t0));var e=u<0.5?2*u*u:1-Math.pow(-2*u+2,2)/2;pos=at(seg.pts,e);u=e;}
      else{var inp=step.via?ptsOf(step.via):[];pos=inp.length?inp[inp.length-1]:[n.cx,n.cy];}
      var tx=pos[0]*Z,ty=pos[1]*Z;if(!cam)cam=[tx,ty];
      var a=1-Math.exp(-(dt||0.033)*5);cam[0]+=(tx-cam[0])*a;cam[1]+=(ty-cam[1])*a;
      var ox=bmp.width<=VW?(VW-bmp.width)/2:VW/2-Math.max(VW/2,Math.min(bmp.width-VW/2,cam[0]));
      var oy=bmp.height<=AREA?HEAD+(AREA-bmp.height)/2:HEAD+AREA/2-Math.max(AREA/2,Math.min(bmp.height-AREA/2,cam[1]));
      ctx.fillStyle=BG;ctx.fillRect(0,0,VW,VH);
      ctx.save();ctx.beginPath();ctx.rect(0,HEAD,VW,AREA);ctx.clip();ctx.translate(ox,oy);ctx.drawImage(bmp,0,0);
      ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=HOT;ctx.lineWidth=3.2*Z;
      for(var j=1;j<=si;j++)polyline(ptsOf(it.steps[j].via));
      if(seg.kind==='move')polyline(seg.pts,u);
      /* a un bivio: le strade che non si prendono, tratteggiate */
      if(seg.kind==='decide'){
        var chosen=it.steps[si+1]&&it.steps[si+1].via;
        ctx.save();ctx.setLineDash([9*Z,7*Z]);ctx.strokeStyle=ALT;ctx.lineWidth=3*Z;
        outsOf(n).forEach(function(e){if(e!==chosen){var p=ptsOf(e);if(p.length>1)polyline(p);}});
        ctx.restore();
        outsOf(n).forEach(function(e){if(e!==chosen&&g.byId[e.to])ring(g.byId[e.to],1.6,0.5,false,ALT);});
      }
      for(j=0;j<=si;j++)ring(it.steps[j].node,2.2,0.55,false);
      if(seg.kind!=='move')ring(n,3.6,1,true);
      ctx.shadowColor=HOT;ctx.shadowBlur=16;ctx.fillStyle=HOT;ctx.beginPath();ctx.arc(tx,ty,11*Z,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.stroke();
      ctx.restore();
      /* testata */
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,VW,HEAD);ctx.fillStyle=INK;ctx.font='600 22px '+FD;ctx.textBaseline='middle';
      ctx.fillText(wrapText(g.title,VW-420,'600 22px '+FD,1)[0],28,HEAD/2);
      ctx.textAlign='right';ctx.fillStyle=ACC;ctx.font='500 18px '+FB;ctx.fillText(it.variant?'Variante: '+it.caso.nome:(tutto?'Caso principale: ':'')+it.caso.nome,VW-28,HEAD/2);ctx.textAlign='left';
      ctx.strokeStyle='#d6d8d2';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,HEAD+.5);ctx.lineTo(VW,HEAD+.5);ctx.stroke();
      /* la didascalia: il passo che si racconta (durante il viaggio quello appena lasciato, che si spegne) */
      var cy0=VH-CAPH;ctx.fillStyle='#ffffff';ctx.fillRect(0,cy0,VW,CAPH);ctx.strokeStyle='#d6d8d2';ctx.beginPath();ctx.moveTo(0,cy0+.5);ctx.lineTo(VW,cy0+.5);ctx.stroke();
      ctx.textBaseline='alphabetic';
      if(seg.kind==='decide'){
        var chosen2=it.steps[si+1].via;ctx.fillStyle='#78350f';ctx.font='600 22px '+FD;ctx.fillText('Qui si decide: '+wrapText(n.name,VW-420,'600 22px '+FD,1)[0],40,cy0+40);
        var x=40,y3=cy0+66;
        outsOf(n).forEach(function(e){
          var lab=wrapText(e.label||(g.byId[e.to]||{}).name||'avanti',360,'600 20px '+FB,1)[0],w=ctx.measureText(lab).width+34,on=(e===chosen2);
          if(x+w>VW-30){x=40;y3+=50;}
          rr(x,y3,w,40,20);if(on){ctx.fillStyle=HOT;ctx.fill();}else{ctx.fillStyle='#ffffff';ctx.fill();ctx.setLineDash([6,5]);ctx.strokeStyle=ALT;ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);}
          ctx.fillStyle=on?'#ffffff':MUT;ctx.font='600 20px '+FB;ctx.fillText(lab,x+17,y3+27);x+=w+14;
        });
        ctx.fillStyle=MUT;ctx.font='400 17px '+FB;ctx.fillText('In questo caso si prende la strada evidenziata; le altre strade sono quelle degli altri casi.',40,cy0+CAPH-14);
      }else{
        var inf=info(seg.kind==='move'?n:n),cur=inf;
        ctx.globalAlpha=seg.kind==='move'?Math.max(0,1-u*3):1;
        ctx.fillStyle=ACC;ctx.beginPath();ctx.arc(52,cy0+44,20,0,7);ctx.fill();
        ctx.fillStyle='#ffffff';ctx.font='700 18px '+FB;ctx.textAlign='center';ctx.fillText(String(cur.num),52,cy0+50);ctx.textAlign='left';
        ctx.fillStyle=INK;ctx.font='600 30px '+FD;ctx.fillText(wrapText(cur.name,VW-360,'600 30px '+FD,1)[0],92,cy0+52);
        if(cur.who){
          var wc={human:['#dbeafe','#2563eb','#1e3a8a'],ai:['#ede9fe','#7c3aed','#4c1d95'],auto:['#dcfce7','#16a34a','#14532d'],gw:['#fef3c7','#b45309','#78350f']}[cur.cls]||['#eceee9','#d6d8d2',MUT];
          ctx.font='600 16px '+FB;var ww=ctx.measureText(cur.who).width+24;rr(VW-ww-32,cy0+28,ww,30,15);ctx.fillStyle=wc[0];ctx.fill();ctx.strokeStyle=wc[1];ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=wc[2];ctx.fillText(cur.who,VW-ww-20,cy0+49);
        }
        ctx.fillStyle=INK;var tl=wrapText(cur.text,VW-120,'400 24px '+FB,3);ctx.font='400 24px '+FB;ctx.fillStyle=INK;tl.forEach(function(s,ii){ctx.fillText(s,92,cy0+92+ii*31);});
        if(step.via&&step.via.label&&it.steps[si-1]&&it.steps[si-1].node.shape==='gw'&&seg.kind==='step'){ctx.fillStyle=HOT;ctx.font='600 17px '+FB;ctx.fillText('Scelta fatta: «'+step.via.label+'»',92,cy0+CAPH-14);}
        ctx.globalAlpha=1;
      }
      bar(tt);
    }
    /* la registrazione */
    var stream=cv.captureStream(30);
    try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});}catch(e){recorder=new MediaRecorder(stream);}
    recorder.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data);};
    recorder.onstop=function(){
      cancelB.remove();
      if(cancelled){reject(new Error('Video annullato.'));return;}
      resolve({blob:new Blob(chunks,{type:mime.split(';')[0]}),ext:ext,total:total});
    };
    cancelB.addEventListener('click',function(){cancelled=true;try{recorder.stop();}catch(e){}});
    var t0=performance.now();last=t0;recorder.start(500);frame(0,0.033);
    (function loop(){
      if(cancelled)return;
      var now=performance.now(),tt=(now-t0)/1000;
      if(o.status)o.status.textContent=(document.hidden?'Tieni aperta questa scheda mentre registro: ':'Registro il video… non cambiare scheda. ')+Math.round(tt)+' s su '+Math.round(total)+'.';
      if(tt>=total){frame(total-0.001,(now-last)/1000);setTimeout(function(){try{recorder.stop();}catch(e){}},400);return;}
      frame(tt,(now-last)/1000);last=now;requestAnimationFrame(loop);
    })();
  }).catch(function(e){reject(e);});
  });
}
