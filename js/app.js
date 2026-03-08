// ── DATA & CONFIG ──
const FIXED = 6400;
const LATE  = 500;
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycby4GdBCYNCx7UC83rwiKk8TjkJ3AKI-VFBT7BlBLAJXcCHKi_jLJlMirh8tdofMxto/exec";

const students = [
  { id:'67402040001', name:'นางสาวขวัญเนตร ธนะบุตร',         prefix:'นางสาว',       photo:'images/67402040001.jpg' },
  { id:'67402040002', name:'นางสาวจิราภรณ์ กงสะเด็น',         prefix:'นางสาว',       photo:'images/67402040002.jpg' },
  { id:'67402040003', name:'นายชนาธิป หารสุโพธิ์',            prefix:'นาย',          photo:'images/67402040003.jpg' },
  { id:'67402040004', name:'นางสาวชลธิชา ศิลากุล',            prefix:'นางสาว',       photo:'images/67402040004.png' },
  { id:'67402040005', name:'นายณัฐภูมิ เขียวสด',              prefix:'นาย',          photo:'images/67402040005.jpg' },
  { id:'67402040006', name:'นายธนาวัฒน์ คำกอง',               prefix:'นาย',          photo:'images/67402040006.jpg' },
  { id:'67402040008', name:'นายภูมิวิวัฒน์ มาตยคุณ',          prefix:'นาย',          photo:'images/67402040008.jpg' },
  { id:'67402040009', name:'นางสาวมินตรา โคตะมะ',             prefix:'นางสาว',       photo:'images/67402040009.jpg' },
  { id:'67402040011', name:'นางสาวสุนิสา สมณะ',               prefix:'นางสาว',       photo:'images/67402040011.jpg' },
  { id:'67402040012', name:'นางสาวอาทิตยา โยสิคุณ',           prefix:'นางสาว',       photo:'images/67402040012.jpg' },
  { id:'67402040013', name:'นางสาวอินทราวารี สุนทอง',         prefix:'นางสาว',       photo:'images/67402040013.jpg' },
  { id:'67402040014', name:'นางสาวกตวรรณ จุลโพธิ์',           prefix:'นางสาว',       photo:'images/67402040014.jpg' },
  { id:'67402040015', name:'นางสาวภัทรสุดา หวานขม',           prefix:'นางสาว',       photo:'images/67402040015.jpg' },
  { id:'67402040016', name:'นายอิสระ วัฒนาเสรีพล',            prefix:'นาย',          photo:'images/67402040016.jpg' },
  { id:'67402040018', name:'นางสาวกุลสตรี กอจันกลาง',         prefix:'นางสาว',       photo:'images/67402040018.jpg' },
  { id:'67402040019', name:'ว่าที่ร้อยตรีชาติณรงค์ น้อยมาลา', prefix:'ว่าที่ร้อยตรี', photo:'images/67402040019.jpg' },
  { id:'67402040021', name:'นางสาวศิริรัตน์ ชินนอก',           prefix:'นางสาว',       photo:'images/67402040021.jpg' },
];

let payments    = {};
let current     = null;
let withLate    = false;
let currentSlip = null;

const pw = id => 'DBT' + id.slice(-3);

// SVG placeholder เก็บแยก ไม่ฝังใน template literal
const SVG_PLACEHOLDER = '<svg viewBox="0 0 80 80" fill="#cbd5e0" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="18"/><ellipse cx="40" cy="65" rx="28" ry="18"/></svg>';
function svgIcon() { return SVG_PLACEHOLDER; }
function imgError(el) { el.parentElement.innerHTML = SVG_PLACEHOLDER; }

// แปลงวันที่ทุกรูปแบบ → dd/mm/yyyy พ.ศ.
function formatDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return day + '/' + mon + '/' + year;
}

