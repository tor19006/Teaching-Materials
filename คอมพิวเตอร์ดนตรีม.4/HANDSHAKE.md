# 🤝 Handshake — ข้อตกลงการทำงานสื่อการสอน

> ไฟล์นี้เป็นข้อตกลงมาตรฐานที่ Agent ต้องอ่านและปฏิบัติตามทุกครั้งที่ทำงานในโปรเจกต์นี้

---

## 📋 ข้อมูลโปรเจกต์

- **วิชา:** คอมพิวเตอร์ดนตรี (Music Technology & AI)
- **ระดับ:** ม.4 (Grade 10)
- **โรงเรียน:** สุรศักดิ์มนตรี
- **ครูผู้สอน:** ครูเอกณัฐ ลุผลแท้
- **กลุ่มเป้าหมาย:** นักเรียนที่ไม่มีพื้นฐานดนตรี
- **Syllabus:** 18 สัปดาห์ (ดู `syllabus.txt`)

---

## 🎨 Design Standards

### Theme
- **Minimal Light** — พื้นหลังขาวสะอาด, flat design
- **ไม่ใช้** gradient, glow, dark theme, หรือ animation ที่ดู "AI สร้าง"
- **Font:** IBM Plex Sans Thai + Inter
- **สี:**
  - Accent: `#2563eb` (น้ำเงิน)
  - Warm: `#ea580c` (ส้ม)
  - Green: `#16a34a` (เขียว)
  - Red: `#dc2626` (แดง)

### Layout (v2 — ใช้กับทุกสัปดาห์)
- เวที 16:9 (ออกแบบที่ 1280×720 สเกลด้วย `--k`) ไม่มี scroll ในสไลด์
- ใช้ shared assets: `assets/deck.css` + `assets/deck.js` (HTML ต่อสัปดาห์เก็บเฉพาะเนื้อหา)
- ธีมสีเปลี่ยนตามหน่วยผ่าน `data-unit="1..6"` บนแท็ก `<html>`
- Responsive — ใช้ได้ทั้งจอใหญ่และมือถือ (รองรับ swipe)
- Navigation: ปุ่มซ้าย-ขวา + ตัวนับสไลด์ + keyboard (←→, Space, Home/End) + ปุ่มเต็มจอ ⛶
- โครงสไลด์มาตรฐาน ~29 หน้า/คาบ: ปก → เป้าหมาย → run sheet → hook → แนวคิด 1–4 (มี SVG ประกอบทุกแนวคิด) → ภาพรวม (SVG ใหญ่) → **เจาะลึก 1–2 + คำศัพท์เสริม** → แก้ความเข้าใจผิด → teacher demo → **เทคนิค/กรณีศึกษาจากคอร์สจริง** → interactive → ฝึกนำร่อง → ใบงาน → workshop → บทบาทกลุ่ม → quality check → **troubleshooting** → studio timer + feedback → จริยธรรม → **โลกจริง/อาชีพ + FAQ** → สรุป → อ้างอิง APA → quiz 10 ข้อ
- เนื้อหาเชิงลึกอิงคอร์ส/คู่มือจริง: BandLab Studio guides, Berklee Music Production 101, OpenAI prompt best practices, Suno Help, UNESCO — อ้างอิงในสไลด์และท้ายชุดตาม APA

---

## 📝 เนื้อหา & โครงสร้างสไลด์

### ปรัชญาการสอน
- **เนื้อหาละเอียดแต่ง่าย** — ไม่ให้เด็กตกใจ
- **ไม่ลงลึกฟิสิกส์** — อธิบายแบบ everyday language
- **Human-first, AI-assisted** — นักเรียนต้องสร้างก่อน AI ช่วย
- ใช้ภาษาไทยเป็นหลัก มีศัพท์อังกฤษกำกับในวงเล็บ

### โครงสร้างแต่ละคาบ (MUST FOLLOW)
1. **หน้าปก** — ชื่อคาบ, หัวข้อ, badges สำคัญ
2. **เนื้อหา** — แบ่งเป็น sections (01, 02, 03...) มี section divider
3. **Interactive elements** — อย่างน้อย 2-3 อย่าง ต่อคาบ เช่น:
   - Quiz สนุก ๆ (คั่นระหว่างเนื้อหา)
   - Beat Pad / Sound demo
   - Prompt Builder
   - Reveal cards (กดเปิดดูข้อมูลเพิ่ม)
   - Timer สำหรับกิจกรรม
   - Volume slider
