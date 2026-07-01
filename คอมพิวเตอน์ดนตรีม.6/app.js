/**
 * ==========================================================================
 * APPLICATION LOGIC - COMPUTER MUSIC PRESENTATION & LEARNING HUB (ม.6)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  let currentSlide = 0;
  const totalSlides = 18;
  let isFullscreen = false;
  
  // Quiz State
  let quizCurrentQuestion = 0;
  let quizScore = 0;
  let quizAnswers = []; // เก็บตัวเลือกที่นักเรียนเลือก
  let quizActive = false;

  // Signal Flow Anim State
  let animationFrameId = null;
  let flowPaths = []; // เก็บ path elements และ dot elements สำหรับอนิเมชัน
  let activeScenario = 'vocal'; // 'vocal' หรือ 'midi'
  let phantomPowerOn = false; // สถานะไฟเลี้ยงไมค์ Condenser

  // Audio Demo State for Slide 7
  let acousticAudioCtx = null;
  let midiAudioCtx = null;
  let acousticTimer = null;
  let midiTimer = null;

  // ==========================================================================
  // DOM ELEMENTS
  // ==========================================================================
  const slideItems = document.querySelectorAll('.slide-item');
  const navDots = document.querySelectorAll('.nav-dot');
  const slideJumpSelect = document.getElementById('slide-jump');
  const currentSlideNumSpan = document.getElementById('current-slide-num');
  
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnPresentMode = document.getElementById('btn-present-mode');
  const btnReviewMode = document.getElementById('btn-review-mode');
  
  const presentationContainer = document.getElementById('presentation-container');
  const reviewContainer = document.getElementById('review-container');

  // Canvas
  const samplingCanvas = document.getElementById('sampling-canvas');
  const sliderSampleRate = document.getElementById('slider-samplerate');
  const sliderBitDepth = document.getElementById('slider-bitdepth');
  const valSampleRate = document.getElementById('val-samplerate');
  const valBitDepth = document.getElementById('val-bitdepth');

  // Signal Flow Simulator DOM
  const btnScenarioVocal = document.getElementById('scenario-vocal');
  const btnScenarioGuitar = document.getElementById('scenario-guitar');
  const btnScenarioSynth = document.getElementById('scenario-synth');
  const btnScenarioMidi = document.getElementById('scenario-midi');
  const btnScenarioLiveBand = document.getElementById('scenario-live-band');
  const statusTitle = document.getElementById('status-title');
  const statusDescription = document.getElementById('status-description');
  const nodeMic = document.getElementById('node-mic');
  const nodeGuitar = document.getElementById('node-guitar');
  const nodeSynth = document.getElementById('node-synth');
  const nodeDrums = document.getElementById('node-drums');
  const nodeMidi = document.getElementById('node-midi');
  const nodeInterface = document.getElementById('node-interface');
  const nodeComputer = document.getElementById('node-computer');
  const nodeSpeakers = document.getElementById('node-speakers');
  const nodeHeadphones = document.getElementById('node-headphones');
  const nodeDibox = document.getElementById('node-dibox');

  // ==========================================================================
  // SLIDE NAVIGATION LOGIC
  // ==========================================================================
  
  function showSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    
    // หยุดอนิเมชัน Signal Flow ไว้ก่อนชั่วคราวเพื่อประหยัดทรัพยากร
    stopSignalFlowAnimation();
    stopStudioFlowAnimation();
    
    // หยุดการสาธิตเสียงในสไลด์ที่ 7 หากมีการเล่นอยู่
    if (typeof stopAcousticDemo === 'function') {
      const btnAcoustic = document.getElementById('btn-play-acoustic');
      if (btnAcoustic && btnAcoustic.classList.contains('playing')) {
        stopAcousticDemo(btnAcoustic);
      }
    }
    if (typeof stopMidiDemo === 'function') {
      const btnMidi = document.getElementById('btn-play-midi');
      if (btnMidi && btnMidi.classList.contains('playing')) {
        stopMidiDemo(btnMidi);
      }
    }
    
    // ซ่อนสไลด์ทั้งหมดและเอา class active ออก
    slideItems.forEach(slide => slide.classList.remove('active'));
    navDots.forEach(dot => dot.classList.remove('active'));
    
    // แสดงสไลด์เป้าหมาย
    slideItems[index].classList.add('active');
    currentSlide = index;
    
    // อัปเดตเมนูข้างและตัวควบคุมอื่นๆ
    if (navDots[index]) navDots[index].classList.add('active');
    slideJumpSelect.value = index;
    currentSlideNumSpan.textContent = index + 1;
    
    // การรันฟังก์ชันพิเศษตามสไลด์ที่แสดงผล
    if (index === 2) {
      // สไลด์ที่ 3: ทฤษฎีเสียงดิจิทัลและการแซมพลิง -> เริ่มรันแอนิเมชันคลื่น
      initSamplingCanvas();
    } else if (index === 11) {
      // สไลด์ที่ 12: แผนผังเส้นทางสัญญาณเสียงในสตูดิโอ (Studio Signal Flow) -> เริ่มอนิเมชัน SVG
      if (typeof startStudioFlowAnimation === 'function') startStudioFlowAnimation();
    } else if (index === 12) {
      // สไลด์ที่ 13: ระบบจำลองสายสัญญาณ (Interactive Simulator) -> เริ่มแอนิเมชันการต่อสายสัญญาณ
      startSignalFlowAnimation();
    }
    
    // เลื่อน scroll ของตัวสไลด์กลับไปด้านบนสุด (กรณีเนื้อหายาวจนเลื่อน)
    slideItems[index].scrollTop = 0;
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      showSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      showSlide(currentSlide - 1);
    }
  }

  // Event Listeners สำหรับปุ่มควบคุม
  btnPrev.addEventListener('click', prevSlide);
  btnNext.addEventListener('click', nextSlide);
  
  slideJumpSelect.addEventListener('change', (e) => {
    showSlide(parseInt(e.target.value));
  });

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      showSlide(parseInt(dot.getAttribute('data-slide')));
    });
  });

  // แป้นพิมพ์ลัดคีย์บอร์ด
  document.addEventListener('keydown', (e) => {
    // ตรวจจับเฉพาะกรณีที่ไม่อยู่ในโหมดทำควิซเพื่อเลี่ยงปุ่มลูกศรชนกัน
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
      return;
    }
    
    if (presentationContainer.classList.contains('hidden')) return; // ข้ามถ้ารันในโหมดทบทวน

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      nextSlide();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prevSlide();
      e.preventDefault();
    }
  });

  // Fullscreen Handler
  btnFullscreen.addEventListener('click', () => {
    if (!isFullscreen) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
      isFullscreen = true;
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
      isFullscreen = false;
    }
  });

  // ==========================================================================
  // VIEW MODE TOGGLE (PRESENTATION VS REVIEW SHEET)
  // ==========================================================================
  
  btnPresentMode.addEventListener('click', () => {
    btnPresentMode.classList.add('active');
    btnReviewMode.classList.remove('active');
    presentationContainer.classList.remove('hidden');
    reviewContainer.classList.add('hidden');
    
    // อัปเดตสไลด์ปัจจุบันอีกครั้ง
    showSlide(currentSlide);
  });

  btnReviewMode.addEventListener('click', () => {
    btnReviewMode.classList.add('active');
    btnPresentMode.classList.remove('active');
    reviewContainer.classList.remove('hidden');
    presentationContainer.classList.add('hidden');
    
    // หยุดอนิเมชัน Signal Flow เพื่อไม่ให้เบราว์เซอร์ช้า
    stopSignalFlowAnimation();
  });


  // ==========================================================================
  // WIDGET 1: SAMPLING & QUANTIZATION SIMULATOR (SLIDE 2)
  // ==========================================================================
  
  let samplingCanvasInitialized = false;
  let drawSamplingCanvas = null;

  function initSamplingCanvas() {
    if (!samplingCanvas) return;
    
    if (samplingCanvasInitialized) {
      if (drawSamplingCanvas) drawSamplingCanvas();
      return;
    }
    
    const ctx = samplingCanvas.getContext('2d');
    
    function draw() {
      const width = samplingCanvas.width;
      const height = samplingCanvas.height;
      const centerY = height / 2;
      const amplitude = height * 0.4;
      
      const sampleRate = parseInt(sliderSampleRate.value);
      const bitDepth = parseInt(sliderBitDepth.value);
      
      // อัปเดตข้อความแสดงผลค่า
      valSampleRate.textContent = sampleRate;
      valBitDepth.textContent = bitDepth;
      
      // เคลียร์ Canvas
      ctx.clearRect(0, 0, width, height);
      
      // 1. วาดเส้นตารางพิกัด (Grid Lines)
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      
      // เส้นแนวนอนแสดงความละเอียดของ Bit Depth (Quantization Levels)
      const quantLevels = Math.pow(2, bitDepth);
      for (let i = 0; i <= quantLevels; i++) {
        const y = (i / quantLevels) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // 2. วาดเส้นคลื่น Analog ดั้งเดิม (Smooth Sine Wave)
      ctx.strokeStyle = '#9ca3af'; // สีเทาอ่อน
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); // เส้นประ
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const angle = (x / width) * Math.PI * 4; // วาด 2 รอบคลื่น
        const y = centerY + Math.sin(angle) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]); // รีเซ็ตเส้นประกลับคืน
      
      // 3. คำนวณและวาดแท่งดิจิทัลจากการสุ่มแซมเปิล (Sampling Bars & Quantized Wave)
      const colWidth = width / sampleRate;
      
      ctx.fillStyle = 'rgba(37, 99, 235, 0.15)'; // สีน้ำเงินใสสำหรับแท่งแซมเปิล
      ctx.strokeStyle = '#2563eb'; // สีน้ำเงินเข้มสำหรับเส้นต่อสัญญาณดิจิทัล
      ctx.lineWidth = 2.5;
      
      const digitalPoints = [];
      
      for (let i = 0; i < sampleRate; i++) {
        // หาจุดกึ่งกลางของแต่ละแท่งแซมเปิล
        const xSample = (i + 0.5) * colWidth;
        const angle = (xSample / width) * Math.PI * 4;
        const analogY = centerY + Math.sin(angle) * amplitude;
        
        // Quantization: ปรับย่านค่า Y ให้อยู่ในตารางระดับของ Bit Depth
        const normalizedY = (analogY / height); // 0.0 ถึง 1.0
        const quantizedLevel = Math.round(normalizedY * quantLevels);
        const digitalY = (quantizedLevel / quantLevels) * height;
        
        digitalPoints.push({ xStart: i * colWidth, xEnd: (i + 1) * colWidth, y: digitalY });
        
        // วาดแท่งแซมเปิลพิกัดแนวดิ่ง
        ctx.fillRect(i * colWidth + 1, digitalY, colWidth - 2, height - digitalY);
        
        // วาดจุดแซมเปิลที่เก็บได้จริง
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(xSample, digitalY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
      }
      
      // วาดขั้นบันไดดิจิทัล (Digital Reconstruction Wave)
      ctx.beginPath();
      for (let i = 0; i < digitalPoints.length; i++) {
        const pt = digitalPoints[i];
        if (i === 0) {
          ctx.moveTo(pt.xStart, pt.y);
          ctx.lineTo(pt.xEnd, pt.y);
        } else {
          // วาดเส้นแนวตั้งขึ้นบันได แล้วค่อยลากเส้นแนวนอนต่อ
          ctx.lineTo(pt.xStart, pt.y);
          ctx.lineTo(pt.xEnd, pt.y);
        }
      }
      ctx.stroke();
    }
    
    // ตั้ง Event Listeners สำหรับสไลเดอร์ตอบรับ
    sliderSampleRate.addEventListener('input', draw);
    sliderBitDepth.addEventListener('input', draw);
    
    // เก็บฟังก์ชันวาดไว้และสั่งรันครั้งแรก
    drawSamplingCanvas = draw;
    draw();
    samplingCanvasInitialized = true;
  }

  // ==========================================================================
  // WIDGET 2: INTERACTIVE SIGNAL FLOW SIMULATOR (SLIDE 7)
  // ==========================================================================

  // ฟังก์ชันสลับ Scenario
  function setScenario(scenario) {
    activeScenario = scenario;
    phantomPowerOn = false; // รีเซ็ตสถานะไฟเลี้ยง
    
    // ลบสถานะแอกทีฟของปุ่มทั้งหมด
    btnScenarioVocal.classList.remove('active');
    btnScenarioGuitar.classList.remove('active');
    btnScenarioSynth.classList.remove('active');
    btnScenarioMidi.classList.remove('active');
    btnScenarioLiveBand.classList.remove('active');
    
    // ลบสถานะแอกทีฟของ Node ทั้งหมดบน SVG
    document.querySelectorAll('.svg-node').forEach(node => {
      node.classList.remove('active');
    });
    
    // ลบสถานะสายไฟแอกทีฟทั้งหมด
    document.querySelectorAll('#svg-flow-diagram path').forEach(path => {
      path.classList.remove('active', 'active-midi', 'active-analog', 'active-output', 'active-digital', 'active-instrument', 'active-drums');
    });

    // รีเซ็ตการซ่อน/แสดงของ Node และส่วนขยายพิเศษ
    if (nodeDibox) nodeDibox.style.display = 'none';
    
    const hizLed = document.getElementById('interface-hiz-led');
    const hizTxt = document.getElementById('interface-hiz-text');
    if (hizLed) hizLed.style.display = 'none';
    if (hizTxt) hizTxt.style.display = 'none';
    
    const led = document.getElementById('mic-phantom-led');
    const txt = document.getElementById('mic-phantom-text');
    if (led) led.style.fill = '#ef4444'; // แดงเริ่มต้น
    if (txt) {
      txt.textContent = '+48V OFF';
      txt.style.fill = '#ef4444';
    }

    const hpLabel = document.getElementById('headphones-label');
    const hpExtra = document.getElementById('headphones-extra');
    if (hpLabel) hpLabel.textContent = "Headphones";
    if (hpExtra) hpExtra.style.display = 'none';

    if (scenario === 'vocal') {
      btnScenarioVocal.classList.add('active');
      statusTitle.textContent = "ขณะนี้: อัดเสียงร้อง";
      statusDescription.textContent = "เสียงอนาลอกจากไมโครโฟนคอนเดนเซอร์ วิ่งเข้าสายสัญญาณ XLR (Balanced) มุ่งหน้าสู่อินเตอร์เฟสเสียง ซึ่งต้องเปิดสวิตช์ +48V Phantom Power เพื่อเลี้ยงวงจรตัวเก็บประจุของไมค์ จากนั้นสัญญาณจะโดนแปลงเป็นดิจิทัลส่งเข้าโปรแกรม DAW ในคอมพิวเตอร์";
      
      nodeMic.classList.add('active');
      nodeInterface.classList.add('active');
      nodeComputer.classList.add('active');
      nodeSpeakers.classList.add('active');
      nodeHeadphones.classList.add('active');

      document.getElementById('path-mic-to-interface').classList.add('active-analog');
      document.getElementById('path-interface-to-computer').classList.add('active-digital');
      document.getElementById('path-computer-to-interface').classList.add('active-digital');
      document.getElementById('path-interface-to-monitors').classList.add('active-output');
      document.getElementById('path-interface-to-headphones').classList.add('active-output');

    } else if (scenario === 'guitar') {
      btnScenarioGuitar.classList.add('active');
      statusTitle.textContent = "ขณะนี้: อัดกีตาร์ไฟฟ้า (Hi-Z)";
      statusDescription.textContent = "สัญญาณจากปิ๊กอัพกีตาร์ไฟฟ้ามีความต้านทานสูง (High Impedance) เชื่อมต่อผ่านสายสัญญาณ Instrument (TS Unbalanced) เข้าช่องสัญญาณที่ปรับสถานะเป็น Hi-Z/Inst บนอินเตอร์เฟส เพื่อปรับปรุงคุณภาพสัญญาณให้ตรงกัน ไม่สูญเสียความถี่และไดนามิก";
      
      nodeGuitar.classList.add('active');
      nodeInterface.classList.add('active');
      nodeComputer.classList.add('active');
      nodeSpeakers.classList.add('active');
      nodeHeadphones.classList.add('active');

      if (hizLed) {
        hizLed.style.display = 'block';
        hizLed.style.fill = '#10b981'; // เปิดไฟเขียว Hi-Z
      }
      if (hizTxt) {
        hizTxt.style.display = 'block';
        hizTxt.style.fill = '#065f46';
      }

      document.getElementById('path-guitar-to-interface').classList.add('active-instrument');
      document.getElementById('path-interface-to-computer').classList.add('active-digital');
      document.getElementById('path-computer-to-interface').classList.add('active-digital');
      document.getElementById('path-interface-to-monitors').classList.add('active-output');
      document.getElementById('path-interface-to-headphones').classList.add('active-output');

    } else if (scenario === 'synth') {
      btnScenarioSynth.classList.add('active');
      statusTitle.textContent = "ขณะนี้: อัดคีย์บอร์ดสเตอริโอ (Line Level)";
      statusDescription.textContent = "สัญญาณช่อง Output ของคีย์บอร์ดซินธิไซเซอร์เป็นระดับสัญญาณ Line Level กำลังไฟปกติ เชื่อมต่อด้วยสายสัญญาณ TS/TRS แบบคู่สัญญาณซ้าย/ขวา (L/R) สองเส้นเข้าอินพุตแชนเนล 1 และ 2 ของอินเตอร์เฟสเพื่อมิติเสียงสเตอริโอสมจริง";
      
      nodeSynth.classList.add('active');
      nodeInterface.classList.add('active');
      nodeComputer.classList.add('active');
      nodeSpeakers.classList.add('active');
      nodeHeadphones.classList.add('active');

      document.getElementById('path-synth-to-interface-l').classList.add('active-analog');
      document.getElementById('path-synth-to-interface-r').classList.add('active-analog');
      document.getElementById('path-interface-to-computer').classList.add('active-digital');
      document.getElementById('path-computer-to-interface').classList.add('active-digital');
      document.getElementById('path-interface-to-monitors').classList.add('active-output');
      document.getElementById('path-interface-to-headphones').classList.add('active-output');

    } else if (scenario === 'midi') {
      btnScenarioMidi.classList.add('active');
      statusTitle.textContent = "ขณะนี้: เล่นคีย์บอร์ด MIDI";
      statusDescription.textContent = "คีย์บอร์ด MIDI ไม่ส่งสัญญาณเสียงคลื่นไฟฟ้า แต่ส่งรหัสข้อมูลตัวโน้ตดิจิทัล (MIDI Data เช่น Note Number, Velocity) ผ่านสาย USB ตรงเข้าคอมพิวเตอร์เพื่อควบคุมซอฟต์แวร์เครื่องดนตรีจำลอง VSTi ใน DAW แปลงเสียงขับย้อนออกไปผ่านอินเตอร์เฟส";
      
      nodeMidi.classList.add('active');
      nodeComputer.classList.add('active');
      nodeInterface.classList.add('active');
      nodeSpeakers.classList.add('active');
      nodeHeadphones.classList.add('active');

      document.getElementById('path-midi-to-computer').classList.add('active-midi');
      document.getElementById('path-computer-to-interface').classList.add('active-digital');
      document.getElementById('path-interface-to-monitors').classList.add('active-output');
      document.getElementById('path-interface-to-headphones').classList.add('active-output');

    } else if (scenario === 'live-band') {
      btnScenarioLiveBand.classList.add('active');
      statusTitle.textContent = "ขณะนี้: อัดเสียงวงดนตรีสดพร้อมกัน (Spectacular!)";
      statusDescription.textContent = "การทำงานระดับโปรแกรมมิ่ง: ไมค์ร้องต่อตรงเข้าอินพุต, กีตาร์ต่อสาย TS เข้า DI Box แปลงสัญญาณเป็น Balanced XLR ป้องกันคลื่นรบกวน, คีย์บอร์ดซินธ์ต่อ Line L/R และไมค์กลอง 2 แชนเนล วิ่งรวมกันเข้าอินเตอร์เฟสแปลงข้อมูลส่งผ่านสาย USB สตรีมแบบ Multitrack ไปอัดบันทึกแยกแทร็กอิสระในคอมพิวเตอร์";
      
      nodeMic.classList.add('active');
      nodeGuitar.classList.add('active');
      nodeSynth.classList.add('active');
      nodeDrums.classList.add('active');
      if (nodeDibox) nodeDibox.style.display = 'block';
      nodeInterface.classList.add('active');
      nodeComputer.classList.add('active');
      nodeSpeakers.classList.add('active');
      nodeHeadphones.classList.add('active');

      if (hpLabel) hpLabel.textContent = "Headphone Amp";
      if (hpExtra) hpExtra.style.display = 'block';

      document.getElementById('path-mic-to-interface').classList.add('active-analog');
      document.getElementById('path-guitar-to-dibox').classList.add('active-instrument');
      document.getElementById('path-dibox-to-interface').classList.add('active-analog');
      document.getElementById('path-synth-to-interface-l').classList.add('active-analog');
      document.getElementById('path-synth-to-interface-r').classList.add('active-analog');
      document.getElementById('path-drums-to-interface').classList.add('active-drums');
      document.getElementById('path-interface-to-computer').classList.add('active-digital');
      document.getElementById('path-computer-to-interface').classList.add('active-digital');
      document.getElementById('path-interface-to-monitors').classList.add('active-output');
      document.getElementById('path-interface-to-headphones').classList.add('active-output');
    }
  }

  // จัดตั้งระบบคลิกเปลี่ยน Scenario
  btnScenarioVocal.addEventListener('click', () => setScenario('vocal'));
  btnScenarioGuitar.addEventListener('click', () => setScenario('guitar'));
  btnScenarioSynth.addEventListener('click', () => setScenario('synth'));
  btnScenarioMidi.addEventListener('click', () => setScenario('midi'));
  btnScenarioLiveBand.addEventListener('click', () => setScenario('live-band'));

  // ฟังก์ชันพิเศษ: กดสลับไฟเลี้ยงไมค์ที่ตัวไอคอนไมโครโฟน
  nodeMic.addEventListener('click', () => {
    if (activeScenario !== 'vocal') return;
    
    phantomPowerOn = !phantomPowerOn;
    const led = document.getElementById('mic-phantom-led');
    const txt = document.getElementById('mic-phantom-text');
    
    if (phantomPowerOn) {
      led.style.fill = '#10b981'; // เขียว
      txt.textContent = '+48V ON';
      txt.style.fill = '#065f46';
      statusTitle.textContent = "ขณะนี้: อัดเสียงร้อง (+48V เปิดใช้งานแล้ว)";
      statusDescription.textContent = "🔊 ไมค์ Condenser ได้รับกระแสไฟเลี้ยง +48V สมบูรณ์ สามารถเก็บกระแสไฟฟ้าประจุเสียงได้อย่างละเอียดและมีความไวเสียงระดับสูงป้อนเข้าอินเตอร์เฟส";
    } else {
      led.style.fill = '#ef4444'; // แดง
      txt.textContent = '+48V OFF';
      txt.style.fill = '#ef4444';
      statusTitle.textContent = "เตือน: อัดเสียงร้อง (ปิดไฟ +48V)";
      statusDescription.textContent = "⚠️ หากท่านใช้ไมโครโฟนชนิด Condenser สัญญาณจะเงียบสนิท ไม่มีเสียงเข้า เนื่องจากไม่มีกระแสไฟจ่ายไปเลี้ยงตัวเก็บประจุ แนะนำให้ครูกดเปิดสวิตช์ไฟเลี้ยงบน Audio Interface!";
    }
  });

  // อนิมชันอนุภาคแสง (Signal Particles) ไหลผ่านเส้นสัญญาณ
  function startSignalFlowAnimation() {
    // กำหนดค่าตั้งต้น Scenario
    setScenario(activeScenario);
    
    const svg = document.getElementById('svg-flow-diagram');
    if (!svg) return;

    // ค้นหาเส้น path ต่างๆ
    const paths = {
      mic_to_interface: document.getElementById('path-mic-to-interface'),
      guitar_to_interface: document.getElementById('path-guitar-to-interface'),
      guitar_to_dibox: document.getElementById('path-guitar-to-dibox'),
      dibox_to_interface: document.getElementById('path-dibox-to-interface'),
      synth_l: document.getElementById('path-synth-to-interface-l'),
      synth_r: document.getElementById('path-synth-to-interface-r'),
      drums: document.getElementById('path-drums-to-interface'),
      midi_in: document.getElementById('path-midi-to-computer'),
      interface_to_computer: document.getElementById('path-interface-to-computer'),
      computer_to_interface: document.getElementById('path-computer-to-interface'),
      monitors: document.getElementById('path-interface-to-monitors'),
      headphones: document.getElementById('path-interface-to-headphones')
    };

    // อานุภาคแสง
    const dots = {
      mic: document.getElementById('flow-dot-mic'),
      guitar: document.getElementById('flow-dot-guitar'),
      guitar_to_dibox: document.getElementById('flow-dot-guitar-to-dibox'),
      dibox_to_interface: document.getElementById('flow-dot-dibox-to-interface'),
      synth_l: document.getElementById('flow-dot-synth-l'),
      synth_r: document.getElementById('flow-dot-synth-r'),
      drums: document.getElementById('flow-dot-drums'),
      midi: document.getElementById('flow-dot-midi'),
      usb_send: document.getElementById('flow-dot-usb-send'),
      usb_return: document.getElementById('flow-dot-usb-return'),
      speakers: document.getElementById('flow-dot-speakers'),
      headphones: document.getElementById('flow-dot-headphones')
    };

    // ซ่อนจุดทั้งหมดก่อน
    for (let key in dots) {
      if (dots[key]) dots[key].style.display = 'none';
    }

    let startTime = null;

    function animStep(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (activeScenario === 'vocal') {
        // 1. ไมค์ -> อินเตอร์เฟส (Analog XLR, น้ำเงิน)
        animateDot(dots.mic, paths.mic_to_interface, elapsed, 2000, 0, '#2563eb');
        
        // 2. อินเตอร์เฟส -> คอม (Digital USB, ม่วง)
        animateDot(dots.usb_send, paths.interface_to_computer, elapsed, 2000, 500, '#8b5cf6');
        
        // 3. คอม -> อินเตอร์เฟส (Digital USB Return, ม่วง)
        animateDot(dots.usb_return, paths.computer_to_interface, elapsed, 2000, 1000, '#8b5cf6');
        
        // 4. อินเตอร์เฟส -> ลำโพง/หูฟัง (Analog Output, ชมพู)
        animateDot(dots.speakers, paths.monitors, elapsed, 1500, 1500, '#db2777');
        animateDot(dots.headphones, paths.headphones, elapsed, 1500, 1500, '#db2777');
        
      } else if (activeScenario === 'guitar') {
        // 1. กีตาร์ -> อินเตอร์เฟส (Hi-Z Instrument, เขียว)
        animateDot(dots.guitar, paths.guitar_to_interface, elapsed, 2000, 0, '#10b981');
        
        // 2. อินเตอร์เฟส -> คอม (Digital USB, ม่วง)
        animateDot(dots.usb_send, paths.interface_to_computer, elapsed, 2000, 500, '#8b5cf6');
        
        // 3. คอม -> อินเตอร์เฟส (Digital USB Return, ม่วง)
        animateDot(dots.usb_return, paths.computer_to_interface, elapsed, 2000, 1000, '#8b5cf6');
        
        // 4. อินเตอร์เฟส -> ลำโพง/หูฟัง (Analog Output, ชมพู)
        animateDot(dots.speakers, paths.monitors, elapsed, 1500, 1500, '#db2777');
        animateDot(dots.headphones, paths.headphones, elapsed, 1500, 1500, '#db2777');
        
      } else if (activeScenario === 'synth') {
        // 1. ซินธ์ -> อินเตอร์เฟส (Line Level Stereo L/R, น้ำเงิน/ม่วง)
        animateDot(dots.synth_l, paths.synth_l, elapsed, 2000, 0, '#6366f1');
        animateDot(dots.synth_r, paths.synth_r, elapsed, 2000, 0, '#4f46e5');
        
        // 2. อินเตอร์เฟส -> คอม (Digital USB, ม่วง)
        animateDot(dots.usb_send, paths.interface_to_computer, elapsed, 2000, 500, '#8b5cf6');
        
        // 3. คอม -> อินเตอร์เฟส (Digital USB Return, ม่วง)
        animateDot(dots.usb_return, paths.computer_to_interface, elapsed, 2000, 1000, '#8b5cf6');
        
        // 4. อินเตอร์เฟส -> ลำโพง/หูฟัง (Analog Output, ชมพู)
        animateDot(dots.speakers, paths.monitors, elapsed, 1500, 1500, '#db2777');
        animateDot(dots.headphones, paths.headphones, elapsed, 1500, 1500, '#db2777');
        
      } else if (activeScenario === 'midi') {
        // 1. คีย์บอร์ด MIDI -> คอม (MIDI Data USB, ส้ม)
        animateDot(dots.midi, paths.midi_in, elapsed, 2000, 0, '#f59e0b');
        
        // 2. คอม -> อินเตอร์เฟส (Digital USB Return, ม่วง)
        animateDot(dots.usb_return, paths.computer_to_interface, elapsed, 2000, 700, '#8b5cf6');
        
        // 3. อินเตอร์เฟส -> ลำโพง/หูฟัง (Analog Output, ชมพู)
        animateDot(dots.speakers, paths.monitors, elapsed, 1500, 1200, '#db2777');
        animateDot(dots.headphones, paths.headphones, elapsed, 1500, 1200, '#db2777');
        
      } else if (activeScenario === 'live-band') {
        // อัดเสียงวงดนตรีสดพร้อมกันทั้งหมด (Spectacular!)
        // 1. ทุกต้นสัญญาณไหลเข้าอินเตอร์เฟสพร้อมกัน
        animateDot(dots.mic, paths.mic_to_interface, elapsed, 2000, 0, '#2563eb');
        
        // กีตาร์ผ่าน DI Box
        animateDot(dots.guitar_to_dibox, paths.guitar_to_dibox, elapsed, 1000, 0, '#10b981');
        animateDot(dots.dibox_to_interface, paths.dibox_to_interface, elapsed, 1000, 1000, '#059669');
        
        // ซินธิไซเซอร์ สเตอริโอ L/R
        animateDot(dots.synth_l, paths.synth_l, elapsed, 2000, 0, '#6366f1');
        animateDot(dots.synth_r, paths.synth_r, elapsed, 2000, 0, '#4f46e5');
        
        // ไมค์กลองชุด
        animateDot(dots.drums, paths.drums, elapsed, 2000, 0, '#ec4899');
        
        // 2. สัญญาณสตรีมดิจิทัลแบบหลายช่องทาง (Multitrack USB Stream) จากอินเตอร์เฟส -> คอม
        animateDot(dots.usb_send, paths.interface_to_computer, elapsed, 2000, 500, '#8b5cf6');
        
        // 3. คอม -> อินเตอร์เฟส (Digital USB Return, ส่ง Cue Mix)
        animateDot(dots.usb_return, paths.computer_to_interface, elapsed, 2000, 1000, '#a855f7');
        
        // 4. อินเตอร์เฟส -> ลำโพง และตัวกระจายหูฟังจ่ายนักดนตรีแยกคน
        animateDot(dots.speakers, paths.monitors, elapsed, 1500, 1500, '#db2777');
        animateDot(dots.headphones, paths.headphones, elapsed, 1500, 1500, '#d946ef');
      }

      animationFrameId = requestAnimationFrame(animStep);
    }

    // ฟังก์ชันคำนวณตำแหน่งจุดพิกัดเดินทางตามความยาว Path
    function animateDot(dot, path, elapsed, duration, delay, color) {
      if (!dot || !path) return;
      
      const pathLength = path.getTotalLength();
      let activeTime = elapsed - delay;
      
      // ลูปอนิมรอบใหม่
      if (activeTime < 0) {
        dot.style.display = 'none';
        return;
      }
      
      activeTime = activeTime % duration;
      const progress = activeTime / duration;
      
      const point = path.getPointAtLength(progress * pathLength);
      
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      dot.setAttribute('fill', color);
      dot.style.display = 'block';
    }

    animationFrameId = requestAnimationFrame(animStep);
  }

  function stopSignalFlowAnimation() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // ==========================================================================
  // WIDGET 2.5: STUDIO SIGNAL FLOW ANIMATION (SLIDE 11)
  // ==========================================================================
  let studioFlowAnimId = null;
  let activeStudioFlow = 'acoustic'; // 'acoustic' or 'midi'

  function startStudioFlowAnimation() {
    stopStudioFlowAnimation();
    
    const svg = document.getElementById('svg-studio-flow');
    if (!svg) return;

    // Define path-dot pairs for each flow
    const acousticPaths = [
      { pathId: 'path-studio-mic-to-interface', dotId: 'dot-studio-mic', color: '#3b82f6' },
      { pathId: 'path-studio-interface-to-computer', dotId: 'dot-studio-usb-send', color: '#8b5cf6' },
    ];
    const outputPaths = [
      { pathId: 'path-studio-interface-to-speakers', dotId: 'dot-studio-speakers', color: '#db2777' },
      { pathId: 'path-studio-interface-to-headphones', dotId: 'dot-studio-headphones', color: '#d946ef' },
    ];
    const midiPaths = [
      { pathId: 'path-studio-midi-to-computer', dotId: 'dot-studio-midi', color: '#f59e0b' },
      { pathId: 'path-studio-computer-to-interface', dotId: 'dot-studio-usb-return', color: '#8b5cf6' },
    ];

    // Activate dots and highlight paths based on active flow
    function setFlowState(flow) {
      const allDots = ['dot-studio-mic', 'dot-studio-usb-send', 'dot-studio-midi', 'dot-studio-usb-return', 'dot-studio-speakers', 'dot-studio-headphones'];
      const allPaths = ['path-studio-mic-to-interface', 'path-studio-interface-to-computer', 'path-studio-midi-to-computer', 'path-studio-computer-to-interface', 'path-studio-interface-to-speakers', 'path-studio-interface-to-headphones'];
      
      // Reset all
      allDots.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
      allPaths.forEach(id => { 
        const el = document.getElementById(id); 
        if (el) { 
          el.setAttribute('stroke', '#e2e8f0'); 
          el.setAttribute('stroke-width', flow === 'acoustic' || flow === 'midi' ? '3' : '4');
          el.setAttribute('marker-end', 'url(#studio-arrow)');
        } 
      });

      const activeSets = flow === 'acoustic' ? [...acousticPaths, ...outputPaths] : [...midiPaths, ...outputPaths];
      activeSets.forEach(item => {
        const dot = document.getElementById(item.dotId);
        const path = document.getElementById(item.pathId);
        if (dot) { dot.style.display = 'block'; dot.setAttribute('fill', item.color); }
        if (path) { 
          path.setAttribute('stroke', item.color); 
          path.setAttribute('stroke-width', '4');
          path.setAttribute('marker-end', 'url(#studio-arrow-active)');
        }
      });
    }

    setFlowState(activeStudioFlow);

    // Animate dots along paths
    const startTime = performance.now();
    function animateStudioFlow(timestamp) {
      const elapsed = (timestamp - startTime) / 1000;
      const activeSets = activeStudioFlow === 'acoustic' ? [...acousticPaths, ...outputPaths] : [...midiPaths, ...outputPaths];

      activeSets.forEach((item, i) => {
        const path = document.getElementById(item.pathId);
        const dot = document.getElementById(item.dotId);
        if (!path || !dot) return;

        const totalLength = path.getTotalLength();
        const speed = 2.5; // seconds per cycle
        const offset = i * 0.3; // stagger each dot
        const progress = ((elapsed + offset) % speed) / speed;
        const pt = path.getPointAtLength(progress * totalLength);
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
      });

      studioFlowAnimId = requestAnimationFrame(animateStudioFlow);
    }
    studioFlowAnimId = requestAnimationFrame(animateStudioFlow);

    // Card click handlers
    const cardAcoustic = document.getElementById('card-acoustic-flow');
    const cardMidi = document.getElementById('card-midi-flow');
    
    function handleCardClick(flow) {
      activeStudioFlow = flow;
      setFlowState(flow);
      if (cardAcoustic) cardAcoustic.style.borderColor = flow === 'acoustic' ? '#3b82f6' : 'var(--border-color)';
      if (cardMidi) cardMidi.style.borderColor = flow === 'midi' ? '#f59e0b' : 'var(--border-color)';
    }
    
    if (cardAcoustic) {
      cardAcoustic.onclick = () => handleCardClick('acoustic');
      cardAcoustic.style.borderColor = activeStudioFlow === 'acoustic' ? '#3b82f6' : 'var(--border-color)';
    }
    if (cardMidi) {
      cardMidi.onclick = () => handleCardClick('midi');
      cardMidi.style.borderColor = activeStudioFlow === 'midi' ? '#f59e0b' : 'var(--border-color)';
    }
  }

  function stopStudioFlowAnimation() {
    if (studioFlowAnimId) {
      cancelAnimationFrame(studioFlowAnimId);
      studioFlowAnimId = null;
    }
  }

  // ==========================================================================
  // WIDGET 3: INTERACTIVE ASSESSMENT / QUIZ (SLIDE 17)
  // ==========================================================================

  const quizQuestions = [
    {
      question: "1. คีย์บอร์ด MIDI (MIDI Controller) แตกต่างจากคีย์บอร์ดดนตรีหรือเปียโนไฟฟ้าทั่วไปอย่างไร?",
      options: [
        "A: มีเสียงดนตรีภายในตัวเลือกได้หลากหลายกว่ามาก",
        "B: ไม่มีเสียงในตัวเอง ส่งเฉพาะรหัสข้อมูลตัวโน้ตดิจิทัลไปสั่งซอฟต์แวร์ในคอมพิวเตอร์",
        "C: ตอบสนองความดังได้เฉพาะเสียงระดับคงที่เท่านั้น",
        "D: ต้องเชื่อมต่อกับไฟกระแสสูง +48V ตลอดเวลาเพื่อป้องกันข้อมูลหาย"
      ],
      correctIndex: 1,
      explanation: "คีย์บอร์ด MIDI ไม่มีกล่องเสียงในตัวเอง ทำหน้าที่เสมือนตัวรับคำสั่งส่งข้อมูลรหัสตัวเลข (เช่น โน้ตเพลงความเบาดัง) ไปสั่งให้ปลั๊กอินเครื่องดนตรีสังเคราะห์ใน DAW จำลองคลื่นเสียงขึ้นมาอีกที"
    },
    {
      question: "2. หากต้องการนำไมโครโฟนประเภท Condenser มาบันทึกเสียงร้องในสตูดิโอให้ทำงานได้ ต้องเปิดค่าใดเพิ่มเป็นพิเศษ?",
      options: [
        "A: ปรับ Buffer Size ให้มีขนาดสูงสุดเพื่อขยายสัญญาณเสียง",
        "B: สลับโหมดทรานส์ดิวเซอร์เป็นแบบขดลวดแม่เหล็ก",
        "C: เปิดสวิตช์ส่งกระแสไฟเลี้ยง Phantom Power +48V บน Audio Interface",
        "D: เชื่อมสายสัญญาณแบบ XLR เข้าสู่ขั้วต่อลำโพงมอนิเตอร์โดยตรง"
      ],
      correctIndex: 2,
      explanation: "ไมค์ Condenser ใช้แผ่นประจุไฟฟ้าขึงกัน จึงต้องมีแหล่งไฟภายนอก Phantom Power +48V ส่งไปตามสาย XLR เพื่อกระตุ้นให้วงจรและแผ่นรับเสียงทำงาน ต่างจากไมค์ Dynamic ที่ไม่ต้องมีไฟเลี้ยง"
    },
    {
      question: "3. ในการติดตั้งระบบเสียง หน้าที่หลักของเครื่อง ADC/DAC บนตัว Audio Interface มีความสำคัญอย่างไร?",
      options: [
        "A: ตรวจสอบความถูกต้องของคีย์ดนตรีและจังหวะกลองอัตโนมัติ",
        "B: แปลงสัญญาณเสียงคลื่นอนาล็อกเป็นดิจิทัล (0, 1) และแปลงข้อมูลดิจิทัลกลับมาเป็นกระแสไฟฟ้าอนาล็อกเพื่อขับเสียง",
        "C: เพิ่มความเร็วอินเทอร์เน็ตในการอัปโหลดบีทเพลงขึ้นคลาวด์ BandLab",
        "D: ลบเอฟเฟกต์และเสียงรบกวนภายนอกทั้งหมดออกโดยไร้รอยหน่วง"
      ],
      correctIndex: 1,
      explanation: "ADC (Analog-to-Digital Converter) แปลงเสียงร้อง/เครื่องดนตรีเป็นข้อมูลรหัสคอมพิวเตอร์ และ DAC (Digital-to-Analog Converter) แปลงข้อมูลเสียงจากโปรแกรม DAW ให้กลับมาเป็นกระแสไฟขับหูฟังหรือลำโพงออกเป็นคลื่นเสียง"
    },
    {
      question: "4. ลำโพงหรือหูฟังประเภทสตูดิโอมอนิเตอร์ (Studio Monitor) ต่างจากลำโพงบ้านทั่วไปอย่างไร?",
      options: [
        "A: มีการติดตั้งขยายย่านเสียงต่ำ (Bass Boost) และความใสพิเศษเพื่อให้สนุกตอนฟัง",
        "B: เน้นตอบสนองความถี่ราบเรียบ (Flat Frequency Response) เพื่อให้วิศวกรเสียงได้ยินพลังงานเสียงที่แท้จริงโดยไม่ถูกแต่งสีสัน",
        "C: สามารถเสียบไฟเชื่อมต่อกับตัวคีย์บอร์ด MIDI เพื่อส่งเสียงขับสัญญาณสด",
        "D: มีความแข็งแรงในการกันน้ำกันกระแทกและสามารถป้องกันฝุ่นได้สมบูรณ์"
      ],
      correctIndex: 1,
      explanation: "เป้าหมายของมอนิเตอร์คือการไม่บิดเบือนสัญญาณดั้งเดิม (Flat) ทำให้เราได้ยินข้อบกพร่องและระดับเสียงที่แท้จริงเพื่อทำงานมิกซ์เสียงได้อย่างแม่นยำ ไม่หลอกตัวเองต่างจากหูฟังความบันเทิงที่ปรับแต่งเสียงเบส/แหลม"
    },
    {
      question: "5. หากนักเรียนร้องเพลงบันทึกเสียงสดแล้วรู้สึกหน่วงหูหรือเสียงตอบรับดีเลย์ผิดปกติ (Latency) ควรแก้ไขการตั้งค่าอย่างไรใน DAW?",
      options: [
        "A: ปรับลดค่าขนาด Buffer Size ลงให้ต่ำ (เช่น 64 หรือ 128 samples)",
        "B: เพิ่มค่า Buffer Size ให้ขึ้นสูงที่สุดเป็น 1024 samples เพื่อเร่งการประมวลผล",
        "C: ถอด Audio Interface ออกแล้วใช้ไมโครโฟนติดคอมพิวเตอร์ธรรมดาแทน",
        "D: ปรับระดับ Sample Rate จาก 44.1 kHz ลงมาเหลือ 8 kHz"
      ],
      correctIndex: 0,
      explanation: "การปรับ Buffer Size ให้เล็กลงช่วยร่นขนาดถังพักข้อมูล ทำให้ระยะเวลาประมวลสัญญาณเร็วขึ้น Latency จึงลดลงจนหูฟังไม่ดีเลย์ แต่ถ้าเครื่องช้าเกินไปอาจเกิดเสียงสะดุดเปรี๊ยะ จึงต้องหาค่าสมดุลที่เหมาะกับ CPU"
    },
    {
      question: "6. ตามทฤษฎีการสุ่มตัวอย่าง (Nyquist Theorem) หากต้องการบันทึกเสียงร้องให้ออกมาสมบูรณ์แบบไม่เกิดสัญญาณหลอน (Aliasing) ย่านความถี่สุ่มตัวอย่าง (Sample Rate) ขั้นต่ำสุดต้องมีค่าเท่าใด?",
      options: [
        "A: 10,000 Hz (ครึ่งหนึ่งของย่านหูรับรู้ได้สูงสุด)",
        "B: 20,000 Hz (เท่ากับย่านหูรับรู้สูงสุดพอดี)",
        "C: 40,000 Hz (อย่างน้อยเป็น 2 เท่าของความถี่สูงสุดที่หูได้ยิน)",
        "D: 96,000 Hz (ความละเอียดระดับ High-Resolution เสมอ)"
      ],
      correctIndex: 2,
      explanation: "ทฤษฎี Nyquist-Shannon กำหนดว่า Sample Rate ต้องไม่ต่ำกว่า 2 เท่าของความถี่เสียงสูงสุดที่ต้องการบันทึก หูคนทั่วไปได้ยินสูงสุดประมาณ 20,000 Hz ดังนั้นอัตราสุ่มจึงต้องไม่ต่ำกว่า 40,000 Hz เพื่อไม่ให้เกิดคลื่นหลอน (Aliasing) มาตรฐานสากลจึงเริ่มต้นที่ 44.1 kHz หรือ 48 kHz"
    },
    {
      question: "7. สายสัญญาณเสียงแบบ Balanced (เช่น สาย XLR หรือแจ็ค TRS) มีกลไกอย่างไรในการขจัดเสียงรบกวนจี่ฮัมจากสภาพแวดล้อมได้เงียบสนิท แม้ลากสายยาวหลายสิบเมตร?",
      options: [
        "A: มีเส้นใยแก้วนำแสงนำคลื่นแสงเสียงแทนกระแสไฟฟ้าอนาล็อก",
        "B: ใช้สายนำสัญญาณ 2 เส้นที่มีเฟสตรงข้ามกัน (Hot & Cold) ปลายทางจะสลับเฟส Cold กลับมารวมและขจัดเสียงกวนที่ปนมาระหว่างทาง (CMRR)",
        "C: มีปลอกยางหนาพิเศษด้านนอกคอยซับคลื่นรบกวนแม่เหล็กไฟฟ้าไม่ให้เล็ดลอด",
        "D: มีแบตเตอรี่ในตัวเพื่อคอยกรองไฟและระดับสัญญาณให้เรียบตรง"
      ],
      correctIndex: 1,
      explanation: "สาย Balanced ประกอบด้วย Hot (เฟสบวก) และ Cold (เฟสลบกลับด้าน 180 องศา) ร่วมกับกราวด์ เมื่อปลายทาง (ซาวด์การ์ด/ลำโพง) ได้รับสัญญาณ จะทำการสลับเฟส Cold กลับคืน ทำให้เสียงหลักดังขึ้นเท่าตัว และขจัดสัญญาณรบกวนที่เก็บมาระหว่างทางเพราะหักล้างกันเองหมดจด (เรียกว่า Common Mode Rejection Ratio: CMRR)"
    },
    {
      question: "8. ในระบบบันทึกเสียงสตูดิโอ หากเปิดไฟเลี้ยง Phantom Power +48V ไปที่สายไมโครโฟนชนิดริบบอน (Ribbon Microphone) จะส่งผลเสียหายอย่างไรทางวิทยาศาสตร์?",
      options: [
        "A: แผ่นอลูมิเนียมริบบอนที่บอบบางจะรับกระแสไฟร้อนและขาดเสียหายทันที",
        "B: สัญญาณเสียงจะดังขึ้น 48 เดซิเบลจนทำให้ลำโพงสตูดิโอขาดเพี้ยน",
        "C: ไม่เกิดความเสียหายใดๆ เพราะไมค์ริบบอนมีตัวต้านทานช่วยจ่ายไฟอยู่แล้ว",
        "D: ข้อมูลดิจิทัลออดิโอที่ส่งเข้าโปรแกรม DAW จะสลับพิกัดบิตสูงต่ำกัน"
      ],
      correctIndex: 0,
      explanation: "ไมค์ริบบอนใช้แผ่นอลูมิเนียมบางเฉียบขึงรับเสียงซึ่งบอบบางมาก หากมีกระแสไฟ +48V ป้อนเข้ามาทางสายไมค์ ไฟจะวิ่งเข้าสู่เส้นริบบอนโดยตรงและทำให้มันเกิดความร้อนขยายตัวอย่างรวดเร็วจนขาดเสียหายทันที"
    },
    {
      question: "9. ปลั๊กอินเอฟเฟกต์ชนิด Compressor และ Reverb จัดอยู่ในเอฟเฟกต์ประเภทใดและมีหน้าที่ต่างกันอย่างไร?",
      options: [
        "A: Compressor คุมความถี่ / Reverb คุมมิติเวลา",
        "B: Compressor คุมความดังระดับเสียงเฉลี่ย / Reverb สร้างเสียงสะท้อนสภาพแวดล้อมเสมือนจริง",
        "C: Compressor สังเคราะห์เสียงกลอง / Reverb บันทึกคอร์ดเปียโน",
        "D: Compressor สแกนหาเสียงรบกวน / Reverb ขยายเสียงเบส"
      ],
      correctIndex: 1,
      explanation: "Compressor อยู่ในกลุ่ม Dynamics Effects ทำหน้าที่คุมน้ำหนักและช่วงความดังเสียงเฉลี่ย (บีบยอดเสียงดัง ดึงระดับเสียงเบาขึ้น) ขณะที่ Reverb จัดอยู่ในกลุ่ม Time-based Effects ทำหน้าที่จำลองห้องและสร้างหางเสียงสะท้อนสภาพแวดล้อมเสมือนจริง"
    },
    {
      question: "10. คุณสมบัติเด่นของฟอร์แมตเสียงแบบ 32-bit Float (ทศนิยมลอยตัว) ที่มีประโยชน์อย่างยิ่งในขั้นตอนบันทึกเสียงและมิกซ์ดนตรีคือข้อใด?",
      options: [
        "A: ป้องกันสัญญาณขาดหรือกระเพื่อมหน่วงจาก CPU อัตโนมัติ",
        "B: ทำให้ขนาดไฟล์เสียงเล็กลงกะทัดรัดกว่าฟอร์แมต MP3",
        "C: มีพิสัยความดังกว้างมหาศาลทางทฤษฎีถึง 1,500 dB ทำให้เสียงไม่แตกรีบ (Clipping) และดึงคืนเสียงที่แดงล้นกลับมาได้สะอาดสมบูรณ์",
        "D: สามารถแปลงเสียงร้องของผู้ชายให้เป็นผู้หญิงได้ทันทีขณะร้องสด"
      ],
      correctIndex: 2,
      explanation: "ระบบ 32-bit Float มีพิสัยความดังกว้างมากถึง 1,500 dB ทำให้หมดปัญหาเรื่องสัญญาณดังเกินขีดจำกัดแล้วเกิดเสียงแตกร้าว (Digital Clipping) แม้มิเตอร์จะขึ้นไฟแดงพีคก็สามารถดึง Gain ลดลงใน DAW เพื่อกู้คืนรูปคลื่นเสียงที่สมบูรณ์ปราศจากความพร่าเพี้ยนกลับมาได้"
    }
  ];

  // ค้นหา DOM ของควิซ
  const quizIntro = document.getElementById('quiz-intro');
  const quizQuestionBox = document.getElementById('quiz-question-box');
  const quizResults = document.getElementById('quiz-results');
  
  const btnStartQuiz = document.getElementById('btn-start-quiz');
  const btnNextQuestion = document.getElementById('btn-next-question');
  const btnRestartQuiz = document.getElementById('btn-restart-quiz');
  const btnShowExplanations = document.getElementById('btn-toggle-explain');
  
  const questionNumber = document.getElementById('quiz-question-number');
  const questionText = document.getElementById('quiz-question-text');
  const quizOptions = document.getElementById('quiz-options');
  const quizProgress = document.getElementById('quiz-progress-bar');
  
  const resultScore = document.getElementById('quiz-result-score');
  const resultEvaluation = document.getElementById('quiz-result-text');
  const resultSummary = document.getElementById('result-summary');
  const quizExplanations = document.getElementById('quiz-explanations');

  // เริ่มทำข้อสอบ
  btnStartQuiz.addEventListener('click', startQuiz);
  btnNextQuestion.addEventListener('click', nextQuestion);
  btnRestartQuiz.addEventListener('click', resetQuiz);
  
  btnShowExplanations.addEventListener('click', () => {
    quizExplanations.classList.toggle('hidden');
    // ดึง scroll ไปตรงช่องเฉลย
    quizExplanations.scrollIntoView({ behavior: 'smooth' });
  });

  function startQuiz() {
    quizCurrentQuestion = 0;
    quizScore = 0;
    quizAnswers = [];
    quizActive = true;
    quizExplanations.classList.add('hidden');
    
    quizIntro.classList.add('hidden');
    quizResults.classList.add('hidden');
    quizQuestionBox.classList.remove('hidden');
    
    loadQuestion(quizCurrentQuestion);
  }

  function loadQuestion(index) {
    btnNextQuestion.classList.add('hidden');
    
    const q = quizQuestions[index];
    questionNumber.textContent = `ข้อที่ ${index + 1} จาก ${quizQuestions.length}`;
    questionText.textContent = q.question;
    
    // อัปเดตแถบความก้าวหน้า
    const progressPercent = ((index + 1) / quizQuestions.length) * 100;
    quizProgress.style.width = `${progressPercent}%`;
    
    // เคลียร์ตัวเลือกเก่า
    quizOptions.innerHTML = '';
    
    // สร้างตัวเลือก
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-item';
      
      const letterSpan = document.createElement('span');
      letterSpan.className = 'option-letter';
      letterSpan.textContent = opt.substring(0, 1);
      
      const textSpan = document.createElement('span');
      textSpan.textContent = opt.substring(3); // ตัดเฉพาะหัว A:, B: ออกเพราะตัวบนใส่ไปแล้ว
      
      btn.appendChild(letterSpan);
      btn.appendChild(textSpan);
      
      btn.addEventListener('click', () => {
        if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return; // ล็อกปุ่มหากตอบไปแล้ว
        selectOption(idx, btn);
      });
      
      quizOptions.appendChild(btn);
    });
  }

  function selectOption(selectedIndex, clickedBtn) {
    const q = quizQuestions[quizCurrentQuestion];
    quizAnswers.push(selectedIndex);
    
    // ไฮไลต์และล็อกการเลือกคำตอบทันทีเฉลยผล
    const optionBtns = quizOptions.querySelectorAll('.option-item');
    
    optionBtns.forEach((btn, idx) => {
      if (idx === q.correctIndex) {
        btn.classList.add('correct'); // ตัวเลือกถูกทำเป็นสีเขียว
      } else if (idx === selectedIndex) {
        btn.classList.add('wrong'); // ตัวเลือกที่เลือกผิดทำเป็นสีแดง
      }
    });

    if (selectedIndex === q.correctIndex) {
      quizScore++;
    }

    // แสดงปุ่มถัดไป
    btnNextQuestion.classList.remove('hidden');
    btnNextQuestion.focus();
  }

  function nextQuestion() {
    quizCurrentQuestion++;
    if (quizCurrentQuestion < quizQuestions.length) {
      loadQuestion(quizCurrentQuestion);
    } else {
      showQuizResults();
    }
  }

  function showQuizResults() {
    quizQuestionBox.classList.add('hidden');
    quizResults.classList.remove('hidden');
    
    resultScore.textContent = `${quizScore} / ${quizQuestions.length}`;
    
    // ประเมินผลระดับคะแนน
    let evaluation = '';
    let summary = '';
    
    if (quizScore === 10) {
      evaluation = "ระดับ: อัจฉริยะวิศวกรเสียง (10/10 คะแนน) 🏆";
      summary = "ยอดเยี่ยมมาก! คุณเข้าใจความแตกต่างของอุปกรณ์ สัญญาณ และซอฟต์แวร์ดนตรีมาตรฐานสตูดิโอได้อย่างสมบูรณ์แบบ พร้อมสำหรับฝึกปฏิบัติทำเพลงขั้นจริง";
    } else if (quizScore >= 7) {
      evaluation = "ระดับ: โปรดิวเซอร์มีแววรุ่ง (7-9 คะแนน) 🎧";
      summary = "ดีมาก! คุณเข้าใจหลักการพื้นฐานของเทคโนโลยีดนตรีและกระบวนการทำงานหลักได้ดี แนะนำให้ทบทวนจุดผิดในเฉลยละเอียดเพิ่มเติมเพื่อความแม่นยำเต็มร้อย";
    } else {
      evaluation = "ระดับ: นักเรียนฝึกฝนสตูดิโอ (0-6 คะแนน) 🎙️";
      summary = "ไม่เป็นไรนะ! บทเรียนเทคโนโลยีเสียงดิจิทัลเป็นเรื่องเข้าใจยากในการเริ่มต้น ลองสลับหน้าเว็บเข้าโหมด **ทบทวนความรู้ (Review Mode)** ด้านบนเพื่ออ่านสรุปบทเรียนและลองควิซใหม่อีกครั้ง";
    }
    
    resultEvaluation.textContent = evaluation;
    resultSummary.textContent = summary;
    
    // สร้างตารางเฉลยละเอียด
    buildExplanations();
  }

  function buildExplanations() {
    quizExplanations.innerHTML = '<h4>รายละเอียดเฉลยข้อสอบและวิเคราะห์:</h4>';
    
    quizQuestions.forEach((q, idx) => {
      const userAnsIdx = quizAnswers[idx];
      const userAnsStr = userAnsIdx !== undefined ? q.options[userAnsIdx] : 'ไม่ได้ระบุคำตอบ';
      const correctAnsStr = q.options[q.correctIndex];
      const isCorrect = userAnsIdx === q.correctIndex;
      
      const expItem = document.createElement('div');
      expItem.className = 'exp-item';
      
      expItem.innerHTML = `
        <div class="exp-q" style="color: ${isCorrect ? 'var(--text-primary)' : 'var(--color-error)'}">
          ${isCorrect ? '✅' : '❌'} ${q.question}
        </div>
        <div class="exp-ans">
          คำตอบที่ถูก: <span style="font-weight: 500;">${correctAnsStr}</span>
        </div>
        ${!isCorrect ? `<div style="font-size: 11px; color: var(--text-muted);">คุณเลือก: ${userAnsStr}</div>` : ''}
        <div class="exp-detail">
          💡 อธิบาย: ${q.explanation}
        </div>
      `;
      
      quizExplanations.appendChild(expItem);
    });
  }

  function resetQuiz() {
    startQuiz();
  }

  // ==========================================================================
  // WIDGET 4: AUDIO DEMO PLAYBACK (SLIDE 7)
  // ==========================================================================
  const btnPlayAcoustic = document.getElementById('btn-play-acoustic');
  const btnPlayMidi = document.getElementById('btn-play-midi');

  if (btnPlayAcoustic) {
    btnPlayAcoustic.addEventListener('click', () => {
      playAcousticDemo(btnPlayAcoustic);
    });
  }

  if (btnPlayMidi) {
    btnPlayMidi.addEventListener('click', () => {
      playMidiDemo(btnPlayMidi);
    });
  }

  function playAcousticDemo(button) {
    if (button.classList.contains('playing')) {
      stopAcousticDemo(button);
      return;
    }
    
    // หยุดการเล่นฝั่ง MIDI ถ้าเล่นอยู่
    if (btnPlayMidi && btnPlayMidi.classList.contains('playing')) {
      stopMidiDemo(btnPlayMidi);
    }
    
    button.classList.add('playing');
    const icon = button.querySelector('.icon');
    if (icon) icon.textContent = '⏹️';
    
    try {
      acousticAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (acousticAudioCtx && acousticAudioCtx.state === 'suspended') {
        acousticAudioCtx.resume();
      }
      const now = acousticAudioCtx.currentTime;
      
      // ลำดับโน้ตเพลงอะคูสติกจำลองเสียงสายกีตาร์อบอุ่น (C Major Arpeggio)
      const notes = [
        { freq: 261.63, time: 0.0, dur: 1.5 },    // C4
        { freq: 329.63, time: 0.2, dur: 1.3 },    // E4
        { freq: 392.00, time: 0.4, dur: 1.1 },    // G4
        { freq: 523.25, time: 0.6, dur: 1.5 },    // C5
        { freq: 659.25, time: 0.8, dur: 1.8 }     // E5
      ];
      
      notes.forEach(note => {
        const osc = acousticAudioCtx.createOscillator();
        const gainNode = acousticAudioCtx.createGain();
        const filter = acousticAudioCtx.createBiquadFilter();
        
        // คลื่นเสียงแบบ Triangle เพื่อความอบอุ่นแบบสายดนตรีออร์แกนิก
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.time);
        
        // ใส่ LFO (Vibrato) เพิ่มความเป็นธรรมชาติของเสียงเครื่องดนตรีสด/เสียงร้อง
        const lfo = acousticAudioCtx.createOscillator();
        const lfoGain = acousticAudioCtx.createGain();
        lfo.frequency.setValueAtTime(5.5, now + note.time); // ความถี่วิเบรโต 5.5 Hz
        lfoGain.gain.setValueAtTime(4, now + note.time);    // ความกว้างสวิงระดับเสียง 4 Hz
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        // ปรับแต่งฟิลเตอร์เพื่อตัดย่านแหลมสลัดออก ให้โทนเสียงนุ่มละมุน
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now + note.time);
        filter.frequency.exponentialRampToValueAtTime(300, now + note.time + note.dur);
        
        // Envelope: เล่นเร็วแต่ปล่อยเสียงค่อยๆ ดับอย่างต่อเนื่อง (Acoustic Pluck & Decay)
        gainNode.gain.setValueAtTime(0, now + note.time);
        gainNode.gain.linearRampToValueAtTime(0.25, now + note.time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(acousticAudioCtx.destination);
        
        lfo.start(now + note.time);
        osc.start(now + note.time);
        
        lfo.stop(now + note.time + note.dur);
        osc.stop(now + note.time + note.dur);
      });
      
      // ตั้งเวลาลบ class playing เมื่อการเล่นจบลง
      acousticTimer = setTimeout(() => {
        stopAcousticDemo(button);
      }, 3000);
      
    } catch (err) {
      console.error("Web Audio API Error: ", err);
      stopAcousticDemo(button);
    }
  }

  function stopAcousticDemo(button) {
    if (acousticTimer) {
      clearTimeout(acousticTimer);
      acousticTimer = null;
    }
    if (acousticAudioCtx) {
      if (acousticAudioCtx.state !== 'closed') {
        acousticAudioCtx.close();
      }
      acousticAudioCtx = null;
    }
    button.classList.remove('playing');
    const icon = button.querySelector('.icon');
    if (icon) icon.textContent = '🔊';
  }

  function playMidiDemo(button) {
    if (button.classList.contains('playing')) {
      stopMidiDemo(button);
      return;
    }
    
    // หยุดการเล่นฝั่ง Acoustic ถ้าเล่นอยู่
    if (btnPlayAcoustic && btnPlayAcoustic.classList.contains('playing')) {
      stopAcousticDemo(btnPlayAcoustic);
    }
    
    button.classList.add('playing');
    const icon = button.querySelector('.icon');
    if (icon) icon.textContent = '⏹️';
    
    try {
      midiAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (midiAudioCtx && midiAudioCtx.state === 'suspended') {
        midiAudioCtx.resume();
      }
      const now = midiAudioCtx.currentTime;
      
      // ลำดับโน้ตเพลงอิเล็กทรอนิกส์สังเคราะห์ (MIDI Synthesizer Arpeggiator)
      // เล่นทำนองดิจิทัลรวดเร็วคมชัด
      const arpeggio = [
        261.63, 392.00, 523.25, 659.25, 783.99, 659.25, 523.25, 392.00,
        349.23, 440.00, 523.25, 698.46, 880.00, 698.46, 523.25, 440.00
      ];
      
      const tempo = 0.12; // 120ms ต่อโน้ต (รวดเร็วสมเป็นคอมพิวเตอร์สร้าง)
      
      arpeggio.forEach((freq, idx) => {
        const osc = midiAudioCtx.createOscillator();
        const gainNode = midiAudioCtx.createGain();
        const filter = midiAudioCtx.createBiquadFilter();
        
        // คลื่นเสียงประเภท Sawtooth (ฟันเลื่อย) ที่มีคุณลักษณะเสียงสังเคราะห์สไตล์ Retro ดิจิทัล
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * tempo);
        
        // การกวาดความถี่ฟิลเตอร์ลงอย่างรวดเร็ว (Filter Sweep Envelope) ให้เสียงป็อปๆ เป็นจังหวะ
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now + idx * tempo);
        filter.frequency.exponentialRampToValueAtTime(150, now + idx * tempo + 0.15);
        
        // Envelope ระดับความดัง (Fast Attack, Fast Decay) สไตล์ Synth Pluck
        gainNode.gain.setValueAtTime(0, now + idx * tempo);
        gainNode.gain.linearRampToValueAtTime(0.12, now + idx * tempo + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * tempo + 0.14);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(midiAudioCtx.destination);
        
        osc.start(now + idx * tempo);
        osc.stop(now + idx * tempo + 0.16);
      });
      
      // ตั้งเวลาลบ class playing เมื่อจบโน้ตสุดท้าย
      midiTimer = setTimeout(() => {
        stopMidiDemo(button);
      }, arpeggio.length * tempo * 1000 + 200);
      
    } catch (err) {
      console.error("Web Audio API Error: ", err);
      stopMidiDemo(button);
    }
  }

  function stopMidiDemo(button) {
    if (midiTimer) {
      clearTimeout(midiTimer);
      midiTimer = null;
    }
    if (midiAudioCtx) {
      if (midiAudioCtx.state !== 'closed') {
        midiAudioCtx.close();
      }
      midiAudioCtx = null;
    }
    button.classList.remove('playing');
    const icon = button.querySelector('.icon');
    if (icon) icon.textContent = '🔊';
  }


  // ==========================================================================
  // INITIALIZATION RUN AT STARTUP
  // ==========================================================================
  // เริ่มแสดงผลที่สไลด์แรก
  showSlide(0);

});
