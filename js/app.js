// ── DATA ──
const FIXED = 6400;
const LATE  = 500;

const students = [
  { id:'67402040001', name:'นางสาวขวัญเนตร ธนะบุตร', photo:'images/67402040001.jpg' },
  { id:'67402040002', name:'นางสาวจิราภรณ์ กงสะเด็น',  photo:'images/67402040002.jpg' },
  { id:'67402040003', name:'นายชนาธิป หารสุโพธิ์',  photo:'images/67402040003.jpg' },
  { id:'67402040004', name:'นางสาวชลธิชา ศิลากุล',              prefix:'นางสาว',        photo:'images/67402040004.png' },
  { id:'67402040005', name:'นายณัฐภูมิ เขียวสด',                 prefix:'นาย',           photo:'images/67402040005.jpg' },
  { id:'67402040006', name:'นายธนาวัฒน์ คำกอง',                  prefix:'นาย',           photo:'images/67402040006.jpg' },
  { id:'67402040008', name:'นายภูมิวิวัฒน์ มาตยคุณ',             prefix:'นาย',           photo:'images/67402040008.jpg' },
  { id:'67402040009', name:'นางสาวมินตรา โคตะมะ',                prefix:'นางสาว',        photo:'images/67402040009.jpg' },
  { id:'67402040011', name:'นางสาวสุนิสา สมณะ',                  prefix:'นางสาว',        photo:'images/67402040011.jpg' },
  { id:'67402040012', name:'นางสาวอาทิตยา โยสิคุณ',              prefix:'นางสาว',        photo:'images/67402040012.jpg' },
  { id:'67402040013', name:'นางสาวอินทราวารี สุนทอง',            prefix:'นางสาว',        photo:'images/67402040013.jpg' },
  { id:'67402040014', name:'นางสาวกตวรรณ จุลโพธิ์',              prefix:'นางสาว',        photo:'images/67402040014.jpg' },
  { id:'67402040015', name:'นางสาวภัทรสุดา หวานขม',              prefix:'นางสาว',        photo:'images/67402040015.jpg' },
  { id:'67402040016', name:'นายอิสระ วัฒนาเสรีพล',               prefix:'นาย',           photo:'images/67402040016.jpg' },
  { id:'67402040018', name:'นางสาวกุลสตรี กอจันกลาง',            prefix:'นางสาว',        photo:'images/67402040018.jpg' },
  { id:'67402040019', name:'ว่าที่ร้อยตรีชาติณรงค์ น้อยมาลา',   prefix:'ว่าที่ร้อยตรี', photo:'images/67402040019.jpg' },
  { id:'67402040021', name:'นางสาวศิริรัตน์ ชินนอก',             prefix:'นางสาว',        photo:'images/67402040021.jpg' },
];

let payments = {};
let current  = null;
let withLate = false;
let currentSlip = null;

// ✨ เปลี่ยน URL เป็นลิงก์ Web App ที่ลงท้ายด้วย /exec เท่านั้น
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycby4GdBCYNCx7UC83rwiKk8TjkJ3AKI-VFBT7BlBLAJXcCHKi_jLJlMirh8tdofMxto/exec";

// ── HELPERS ──
const pw = id => 'DBT' + id.slice(-3);
const svgIcon = () => `<svg viewBox="0 0 80 80" fill="white" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="18"/><ellipse cx="40" cy="65" rx="28" ry="18"/></svg>`;

function applyLogo(url) {
  const btn = document.getElementById('logo-btn');
  if (btn) btn.innerHTML = `<img src="${url}" class="custom-logo" style="width:100%; height:100%; object-fit:contain;">`;
}

function loadLogo() {
  const saved = localStorage.getItem('logo');
  applyLogo(saved || 'images/logo.png');
}

// ── SAVE/LOAD PHOTOS ──
function savePhotos() {
  const photos = {};
  students.forEach(s => { if (s.photo) photos[s.id] = s.photo; });
  localStorage.setItem('student_photos', JSON.stringify(photos));
}

