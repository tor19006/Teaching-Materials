/* ==========================================================================
   INTERACTIVE WIDGETS - JavaScript
   วิดเจ็ตอินเตอร์แอกทีฟใหม่สำหรับสไลด์คอมพิวเตอร์ดนตรี ม.6
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // สร้าง AudioContext กลาง (สำหรับทุก widget)
  let widgetAudioCtx = null;
  function getAudioCtx() {
    if (!widgetAudioCtx || widgetAudioCtx.state === 'closed') {
      widgetAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (widgetAudioCtx && widgetAudioCtx.state === 'suspended') {
      widgetAudioCtx.resume();
    }
    return widgetAudioCtx;
  }

  // ============================================================
  // 1. WAVEFORM VISUALIZER (Slide 0 - #waveform-canvas)
  // ============================================================
  (function initWaveformVisualizer() {
    const canvas = document.getElementById('waveform-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sliderFreq = document.getElementById('slider-wave-freq');
    const sliderAmp = document.getElementById('slider-wave-amp');
    const selectType = document.getElementById('select-wave-type');
    const valFreq = document.getElementById('val-wave-freq');
    const valAmp = document.getElementById('val-wave-amp');
    const btnPlay = document.getElementById('btn-play-wave');
    const btnBass = document.getElementById('btn-wave-bass');
    const btnMid = document.getElementById('btn-wave-mid');
    const btnHigh = document.getElementById('btn-wave-high');

    if (!sliderFreq || !sliderAmp || !selectType) return;

    function drawWaveform() {
      const freq = parseInt(sliderFreq.value);
      const amp = parseInt(sliderAmp.value) / 100;
      const type = selectType.value;
      const w = canvas.width, h = canvas.height;
      const midY = h / 2;

      ctx.clearRect(0, 0, w, h);
      // พื้นหลัง
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      // เส้นกลาง
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();
      ctx.setLineDash([]);

      // วาดคลื่น
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const cycles = Math.max(2, freq / 100);
      for (let x = 0; x < w; x++) {
        const t = (x / w) * cycles * Math.PI * 2;
        let y;
        if (type === 'sine') {
          y = Math.sin(t);
        } else if (type === 'square') {
          y = Math.sin(t) >= 0 ? 1 : -1;
        } else if (type === 'sawtooth') {
          y = 2 * ((t / (2 * Math.PI)) % 1) - 1;
        } else { // triangle
          y = 2 * Math.abs(2 * ((t / (2 * Math.PI)) % 1) - 1) - 1;
        }
        const py = midY - y * amp * (h * 0.4);
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();

      // ป้ายชื่อคลื่น
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Prompt, sans-serif';
      ctx.fillText(`${type} · ${freq} Hz · ${Math.round(amp * 100)}%`, 8, 14);
    }

    function playTone(freq, duration) {
      try {
        const ac = getAudioCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = selectType.value;
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        gain.gain.setValueAtTime(0.15, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + duration);
      } catch (e) { console.error(e); }
    }

    sliderFreq.addEventListener('input', () => { valFreq.textContent = sliderFreq.value; drawWaveform(); });
    sliderAmp.addEventListener('input', () => { valAmp.textContent = sliderAmp.value; drawWaveform(); });
    selectType.addEventListener('change', drawWaveform);

    if (btnPlay) btnPlay.addEventListener('click', () => playTone(parseInt(sliderFreq.value), 1.5));
    if (btnBass) btnBass.addEventListener('click', () => { sliderFreq.value = 100; valFreq.textContent = '100'; drawWaveform(); playTone(100, 1.5); });
    if (btnMid) btnMid.addEventListener('click', () => { sliderFreq.value = 1000; valFreq.textContent = '1000'; drawWaveform(); playTone(1000, 1.5); });
    if (btnHigh) btnHigh.addEventListener('click', () => { sliderFreq.value = 3000; valFreq.textContent = '3000'; drawWaveform(); playTone(3000, 1.5); });

    drawWaveform();
  })();

  // ============================================================
  // 2. MIC SOUND COMPARISON (Slide 3)
  // ============================================================
  (function initMicComparison() {
    const btnDynamic = document.getElementById('btn-mic-dynamic');
    const btnCondenser = document.getElementById('btn-mic-condenser');
    const btnRibbon = document.getElementById('btn-mic-ribbon');
    const sliderProx = document.getElementById('slider-proximity');
    const valProx = document.getElementById('val-proximity');
    const canvas = document.getElementById('mic-spectrum-canvas');
    if (!btnDynamic || !canvas) return;
    const ctx2 = canvas.getContext('2d');

    let currentMicType = null;
    let spectrumData = new Array(20).fill(0);

    function drawSpectrum() {
      const w = canvas.width, h = canvas.height;
      ctx2.clearRect(0, 0, w, h);
      ctx2.fillStyle = '#f8fafc';
      ctx2.fillRect(0, 0, w, h);

      const barW = (w - 40) / spectrumData.length;
      spectrumData.forEach((val, i) => {
        const barH = val * (h - 16);
        const hue = 200 + i * 4;
        ctx2.fillStyle = `hsl(${hue}, 70%, 55%)`;
        ctx2.fillRect(20 + i * barW, h - 8 - barH, barW - 2, barH);
      });

      // ป้ายย่านความถี่
      ctx2.fillStyle = '#94a3b8';
      ctx2.font = '8px Prompt';
      ctx2.fillText('Bass', 22, h - 1);
      ctx2.fillText('Mids', w * 0.4, h - 1);
      ctx2.fillText('Highs', w * 0.75, h - 1);
    }

    function playMicSound(type) {
      try {
        const ac = getAudioCtx();
        const noise = ac.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(220, ac.currentTime);

        const filter = ac.createBiquadFilter();
        const proxBoost = ac.createBiquadFilter();
        const gain = ac.createGain();

        // Proximity Effect
        const proxVal = sliderProx ? parseInt(sliderProx.value) : 50;
        proxBoost.type = 'peaking';
        proxBoost.frequency.setValueAtTime(180, ac.currentTime);
        proxBoost.gain.setValueAtTime(Math.max(0, (50 - proxVal) * 0.3), ac.currentTime);
        proxBoost.Q.setValueAtTime(1, ac.currentTime);

        if (type === 'dynamic') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(7000, ac.currentTime);
          spectrumData = [0.7, 0.8, 0.85, 0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.38, 0.3, 0.22, 0.18, 0.12, 0.08, 0.05, 0.03];
        } else if (type === 'condenser') {
          filter.type = 'highshelf';
          filter.frequency.setValueAtTime(4000, ac.currentTime);
          filter.gain.setValueAtTime(6, ac.currentTime);
          spectrumData = [0.4, 0.55, 0.65, 0.7, 0.75, 0.8, 0.82, 0.85, 0.88, 0.9, 0.88, 0.85, 0.82, 0.78, 0.72, 0.65, 0.55, 0.45, 0.35, 0.25];
        } else {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(5500, ac.currentTime);
          spectrumData = [0.6, 0.7, 0.75, 0.8, 0.82, 0.78, 0.7, 0.6, 0.5, 0.42, 0.35, 0.28, 0.22, 0.16, 0.1, 0.07, 0.04, 0.02, 0.01, 0.01];
        }

        // ใส่ Proximity Effect ในสเปกตรัม
        if (proxVal < 30) {
          for (let i = 0; i < 5; i++) spectrumData[i] = Math.min(1, spectrumData[i] * 1.4);
        }

        gain.gain.setValueAtTime(0.12, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2);

        noise.connect(filter);
        filter.connect(proxBoost);
        proxBoost.connect(gain);
        gain.connect(ac.destination);
        noise.start();
        noise.stop(ac.currentTime + 2);

        currentMicType = type;
        drawSpectrum();

        // ไฮไลต์ปุ่ม
        [btnDynamic, btnCondenser, btnRibbon].forEach(b => b.classList.remove('active-mic'));
        if (type === 'dynamic') btnDynamic.classList.add('active-mic');
        else if (type === 'condenser') btnCondenser.classList.add('active-mic');
        else btnRibbon.classList.add('active-mic');

        setTimeout(() => {
          [btnDynamic, btnCondenser, btnRibbon].forEach(b => b.classList.remove('active-mic'));
        }, 2000);
      } catch (e) { console.error(e); }
    }

    btnDynamic.addEventListener('click', () => playMicSound('dynamic'));
    btnCondenser.addEventListener('click', () => playMicSound('condenser'));
    btnRibbon.addEventListener('click', () => playMicSound('ribbon'));

    if (sliderProx) {
      sliderProx.addEventListener('input', () => {
        if (valProx) valProx.textContent = sliderProx.value;
        if (currentMicType) {
          // อัปเดตสเปกตรัมตาม proximity
          const proxVal = parseInt(sliderProx.value);
          if (proxVal < 30) {
            for (let i = 0; i < 5; i++) spectrumData[i] = Math.min(1, spectrumData[i] * 1.1);
          }
          drawSpectrum();
        }
      });
    }

    drawSpectrum();
  })();

  // ============================================================
  // 3. POLAR PATTERN VISUALIZER (Slide 4)
  // ============================================================
  (function initPolarPattern() {
    const canvas = document.getElementById('polar-canvas');
    if (!canvas) return;
    const ctx3 = canvas.getContext('2d');
    const radios = document.querySelectorAll('input[name="polar-type"]');

    function cardioid(angle) { return 0.5 * (1 + Math.cos(angle)); }
    function omni() { return 1; }
    function figure8(angle) { return Math.abs(Math.cos(angle)); }

    function drawPattern(type) {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const maxR = Math.min(cx, cy) - 20;

      ctx3.clearRect(0, 0, w, h);
      ctx3.fillStyle = '#f8fafc';
      ctx3.fillRect(0, 0, w, h);

      // เส้นตาราง
      ctx3.strokeStyle = '#e2e8f0';
      ctx3.lineWidth = 0.5;
      for (let r = maxR; r > 0; r -= maxR / 4) {
        ctx3.beginPath();
        ctx3.arc(cx, cy, r, 0, Math.PI * 2);
        ctx3.stroke();
      }
      // เส้นกากบาท
      ctx3.beginPath(); ctx3.moveTo(cx - maxR, cy); ctx3.lineTo(cx + maxR, cy); ctx3.stroke();
      ctx3.beginPath(); ctx3.moveTo(cx, cy - maxR); ctx3.lineTo(cx, cy + maxR); ctx3.stroke();

      // วาด Pattern
      const colors = { cardioid: '#2563eb', omni: '#10b981', figure8: '#8b5cf6' };
      ctx3.strokeStyle = colors[type] || '#2563eb';
      ctx3.lineWidth = 2.5;
      ctx3.fillStyle = (colors[type] || '#2563eb') + '20';
      ctx3.beginPath();

      for (let a = 0; a <= 360; a += 1) {
        const rad = (a * Math.PI) / 180;
        let r;
        if (type === 'cardioid') r = cardioid(rad);
        else if (type === 'omni') r = omni();
        else r = figure8(rad);

        const x = cx + r * maxR * Math.cos(rad - Math.PI / 2);
        const y = cy + r * maxR * Math.sin(rad - Math.PI / 2);
        if (a === 0) ctx3.moveTo(x, y);
        else ctx3.lineTo(x, y);
      }
      ctx3.closePath();
      ctx3.fill();
      ctx3.stroke();

      // ไอคอนไมค์ตรงกลาง
      ctx3.fillStyle = '#475569';
      ctx3.font = '16px sans-serif';
      ctx3.textAlign = 'center';
      ctx3.fillText('🎙️', cx, cy + 6);

      // ป้าย
      ctx3.fillStyle = colors[type] || '#2563eb';
      ctx3.font = '10px Prompt, sans-serif';
      ctx3.fillText(type.charAt(0).toUpperCase() + type.slice(1), cx, h - 4);

      // ป้ายทิศทาง
      ctx3.fillStyle = '#94a3b8';
      ctx3.font = '8px Prompt';
      ctx3.fillText('หน้า', cx, 12);
      ctx3.fillText('หลัง', cx, h - 14);
      ctx3.textAlign = 'left';
      ctx3.fillText('ซ้าย', 2, cy + 4);
      ctx3.textAlign = 'right';
      ctx3.fillText('ขวา', w - 2, cy + 4);
      ctx3.textAlign = 'center';
    }

    radios.forEach(r => r.addEventListener('change', () => drawPattern(r.value)));
    drawPattern('cardioid');
  })();

  // ============================================================
  // 4. MINI MIDI PIANO (Slide 4)
  // ============================================================
  (function initMidiPiano() {
    const container = document.getElementById('midi-piano-container');
    const log = document.getElementById('midi-log');
    if (!container) return;

    const noteNames = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'];
    const noteFreqs = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88];
    const isBlack = [false, true, false, true, false, false, true, false, true, false, true, false];

    const pianoDiv = document.createElement('div');
    pianoDiv.className = 'widget-piano';
    
    // ตำแหน่ง black keys (เป็น % จากซ้าย)
    const blackPositions = [8.5, 20, null, 44, 55.5, 67, null, null];
    let blackIdx = 0;

    // สร้าง white keys ก่อน
    const whiteNotes = noteNames.filter((_, i) => !isBlack[i]);
    const whiteFreqList = noteFreqs.filter((_, i) => !isBlack[i]);
    const whiteMidiList = [60, 62, 64, 65, 67, 69, 71];

    whiteNotes.forEach((name, i) => {
      const key = document.createElement('div');
      key.className = 'widget-piano-key';
      key.textContent = name;
      key.dataset.freq = whiteFreqList[i];
      key.dataset.midi = whiteMidiList[i];
      key.dataset.name = name;
      pianoDiv.appendChild(key);
    });

    // สร้าง black keys
    const blackNoteData = [
      { name: 'C#4', freq: 277.18, midi: 61, left: '11%' },
      { name: 'D#4', freq: 311.13, midi: 63, left: '24.5%' },
      { name: 'F#4', freq: 369.99, midi: 66, left: '52%' },
      { name: 'G#4', freq: 415.30, midi: 68, left: '65.5%' },
      { name: 'A#4', freq: 466.16, midi: 70, left: '79%' },
    ];

    blackNoteData.forEach(nd => {
      const key = document.createElement('div');
      key.className = 'widget-piano-key black';
      key.textContent = nd.name;
      key.style.left = nd.left;
      key.dataset.freq = nd.freq;
      key.dataset.midi = nd.midi;
      key.dataset.name = nd.name;
      pianoDiv.appendChild(key);
    });

    container.appendChild(pianoDiv);

    // เล่นเสียงเมื่อกดคีย์
    const handlePianoPress = (e) => {
      const key = e.target.closest('.widget-piano-key');
      if (!key) return;

      // ป้องกันการทำงานซ้ำซ้อนในบางเบราว์เซอร์
      if (e.type === 'touchstart') {
        e.preventDefault();
      }

      const freq = parseFloat(key.dataset.freq);
      const midi = parseInt(key.dataset.midi);
      const name = key.dataset.name;
      const velocity = Math.floor(Math.random() * 64) + 64; // 64-127

      key.classList.add('active');
      setTimeout(() => key.classList.remove('active'), 300);

      // แสดง MIDI log
      if (log) {
        log.innerHTML = `<span style="color:var(--color-success);">▶ Note On</span> | Note: <strong>${name}</strong> (${midi}) | Velocity: <strong>${velocity}</strong> | Channel: 1`;
        setTimeout(() => {
          log.innerHTML = `<span style="color:var(--color-error);">■ Note Off</span> | Note: <strong>${name}</strong> (${midi}) | Velocity: 0 | Channel: 1`;
        }, 500);
      }

      try {
        const ac = getAudioCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        gain.gain.setValueAtTime(velocity / 127 * 0.2, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.8);
      } catch (err) { console.error(err); }
    };

    pianoDiv.addEventListener('mousedown', handlePianoPress);
    pianoDiv.addEventListener('touchstart', handlePianoPress, { passive: false });
  })();

  // ============================================================
  // 5. AUDIO INTERFACE DIAGRAM (Slide 5)
  // ============================================================
  (function initInterfaceDiagram() {
    const container = document.getElementById('interface-diagram');
    const btnBalanced = document.getElementById('btn-balanced-demo');
    const btnUnbalanced = document.getElementById('btn-unbalanced-demo');
    if (!container) return;

    const stages = [
      { icon: '🎙️', label: 'Mic Input', tip: 'จุดรับสัญญาณจากไมโครโฟน ผ่านพอร์ต XLR (Balanced) สัญญาณระดับ Mic Level ต่ำมาก' },
      { icon: '🔊', label: 'Preamp', tip: 'ขยายสัญญาณจากระดับ Mic Level (มิลลิโวลต์) ให้เพิ่มขึ้นเป็น Line Level เพื่อลด Noise' },
      { icon: '📊', label: 'ADC', tip: 'แปลงสัญญาณอนาล็อก (คลื่นไฟฟ้า) เป็นข้อมูลดิจิทัล (เลขฐานสอง 0/1) ตาม Sample Rate + Bit Depth' },
      { icon: '🔌', label: 'USB', tip: 'สตรีมข้อมูลดิจิทัลจาก Interface เข้าคอมพิวเตอร์ผ่านสาย USB (หรือ Thunderbolt)' },
      { icon: '💻', label: 'DAW', tip: 'ซอฟต์แวร์ทำเพลง (Digital Audio Workstation) ประมวลผลตัดต่อมิกซ์เสียงในคอมพิวเตอร์' },
      { icon: '📊', label: 'DAC', tip: 'แปลงข้อมูลดิจิทัลกลับเป็นสัญญาณอนาล็อก (คลื่นไฟฟ้า) เพื่อส่งไปขับลำโพง' },
      { icon: '🔊', label: 'Output', tip: 'ส่งสัญญาณอนาล็อกไปยังลำโพงมอนิเตอร์หรือหูฟัง เพื่อฟังเสียง' },
    ];

    stages.forEach((s, i) => {
      if (i > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'widget-if-arrow';
        arrow.textContent = '→';
        container.appendChild(arrow);
      }

      const stageEl = document.createElement('div');
      stageEl.className = 'widget-if-stage';
      stageEl.style.position = 'relative';
      stageEl.innerHTML = `<span class="icon">${s.icon}</span><span class="label">${s.label}</span>`;
      
      const tooltip = document.createElement('div');
      tooltip.className = 'widget-if-tooltip';
      tooltip.textContent = s.tip;
      stageEl.appendChild(tooltip);

      stageEl.addEventListener('click', () => {
        document.querySelectorAll('.widget-if-tooltip').forEach(t => t.classList.remove('show'));
        document.querySelectorAll('.widget-if-stage').forEach(s => s.classList.remove('active'));
        tooltip.classList.toggle('show');
        stageEl.classList.toggle('active');
      });

      container.appendChild(stageEl);
    });

    // Balanced vs Unbalanced Demo
    function playBalanced() {
      try {
        const ac = getAudioCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ac.currentTime);
        gain.gain.setValueAtTime(0.15, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 2);
      } catch (e) { console.error(e); }
    }

    function playUnbalanced() {
      try {
        const ac = getAudioCtx();
        // สัญญาณหลัก
        const osc = ac.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ac.currentTime);
        // เสียงจี่ 60Hz hum
        const hum = ac.createOscillator();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(60, ac.currentTime);
        // เสียง harmonic ของ hum
        const hum2 = ac.createOscillator();
        hum2.type = 'sine';
        hum2.frequency.setValueAtTime(120, ac.currentTime);

        const gainMain = ac.createGain();
        const gainHum = ac.createGain();
        const gainHum2 = ac.createGain();
        const masterGain = ac.createGain();

        gainMain.gain.setValueAtTime(0.12, ac.currentTime);
        gainHum.gain.setValueAtTime(0.06, ac.currentTime);
        gainHum2.gain.setValueAtTime(0.03, ac.currentTime);
        masterGain.gain.setValueAtTime(1, ac.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2.5);

        osc.connect(gainMain); gainMain.connect(masterGain);
        hum.connect(gainHum); gainHum.connect(masterGain);
        hum2.connect(gainHum2); gainHum2.connect(masterGain);
        masterGain.connect(ac.destination);

        osc.start(); hum.start(); hum2.start();
        osc.stop(ac.currentTime + 2.5);
        hum.stop(ac.currentTime + 2.5);
        hum2.stop(ac.currentTime + 2.5);
      } catch (e) { console.error(e); }
    }

    if (btnBalanced) btnBalanced.addEventListener('click', playBalanced);
    if (btnUnbalanced) btnUnbalanced.addEventListener('click', playUnbalanced);
  })();

  // ============================================================
  // 6. LATENCY CALCULATOR (Slide 6)
  // ============================================================
  (function initLatencyCalc() {
    const selectSR = document.getElementById('select-sample-rate');
    const sliderBuf = document.getElementById('slider-buffer-size');
    const valBuf = document.getElementById('val-buffer-size');
    const result = document.getElementById('latency-result');
    const indicator = document.getElementById('latency-indicator');
    if (!selectSR || !sliderBuf) return;

    const bufferSizes = [32, 64, 128, 256, 512, 1024];

    function calcLatency() {
      const sr = parseInt(selectSR.value);
      const bufIdx = parseInt(sliderBuf.value);
      const buf = bufferSizes[bufIdx];
      if (valBuf) valBuf.textContent = buf;
      const latency = (buf / sr) * 1000 * 2; // round-trip

      if (result) result.textContent = latency.toFixed(1) + ' ms';

      if (indicator) {
        if (latency < 10) {
          result.style.color = 'var(--color-success)';
          indicator.style.background = '#d1fae5';
          indicator.style.color = 'var(--color-success)';
          indicator.textContent = '✅ เล่นสดไม่รู้สึกหน่วง (< 10ms)';
        } else if (latency < 20) {
          result.style.color = 'var(--color-warning)';
          indicator.style.background = '#fef3c7';
          indicator.style.color = 'var(--color-warning)';
          indicator.textContent = '⚠️ เริ่มรู้สึกหน่วงเล็กน้อย (10-20ms)';
        } else {
          result.style.color = 'var(--color-error)';
          indicator.style.background = '#fee2e2';
          indicator.style.color = 'var(--color-error)';
          indicator.textContent = '❌ หน่วงมากเกินไปสำหรับเล่นสด (> 20ms)';
        }
      }
    }

    selectSR.addEventListener('change', calcLatency);
    sliderBuf.addEventListener('input', calcLatency);
    calcLatency();
  })();

  // ============================================================
  // 7. GAIN STAGING METER (Slide 6)
  // ============================================================
  (function initGainMeter() {
    const sliderMic = document.getElementById('slider-gain-mic');
    const sliderPre = document.getElementById('slider-gain-preamp');
    const sliderDaw = document.getElementById('slider-gain-daw');
    const meterMic = document.getElementById('gain-meter-mic');
    const meterPre = document.getElementById('gain-meter-preamp');
    const meterDaw = document.getElementById('gain-meter-daw');
    const clipWarn = document.getElementById('gain-clip-warning');
    if (!sliderMic || !meterMic) return;

    function updateGain() {
      const mic = parseInt(sliderMic.value);
      const pre = parseInt(sliderPre.value);
      const daw = parseInt(sliderDaw.value);

      // อัปเดตป้ายค่า
      const valMic = document.getElementById('gain-val-mic');
      const valPre = document.getElementById('gain-val-preamp');
      const valDaw = document.getElementById('gain-val-daw');
      if (valMic) valMic.textContent = mic;
      if (valPre) valPre.textContent = pre;
      if (valDaw) valDaw.textContent = daw;

      // อัปเดตมิเตอร์
      const fillMic = meterMic.querySelector('.widget-meter-fill');
      const fillPre = meterPre ? meterPre.querySelector('.widget-meter-fill') : null;
      const fillDaw = meterDaw ? meterDaw.querySelector('.widget-meter-fill') : null;
      if (fillMic) fillMic.style.height = mic + '%';
      if (fillPre) fillPre.style.height = pre + '%';
      if (fillDaw) fillDaw.style.height = daw + '%';

      // ตรวจสอบ clipping
      const total = (mic + pre + daw) / 3;
      if (clipWarn) {
        if (total > 85) {
          clipWarn.style.display = 'block';
          clipWarn.textContent = '⚠️ สัญญาณแตก! (Clipping) ลด Gain ลง';
        } else if (total > 70) {
          clipWarn.style.display = 'block';
          clipWarn.style.color = 'var(--color-warning)';
          clipWarn.textContent = '⚠️ ใกล้ขีดจำกัด - ระวังสัญญาณแตก';
        } else {
          clipWarn.style.display = 'none';
        }
      }
    }

    sliderMic.addEventListener('input', updateGain);
    sliderPre.addEventListener('input', updateGain);
    sliderDaw.addEventListener('input', updateGain);
    updateGain();
  })();

  // ============================================================
  // 8. FREQUENCY RESPONSE CURVES (Slide 7)
  // ============================================================
  (function initFRCurves() {
    const canvas = document.getElementById('fr-canvas');
    if (!canvas) return;
    const ctx4 = canvas.getContext('2d');
    const radios = document.querySelectorAll('input[name="fr-type"]');

    const curves = {
      flat: (x) => 0 + Math.sin(x * 0.3) * 0.5,
      vshape: (x) => {
        const norm = x / 100;
        if (norm < 0.15) return 6 * (1 - norm / 0.15);
        if (norm > 0.7) return 5 * ((norm - 0.7) / 0.3);
        return -3 + Math.sin(norm * 8) * 0.5;
      },
      headphone: (x) => {
        const norm = x / 100;
        if (norm < 0.08) return -6 * (1 - norm / 0.08);
        return 0.5 + Math.sin(norm * 4) * 0.8;
      }
    };

    const colors = { flat: '#2563eb', vshape: '#ef4444', headphone: '#8b5cf6' };

    function drawFR(type) {
      const w = canvas.width, h = canvas.height;
      const padL = 35, padR = 10, padT = 15, padB = 25;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      const midY = padT + plotH / 2;

      ctx4.clearRect(0, 0, w, h);
      ctx4.fillStyle = '#f8fafc';
      ctx4.fillRect(0, 0, w, h);

      // กริด dB
      ctx4.strokeStyle = '#e2e8f0';
      ctx4.lineWidth = 0.5;
      ctx4.fillStyle = '#94a3b8';
      ctx4.font = '8px Prompt';
      ctx4.textAlign = 'right';
      for (let db = -12; db <= 12; db += 6) {
        const y = midY - (db / 12) * (plotH / 2);
        ctx4.beginPath();
        ctx4.setLineDash([2, 2]);
        ctx4.moveTo(padL, y);
        ctx4.lineTo(w - padR, y);
        ctx4.stroke();
        ctx4.setLineDash([]);
        ctx4.fillText(db + 'dB', padL - 3, y + 3);
      }

      // ป้ายความถี่
      ctx4.textAlign = 'center';
      ctx4.fillStyle = '#94a3b8';
      const freqLabels = [
        { label: '20', x: 0 }, { label: '100', x: 0.17 }, { label: '500', x: 0.35 },
        { label: '1k', x: 0.5 }, { label: '5k', x: 0.7 }, { label: '10k', x: 0.85 }, { label: '20k', x: 1 }
      ];
      freqLabels.forEach(f => {
        ctx4.fillText(f.label, padL + f.x * plotW, h - 5);
      });

      // ป้ายย่าน
      ctx4.fillStyle = '#cbd5e1';
      ctx4.font = '9px Prompt';
      ctx4.fillText('Bass', padL + plotW * 0.1, padT + 10);
      ctx4.fillText('Mids', padL + plotW * 0.45, padT + 10);
      ctx4.fillText('Highs', padL + plotW * 0.82, padT + 10);

      // วาดเส้น 0dB
      ctx4.strokeStyle = '#cbd5e1';
      ctx4.lineWidth = 1;
      ctx4.beginPath();
      ctx4.moveTo(padL, midY);
      ctx4.lineTo(w - padR, midY);
      ctx4.stroke();

      // วาดเส้นโค้ง
      const fn = curves[type] || curves.flat;
      ctx4.strokeStyle = colors[type] || '#2563eb';
      ctx4.lineWidth = 3;
      ctx4.beginPath();
      for (let px = 0; px <= plotW; px++) {
        const x = (px / plotW) * 100;
        const db = fn(x);
        const y = midY - (db / 12) * (plotH / 2);
        if (px === 0) ctx4.moveTo(padL + px, y);
        else ctx4.lineTo(padL + px, y);
      }
      ctx4.stroke();

      // Fill area
      ctx4.lineTo(w - padR, midY);
      ctx4.lineTo(padL, midY);
      ctx4.closePath();
      ctx4.fillStyle = (colors[type] || '#2563eb') + '15';
      ctx4.fill();
    }

    radios.forEach(r => r.addEventListener('change', () => drawFR(r.value)));
    drawFR('flat');
  })();

  // ============================================================
  // 9. ROOM ACOUSTICS VISUALIZER (Slide 8)
  // ============================================================
  (function initRoomAcoustics() {
    const canvas = document.getElementById('room-canvas');
    const btnNo = document.getElementById('btn-no-treatment');
    const btnYes = document.getElementById('btn-with-treatment');
    if (!canvas) return;
    const ctx5 = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    let hasTreatment = false;
    let animFrame = null;
    let startTime = null;

    function drawRoom(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      ctx5.clearRect(0, 0, w, h);
      // ผนังห้อง
      ctx5.fillStyle = '#1e293b';
      ctx5.fillRect(0, 0, w, h);
      ctx5.strokeStyle = '#475569';
      ctx5.lineWidth = 3;
      ctx5.strokeRect(20, 15, w - 40, h - 30);

      // แผง Treatment
      if (hasTreatment) {
        ctx5.fillStyle = '#7c3aed33';
        // ผนังซ้าย
        ctx5.fillRect(22, 50, 8, 40);
        ctx5.fillRect(22, 110, 8, 40);
        // ผนังขวา
        ctx5.fillRect(w - 30, 50, 8, 40);
        ctx5.fillRect(w - 30, 110, 8, 40);
        // ผนังหลัง
        ctx5.fillRect(100, h - 28, 60, 8);
        ctx5.fillRect(w - 160, h - 28, 60, 8);

        ctx5.fillStyle = '#7c3aed';
        ctx5.font = '8px Prompt';
        ctx5.fillText('Absorber', 32, 75);
        ctx5.fillText('Diffuser', w - 85, 75);
      }

      // ลำโพง (สามเหลี่ยม)
      const spkY = 40;
      [w * 0.35, w * 0.65].forEach((sx, i) => {
        ctx5.fillStyle = '#3b82f6';
        ctx5.beginPath();
        ctx5.moveTo(sx, spkY - 10);
        ctx5.lineTo(sx - 8, spkY + 8);
        ctx5.lineTo(sx + 8, spkY + 8);
        ctx5.closePath();
        ctx5.fill();
        ctx5.fillStyle = '#94a3b8';
        ctx5.font = '7px Prompt';
        ctx5.textAlign = 'center';
        ctx5.fillText(i === 0 ? 'L' : 'R', sx, spkY + 18);
      });

      // จุดนั่งฟัง
      const listX = w / 2, listY = h * 0.6;
      ctx5.fillStyle = '#10b981';
      ctx5.beginPath();
      ctx5.arc(listX, listY, 8, 0, Math.PI * 2);
      ctx5.fill();
      ctx5.fillStyle = '#d1fae5';
      ctx5.font = '8px Prompt';
      ctx5.textAlign = 'center';
      ctx5.fillText('🧑', listX, listY + 4);
      ctx5.fillText('จุดฟัง', listX, listY + 20);

      // เส้นเสียง (Direct)
      ctx5.strokeStyle = '#3b82f644';
      ctx5.lineWidth = 1;
      [w * 0.35, w * 0.65].forEach(sx => {
        ctx5.beginPath();
        ctx5.moveTo(sx, spkY);
        ctx5.lineTo(listX, listY);
        ctx5.stroke();
      });

      // เสียงสะท้อน (Reflections)
      const reflections = hasTreatment ? 2 : 6;
      const reflColor = hasTreatment ? '#f59e0b22' : '#ef444466';
      ctx5.strokeStyle = reflColor;
      ctx5.lineWidth = 1;
      ctx5.setLineDash([4, 3]);

      const wallPoints = [
        { x: 22, y: h * 0.4 }, // ผนังซ้าย
        { x: w - 22, y: h * 0.4 }, // ผนังขวา
        { x: w * 0.3, y: h - 17 }, // ผนังหลังซ้าย
        { x: w * 0.7, y: h - 17 }, // ผนังหลังขวา
        { x: w * 0.25, y: 17 }, // ผนังหน้าซ้าย
        { x: w * 0.75, y: 17 }, // ผนังหน้าขวา
      ];

      const progress = Math.min(1, (elapsed % 3) / 2);
      for (let i = 0; i < reflections; i++) {
        const wp = wallPoints[i];
        const sx = i % 2 === 0 ? w * 0.35 : w * 0.65;

        // ลำโพง → ผนัง
        const dx1 = sx + (wp.x - sx) * progress;
        const dy1 = spkY + (wp.y - spkY) * progress;
        ctx5.beginPath();
        ctx5.moveTo(sx, spkY);
        ctx5.lineTo(dx1, dy1);
        ctx5.stroke();

        // ผนัง → จุดฟัง (ปรากฏหลังจากเดินทางถึงผนัง)
        if (progress > 0.5) {
          const p2 = (progress - 0.5) * 2;
          const dx2 = wp.x + (listX - wp.x) * p2;
          const dy2 = wp.y + (listY - wp.y) * p2;
          ctx5.beginPath();
          ctx5.moveTo(wp.x, wp.y);
          ctx5.lineTo(dx2, dy2);
          ctx5.stroke();
        }
      }
      ctx5.setLineDash([]);

      animFrame = requestAnimationFrame(drawRoom);
    }

    function startAnim() {
      if (animFrame) cancelAnimationFrame(animFrame);
      startTime = null;
      animFrame = requestAnimationFrame(drawRoom);
    }

    if (btnNo) btnNo.addEventListener('click', () => {
      hasTreatment = false;
      btnNo.style.fontWeight = '700';
      btnYes.style.fontWeight = '400';
      startAnim();
    });
    if (btnYes) btnYes.addEventListener('click', () => {
      hasTreatment = true;
      btnYes.style.fontWeight = '700';
      btnNo.style.fontWeight = '400';
      startAnim();
    });

    startAnim();

    // หยุดอนิเมชันเมื่อออกจากสไลด์ (ตรวจจับผ่าน IntersectionObserver)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && animFrame) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        } else if (entry.isIntersecting && !animFrame) {
          startAnim();
        }
      });
    });
    observer.observe(canvas);
  })();

  // ============================================================
  // 10. STEP SEQUENCER (Slide 9)
  // ============================================================
  (function initStepSequencer() {
    const grid = document.getElementById('step-sequencer-grid');
    const btnPlay = document.getElementById('btn-seq-play');
    const btnStop = document.getElementById('btn-seq-stop');
    const btnClear = document.getElementById('btn-seq-clear');
    if (!grid) return;

    const rows = ['Kick', 'Snare', 'Hi-Hat', 'Clap'];
    const rowClasses = ['kick', 'snare', 'hihat', 'clap'];
    const cols = 8;
    const pattern = Array.from({ length: 4 }, () => new Array(cols).fill(false));
    let seqInterval = null;
    let currentStep = 0;

    // สร้างกริด
    const gridDiv = document.createElement('div');
    gridDiv.className = 'widget-seq-grid';

    rows.forEach((name, rowIdx) => {
      const label = document.createElement('div');
      label.className = 'widget-seq-label';
      label.textContent = name;
      gridDiv.appendChild(label);

      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'widget-seq-cell';
        cell.dataset.row = rowIdx;
        cell.dataset.col = c;
        cell.addEventListener('click', () => {
          pattern[rowIdx][c] = !pattern[rowIdx][c];
          cell.classList.toggle('on');
          if (pattern[rowIdx][c]) cell.classList.add(rowClasses[rowIdx]);
          else cell.classList.remove(rowClasses[rowIdx]);
        });
        gridDiv.appendChild(cell);
      }
    });
    grid.appendChild(gridDiv);

    // เสียงกลอง ด้วย Web Audio
    function playDrumSound(type) {
      try {
        const ac = getAudioCtx();
        const now = ac.currentTime;
        if (type === 0) { // Kick
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain); gain.connect(ac.destination);
          osc.start(now); osc.stop(now + 0.3);
        } else if (type === 1) { // Snare
          const bufferSize = ac.sampleRate * 0.15;
          const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ac.createBufferSource();
          noise.buffer = buffer;
          const filter = ac.createBiquadFilter();
          filter.type = 'highpass'; filter.frequency.value = 1000;
          const gain = ac.createGain();
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          noise.connect(filter); filter.connect(gain); gain.connect(ac.destination);
          noise.start(now);
        } else if (type === 2) { // Hi-Hat
          const bufferSize = ac.sampleRate * 0.05;
          const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ac.createBufferSource();
          noise.buffer = buffer;
          const filter = ac.createBiquadFilter();
          filter.type = 'highpass'; filter.frequency.value = 6000;
          const gain = ac.createGain();
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          noise.connect(filter); filter.connect(gain); gain.connect(ac.destination);
          noise.start(now);
        } else { // Clap
          const bufferSize = ac.sampleRate * 0.1;
          const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ac.createBufferSource();
          noise.buffer = buffer;
          const filter = ac.createBiquadFilter();
          filter.type = 'bandpass'; filter.frequency.value = 2000; filter.Q.value = 2;
          const gain = ac.createGain();
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          noise.connect(filter); filter.connect(gain); gain.connect(ac.destination);
          noise.start(now);
        }
      } catch (e) { console.error(e); }
    }

    function playStep() {
      // ลบ highlight เก่า
      gridDiv.querySelectorAll('.playing').forEach(c => c.classList.remove('playing'));

      // เล่นเสียงของ step ปัจจุบัน
      for (let r = 0; r < 4; r++) {
        const cell = gridDiv.querySelector(`[data-row="${r}"][data-col="${currentStep}"]`);
        if (cell) cell.classList.add('playing');
        if (pattern[r][currentStep]) {
          playDrumSound(r);
        }
      }
      currentStep = (currentStep + 1) % cols;
    }

    if (btnPlay) btnPlay.addEventListener('click', () => {
      if (seqInterval) return;
      currentStep = 0;
      seqInterval = setInterval(playStep, 60000 / 120 / 2); // 120 BPM, eighth notes
    });

    if (btnStop) btnStop.addEventListener('click', () => {
      if (seqInterval) { clearInterval(seqInterval); seqInterval = null; }
      gridDiv.querySelectorAll('.playing').forEach(c => c.classList.remove('playing'));
      currentStep = 0;
    });

    if (btnClear) btnClear.addEventListener('click', () => {
      if (seqInterval) { clearInterval(seqInterval); seqInterval = null; }
      pattern.forEach(row => row.fill(false));
      gridDiv.querySelectorAll('.widget-seq-cell').forEach(c => {
        c.classList.remove('on', 'kick', 'snare', 'hihat', 'clap', 'playing');
      });
      currentStep = 0;
    });

    // ตั้ง default pattern (เบสิค)
    const defaults = [
      [0, 0, 0, 0, 1, 0, 0, 0], // kick
      [0, 0, 1, 0, 0, 0, 1, 0], // snare
      [1, 1, 1, 1, 1, 1, 1, 1], // hihat
      [0, 0, 0, 0, 0, 0, 0, 1], // clap
    ];
    defaults.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) {
          pattern[r][c] = true;
          const cell = gridDiv.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          if (cell) { cell.classList.add('on', rowClasses[r]); }
        }
      });
    });
  })();

  // ============================================================
  // 11. PLUGIN EFFECT DEMOS (Slide 10)
  // ============================================================
  (function initPluginDemo() {
    const eqCanvas = document.getElementById('eq-canvas');
    const sliderBass = document.getElementById('slider-eq-bass');
    const sliderMid = document.getElementById('slider-eq-mid');
    const sliderHigh = document.getElementById('slider-eq-high');
    const sliderRev = document.getElementById('slider-reverb');
    const btnDry = document.getElementById('btn-play-dry');
    const btnWet = document.getElementById('btn-play-wet');
    if (!eqCanvas) return;
    const ctx6 = eqCanvas.getContext('2d');

    function drawEQ() {
      const w = eqCanvas.width, h = eqCanvas.height;
      const bass = sliderBass ? parseInt(sliderBass.value) : 0;
      const mid = sliderMid ? parseInt(sliderMid.value) : 0;
      const high = sliderHigh ? parseInt(sliderHigh.value) : 0;
      const midY = h / 2;

      ctx6.clearRect(0, 0, w, h);
      ctx6.fillStyle = '#f8fafc';
      ctx6.fillRect(0, 0, w, h);

      // เส้น 0dB
      ctx6.strokeStyle = '#e2e8f0';
      ctx6.lineWidth = 1;
      ctx6.setLineDash([3, 3]);
      ctx6.beginPath(); ctx6.moveTo(0, midY); ctx6.lineTo(w, midY); ctx6.stroke();
      ctx6.setLineDash([]);

      // เส้น EQ
      ctx6.strokeStyle = '#2563eb';
      ctx6.lineWidth = 2.5;
      ctx6.beginPath();
      for (let px = 0; px < w; px++) {
        const norm = px / w;
        let db = 0;
        // Bass bell
        db += bass * Math.exp(-Math.pow((norm - 0.1) / 0.12, 2));
        // Mid bell
        db += mid * Math.exp(-Math.pow((norm - 0.45) / 0.15, 2));
        // Treble bell
        db += high * Math.exp(-Math.pow((norm - 0.85) / 0.12, 2));
        const y = midY - (db / 12) * (h * 0.4);
        if (px === 0) ctx6.moveTo(px, y);
        else ctx6.lineTo(px, y);
      }
      ctx6.stroke();

      // Fill
      ctx6.lineTo(w, midY);
      ctx6.lineTo(0, midY);
      ctx6.closePath();
      ctx6.fillStyle = '#2563eb15';
      ctx6.fill();

      // ป้าย
      ctx6.fillStyle = '#94a3b8';
      ctx6.font = '8px Prompt';
      ctx6.textAlign = 'center';
      ctx6.fillText('Bass', w * 0.1, h - 3);
      ctx6.fillText('Mid', w * 0.45, h - 3);
      ctx6.fillText('Treble', w * 0.85, h - 3);
    }

    if (sliderBass) sliderBass.addEventListener('input', drawEQ);
    if (sliderMid) sliderMid.addEventListener('input', drawEQ);
    if (sliderHigh) sliderHigh.addEventListener('input', drawEQ);

    // เล่นเสียง Dry
    function playDemoSound(applyEffects) {
      try {
        const ac = getAudioCtx();
        const now = ac.currentTime;
        const notes = [261.63, 329.63, 392, 523.25, 329.63];

        notes.forEach((freq, i) => {
          const osc = ac.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + i * 0.2);

          const gain = ac.createGain();
          gain.gain.setValueAtTime(0.1, now + i * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4);

          let lastNode = osc;

          if (applyEffects) {
            // EQ
            const bassF = ac.createBiquadFilter();
            bassF.type = 'peaking'; bassF.frequency.value = 100; bassF.Q.value = 1;
            bassF.gain.value = sliderBass ? parseInt(sliderBass.value) : 0;
            const midF = ac.createBiquadFilter();
            midF.type = 'peaking'; midF.frequency.value = 1000; midF.Q.value = 1;
            midF.gain.value = sliderMid ? parseInt(sliderMid.value) : 0;
            const highF = ac.createBiquadFilter();
            highF.type = 'peaking'; highF.frequency.value = 8000; highF.Q.value = 1;
            highF.gain.value = sliderHigh ? parseInt(sliderHigh.value) : 0;

            osc.connect(bassF); bassF.connect(midF); midF.connect(highF); highF.connect(gain);
          } else {
            osc.connect(gain);
          }
          gain.connect(ac.destination);
          osc.start(now + i * 0.2);
          osc.stop(now + i * 0.2 + 0.4);
        });
      } catch (e) { console.error(e); }
    }

    if (btnDry) btnDry.addEventListener('click', () => playDemoSound(false));
    if (btnWet) btnWet.addEventListener('click', () => playDemoSound(true));
    drawEQ();
  })();

  // ============================================================
  // 12. TROUBLESHOOT SIMULATOR (Slide 13)
  // ============================================================
  (function initTroubleshoot() {
    const select = document.getElementById('troubleshoot-select');
    const stepsDiv = document.getElementById('troubleshoot-steps');
    if (!select || !stepsDiv) return;

    const solutions = {
      'no-sound': [
        'ตรวจสอบว่าสาย USB เชื่อมต่อ Audio Interface กับคอมพิวเตอร์แน่น',
        'ตรวจ Output Volume ของ Interface ไม่ได้ปิดอยู่ (ลำโพงมี LED สว่าง)',
        'เช็คใน DAW ว่า Audio Device เลือกเป็น Audio Interface ที่ใช้',
        'ตรวจ Output Routing ว่าชี้ไปช่อง Output 1-2 ของ Interface',
        'ลองเสียบหูฟังตรงที่ Interface เพื่อตัดปัญหาลำโพง',
        'ลองรีสตาร์ท Audio Interface แล้วเปิด DAW ใหม่'
      ],
      'hum-noise': [
        'ตรวจสอบว่าสายสัญญาณเป็นชนิด Balanced (XLR/TRS) ไม่ใช่ TS',
        'เช็คว่าสายกราวด์ทุกจุดเชื่อมต่อถูกต้อง ไม่มี ground loop',
        'ย้ายสายสัญญาณออกห่างจากสายไฟ AC/อะแดปเตอร์',
        'ลองเปลี่ยนปลั๊กไฟไปช่องอื่นที่วงจรเดียวกัน',
        'ใช้ DI Box เพื่อตัด ground loop จากเครื่องดนตรี',
        'เช็ค Phantom Power (+48V) ไม่ได้เปิดกับไมค์ที่ไม่ต้องการ'
      ],
      'clipping': [
        'ลดระดับ Gain/Input บน Audio Interface ลง (ไฟ LED ไม่ควรเป็นสีแดง)',
        'ตรวจค่า Fader ใน DAW ว่าไม่เกิน 0 dBFS',
        'ใช้ Compressor/Limiter plugin บน Master Bus',
        'ลดระดับเสียงที่แหล่งกำเนิด (เช่น ถอยห่างจากไมค์)',
        'ตรวจ Bit Depth: ใช้ 24-bit หรือ 32-bit Float เพื่อ headroom มากขึ้น',
        'ลองเปิด Gain Staging ใหม่: ตั้งทุกจุดให้อยู่ประมาณ -18 ถึง -12 dBFS'
      ],
      'latency': [
        'ลดค่า Buffer Size ใน DAW (เช่น จาก 512 เป็น 128 samples)',
        'ตรวจว่าใช้ ASIO driver (Windows) หรือ Core Audio (Mac)',
        'ปิด Plugin ที่มี Latency สูง (Linear Phase EQ, Look-ahead Compressor)',
        'ลด Sample Rate ชั่วคราวขณะอัดเสียง (เช่น ใช้ 44.1kHz แทน 96kHz)',
        'เปิด Direct Monitoring บน Audio Interface',
        'ลองเปิด Low Latency Mode / Constrain Delay Compensation ใน DAW'
      ]
    };

    function showSolution(problem) {
      const steps = solutions[problem] || [];
      stepsDiv.innerHTML = '';
      steps.forEach((step, i) => {
        const div = document.createElement('div');
        div.className = 'widget-ts-step';
        div.style.animationDelay = (i * 0.1) + 's';
        div.innerHTML = `<span class="widget-ts-num">${i + 1}</span><span class="widget-ts-text">${step}</span>`;
        stepsDiv.appendChild(div);
      });
    }

    select.addEventListener('change', () => showSolution(select.value));
    showSolution('no-sound');
  })();

  // ============================================================
  // 13. FILE SIZE CALCULATOR (Slide 14)
  // ============================================================
  (function initFileSizeCalc() {
    const calcSR = document.getElementById('calc-samplerate');
    const calcBD = document.getElementById('calc-bitdepth');
    const calcDur = document.getElementById('calc-duration');
    const calcCh = document.getElementById('calc-channels');
    const calcResult = document.getElementById('calc-result');
    if (!calcSR || !calcResult) return;

    function calculate() {
      const sr = parseInt(calcSR.value);
      const bd = parseInt(calcBD.value);
      const dur = parseInt(calcDur.value) || 0;
      const ch = parseInt(calcCh.value);
      const bytes = sr * (bd / 8) * dur * ch;
      const mb = bytes / (1024 * 1024);
      calcResult.textContent = `ขนาดไฟล์: ${mb.toFixed(1)} MB`;
    }

    [calcSR, calcBD, calcDur, calcCh].forEach(el => {
      if (el) el.addEventListener('input', calculate);
      if (el) el.addEventListener('change', calculate);
    });
    calculate();
  })();

  // ============================================================
  // 14. WELCOME ANIMATION (Slide 0)
  // ============================================================
  (function initWelcomeAnim() {
    // เพิ่มอนิเมชัน staggered fadeInUp ให้ timeline steps
    const steps = document.querySelectorAll('.timeline-step');
    steps.forEach((step, i) => {
      step.classList.add('widget-animate-in');
      step.style.animationDelay = (i * 0.15) + 's';
    });
  })();

  // ============================================================
  // 15. MINI KNOWLEDGE CHECKS
  // ============================================================
  (function initMiniQuiz() {
    // เพิ่ม mini quiz ท้ายสไลด์ฟิสิกส์เสียง (slide-1) และเสียงดิจิทัล (slide-2)
    const quizData = [
      {
        slideId: 'slide-1',
        question: '❓ คลื่นเสียงความถี่ 440 Hz เป็นระดับเสียงโน้ตอะไร?',
        options: ['โน้ต C (โด)', 'โน้ต A (ลา)', 'โน้ต G (ซอล)'],
        correct: 1,
        explanation: '440 Hz เป็นความถี่มาตรฐานของโน้ต A4 (ลา) ที่ใช้ตั้งเสียงเครื่องดนตรี'
      },
      {
        slideId: 'slide-2',
        question: '❓ ถ้า Sample Rate 44,100 Hz สามารถบันทึกเสียงความถี่สูงสุดเท่าไร?',
        options: ['44,100 Hz', '22,050 Hz', '88,200 Hz'],
        correct: 1,
        explanation: 'ตามทฤษฎี Nyquist ต้องสุ่มอย่างน้อย 2 เท่า ดังนั้น 44,100 / 2 = 22,050 Hz'
      }
    ];

    quizData.forEach(qd => {
      const slide = document.getElementById(qd.slideId);
      if (!slide) return;

      const content = slide.querySelector('.theory-view') || slide.querySelector('.slide-content');
      if (!content) return;

      const quizDiv = document.createElement('div');
      quizDiv.className = 'widget-mini-quiz';
      quizDiv.innerHTML = `<h4>💡 ทดสอบความเข้าใจ</h4><div class="widget-mq-question">${qd.question}</div>`;

      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'widget-mq-options';
      
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'widget-mq-feedback';

      qd.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'widget-mq-opt';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          optionsDiv.querySelectorAll('.widget-mq-opt').forEach(b => {
            b.style.pointerEvents = 'none';
          });
          if (i === qd.correct) {
            btn.classList.add('correct');
            feedbackDiv.style.display = 'block';
            feedbackDiv.style.background = '#d1fae5';
            feedbackDiv.style.color = '#065f46';
            feedbackDiv.textContent = '✅ ถูกต้อง! ' + qd.explanation;
          } else {
            btn.classList.add('wrong');
            optionsDiv.children[qd.correct].classList.add('correct');
            feedbackDiv.style.display = 'block';
            feedbackDiv.style.background = '#fee2e2';
            feedbackDiv.style.color = '#991b1b';
            feedbackDiv.textContent = '❌ ไม่ถูก — ' + qd.explanation;
          }
        });
        optionsDiv.appendChild(btn);
      });

      quizDiv.appendChild(optionsDiv);
      quizDiv.appendChild(feedbackDiv);
      content.appendChild(quizDiv);
    });
  })();

  // ============================================================
  // 16. THEORY VS WIDGET VIEW TOGGLING
  // ============================================================
  (function initViewToggles() {
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const parent = btn.closest('.slide-content');
        if (!parent) return;
        const view = btn.getAttribute('data-view');
        
        // Toggle active button
        parent.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Toggle view visibility
        const theoryView = parent.querySelector('.theory-view');
        const widgetView = parent.querySelector('.widget-view');
        
        if (view === 'theory') {
          if (theoryView) theoryView.classList.remove('hidden');
          if (widgetView) widgetView.classList.add('hidden');
        } else {
          if (theoryView) theoryView.classList.add('hidden');
          if (widgetView) widgetView.classList.remove('hidden');
        }
      });
    });
  })();

});