// ─────────────────────────────────────────
// LOAD FROM SHEET
// ─────────────────────────────────────────
async function loadPaymentsFromSheet() {
  try {
    // timeout 5 วิ — ถ้า Sheet ตอบช้า render grid ทันทีโดยไม่รอ
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(GOOGLE_SHEET_URL, {
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('Network response failed');
    const data = await res.json();

    if (Array.isArray(data)) {
      payments = {};
      data.forEach(item => {
        if (item.studentId) {
          payments[item.studentId] = {
            fullname : item.fullname  || '',
            year     : '2/2568',
            date     : item.date ? String(item.date).split('T')[0] : '',
            lateFee  : item.lateFee === true || item.lateFee === 'true',
            total    : Number(item.total) || FIXED,
            amt      : FIXED,
          };
        }
      });
    }
  } catch (err) {
    console.warn('โหลดข้อมูลไม่ได้:', err);
  } finally {
    renderGrid();
    renderSummary();
  }
}

// ─────────────────────────────────────────
// RENDER GRID
// ─────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('student-grid');
  if (!grid) return;
  grid.innerHTML = '';
  let paidCount = 0;
  const fragment = document.createDocumentFragment(); // batch DOM insert = เร็วขึ้น

  students.forEach(s => {
    const paid = !!payments[s.id];
    if (paid) paidCount++;

    // สร้างทุก element ด้วย createElement — ไม่มี innerHTML ทำให้ไม่มี "> หลุดออกมา
    const card   = document.createElement('div');
    card.className = 'student-card';

    // avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 's-avatar';
    if (s.photo) {
      const img = document.createElement('img');
      img.src     = s.photo;
      img.alt     = s.name;
      img.loading = 'lazy';          // โหลดช้า → หน้าแรกเร็วขึ้น
      img.decoding = 'async';
      img.onerror = function() { this.parentElement.innerHTML = SVG_PLACEHOLDER; };
      avatarDiv.appendChild(img);
    } else {
      avatarDiv.innerHTML = SVG_PLACEHOLDER;
    }

    // name
    const nameDiv = document.createElement('div');
    nameDiv.className   = 's-name';
    nameDiv.textContent = s.name;

    // badge
    const badge = document.createElement('div');
    badge.className   = 's-badge ' + (paid ? 'paid' : 'unpaid');
    badge.textContent = paid ? '✓ ชำระแล้ว' : '· ยังไม่ชำระ';

    // button
    const btn = document.createElement('button');
    btn.className   = 's-login-btn';
    btn.textContent = '🔑 เข้าสู่ระบบ';
    btn.onclick     = () => openLogin(s.id);

    card.appendChild(avatarDiv);
    card.appendChild(nameDiv);
    card.appendChild(badge);
    card.appendChild(btn);
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);

  const pCount = document.getElementById('paid-count');
  const uCount = document.getElementById('unpaid-count');
  if (pCount) pCount.textContent = paidCount;
  if (uCount) uCount.textContent = students.length - paidCount;
}

// ─────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────
function openLogin(id) {
  current = students.find(x => x.id === id);
  if (!current) return;

  const modalName = document.getElementById('modal-name');
  const inner     = document.getElementById('modal-avatar-inner');
  if (modalName) modalName.textContent = current.name;
  if (inner) {
    inner.innerHTML = '';
    if (current.photo) {
      const img = document.createElement('img');
      img.src     = current.photo;
      img.alt     = current.name;
      img.onerror = function() { this.parentElement.innerHTML = SVG_PLACEHOLDER; };
      inner.appendChild(img);
    } else {
      inner.innerHTML = SVG_PLACEHOLDER;
    }
  }

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
  if (!uInp || !pInp || !current) return;

  const u = uInp.value.trim();
  const p = pInp.value.trim();

  if (u === current.id && p === pw(current.id)) {
    closeModal();
    openForm(current);
  } else {
    const err = document.getElementById('login-error');
    if (err) err.style.display = 'block';
    toast('รหัสผ่านไม่ถูกต้อง', '#c05621');
  }
}

// ─────────────────────────────────────────
// FORM PAGE
// ─────────────────────────────────────────
function openForm(s) {
  current = s;

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setVal  = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  setText('pf-name', s.name);
  setText('pf-id',   'รหัสนักศึกษา ' + s.id);
  setVal('pf-student-id', s.id);
  setVal('pf-fullname',   s.name);
  setVal('pf-date',       new Date().toISOString().split('T')[0]);

  // ตั้ง prefix ให้ตรงกับ option ที่มีใน select
  const prefSel = document.getElementById('pf-prefix');
  if (prefSel) {
    const target = s.prefix || 'นาย';
    const match  = [...prefSel.options].find(o => o.value === target || o.text === target);
    prefSel.value = match ? match.value : prefSel.options[0].value;
  }

  // avatar
  const inner = document.getElementById('pf-avatar-inner');
  if (inner) {
    inner.innerHTML = '';
    if (s.photo) {
      const img = document.createElement('img');
      img.src     = s.photo;
      img.alt     = s.name;
      img.onerror = function() { this.parentElement.innerHTML = SVG_PLACEHOLDER; };
      inner.appendChild(img);
    } else {
      inner.innerHTML = SVG_PLACEHOLDER;
    }
  }

  // reset slip
  const slipBtn = document.querySelector('button[onclick*="slip-upload"]');
  if (slipBtn) { slipBtn.innerHTML = '📁 แนบหลักฐาน'; slipBtn.style.color = ''; }

  currentSlip = null;
  setLateFee(false);
  showPage('form');
}

// ─────────────────────────────────────────
// LATE FEE TOGGLE
// ─────────────────────────────────────────
function setLateFee(v) {
  withLate = v;
  const btnYes  = document.getElementById('btn-late-yes');
  const btnNo   = document.getElementById('btn-late-no');
  const chip    = document.getElementById('late-chip');
  const totalEl = document.getElementById('pf-total');
  const breakEl = document.getElementById('total-breakdown');

  if (btnYes) btnYes.className = 'toggle-btn ' + (v ? 'on' : 'off');
  if (btnNo)  btnNo.className  = 'toggle-btn ' + (!v ? 'on' : 'off');
  if (chip)   chip.style.display = v ? 'inline-block' : 'none';

  const total = FIXED + (v ? LATE : 0);
  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (breakEl) breakEl.textContent = `ค่าเทอม 6,400 บาท${v ? ' + ค่าปรับ 500 บาท' : ''}`;
}

// ─────────────────────────────────────────
// SLIP UPLOAD
// ─────────────────────────────────────────
function handleSlipUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    currentSlip = ev.target.result;
    const btn = document.querySelector('button[onclick*="slip-upload"]');
    if (btn) { btn.innerHTML = '✅ แนบหลักฐานแล้ว'; btn.style.color = '#2f855a'; }
    toast('📎 แนบหลักฐานเรียบร้อย');
  };
  r.readAsDataURL(file);
}

