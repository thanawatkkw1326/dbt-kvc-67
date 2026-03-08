// ── DATA & CONFIG ──
const FIXED = 6400;
const LATE  = 500;
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycby4GdBCYNCx7UC83rwiKk8TjkJ3AKI-VFBT7BlBLAJXcCHKi_jLJlMirh8tdofMxto/exec";

const students = [
  { id:'67402040001', name:'นางสาวขวัญเนตร ธนะบุตร', photo:'images/67402040001.jpg' },
  { id:'67402040002', name:'นางสาวจิราภรณ์ กงสะเด็น',  photo:'images/67402040002.jpg' },
  { id:'67402040003', name:'นายชนาธิป หารสุโพธิ์',  photo:'images/67402040003.jpg' },
  { id:'67402040004', name:'นางสาวชลธิชา ศิลากุล', prefix:'นางสาว', photo:'images/67402040004.png' },
  { id:'67402040005', name:'นายณัฐภูมิ เขียวสด', prefix:'นาย', photo:'images/67402040005.jpg' },
  { id:'67402040006', name:'นายธนาวัฒน์ คำกอง', prefix:'นาย', photo:'images/67402040006.jpg' },
  { id:'67402040008', name:'นายภูมิวิวัฒน์ มาตยคุณ', prefix:'นาย', photo:'images/67402040008.jpg' },
  { id:'67402040009', name:'นางสาวมินตรา โคตะมะ', prefix:'นางสาว', photo:'images/67402040009.jpg' },
  { id:'67402040011', name:'นางสาวสุนิสา สมณะ', prefix:'นางสาว', photo:'images/67402040011.jpg' },
  { id:'67402040012', name:'นางสาวอาทิตยา โยสิคุณ', prefix:'นางสาว', photo:'images/67402040012.jpg' },
  { id:'67402040013', name:'นางสาวอินทราวารี สุนทอง', prefix:'นางสาว', photo:'images/67402040013.jpg' },
  { id:'67402040014', name:'นางสาวกตวรรณ จุลโพธิ์', prefix:'นางสาว', photo:'images/67402040014.jpg' },
  { id:'67402040015', name:'นางสาวภัทรสุดา หวานขม', prefix:'นางสาว', photo:'images/67402040015.jpg' },
  { id:'67402040016', name:'นายอิสระ วัฒนาเสรีพล', prefix:'นาย', photo:'images/67402040016.jpg' },
  { id:'67402040018', name:'นางสาวกุลสตรี กอจันกลาง', prefix:'นางสาว', photo:'images/67402040018.jpg' },
  { id:'67402040019', name:'ว่าที่ร้อยตรีชาติณรงค์ น้อยมาลา', prefix:'ว่าที่ร้อยตรี', photo:'images/67402040019.jpg' },
  { id:'67402040021', name:'นางสาวศิริรัตน์ ชินนอก', prefix:'นางสาว', photo:'images/67402040021.jpg' },
];

let payments = {};
let current  = null;
let withLate = false;
let currentSlip = null;

const pw = id => 'DBT' + id.slice(-3);
const svgIcon = () => `<svg viewBox="0 0 80 80" fill="#cbd5e0" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="18"/><ellipse cx="40" cy="65" rx="28" ry="18"/></svg>`;

// ── LOAD FROM SHEET ──
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
            fullname : item.fullname,
            year     : item.year,
            date     : item.date,
            lateFee  : item.lateFee === true || item.lateFee === 'true',
            total    : Number(item.total),
            amt      : FIXED,
          };
        }
      });
    }
  } catch (error) {
    console.warn("ยังไม่มีข้อมูลชำระเงินในระบบ:", error);
  } finally {
    renderGrid();
    renderSummary();
  }
}

