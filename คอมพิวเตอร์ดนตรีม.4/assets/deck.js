/* ============================================================
   Presentation deck engine (v2) — 16:9 scaled stage
   ============================================================ */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  /* ---------- Fit 16:9 stage to viewport ---------- */
  const stage=$('#stage');
  function fit(){
    const availW=window.innerWidth-70;
    const availH=window.innerHeight-140;   // เผื่อ topbar + navbar
    const k=Math.min(availW/1280,availH/720);
    document.documentElement.style.setProperty('--k',k);
  }
  window.addEventListener('resize',fit);fit();

  /* ---------- Navigation ---------- */
  const slides=$$('.slide');
  let i=Math.max(0,slides.findIndex(s=>s.classList.contains('active')));if(i<0)i=0;
  const bar=$('.progress>span'),count=$('.nav-count b'),total=$('.nav-total'),sec=$('.nav-sec');
  function show(n){
    i=Math.max(0,Math.min(slides.length-1,n));
    slides.forEach((s,k)=>s.classList.toggle('active',k===i));
    if(bar)bar.style.width=((i+1)/slides.length*100)+'%';
    if(count)count.textContent=i+1;if(total)total.textContent=slides.length;
    if(sec)sec.textContent=slides[i].dataset.sec||'';
    location.hash='s'+(i+1);
  }
  window.deckGo=show;
  $('.nav-prev')&&$('.nav-prev').addEventListener('click',()=>show(i-1));
  $('.nav-next')&&$('.nav-next').addEventListener('click',()=>show(i+1));
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea'))return;
    if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(i+1);}
    else if(['ArrowLeft','PageUp'].includes(e.key))show(i-1);
    else if(e.key==='Home')show(0);else if(e.key==='End')show(slides.length-1);
  });
  let tx=0;
  document.addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true});
  document.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx;
    if(Math.abs(dx)>60)show(i+(dx<0?1:-1));},{passive:true});

  /* ---------- Tools ---------- */
  $('.t-full')&&$('.t-full').addEventListener('click',()=>{
    if(!document.fullscreenElement)document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();
    else document.exitFullscreen&&document.exitFullscreen();
  });

  /* ---------- Checklists ---------- */
  $$('.check').forEach(c=>c.addEventListener('click',()=>{
    c.classList.toggle('on');
    const list=c.closest('.checklist');if(!list)return;
    const m=list.parentElement.querySelector('.check-meter b');if(!m)return;
    m.textContent=$$('.check.on',list).length+'/'+$$('.check',list).length;
  }));

  /* ---------- Quiz (ทีละข้อ) ---------- */
  $$('.quiz').forEach(quiz=>{
    const qs=$$('.q',quiz);let cur=0,right=0,answered=0;
    const pos=$('.quiz-pos',quiz),scoreB=$('.quiz-score b',quiz);
    const prev=$('.quiz-prev',quiz),next=$('.quiz-next',quiz);
    function paint(){
      qs.forEach((q,k)=>q.classList.toggle('active',k===cur));
      if(pos)pos.textContent=(cur+1)+' / '+qs.length;
      if(prev)prev.disabled=cur===0;if(next)next.disabled=cur===qs.length-1;
    }
    prev&&prev.addEventListener('click',()=>{if(cur>0){cur--;paint();}});
    next&&next.addEventListener('click',()=>{if(cur<qs.length-1){cur++;paint();}});
    quiz.addEventListener('click',e=>{
      const opt=e.target.closest('.opt');if(!opt)return;
      const q=opt.closest('.q');if(q.dataset.done)return;
      q.dataset.done='1';answered++;
      if(opt.dataset.correct==='1')right++;
      $$('.opt',q).forEach(o=>{if(o.dataset.correct==='1')o.classList.add('correct');else if(o===opt)o.classList.add('wrong');});
      if(scoreB)scoreB.textContent=right+' / '+qs.length;
    });
    paint();
  });

  /* ---------- Timer ---------- */
  $$('[data-timer]').forEach(box=>{
    const disp=$('.tm-disp',box);let base=+box.dataset.timer*60,left=base,id=null;
    const paint=()=>{if(disp)disp.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');};
    paint();
    const sBtn=$('.tm-start',box);
    sBtn&&sBtn.addEventListener('click',function(){
      if(id){clearInterval(id);id=null;this.textContent='▶ เริ่ม';return;}
      this.textContent='⏸ หยุด';
      id=setInterval(()=>{left--;paint();if(left<=0){clearInterval(id);id=null;this.textContent='▶ เริ่ม';}},1000);
    });
    $('.tm-reset',box)&&$('.tm-reset',box).addEventListener('click',()=>{if(id){clearInterval(id);id=null;}left=base;paint();if(sBtn)sBtn.textContent='▶ เริ่ม';});
  });

  /* ---------- Sound Sorter (คาบ1) ---------- */
  $$('.sorter').forEach(sorter=>{
    let selEl=null;const pool=$('.pool',sorter);
    $$('.tokn',pool).forEach(t=>t.addEventListener('click',()=>{
      $$('.tokn',pool).forEach(x=>x.style.outline='');selEl=t;t.style.outline='3px solid var(--accent)';}));
    $$('.bin',sorter).forEach(bin=>bin.addEventListener('click',()=>{
      if(!selEl)return;const ok=selEl.dataset.cat===bin.dataset.cat;
      const c=selEl.cloneNode(true);c.style.outline='';c.classList.add(ok?'right':'wrong');
      $('.drop',bin).appendChild(c);selEl.classList.add('used');selEl=null;
      const res=$('.sorter-res',sorter),done=$$('.tokn.used',pool).length,all=$$('.tokn',pool).length;
      if(res)res.textContent=done<all?('จัดแล้ว '+done+'/'+all+' — เขียว = ถูกหมวด แดง = ลองคิดใหม่')
        :'ครบแล้ว! เสียงเดียวกันบางทีอยู่ได้หลายหมวด ขึ้นกับว่าเราจะใช้เล่าอะไร';
    }));
  });

  /* ---------- Step sequencer (คาบ1 แถวเดียว / คาบ4 หลายแถว) ---------- */
  $$('.seq').forEach(seq=>{
    const rowEls=$$('.seq-row',seq).length ? $$('.seq-row',seq) : [$('.seq-grid',seq)].filter(Boolean);
    const rows=rowEls.map(r=>({cells:$$('.cell',r),freq:+(r.dataset.freq||180),type:r.dataset.type||'square',sound:r.dataset.sound||''}));
    rows.forEach(r=>r.cells.forEach(c=>c.addEventListener('click',()=>c.classList.toggle('on'))));
    const cols=rows.length?rows[0].cells.length:0;
    let id=null,step=0;const AC=window.AudioContext||window.webkitAudioContext;let ac=null;
    function playSound(sound,freq,type){
      if(!ac)return;
      const t=ac.currentTime;
      if(sound==='kick'){
        const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);
        o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(30,t+0.1);
        g.gain.setValueAtTime(0.3,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
        o.start(t);o.stop(t+0.16);
      }else if(sound==='wood'){
        const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.connect(g);g.connect(ac.destination);
        o.frequency.setValueAtTime(1200,t);g.gain.setValueAtTime(0.25,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.05);
        o.start(t);o.stop(t+0.06);
      }else if(sound==='clap'){
        const len=ac.sampleRate*0.12,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
        for(let k=0;k<len;k++)d[k]=Math.random()*2-1;
        const src=ac.createBufferSource();src.buffer=buf;
        const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1200;f.Q.value=2;
        const g=ac.createGain();src.connect(f);f.connect(g);g.connect(ac.destination);
        g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
        src.start(t);
      }else if(sound==='snap'){
        const len=ac.sampleRate*0.06,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
        for(let k=0;k<len;k++)d[k]=Math.random()*2-1;
        const src=ac.createBufferSource();src.buffer=buf;
        const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=2500;f.Q.value=3;
        const g=ac.createGain();src.connect(f);f.connect(g);g.connect(ac.destination);
        g.gain.setValueAtTime(0.25,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.04);
        src.start(t);
      }else{
        const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;g.gain.value=0.0001;o.connect(g);g.connect(ac.destination);
        g.gain.linearRampToValueAtTime(0.22,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);
        o.start(t);o.stop(t+0.17);
      }
    }
    const pb=$('.seq-play',seq);
    pb&&pb.addEventListener('click',function(){
      if(id){clearInterval(id);id=null;rows.forEach(r=>r.cells.forEach(c=>c.classList.remove('play')));this.textContent='▶ เล่นจังหวะ';return;}
      if(!ac)ac=new AC();this.textContent='⏸ หยุด';step=0;
      id=setInterval(()=>{
        rows.forEach(r=>r.cells.forEach(c=>c.classList.remove('play')));
        rows.forEach(r=>{const c=r.cells[step];if(!c)return;c.classList.add('play');if(c.classList.contains('on'))playSound(r.sound,r.freq,r.type);});
        step=(step+1)%cols;},260);
    });
    $('.seq-clear',seq)&&$('.seq-clear',seq).addEventListener('click',()=>rows.forEach(r=>r.cells.forEach(c=>c.classList.remove('on'))));
    $('.seq-demo',seq)&&$('.seq-demo',seq).addEventListener('click',()=>{
      rows.forEach(r=>r.cells.forEach(c=>c.classList.remove('on')));
      const presets=[[0,4],[0,2,4,6],[2,6],[5,7]];
      rows.forEach((r,idx)=>{if(presets[idx])presets[idx].forEach(x=>{r.cells[x]&&r.cells[x].classList.add('on');});});
    });
  });

  /* ---------- Recording self-check (คาบ2) ---------- */
  $$('.rec-sim').forEach(sim=>{
    const dist=$('[data-r=dist]',sim),lvl=$('[data-r=lvl]',sim),noise=$('[data-r=noise]',sim);
    const needle=$('.needle',sim),verdict=$('.verdict',sim);
    function calc(){
      const d=+dist.value,l=+lvl.value,n=+noise.value;let cap=Math.max(0,Math.min(100,l-d*0.5));
      if(needle)needle.style.left=cap+'%';let msg,cls;
      if(cap>88){msg='🔴 เสียงแรงเกินจนพีคแตก (clipping) — ถอยไมค์ออกหรือลดระดับต้นทาง';cls='bad';}
      else if(cap<35){msg='🟡 เบาไป ต้องมาเร่งทีหลังจะดึง noise ขึ้นมาด้วย — เข้าใกล้แหล่งเสียงอีกนิด';cls='warn';}
      else if(n>60){msg='🟡 ระดับกำลังดี แต่เสียงรบกวนสูง — หาที่เงียบกว่านี้หรือหันไมค์หนีต้นเสียงรบกวน';cls='warn';}
      else{msg='🟢 กำลังดี: ดังพอ ไม่แตก และ noise ต่ำ — take นี้ใช้ได้';cls='ok';}
      if(verdict){verdict.textContent=msg;verdict.style.borderColor='var(--'+cls+')';}
    }
    [dist,lvl,noise].forEach(r=>r&&r.addEventListener('input',calc));calc();
  });

  /* ---------- Mood map (คาบ3) ---------- */
  $$('.moodmap').forEach(map=>{
    const src=map.parentElement.querySelector('.mood-src');let selEl=null;
    if(src)$$('.tokn',src).forEach(t=>t.addEventListener('click',()=>{
      $$('.tokn',src).forEach(x=>x.style.outline='');selEl=t;t.style.outline='3px solid var(--accent)';}));
    map.addEventListener('click',e=>{
      if(!selEl)return;const r=map.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100;
      const dot=document.createElement('span');dot.className='dot';dot.textContent=selEl.textContent;
      dot.style.left=x+'%';dot.style.top=y+'%';map.appendChild(dot);
      selEl.classList.add('used');selEl.style.outline='';selEl=null;
    });
  });

  const h=location.hash.match(/^#s(\d+)$/);show(h?(+h[1]-1):i);
})();
