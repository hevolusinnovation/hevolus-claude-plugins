/* ───────── i casi tipici di un processo ─────────
   Un processo si capisce meglio con tre o quattro storie che con tutti i rami insieme: «arriva un'udienza»,
   «mancano dei dati», «l'udienza viene rinviata». Ogni caso è una strada dal primo all'ultimo passo, scelta dove il
   processo si divide. Si dichiara in spiegazioni.yml, sotto il processo:

     percorsi:
       - nome: "Mancano dei dati"
         scelte:                       # per id del bivio: l'etichetta dell'uscita (o l'id del passo che segue)
           filtro: comunicazione
           completezza: [da chiarire, completi]     # una lista se si passa dallo stesso bivio più volte
           smista: presa visione

   Senza `percorsi` c'è un caso solo, «Il percorso principale»: la prima uscita a ogni bivio, senza i giri di ritorno.
   Lo usano il lettore («Guarda il caso»), il PDF e il Word (una pagina per caso, a fotogrammi) e il video.
   Non inventa strade: percorre gli archi che il diagramma disegna; se una scelta non corrisponde a nessuna uscita
   il caso si ferma lì e lo dice (`incompleto`). */
function percorsoRisolvi(g,p,auto){
  var starts=g.nodes.filter(function(n){return n.shape==='start';}),start=starts[0]||g.order[0];
  if(!start)return null;
  var scelte=p.scelte||{},seen={},steps=[{node:start,via:null}],cur=start,guard=g.nodes.length*3+12,incompleto='';
  function outs(n){return g.edges.filter(function(e){return e.from===n.id;});}
  function pick(o,want){
    var w=flat(want),hit=null;
    o.forEach(function(e){
      var to=g.byId[e.to]||{};
      if(!hit&&(flat(e.label)===w||e.to===want||flat(to.name)===w))hit=e;
    });
    return hit;
  }
  while(guard-->0){
    if(cur.shape==='end')break;
    var o=outs(cur);if(!o.length)break;
    var e=null;
    if(o.length===1)e=o[0];
    else{
      var want=scelte[cur.id];
      if(Array.isArray(want)){var k=seen[cur.id]||0;want=want[Math.min(k,want.length-1)];}
      seen[cur.id]=(seen[cur.id]||0)+1;
      if(want!=null)e=pick(o,want);
      else if(auto)e=o.filter(function(x){return !g.back.has(x);})[0]||o[0];
      if(!e){incompleto='Il caso si ferma al bivio «'+cur.name+'»: '+(want!=null?'nessuna uscita si chiama «'+want+'»':'manca la scelta')+'.';break;}
    }
    var nx=g.byId[e.to];if(!nx)break;
    steps.push({node:nx,via:e});cur=nx;
  }
  return {nome:flat(p.nome)||'Il percorso principale',descrizione:flat(p.descrizione),steps:steps,incompleto:incompleto};
}
function percorsiOf(g){
  var e=entryOf(g),list=Array.isArray(e.percorsi)?e.percorsi:[];
  var out=list.map(function(p){return percorsoRisolvi(g,typeof p==='string'?{nome:p}:p,false);}).filter(Boolean);
  if(!out.length){var a=percorsoRisolvi(g,{nome:'Il percorso principale'},true);if(a)out.push(a);}
  return out;
}
/* le parole di ogni passo: quelle di `passi`, altrimenti quelle calcolate dal manifest */
function testiPassi(g){
  var text={};(authoredSteps(g)||[]).forEach(function(x){text[x.num]=x.text;});
  plain(g).forEach(function(x){if(x.num!=null&&!text[x.num])text[x.num]=x.text;});
  return text;
}
/* un caso come elenco: numero del passo nel disegno, nome, chi lo fa, parole, e la scelta fatta per arrivarci */
function casoPassi(g,caso){
  var text=testiPassi(g);
  return caso.steps.map(function(s,i){
    var n=s.node,w=plWho(n);
    return {i:i+1,num:n.num,name:n.name,who:w?w.t:'',cls:w?w.c:'',text:text[n.num]||'',scelta:s.via&&s.via.label?s.via.label:''};
  });
}
/* il diagramma con la strada del caso in evidenza e i passi numerati nell'ordine in cui il caso li percorre */
function casoSvg(g,caso){
  var host=document.createElement('div'),d=draw(g,host,function(){}),svg=d.svg,by={};
  caso.steps.forEach(function(s,i){
    var el=d.nodeEls[s.node.id];if(el)el.classList.add('onpath');
    (by[s.node.id]=by[s.node.id]||[]).push(i+1);
    if(s.via){d.edgeEls.forEach(function(x){if(x.e===s.via)x.p.classList.add('done');});}
  });
  caso.steps.forEach(function(s){
    var list=by[s.node.id];if(!list||list.done)return;list.done=true;
    var n=s.node,bx=n.cx+n.w/2-(n.shape==='start'||n.shape==='end'?4:6),by2=n.cy+n.h/2-(n.shape==='gw'?n.h/2+2:4),label=list.join('/');
    var w=Math.max(24,label.length*7+14);
    var g2=document.createElementNS(NS,'g');
    var r=document.createElementNS(NS,'rect');r.setAttribute('x',bx-w/2);r.setAttribute('y',by2-11);r.setAttribute('width',w);r.setAttribute('height',22);r.setAttribute('rx',11);r.setAttribute('class','pnb');
    var t=document.createElementNS(NS,'text');t.setAttribute('x',bx);t.setAttribute('y',by2+4.2);t.setAttribute('class','pnt');t.textContent=label;
    g2.appendChild(r);g2.appendChild(t);svg.appendChild(g2);
  });
  return svg;
}
function casoCanvas(g,caso,scale){return toCanvas(casoSvg(g,caso),g.W,g.H,scale);}