function loadPhotos() {
  try {
    const saved = localStorage.getItem('student_photos');
    if (!saved) return;
    const photos = JSON.parse(saved);
    students.forEach(s => { if (photos[s.id]) s.photo = photos[s.id]; });
  } catch(e) {}
}

// ── LOAD FROM SHEET (READ) ──
async function loadPaymentsFromSheet() {
  try {
    // ใช้ redirect: 'follow' เพื่อให้ fetch ทำงานกับ Google Script ได้ถูกต้อง
    const response = await fetch(GOOGLE_SHEET_URL, { redirect: 'follow' });
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        payments[item.studentId] = {
          fullname: item.fullname,
          prefix: "", 
          amt: FIXED,
          late: item.lateFee ? LATE : 0,
          total: item.total,
          date: item.date,
          year: item.year,
          lateFee: item.lateFee
        };
      });
      renderGrid();
      renderSummary();
    }
  } catch (error) {
    console.warn("การดึงข้อมูลจาก Sheet ขัดข้อง (อาจยังไม่มีข้อมูล):", error);
  }
}

// ── RENDER GRID ──
function renderGrid() {
  const grid = document.getElementById('student-grid');
  if(!grid) return;
  grid.innerHTML = '';
  let paidCount = 0;

  students.forEach(s => {
    const paid = payments[s.id];
    if (paid) paidCount++;

    const card = document.createElement('div');
    card.className = 'student-card';
    const av = s.photo ? `<img src="${s.photo}" alt="${s.name}">` : `<div class="s-avatar-icon">${svgIcon()}</div>`;

    card.innerHTML = `
      <div class="s-avatar" onclick="uploadAvatar('${s.id}')">
        ${av}
        <div class="s-avatar-hover">📷</div>
        <input type="file" accept="image/*" id="av-${s.id}" style="display:none" onchange="saveAvatar(event,'${s.id}')">
      </div>
      <div class="s-name">${s.name}</div>
      <div class="s-badge ${paid ? 'paid' : 'unpaid'}">${paid ? '✓ ชำระแล้ว' : '· ยังไม่ชำระ'}</div>
      <button class="s-login-btn" onclick="openLogin('${s.id}')">🔑 เข้าสู่ระบบ</button>
    `;
    grid.appendChild(card);
  });

  document.getElementById('paid-count').textContent = paidCount;
  document.getElementById('unpaid-count').textContent = students.length - paidCount;
}

// ── SUBMIT PAYMENT (WRITE) ──
async function submitPayment() {
  const s = current; if (!s) return;
  const date = document.getElementById('pf-date').value;
  if (!date) { toast('⚠️ กรุณาเลือกวันที่ชำระ', '#c05621'); return; }

  toast('⏳ กำลังอัปโหลดและบันทึกข้อมูล...', '#1e3a5f');

  const fn  = document.getElementById('pf-fullname').value;
  const pre = document.getElementById('pf-prefix').value;
  const yr  = document.getElementById('pf-year').value;
  const late = withLate ? LATE : 0;
  const total = FIXED + late;

  const payload = {
    studentId: s.id,
    prefix: pre,
    fullname: fn,
    year: yr,
    date: date,
    total: total,
    lateFee: withLate,
    slip: currentSlip
  };

  try {
    // ส่งข้อมูลแบบ POST
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors', // สำคัญ: เพื่อไม่ให้ติดปัญหา CORS ในขาโพสต์
      cache: 'no-cache',
      body: JSON.stringify(payload)
    });

    // บันทึกลงหน้าเว็บชั่วคราว
    payments[s.id] = {
      fullname: fn, prefix: pre,
      amt: FIXED, late: late, total: total,
      date: date, year: yr, lateFee: withLate
    };

    const btnSlip = document.querySelector('button[onclick*="slip-upload"]');
    if (btnSlip) { btnSlip.innerHTML = `📁 แนบหลักฐาน`; btnSlip.style.color = ''; }

    currentSlip = null;
    renderGrid();
    renderSummary();
    toast('✅ บันทึกข้อมูลและสลิปสำเร็จ!');
    showPage('home');

  } catch (error) {
    console.error('Error:', error);
    toast('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ', '#c05621');
  }
}

