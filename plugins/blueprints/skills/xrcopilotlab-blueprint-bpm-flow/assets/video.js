/* ───────── il video di un caso ─────────
   Un breve video muto, con le parole scritte sotto: il titolo, poi una pallina che percorre il diagramma del caso
   scelto fermandosi a ogni passo (con la frase di `passi`, chi lo fa e la scelta fatta ai bivi), e in fondo le
   domande «da decidere insieme». Si registra nel browser di chi lo chiede: il diagramma si disegna una volta sola
   su un canvas, a ogni fotogramma si aggiungono la strada percorsa, il passo in evidenza, la pallina e il testo,
   e MediaRecorder lo scrive in MP4 (o in WebM, dove il browser non sa fare MP4). Dura quanto il video: serve tenere
   aperta la scheda. Si salva con la capacità `downloads`, come PDF e Word; non esce dal browser, non va in archivio da solo.
   Niente voce: non si può registrare dal browser. La voce si aggiunge con la CLI (xrcopilotlab-bp voice) fuori dalla pagina. */
function creaVideo(g,caso,ui){
  var st=ui.status,box=ui.box,btn=ui.button;
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){st.textContent='Questo browser non sa registrare video: prova con Chrome, Edge o Firefox.';return;}
  var mime='';['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].forEach(function(m){if(!mime&&MediaRecorder.isTypeSupported(m))mime=m;});
  if(!mime){st.textContent='Questo browser non sa scrivere un file video.';return;}
  var ext=/mp4/.test(mime)?'.mp4':'.webm';
  btn.disabled=true;st.textContent='Preparo il video…';box.innerHTML='';
  var VW=1280,VH=720,HEAD=58,CAPH=176,AREA=VH-HEAD-CAPH,Z=1.2,INK='#1c2127',MUT='#59636e',ACC='#1f4e6b',HOT='#c2410c',BG='#f6f6f3';
  var FB="'IBM Plex Sans',system-ui,sans-serif",FD="'Newsreader',Georgia,serif";
  var host=document.createElement('div'),d=draw(g,host,function(){}),passi=casoPassi(g,caso),qs=questionsOf(g);
  var ptsOf=function(e){var r=null;d.edgeEls.forEach(function(x){if(x.e===e)r=x.pts;});return r||[];};
  function len(p){var l=0,i;for(i=1;i<p.length;i++)l+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return l;}
  function at(p,k){ /* il punto a metà strada k (0..1) lungo una spezzata */
    var L=len(p),dist=k*L,i=1;
    if(p.length<2)return p[0]||[0,0];
    for(;i<p.length-1;i++){var s=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(dist<=s)break;dist-=s;}
    var a=p[i-1],b=p[i],s2=Math.hypot(b[0]-a[0],b[1]-a[1])||1,f=Math.min(1,dist/s2);
    return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
  }
  /* la linea del tempo: titolo, poi per ogni passo una sosta e (se c'è un passo dopo) un tratto di strada, poi la chiusura */
  var segs=[],t=0;
  function add(o,dur){o.t0=t;o.t1=t+dur;t+=dur;segs.push(o);}
  add({k:'title'},2.6);
  caso.steps.forEach(function(s,i){
    var words=String(passi[i].text||'').split(/\s+/).filter(Boolean).length;
    add({k:'step',i:i},Math.max(2.2,1.0+words/3.4));
    var nx=caso.steps[i+1];
    if(nx){var p=ptsOf(nx.via);add({k:'move',i:i,pts:p},Math.max(0.8,len(p)/320));}
  });
  add({k:'end'},qs.length?5.5:3.2);
  var total=t,cancelled=false,recorder=null,chunks=[];
  toCanvas(d.svg,g.W,g.H,Z).then(function(bmp){
    var cv=document.createElement('canvas');cv.width=VW;cv.height=VH;cv.style.cssText='width:100%;max-width:640px;border:1px solid var(--line);border-radius:4px;display:block;margin:8px 0';
    var ctx=cv.getContext('2d');box.appendChild(cv);
    var cancelB=document.createElement('button');cancelB.type='button';cancelB.className='tool';cancelB.textContent='Annulla';box.appendChild(cancelB);
    var cam=null,last=0;
    function wrapText(txt,w,font,maxLines){
      ctx.font=font;var words=String(txt||'').split(/\s+/),lines=[],cur='';
      words.forEach(function(wd){var tst=cur?cur+' '+wd:wd;if(ctx.measureText(tst).width>w&&cur){lines.push(cur);cur=wd;}else cur=tst;});
      if(cur)lines.push(cur);
      if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=lines[maxLines-1].replace(/\s*\S{0,3}$/,'…');}
      return lines;
    }
    function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
    function cardTitle(){
      ctx.fillStyle=ACC;ctx.fillRect(0,0,VW,VH);
      ctx.fillStyle='#ffffff';ctx.textBaseline='alphabetic';
      var l=wrapText(g.title,VW-200,'600 56px '+FD,3);ctx.font='600 56px '+FD;
      l.forEach(function(s,i){ctx.fillText(s,100,250+i*68);});
      ctx.font='500 30px '+FB;ctx.fillStyle='#cfe0ea';ctx.fillText('Un caso: '+caso.nome,100,250+l.length*68+30);
      ctx.font='400 20px '+FB;ctx.fillText([doc.blueprint,doc.version&&'versione '+doc.version].filter(Boolean).join(' · '),100,VH-70);
    }
    function cardEnd(){
      ctx.fillStyle=BG;ctx.fillRect(0,0,VW,VH);ctx.textBaseline='alphabetic';
      ctx.fillStyle=ACC;ctx.font='600 44px '+FD;ctx.fillText('La pratica è arrivata alla fine',100,150);
      ctx.fillStyle=MUT;ctx.font='400 24px '+FB;ctx.fillText('Passi percorsi in questo caso: '+caso.steps.length,100,196);
      if(qs.length){
        ctx.fillStyle=INK;ctx.font='600 28px '+FD;ctx.fillText('Da decidere insieme',100,270);
        var y=312;
        qs.slice(0,4).forEach(function(q){
          ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.arc(116,y-8,15,0,7);ctx.fill();
          ctx.fillStyle=INK;ctx.font='700 13px '+FB;ctx.textAlign='center';ctx.fillText('D'+q.n,116,y-3);ctx.textAlign='left';
          var ls=wrapText(q.text,VW-260,'400 22px '+FB,2);ctx.font='400 22px '+FB;ctx.fillStyle=INK;
          ls.forEach(function(s,i){ctx.fillText(s,148,y+i*28);});y+=Math.max(1,ls.length)*28+22;
        });
      }
    }
    function drawNodeRing(n,lw,alpha,glow){
      ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=HOT;ctx.lineWidth=lw*Z;
      if(glow){ctx.shadowColor=HOT;ctx.shadowBlur=14;}
      var x=n.cx*Z,y=n.cy*Z,w=n.w*Z,h=n.h*Z;
      if(n.shape==='start'||n.shape==='end'){ctx.beginPath();ctx.arc(x,y,w/2+3,0,7);ctx.stroke();}
      else if(n.shape==='gw'){ctx.beginPath();ctx.moveTo(x,y-h/2-3);ctx.lineTo(x+w/2+3,y);ctx.lineTo(x,y+h/2+3);ctx.lineTo(x-w/2-3,y);ctx.closePath();ctx.stroke();}
      else{rr(x-w/2-3,y-h/2-3,w+6,h+6,10);ctx.stroke();}
      ctx.restore();
    }
    function polyline(p,upto){ /* la strada percorsa; `upto` (0..1) ne disegna solo l'inizio */
      var L=len(p),dist=(upto==null?1:upto)*L,i;
      ctx.beginPath();ctx.moveTo(p[0][0]*Z,p[0][1]*Z);
      for(i=1;i<p.length;i++){
        var s=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
        if(dist>=s){ctx.lineTo(p[i][0]*Z,p[i][1]*Z);dist-=s;}
        else{var f=s?dist/s:0;ctx.lineTo((p[i-1][0]+(p[i][0]-p[i-1][0])*f)*Z,(p[i-1][1]+(p[i][1]-p[i-1][1])*f)*Z);break;}
      }
      ctx.stroke();
    }
    function frame(tt,dt){
      var seg=segs[segs.length-1],i;for(i=0;i<segs.length;i++){if(tt<segs[i].t1){seg=segs[i];break;}}
      ctx.setTransform(1,0,0,1,0,0);ctx.textAlign='left';
      if(seg.k==='title'){cardTitle();bar(tt);return;}
      if(seg.k==='end'){cardEnd();bar(tt);return;}
      var si=seg.i,step=caso.steps[si],n=step.node,pos,k=0;
      if(seg.k==='step'){var inp=step.via?ptsOf(step.via):[];pos=inp.length?inp[inp.length-1]:[n.cx,n.cy];} /* la pallina aspetta sul bordo d'ingresso, senza coprire il nome del passo */
      else{k=Math.min(1,(tt-seg.t0)/(seg.t1-seg.t0));var e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;pos=at(seg.pts,e);k=e;}
      /* telecamera: segue la pallina, con un po' d'inerzia */
      var tx=pos[0]*Z,ty=pos[1]*Z;if(!cam)cam=[tx,ty];
      var a=1-Math.exp(-(dt||0.033)*5);cam[0]+=(tx-cam[0])*a;cam[1]+=(ty-cam[1])*a;
      var ox=bmp.width<=VW?(VW-bmp.width)/2:VW/2-Math.max(VW/2,Math.min(bmp.width-VW/2,cam[0]));
      var oy=bmp.height<=AREA?HEAD+(AREA-bmp.height)/2:HEAD+AREA/2-Math.max(AREA/2,Math.min(bmp.height-AREA/2,cam[1]));
      ctx.fillStyle=BG;ctx.fillRect(0,0,VW,VH);
      ctx.save();ctx.beginPath();ctx.rect(0,HEAD,VW,AREA);ctx.clip();ctx.translate(ox,oy);
      ctx.drawImage(bmp,0,0);
      ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=HOT;ctx.lineWidth=3.2*Z;
      for(var j=1;j<=si;j++){ctx.globalAlpha=1;polyline(ptsOf(caso.steps[j].via));}
      if(seg.k==='move'){polyline(seg.pts,k);}
      for(j=0;j<=si;j++)drawNodeRing(caso.steps[j].node,2.2,0.55,false);
      if(seg.k==='step')drawNodeRing(n,3.6,1,true);
      ctx.shadowColor=HOT;ctx.shadowBlur=16;ctx.fillStyle=HOT;ctx.beginPath();ctx.arc(tx,ty,11*Z,0,7);ctx.fill();
      ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.stroke();
      ctx.restore();
      /* testata */
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,VW,HEAD);ctx.fillStyle=INK;ctx.font='600 22px '+FD;ctx.textBaseline='middle';
      ctx.fillText(wrapText(g.title,VW-420,'600 22px '+FD,1)[0],28,HEAD/2);
      ctx.textAlign='right';ctx.fillStyle=ACC;ctx.font='500 18px '+FB;ctx.fillText(caso.nome,VW-28,HEAD/2);ctx.textAlign='left';
      ctx.strokeStyle='#d6d8d2';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,HEAD+.5);ctx.lineTo(VW,HEAD+.5);ctx.stroke();
      /* il passo che si sta raccontando: quello in corso, o quello appena lasciato mentre la pallina viaggia */
      var cp=passi[seg.k==='move'?si+1:si],cs=caso.steps[seg.k==='move'?si+1:si];
      if(seg.k==='move')cp=passi[si+1];
      var cy0=VH-CAPH;ctx.fillStyle='#ffffff';ctx.fillRect(0,cy0,VW,CAPH);ctx.strokeStyle='#d6d8d2';ctx.beginPath();ctx.moveTo(0,cy0+.5);ctx.lineTo(VW,cy0+.5);ctx.stroke();
      ctx.globalAlpha=seg.k==='move'?Math.max(0,1-k*3):1; /* mentre viaggia, il testo del passo lasciato si spegne */
      var cur=seg.k==='move'?passi[si]:cp;
      ctx.textBaseline='alphabetic';
      ctx.fillStyle=ACC;ctx.beginPath();ctx.arc(52,cy0+44,20,0,7);ctx.fill();
      ctx.fillStyle='#ffffff';ctx.font='700 18px '+FB;ctx.textAlign='center';ctx.fillText(String(cur.num),52,cy0+50);ctx.textAlign='left';
      ctx.fillStyle=INK;ctx.font='600 30px '+FD;ctx.fillText(wrapText(cur.name,VW-360,'600 30px '+FD,1)[0],92,cy0+52);
      if(cur.who){
        var wc={human:['#dbeafe','#2563eb','#1e3a8a'],ai:['#ede9fe','#7c3aed','#4c1d95'],auto:['#dcfce7','#16a34a','#14532d'],gw:['#fef3c7','#b45309','#78350f']}[cur.cls]||['#eceee9','#d6d8d2',MUT];
        ctx.font='600 16px '+FB;var ww=ctx.measureText(cur.who).width+24;
        rr(VW-ww-32,cy0+28,ww,30,15);ctx.fillStyle=wc[0];ctx.fill();ctx.strokeStyle=wc[1];ctx.lineWidth=1.5;ctx.stroke();
        ctx.fillStyle=wc[2];ctx.fillText(cur.who,VW-ww-20,cy0+49);
      }
      ctx.fillStyle=INK;ctx.font='400 24px '+FB;
      var tl=wrapText(cur.text,VW-120,'400 24px '+FB,3);ctx.font='400 24px '+FB;ctx.fillStyle=INK;
      tl.forEach(function(s,ii){ctx.fillText(s,92,cy0+92+ii*31);});
      if(cur.scelta&&seg.k==='step'){ctx.fillStyle=HOT;ctx.font='600 17px '+FB;ctx.fillText('Scelta fatta: «'+cur.scelta+'»',92,cy0+CAPH-14);}
      ctx.globalAlpha=1;
      bar(tt);
    }
    function bar(tt){ctx.fillStyle='#d6d8d2';ctx.fillRect(0,VH-5,VW,5);ctx.fillStyle=HOT;ctx.fillRect(0,VH-5,VW*Math.min(1,tt/total),5);}
    /* la registrazione */
    var stream=cv.captureStream(30);
    try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});}catch(e){recorder=new MediaRecorder(stream);}
    recorder.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data);};
    recorder.onstop=function(){
      btn.disabled=false;cancelB.remove();
      if(cancelled){st.textContent='Video annullato.';cv.remove();return;}
      var blob=new Blob(chunks,{type:mime.split(';')[0]}),mb=(blob.size/1048576).toFixed(1).replace('.',',');
      st.textContent='Video pronto ('+Math.round(total)+' s, '+mb+' MB).';
      var sv=document.createElement('button');sv.type='button';sv.className='tool pl-main';sv.textContent='Scarica il video';
      sv.addEventListener('click',async function(){
        var dl=await downloadsCap();
        if(!dl){st.textContent='Il download è disponibile dalla pagina pubblicata, aperta in claude.ai.';return;}
        try{await dl.save({filename:slugOf(document.title||'flussi-bpm')+'-'+slugOf(g.key)+'-'+slugOf(caso.nome)+ext,data:blob});st.textContent='Video salvato.';}
        catch(e){st.textContent=e&&e.code==='declined'?'Download annullato.':'Non sono riuscito a salvare il video: '+((e&&e.message)||e);}
      });
      box.appendChild(sv);
    };
    cancelB.addEventListener('click',function(){cancelled=true;try{recorder.stop();}catch(e){}});
    var t0=performance.now();last=t0;recorder.start(500);frame(0,0.033);
    (function loop(){
      if(cancelled)return;
      var now=performance.now(),tt=(now-t0)/1000;
      if(document.hidden)st.textContent='Tieni aperta questa scheda mentre registro: '+Math.round(tt)+' s su '+Math.round(total)+'.';
      else st.textContent='Registro il video… '+Math.round(tt)+' s su '+Math.round(total)+'. Non cambiare scheda.';
      if(tt>=total){frame(total-0.001,(now-last)/1000);setTimeout(function(){try{recorder.stop();}catch(e){}},400);return;}
      frame(tt,(now-last)/1000);last=now;requestAnimationFrame(loop);
    })();
  }).catch(function(e){btn.disabled=false;st.textContent='Non sono riuscito a preparare il video: '+((e&&e.message)||e);});
}