4. **รูปภาพประกอบ** — generate ด้วย AI image tool, เก็บใน `/img/`
5. **กิจกรรม / Workshop** — มีคำแนะนำชัดเจน
6. **สรุปคาบ** — สรุปสิ่งที่เรียนรู้ + แจ้งงานคาบหน้า
7. **⭐ Quiz สรุปท้ายคาบ 10 ข้อ** — ครอบคลุมเนื้อหาทั้งหมดในคาบ
   - อยู่ในสไลด์เดียว แสดงทีละข้อ มีลูกศรเลื่อนไปมา (แสดงเลขข้อ เช่น 1/10)
   - มีระบบตรวจคำตอบอัตโนมัติ
   - แสดงคะแนน + ข้อความให้กำลังใจ
   - มีปุ่ม "ทำใหม่" ได้
   - คำถามต้องครอบคลุมทุกหัวข้อหลักในคาบนั้น

---

## 🛠 Technical Standards

### File Structure
```
คอมพิวเตอร์ดนตรีม.4/
├── HANDSHAKE.md          ← ไฟล์นี้ (อ่านทุกครั้ง!)
├── syllabus.txt          ← หลักสูตร 18 สัปดาห์
├── slides-week1.html     ← สไลด์คาบที่ 1
├── slides-week2.html     ← สไลด์คาบที่ 2 (ถ้ามี)
└── img/
    ├── [week]-[name].png ← รูปภาพแยกตามคาบ
    └── ...
```

### Code Style
- Single-file HTML (CSS + JS ในไฟล์เดียว)
- ใช้ CSS Custom Properties (`:root` variables)
- JavaScript: vanilla, ไม่ใช้ framework
- Web Audio API สำหรับเสียง interactive
- Comment แยก section ชัดเจน: `<!-- ====== N: TITLE ====== -->`

### Interactive Elements
- ใช้ CSS class naming convention:
  - Quiz: `.quiz-opt`, `.quiz-feedback`
  - Final Quiz: `.fq-item`, `.fq-opt`, `.fq-correct`, `.fq-wrong`
  - Beat Pad: `.beat-btn`, `.beat-pad`
  - Prompt Builder: `.prompt-chip`, `.prompt-output`
  - Timer: `.timer-circle`, `.timer-btn`
  - Reveal: `.reveal-card`, `.reveal-front`, `.reveal-back`

---

## ✅ Checklist ก่อนส่งมอบงาน

- [ ] อ่าน `HANDSHAKE.md` แล้ว
- [ ] อ่าน `syllabus.txt` เพื่อดูเนื้อหาคาบที่ต้องทำ
- [ ] สไลด์มี section dividers (01, 02, 03...)
- [ ] มี interactive elements อย่างน้อย 2-3 อย่าง
- [ ] มีรูปภาพประกอบ (generate ใหม่ถ้าจำเป็น)
- [ ] มีสรุปท้ายคาบ
- [ ] **มี Quiz สรุป 10 ข้อท้ายสไลด์**
- [ ] ทดสอบเปิดบน browser แล้วใช้งานได้จริง
- [ ] Navigation, keyboard shortcuts, fullscreen ทำงานปกติ
- [ ] Responsive บนมือถือ

---

## 📌 หมายเหตุ

- ทุกครั้งที่เริ่มทำงานใหม่ ให้อ่านไฟล์นี้ก่อนเสมอ
- ถ้ามีการเปลี่ยนแปลงมาตรฐาน ให้อัปเดตไฟล์นี้ด้วย
- ไฟล์นี้เป็น "สัญญา" ระหว่าง Agent กับครู

---

*อัปเดตล่าสุด: 2026-07-11 — ปรับ week 5–18 เป็นดีไซน์ v2 (เวที 16:9 + shared assets) ครบทุกสัปดาห์ ไฟล์เดิมสำรองไว้ที่ `_backup_original/`*
