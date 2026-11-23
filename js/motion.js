/* Эклектика · motion engine (vanilla, IO + rAF only while moving) */
(function(){
  var d=document,h=d.documentElement,w=window;
  /* top bar height -> --top-h */
  var bar=d.querySelector('.topbar');
  function topH(){ if(bar) h.style.setProperty('--top-h',bar.offsetHeight+'px'); }
  topH(); if(w.ResizeObserver&&bar) new ResizeObserver(topH).observe(bar); else w.addEventListener('resize',topH);

  /* burger */
  var bt=d.querySelector('.burger'),menu=d.getElementById('menu');
  function setMenu(o){ if(!menu)return; menu.classList.toggle('open',o); bt.setAttribute('aria-expanded',o?'true':'false'); }
  if(bt&&menu){
    bt.addEventListener('click',function(){ setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click',function(e){ if(e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown',function(e){ if(e.key==='Escape') setMenu(false); });
  }

  /* map on click */
  d.querySelectorAll('[data-map]').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault(); var box=a.closest('.map'); var f=d.createElement('iframe');
      f.src=a.getAttribute('data-map'); f.title='Эклектика на карте'; f.loading='lazy'; f.allowFullscreen=true;
      box.innerHTML=''; box.appendChild(f); box.classList.add('live');
    });
  });

  if(!h.classList.contains('m-on')) return;
  var rm=w.matchMedia('(prefers-reduced-motion: reduce)');
  if(rm.matches){ h.classList.remove('m-on'); return; }

  /* split headings into words */
  function split(el){
    var txt=el.textContent.replace(/\s+/g,' ').trim(); el.setAttribute('aria-label',txt);
    var n=0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var parts=c.textContent.split(/(\s+)/),frag=d.createDocumentFragment();
          parts.forEach(function(p){
            if(!p) return;
            if(/^\s+$/.test(p)){ frag.appendChild(d.createTextNode(' ')); return; }
            var o=d.createElement('span'); o.className='w'; o.setAttribute('aria-hidden','true');
            var i=d.createElement('span'); i.className='wi'; i.style.setProperty('--wd',(n++)+'');
            i.textContent=p; o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag,c);
        } else if(c.nodeType===1) walk(c);
      });
    })(el);
  }
  d.querySelectorAll('[data-split]').forEach(split);

  /* stagger index from parent */
  d.querySelectorAll('[data-stg]').forEach(function(p){ [].slice.call(p.children).forEach(function(c,i){ c.style.setProperty('--i',i); }); });

  /* glow paragraph */
  var glows=[].slice.call(d.querySelectorAll('[data-glow]'));
  glows.forEach(function(g){
    var t=g.textContent.trim(); g.setAttribute('aria-label',t); g.textContent='';
    t.split(/\s+/).forEach(function(x,i){ var s=d.createElement('span'); s.className='gw'; s.setAttribute('aria-hidden','true'); s.textContent=x+' '; g.appendChild(s); });
  });

  /* marks: captions assembling from noise */
  var noise='#/+×·:;=-_<>';
  function marks(el){
    if(el._m) return; el._m=1; var real=el.getAttribute('data-real'); var tw=el.querySelector('.mk-tw'); if(!tw) return;
    var t0=performance.now(),dur=750;
    (function f(now){
      var k=Math.min(1,(now-t0)/dur),n=Math.floor(real.length*k),s=real.slice(0,n);
      for(var i=n;i<real.length;i++) s+= real[i]===' '?' ':noise[(Math.random()*noise.length)|0];
      tw.textContent=s; if(k<1) requestAnimationFrame(f);
    })(t0);
  }
  d.querySelectorAll('[data-marks]').forEach(function(el){
    var real=el.textContent.trim(); el.setAttribute('data-real',real);
    el.innerHTML='<span class="mk-sr">'+real+'</span><span class="mk-tw" aria-hidden="true">'+real+'</span>';
  });

  /* counters */
  function count(el){
    if(el._c) return; el._c=1; var to=+el.getAttribute('data-count'),t0=performance.now();
    (function f(now){ var k=Math.min(1,(now-t0)/1600),e=1-Math.pow(1-k,3); el.textContent=Math.round(to*e); if(k<1) requestAnimationFrame(f); })(t0);
  }

  var sel='[data-rv],[data-split],[data-cur],[data-pin],.ln,[data-marks],[data-count]';
  var items=[].slice.call(d.querySelectorAll(sel));
  function show(el){
    if(el.classList.contains('in')) return; el.classList.add('in');
    if(el.hasAttribute('data-marks')) marks(el);
    if(el.hasAttribute('data-count')) count(el);
    if(el.hasAttribute('data-cur')){
      var done=function(){ el.classList.add('done'); };
      el.addEventListener('transitionend',function te(e){ if(e.target===el&&e.propertyName==='clip-path'){ el.removeEventListener('transitionend',te); done(); } });
      setTimeout(done,1700);
    }
  }
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ show(e.target); io.unobserve(e.target);} }); },{rootMargin:'0px 0px -8% 0px',threshold:0.01});
  items.forEach(function(el){ io.observe(el); });
  function sweep(){ var vh=innerHeight; items.forEach(function(el){ if(!el.classList.contains('in')&&el.getBoundingClientRect().top<vh) show(el); }); }

  /* scroll-linked: glow + final panel */
  var panel=d.querySelector('[data-panel]'),tick=false;
  function onScroll(){
    if(tick) return; tick=true;
    requestAnimationFrame(function(){
      tick=false; var vh=innerHeight;
      glows.forEach(function(g){
        var r=g.getBoundingClientRect(),ws=g.children,k=(vh*0.85-r.top)/(r.height+vh*0.35);
        k=Math.max(0,Math.min(1,k)); var on=Math.round(k*ws.length);
        for(var i=0;i<ws.length;i++) ws[i].classList.toggle('lit',i<on);
      });
      if(panel){ var t=panel.getBoundingClientRect().top,k2=Math.max(0,Math.min(1,(vh-t)/(vh*0.6))); panel.style.setProperty('--fx',(48*(1-k2)).toFixed(1)+'px'); }
    });
  }
  w.addEventListener('scroll',function(){ onScroll(); sweep(); },{passive:true});
  w.addEventListener('hashchange',sweep); w.addEventListener('load',sweep); w.addEventListener('beforeprint',function(){ items.forEach(show); });

  /* fine pointer: tilt + light spot */
  if(w.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var tilt=d.querySelector('[data-tilt]'),spot=d.querySelector('.spot'),mx=0,my=0,raf=0;
    w.addEventListener('pointermove',function(e){ mx=e.clientX; my=e.clientY; if(!raf) raf=requestAnimationFrame(move); },{passive:true});
    function move(){
      raf=0;
      if(spot) spot.style.transform='translate('+(mx-300)+'px,'+(my-300)+'px)';
      if(tilt){ var r=tilt.getBoundingClientRect(),x=(mx-(r.left+r.width/2))/innerWidth,y=(my-(r.top+r.height/2))/innerHeight;
        tilt.style.setProperty('--rx',(-y*6).toFixed(2)+'deg'); tilt.style.setProperty('--ry',(x*8).toFixed(2)+'deg'); }
    }
  }

  /* hero intro */
  function start(){
    h.classList.add('m-ready');
    setTimeout(function(){ h.classList.add('intro'); sweep(); onScroll(); },300);
  }
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',start); else start();
})();
