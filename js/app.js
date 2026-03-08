// ── DATA & CONFIG ──
const FIXED = 6400;
const LATE  = 500;
// ใส่ URL ของ Web App จาก Google Apps Script ที่ลงท้ายด้วย /exec
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycby4GdBCYNCx7UC83rwiKk8TjkJ3AKI-VFBT7BlBLAJXcCHKi_jLJlMirh8tdofMxto/exec";

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

let payments = {}; // เก็บข้อมูลการชำระที่ดึงจาก Sheet
let current  = null; // นักศึกษาที่กำลังดำเนินการ
let withLate = false;
let currentSlip = null;

// ── HELPERS ──
const pw = id => 'DBT' + id.slice(-3);
const svgIcon = () => `<svg viewBox="0 0 80 80" fill="#cbd5e0" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="18"/><ellipse cx="40" cy="65" rx="28" ry="18"/></svg>`;

// ── LOAD FROM SHEET (GET) ──
async function loadPaymentsFromSheet() {
  try {
    const response = await fetch(GOOGLE_SHEET_URL, { redirect: 'follow' });
    if (!response.ok) throw new Error('Network response failed');
    const data = await response.json();
    
    if (Array.isArray(data)) {
      payments = {};
      data.forEach(item => {
        if (item.studentId) {
          payments[item.studentId] = {
            fullname: item.fullname,
            year: item.year,
            date: item.date,
            lateFee: !!item.lateFee,
            total: item.total,
            amt: FIXED
          };
        }
      });
      renderGrid();
      renderSummary();
    }
  } catch (error) {
    console.warn("ยังไม่มีข้อมูลชำระเงินในระบบ:", error);
  }
}