// ── สรุปยอด (SUMMARY) ──
function renderSummary() {
  const tb = document.getElementById('summary-tbody');
  if(!tb) return;
  tb.innerHTML = '';
  let paidCount = 0;

  students.forEach(s => {
    const p = payments[s.id];
    if (p) paidCount++;
    const tr = document.createElement('tr');
    if (p) {
      tr.innerHTML = `
        <td style="font-weight:700; text-align:left">${p.prefix}${p.fullname.replace(/^(นาย|นางสาว|นาง|ว่าที่ร้อยตรี)/, '')}</td>
        <td style="font-size:12.5px; color:var(--ink-mid)">${s.id}</td>
        <td>${p.year}</td>
        <td>${p.amt.toLocaleString('th-TH')} บาท</td>
        <td><span class="chk ${p.lateFee ? 'y' : 'n'}">${p.lateFee ? '✓' : '✕'}</span></td>
        <td style="font-weight:800; font-size:15px">${p.total.toLocaleString('th-TH')}</td>
        <td><span class="tag-paid">✓ ชำระแล้ว</span></td>`;
    } else {
      tr.innerHTML = `<td style="font-weight:600; text-align:left">${s.name}</td><td style="font-size:12.5px; color:var(--ink-mid)">${s.id}</td><td>—</td><td>—</td><td>—</td><td>—</td><td><span class="tag-unpaid">รอชำระ</span></td>`;
    }
    tb.appendChild(tr);
  });
}

// ── ฟังก์ชันอื่นๆ (LOGIN/AVATAR/NAV/SLIP) ──
function uploadAvatar(id) { document.getElementById(`av-${id}`).click(); }
function saveAvatar(e, id) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const s = students.find(x => x.id === id);
    if (s) s.photo = ev.target.result;
    savePhotos(); renderGrid();
  };
  reader.readAsDataURL(file);
}

function handleSlipUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    currentSlip = ev.target.result;
    const btn = document.querySelector('.pf-actions .btn-ghost');
    if (btn) { btn.innerHTML = `✅ แนบหลักฐานแล้ว`; btn.style.color = 'var(--green)'; }
    toast('📎 แนบหลักฐานเรียบร้อย');
  };
  r.readAsDataURL(file);
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
}

function openLogin(id) {
  current = students.find(x => x.id === id);
  document.getElementById('modal-name').textContent = current.name;
  const inner = document.getElementById('modal-avatar-inner');
  inner.innerHTML = current.photo ? `<img src="${current.photo}">` : svgIcon();
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-modal').classList.add('open');
}

function closeModal() { document.getElementById('login-modal').classList.remove('open'); }

function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  if (u === current.id && p === pw(current.id)) { closeModal(); openForm(current); }
  else { toast('❌ รหัสผ่านไม่ถูกต้อง', '#c05621'); }
}

function openForm(s) {
  document.getElementById('pf-name').textContent = s.name;
  document.getElementById('pf-id').textContent = 'รหัสนักศึกษา ' + s.id;
  document.getElementById('pf-fullname').value = s.name;
  document.getElementById('pf-date').value = new Date().toISOString().split('T')[0];
  setLateFee(false);
  showPage('form');
}

function setLateFee(v) {
  withLate = v;
  document.getElementById('btn-late-yes').className = 'toggle-btn ' + (v ? 'on' : 'off');
  document.getElementById('btn-late-no').className  = 'toggle-btn ' + (!v ? 'on' : 'off');
  const total = FIXED + (v ? LATE : 0);
  document.getElementById('pf-total').textContent = total.toLocaleString('th-TH');
}

function toast(msg, color) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-dot').style.background = color || '#1e3a5f';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

function toggleMenu() { document.querySelector('.sidebar').classList.toggle('active'); }

// ── INIT ──
loadLogo();
loadPhotos();
loadPaymentsFromSheet(); // โหลดข้อมูลจาก Google Sheets
renderGrid();
renderSummary();