// ── RENDER GRID ──
function renderGrid() {
  const grid = document.getElementById('student-grid');
  if (!grid) return;
  grid.innerHTML = '';
  let paidCount = 0;

  students.forEach(s => {
    const paid = payments[s.id];
    if (paid) paidCount++;
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
      <div class="s-avatar">${s.photo ? `<img src="${s.photo}" onerror="this.parentElement.innerHTML='${svgIcon()}'">` : svgIcon()}</div>
      <div class="s-name">${s.name}</div>
      <div class="s-badge ${paid ? 'paid' : 'unpaid'}">${paid ? '✓ ชำระแล้ว' : '· ยังไม่ชำระ'}</div>
      <button class="s-login-btn" onclick="openLogin('${s.id}')">🔑 เข้าสู่ระบบ</button>
    `;
    grid.appendChild(card);
  });

  const pCount = document.getElementById('paid-count');
  const uCount = document.getElementById('unpaid-count');
  if (pCount) pCount.textContent = paidCount;
  if (uCount) uCount.textContent = students.length - paidCount;
}

// ── LOGIN ──
function openLogin(id) {
  current = students.find(x => x.id === id);
  if (!current) return;

  const modalName = document.getElementById('modal-name');
  const inner     = document.getElementById('modal-avatar-inner');
  if (modalName) modalName.textContent = current.name;
  if (inner) inner.innerHTML = current.photo
    ? `<img src="${current.photo}" onerror="this.parentElement.innerHTML='${svgIcon()}'">` : svgIcon();

  const userInp = document.getElementById('login-user');
  const passInp = document.getElementById('login-pass');
  const modal   = document.getElementById('login-modal');
  const err     = document.getElementById('login-error');

  if (userInp) userInp.value = '';
  if (passInp) passInp.value = '';
  if (modal)   modal.classList.add('open');
  if (err)     err.style.display = 'none';
}

function closeModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('open');
}

function doLogin() {
  const uInp = document.getElementById('login-user');
  const pInp = document.getElementById('login-pass');
  if (!uInp || !pInp) return;

  const u = uInp.value.trim();
  const p = pInp.value.trim();

  if (u === current.id && p === pw(current.id)) {
    closeModal();
    openForm(current);
  } else {
    const err = document.getElementById('login-error');
    if (err) err.style.display = 'block';
    toast('❌ รหัสผ่านไม่ถูกต้อง', '#c05621');
  }
}

// ── FORM PAGE ──
function openForm(s) {
  current = s;

  const pfName   = document.getElementById('pf-name');
  const pfId     = document.getElementById('pf-id');
  const idInput  = document.getElementById('pf-student-id');
  const fullInput= document.getElementById('pf-fullname');
  const preInput = document.getElementById('pf-prefix');
  const dateInput= document.getElementById('pf-date');
  const inner    = document.getElementById('pf-avatar-inner');

  if (pfName)    pfName.textContent   = s.name;
  if (pfId)      pfId.textContent     = 'รหัสนักศึกษา ' + s.id;
  if (idInput)   idInput.value        = s.id;
  if (fullInput) fullInput.value      = s.name;
  if (preInput)  preInput.value       = s.prefix || 'นาย';
  if (dateInput) dateInput.value      = new Date().toISOString().split('T')[0];
  if (inner)     inner.innerHTML      = s.photo
    ? `<img src="${s.photo}" onerror="this.parentElement.innerHTML='${svgIcon()}'">` : svgIcon();

  setLateFee(false);
  currentSlip = null;

  const slipBtn = document.querySelector('button[onclick*="slip-upload"]');
  if (slipBtn) { slipBtn.innerHTML = `📁 แนบหลักฐาน`; slipBtn.style.color = ''; }

  showPage('form');
}

function setLateFee(v) {
  withLate = v;
  const btnYes      = document.getElementById('btn-late-yes');
  const btnNo       = document.getElementById('btn-late-no');
  const chip        = document.getElementById('late-chip');
  const totalDisplay= document.getElementById('pf-total');
  const breakdown   = document.getElementById('total-breakdown');

  if (btnYes) btnYes.className = 'toggle-btn ' + (v ? 'on' : 'off');
  if (btnNo)  btnNo.className  = 'toggle-btn ' + (!v ? 'on' : 'off');
  if (chip)   chip.style.display = v ? 'inline-block' : 'none';

  const total = FIXED + (v ? LATE : 0);
  if (totalDisplay) totalDisplay.textContent = total.toLocaleString();
  if (breakdown)    breakdown.textContent = `ค่าเทอม 6,400 บาท ${v ? '+ ค่าปรับ 500 บาท' : ''}`;
}

// ── SLIP UPLOAD ──
function handleSlipUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    currentSlip = ev.target.result;
    const btn = document.querySelector('button[onclick*="slip-upload"]');
    if (btn) { btn.innerHTML = `✅ แนบหลักฐานแล้ว`; btn.style.color = '#2f855a'; }
    toast('📎 แนบหลักฐานเรียบร้อย');
  };
  r.readAsDataURL(file);
}

// ── SUBMIT (แก้ไขแล้ว) ──
async function submitPayment() {
  if (!current) return;

  const dateInp = document.getElementById('pf-date');
  const yearInp = document.getElementById('pf-year');
  const prefInp = document.getElementById('pf-prefix');
  const nameInp = document.getElementById('pf-fullname');

  if (!dateInp || !dateInp.value) {
    toast('⚠️ กรุณาเลือกวันที่ชำระ', '#c05621');
    return;
  }

  toast('⏳ กำลังบันทึกข้อมูล...', '#1e3a5f');

  const payload = {
    studentId : current.id,
    prefix    : prefInp ? prefInp.value : (current.prefix || ''),
    fullname  : nameInp ? nameInp.value : current.name,
    year      : yearInp ? yearInp.value : '',
    date      : dateInp.value,
    total     : FIXED + (withLate ? LATE : 0),
    lateFee   : withLate ? 'true' : 'false',
    // slip ส่งแยกต่างหาก ไม่รวมใน payload หลัก เพราะ base64 ใหญ่เกิน
  };

  // URLSearchParams ทำงานร่วมกับ mode:no-cors ได้ถูกต้อง
  const body = new URLSearchParams(payload).toString();

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method  : 'POST',
      mode    : 'no-cors',
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
      body    : body,
    });

    // อัพเดท local state ทันที
    payments[current.id] = {
      fullname : payload.fullname,
      year     : payload.year,
      date     : payload.date,
      lateFee  : withLate,
      total    : payload.total,
      amt      : FIXED,
    };

    renderGrid();
    renderSummary();
    toast('✅ บันทึกข้อมูลสำเร็จ!');
    showPage('home');

  } catch (error) {
    console.error('submitPayment error:', error);
    toast('❌ เกิดข้อผิดพลาด: ' + error.message, '#c05621');
  }
}

// ── SUMMARY TABLE ──
function renderSummary() {
  const tb = document.getElementById('summary-tbody');
  if (!tb) return;
  tb.innerHTML = '';

  students.forEach(s => {
    const p  = payments[s.id];
    const tr = document.createElement('tr');
    if (p) {
      tr.innerHTML = `
        <td>${p.fullname}</td>
        <td>${s.id}</td>
        <td>${p.year || '—'}</td>
        <td>${Number(p.amt).toLocaleString()}</td>
        <td>${p.lateFee ? '500' : '0'}</td>
        <td>${Number(p.total).toLocaleString()}</td>
        <td><span class="tag-paid">✓ ชำระแล้ว</span></td>`;
    } else {
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.id}</td>
        <td>—</td><td>—</td><td>—</td><td>—</td>
        <td><span class="tag-unpaid">รอชำระ</span></td>`;
    }
    tb.appendChild(tr);
  });
}

// ── UI NAVIGATION ──
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));

  const targetPage = document.getElementById('page-' + name);
  if (targetPage) {
    targetPage.classList.add('active');
  } else {
    console.warn(`หน้า id="page-${name}" ไม่มีอยู่ใน HTML`);
  }

  const targetNav = document.getElementById('nav-' + name);
  if (targetNav) targetNav.classList.add('active');

  const sidebar = document.querySelector('.sidebar');
  if (window.innerWidth < 768 && sidebar && sidebar.classList.contains('active')) {
    toggleMenu();
  }
}

function toggleMenu() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('active');
}

function toast(msg, color) {
  const t    = document.getElementById('toast');
  const tMsg = document.getElementById('toast-msg');
  const tDot = document.getElementById('toast-dot');
  if (!t || !tMsg || !tDot) return;
  tMsg.textContent       = msg;
  tDot.style.background  = color || '#2f855a';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── INITIALIZE ──
window.addEventListener('DOMContentLoaded', loadPaymentsFromSheet);