// ─────────────────────────────────────────
// PHOTO UPLOAD (avatar ใน form)
// ─────────────────────────────────────────
function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    const inner = document.getElementById('pf-avatar-inner');
    if (inner) inner.innerHTML = `<img src="${ev.target.result}">`;
  };
  r.readAsDataURL(file);
}

// ─────────────────────────────────────────
// LOGO UPLOAD
// ─────────────────────────────────────────
function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    const btn = document.getElementById('logo-btn');
    if (!btn) return;
    // ล้าง border dashed แล้วแสดงรูปแทน
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.padding = '0';
    // ใส่รูปเข้าไปใน button โดยตรง
    btn.innerHTML = '<img src="' + ev.target.result + '" style="width:100%;height:100%;object-fit:contain;border-radius:10px;display:block;">';
  };
  r.readAsDataURL(file);
}

// ─────────────────────────────────────────
// SUBMIT ← จุดหลักที่แก้
// ─────────────────────────────────────────
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
    total     : String(FIXED + (withLate ? LATE : 0)),
    lateFee   : withLate ? 'true' : 'false',
  };

  // URLSearchParams + no-cors คือวิธีเดียวที่ browsers อนุญาตให้ POST ไป Apps Script
  const body = new URLSearchParams(payload).toString();

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method  : 'POST',
      mode    : 'no-cors',
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    // อัพเดท local state ทันที ไม่ต้องรอ reload
    payments[current.id] = {
      fullname : payload.fullname,
      year     : payload.year,
      date     : payload.date,
      lateFee  : withLate,
      total    : Number(payload.total),
      amt      : FIXED,
    };

    renderGrid();
    renderSummary();
    toast('✅ บันทึกข้อมูลสำเร็จ!');
    showPage('home');

  } catch (err) {
    console.error('submitPayment error:', err);
    toast('❌ เกิดข้อผิดพลาด: ' + err.message, '#c05621');
  }
}

// ─────────────────────────────────────────
// SUMMARY TABLE
// ─────────────────────────────────────────
function renderSummary() {
  const tb = document.getElementById('summary-tbody');
  if (!tb) return;
  tb.innerHTML = '';

  students.forEach(s => {
    const p  = payments[s.id];
    const tr = document.createElement('tr');
    if (p) {
      tr.innerHTML =
        '<td>' + (p.fullname || s.name) + '</td>' +
        '<td>' + s.id + '</td>' +
        '<td>2/2568</td>' +
        '<td>' + Number(p.amt).toLocaleString() + '</td>' +
        '<td>' + (p.lateFee ? '500' : '0') + '</td>' +
        '<td>' + Number(p.total).toLocaleString() + '</td>' +
        '<td><span class="tag-paid">✓ ชำระแล้ว</span></td>';
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

// ─────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  else console.warn('ไม่พบหน้า: page-' + name);

  const nav = document.getElementById('nav-' + name);
  if (nav) nav.classList.add('active');

  const sidebar = document.querySelector('.sidebar');
  if (window.innerWidth < 768 && sidebar && sidebar.classList.contains('active')) {
    toggleMenu();
  }
}

function toggleMenu() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('active');
}

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────
function toast(msg, color) {
  const t    = document.getElementById('toast');
  const tMsg = document.getElementById('toast-msg');
  const tDot = document.getElementById('toast-dot');
  if (!t || !tMsg || !tDot) return;
  tMsg.textContent      = msg;
  tDot.style.background = color || '#2f855a';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', loadPaymentsFromSheet);