// ── RENDER GRID (HOME) ──
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
      <div class="s-avatar">${av}</div>
      <div class="s-name">${s.name}</div>
      <div class="s-badge ${paid ? 'paid' : 'unpaid'}">${paid ? '✓ ชำระแล้ว' : '· ยังไม่ชำระ'}</div>
      <button class="s-login-btn" onclick="openLogin('${s.id}')">🔑 เข้าสู่ระบบ</button>
    `;
    grid.appendChild(card);
  });

  document.getElementById('paid-count').textContent = paidCount;
  document.getElementById('unpaid-count').textContent = students.length - paidCount;
}

// ── LOGIN MODAL ──
function openLogin(id) {
  current = students.find(x => x.id === id);
  document.getElementById('modal-name').textContent = current.name;
  const inner = document.getElementById('modal-avatar-inner');
  inner.innerHTML = current.photo ? `<img src="${current.photo}">` : svgIcon();
  
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-modal').classList.add('open');
  document.getElementById('login-error').style.display = 'none';
}

function closeModal() {
  document.getElementById('login-modal').classList.remove('open');
}

function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  if (u === current.id && p === pw(current.id)) {
    closeModal();
    openForm(current);
  } else {
    document.getElementById('login-error').style.display = 'block';
    toast('❌ รหัสผ่านไม่ถูกต้อง', '#c05621');
  }
}

// ── FORM PAGE (แก้ไขรหัสหายที่นี่) ──
function openForm(s) {
  // 1. เติมข้อมูลลงหน้าจอ
  document.getElementById('pf-name').textContent = s.name;
  document.getElementById('pf-id').textContent = 'รหัสนักศึกษา ' + s.id;
  
  // 2. เติมข้อมูลลง Input (สำคัญ: ตรงกับ ID pf-student-id ใน HTML ของคุณ)
  document.getElementById('pf-student-id').value = s.id;
  document.getElementById('pf-fullname').value = s.name;
  document.getElementById('pf-prefix').value = s.prefix || 'นาย';
  document.getElementById('pf-date').value = new Date().toISOString().split('T')[0];
  
  // 3. จัดการรูปในหน้าฟอร์ม
  const inner = document.getElementById('pf-avatar-inner');
  inner.innerHTML = s.photo ? `<img src="${s.photo}">` : svgIcon();

  setLateFee(false);
  currentSlip = null;
  
  const slipBtn = document.querySelector('button[onclick*="slip-upload"]');
  if (slipBtn) { slipBtn.innerHTML = `📁 แนบหลักฐาน`; slipBtn.style.color = ''; }

  showPage('form');
}

function setLateFee(v) {
  withLate = v;
  document.getElementById('btn-late-yes').className = 'toggle-btn ' + (v ? 'on' : 'off');
  document.getElementById('btn-late-no').className  = 'toggle-btn ' + (!v ? 'on' : 'off');
  
  const chip = document.getElementById('late-chip');
  chip.style.display = v ? 'inline-block' : 'none';

  const total = FIXED + (v ? LATE : 0);
  document.getElementById('pf-total').textContent = total.toLocaleString();
  document.getElementById('total-breakdown').textContent = `ค่าเทอม 6,400 บาท ${v ? '+ ค่าปรับ 500 บาท' : ''}`;
}

// ── SLIP UPLOAD ──
function handleSlipUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    currentSlip = ev.target.result; // base64
    const btn = document.querySelector('button[onclick*="slip-upload"]');
    if (btn) { btn.innerHTML = `✅ แนบหลักฐานแล้ว`; btn.style.color = '#2f855a'; }
    toast('📎 แนบหลักฐานเรียบร้อย');
  };
  r.readAsDataURL(file);
}

// ── SUBMIT (POST) ──
async function submitPayment() {
  if (!current) return;
  const date = document.getElementById('pf-date').value;
  if (!date) { toast('⚠️ กรุณาเลือกวันที่ชำระ', '#c05621'); return; }

  toast('⏳ กำลังบันทึกข้อมูลและอัปโหลดสลิป...', '#1e3a5f');

  const payload = {
    studentId: current.id,
    prefix: document.getElementById('pf-prefix').value,
    fullname: document.getElementById('pf-fullname').value,
    year: document.getElementById('pf-year').value,
    date: date,
    total: FIXED + (withLate ? LATE : 0),
    lateFee: withLate,
    slip: currentSlip
  };

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload)
    });

    // จำลองสถานะชำระแล้วบนหน้าจอทันที
    payments[current.id] = {
      fullname: payload.fullname,
      year: payload.year,
      date: payload.date,
      lateFee: payload.lateFee,
      total: payload.total,
      amt: FIXED
    };

    renderGrid();
    renderSummary();
    toast('✅ บันทึกข้อมูลสำเร็จ!');
    showPage('home');
  } catch (error) {
    toast('❌ เกิดข้อผิดพลาด', '#c05621');
  }
}

// ── SUMMARY TABLE ──
function renderSummary() {
  const tb = document.getElementById('summary-tbody');
  if(!tb) return;
  tb.innerHTML = '';
  
  students.forEach(s => {
    const p = payments[s.id];
    const tr = document.createElement('tr');
    if (p) {
      tr.innerHTML = `
        <td style="text-align:left; font-weight:700;">${p.fullname}</td>
        <td>${s.id}</td>
        <td>${p.year}</td>
        <td>${p.amt.toLocaleString()}</td>
        <td>${p.lateFee ? '500' : '0'}</td>
        <td style="font-weight:bold; color:var(--navy)">${p.total.toLocaleString()}</td>
        <td><span class="tag-paid">✓ ชำระแล้ว</span></td>
      `;
    } else {
      tr.innerHTML = `
        <td style="text-align:left; color:var(--ink-mid)">${s.name}</td>
        <td style="color:var(--ink-mid)">${s.id}</td>
        <td>—</td><td>—</td><td>—</td><td>—</td>
        <td><span class="tag-unpaid">รอชำระ</span></td>
      `;
    }
    tb.appendChild(tr);
  });
}

// ── UI NAVIGATION ──
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if(window.innerWidth < 768) toggleMenu();
}

function toggleMenu() {
  document.querySelector('.sidebar').classList.toggle('active');
}

function toast(msg, color) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-dot').style.background = color || '#2f855a';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── INITIALIZE ──
window.onload = () => {
  loadPaymentsFromSheet();
};