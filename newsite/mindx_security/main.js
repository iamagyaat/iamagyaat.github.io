/* ═══════════════════════════════════════════════════════
   MindX Security — Main JavaScript
   Neural Network Background · Mobile Menu · Animations
═══════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   NEURAL NETWORK BACKGROUND
   Inspired by Tooplate 2139 Neural Portfolio
   Enhanced: mouse repulsion, multi-color layers,
   node pulse, signal propagation, depth z-order
════════════════════════════════════════════ */
(function(){
  var canvas = document.getElementById('nc');
  var ctx    = canvas.getContext('2d');
  var W, H;
  var nodes  = [];
  var mouse  = { x: -9999, y: -9999 };
  var frame  = 0;

  /* ── Palette matching cybersec brand ── */
  var COLORS = [
    { r:0,   g:255, b:157 },  /* green  */
    { r:0,   g:212, b:255 },  /* cyan   */
    { r:123, g:47,  b:255 },  /* purple */
    { r:0,   g:255, b:255 }   /* aqua   */
  ];

  function rgba(c, a){ return 'rgba('+c.r+','+c.g+','+c.b+','+a+')'; }

  /* ── Node class ── */
  function Node(x, y){
    this.x    = x;
    this.y    = y;
    this.ox   = x;  /* origin for drift */
    this.oy   = y;
    this.vx   = (Math.random() - 0.5) * 0.55;
    this.vy   = (Math.random() - 0.5) * 0.55;
    this.r    = Math.random() * 2.2 + 0.8;
    this.phase= Math.random() * Math.PI * 2;
    this.speed= 0.012 + Math.random() * 0.018;
    this.col  = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.signal = 0;      /* 0‒1 signal ripple */
    this.sigDecay = 0;
    /* layer depth 0=back 2=front */
    this.layer = Math.floor(Math.random() * 3);
  }

  Node.prototype.update = function(){
    /* mouse repulsion */
    var dx = this.x - mouse.x;
    var dy = this.y - mouse.y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if(dist < 120){
      var force = (120 - dist) / 120 * 0.8;
      this.vx += (dx/dist) * force;
      this.vy += (dy/dist) * force;
    }
    /* damping */
    this.vx *= 0.985;
    this.vy *= 0.985;
    this.x  += this.vx;
    this.y  += this.vy;
    /* bounce */
    if(this.x < 0)  { this.x = 0;  this.vx *= -1; }
    if(this.x > W)  { this.x = W;  this.vx *= -1; }
    if(this.y < 0)  { this.y = 0;  this.vy *= -1; }
    if(this.y > H)  { this.y = H;  this.vy *= -1; }
    /* pulse phase */
    this.phase += this.speed;
    /* signal decay */
    if(this.signal > 0) this.signal -= 0.015;
    if(this.signal < 0) this.signal = 0;
  };

  Node.prototype.draw = function(){
    var pulse  = 0.55 + Math.sin(this.phase) * 0.45;
    var radius = this.r * (1 + (this.layer * 0.3));
    /* signal ripple ring */
    if(this.signal > 0.05){
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + this.signal * 18, 0, Math.PI*2);
      ctx.strokeStyle = rgba(this.col, this.signal * 0.5);
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
    /* glow halo */
    var grd = ctx.createRadialGradient(this.x,this.y,0, this.x,this.y, radius*4);
    grd.addColorStop(0,   rgba(this.col, pulse * 0.45));
    grd.addColorStop(1,   rgba(this.col, 0));
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius*4, 0, Math.PI*2);
    ctx.fillStyle = grd;
    ctx.fill();
    /* core dot */
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI*2);
    ctx.fillStyle = rgba(this.col, pulse);
    ctx.fill();
  };

  /* ── Init ── */
  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init(){
    var count = window.innerWidth < 600 ? 55 : (window.innerWidth < 1024 ? 80 : 110);
    nodes = [];
    for(var i = 0; i < count; i++){
      nodes.push(new Node(
        Math.random() * W,
        Math.random() * H
      ));
    }
  }

  /* ── Random signal burst every ~3s ── */
  function randomSignal(){
    var n = nodes[Math.floor(Math.random() * nodes.length)];
    n.signal = 1;
    setTimeout(randomSignal, 2500 + Math.random() * 2000);
  }

  /* ── Draw edges ── */
  function drawEdges(){
    var maxDist = window.innerWidth < 600 ? 110 : 155;
    for(var i = 0; i < nodes.length; i++){
      for(var j = i+1; j < nodes.length; j++){
        var dx   = nodes[i].x - nodes[j].x;
        var dy   = nodes[i].y - nodes[j].y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < maxDist){
          var alpha = (1 - dist/maxDist) * 0.38;
          /* propagate signal along edge */
          if(nodes[i].signal > 0.1 || nodes[j].signal > 0.1){
            var sig = Math.max(nodes[i].signal, nodes[j].signal);
            alpha   = Math.max(alpha, sig * 0.7);
            /* infect neighbour */
            if(nodes[i].signal > 0.3 && nodes[j].signal < 0.1) nodes[j].signal = nodes[i].signal * 0.4;
            if(nodes[j].signal > 0.3 && nodes[i].signal < 0.1) nodes[i].signal = nodes[j].signal * 0.4;
          }
          /* color: blend from both node colors */
          var ci = nodes[i].col, cj = nodes[j].col;
          var pick = ((i+j) % 4 === 0) ? ci : cj;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = rgba(pick, alpha);
          ctx.lineWidth   = 0.6 + (nodes[i].layer + nodes[j].layer) * 0.1;
          ctx.stroke();
        }
      }
    }
  }

  /* ── Mouse proximity highlight ── */
  function drawMouseLinks(){
    var MDIST = 160;
    for(var i = 0; i < nodes.length; i++){
      var dx   = nodes[i].x - mouse.x;
      var dy   = nodes[i].y - mouse.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < MDIST){
        var alpha = (1 - dist/MDIST) * 0.55;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(nodes[i].x, nodes[i].y);
        ctx.strokeStyle = 'rgba(0,255,255,'+alpha+')';
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    }
    /* mouse dot */
    if(mouse.x > 0 && mouse.x < W){
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,255,255,0.6)';
      ctx.fill();
    }
  }

  /* ── Main loop ── */
  function animate(){
    /* slight fade trail for motion blur */
    ctx.fillStyle = 'rgba(9,9,14,0.2)';
    ctx.fillRect(0, 0, W, H);

    frame++;

    /* Draw back layers first */
    for(var layer = 0; layer < 3; layer++){
      for(var i = 0; i < nodes.length; i++){
        if(nodes[i].layer === layer){
          nodes[i].update();
        }
      }
    }

    /* Edges behind nodes */
    drawEdges();
    drawMouseLinks();

    /* Nodes on top */
    for(var i = 0; i < nodes.length; i++){
      nodes[i].draw();
    }

    requestAnimationFrame(animate);
  }

  /* ── Bootstrap ── */
  resize();
  init();
  randomSignal();
  animate();

  var resizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){ resize(); init(); }, 250);
  });

  window.addEventListener('mousemove', function(e){
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('touchmove', function(e){
    if(e.touches.length > 0){
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  /* reset mouse when it leaves */
  window.addEventListener('mouseleave', function(){
    mouse.x = -9999;
    mouse.y = -9999;
  });
})();

(function(){
  var btn=document.getElementById('bgr'),nav=document.getElementById('mnav');
  function cl(){btn.classList.remove('open');nav.classList.remove('open');btn.setAttribute('aria-expanded','false');document.body.style.overflow=''}
  btn.addEventListener('click',function(){var o=btn.classList.toggle('open');o?(nav.classList.add('open'),document.body.style.overflow='hidden'):(nav.classList.remove('open'),document.body.style.overflow='');btn.setAttribute('aria-expanded',String(o))});
  nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',cl)});
  document.addEventListener('click',function(e){if(!btn.contains(e.target)&&!nav.contains(e.target))cl()});
})();

(function(){
  var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{threshold:.07});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
})();

(function(){
  var io=new IntersectionObserver(function(en){en.forEach(function(e){if(!e.isIntersecting)return;var el=e.target,tgt=+el.dataset.t,cur=0,stp=tgt/45;var ti=setInterval(function(){cur=Math.min(cur+stp,tgt);el.textContent=Math.floor(cur);if(cur>=tgt)clearInterval(ti)},28);io.unobserve(el)})},{threshold:.5});
  document.querySelectorAll('.counter').forEach(function(el){io.observe(el)});
})();

(function(){
  var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.style.transform='scaleX('+e.target.dataset.w/100+')';io.unobserve(e.target)}})},{threshold:.4});
  document.querySelectorAll('.svfill').forEach(function(b){io.observe(b)});
})();

(function(){
  var secs=document.querySelectorAll('section[id]'),lnks=document.querySelectorAll('.nav-d a');
  var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){lnks.forEach(function(l){l.style.color=''});var a=document.querySelector('.nav-d a[href="#'+e.target.id+'"]');if(a)a.style.color='var(--green)'}})},{threshold:.3});
  secs.forEach(function(s){io.observe(s)});
})();