// ── DATA & CONFIG ──
const FIXED = 6400;
const LATE  = 500;
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzfP1aRTKl_iZh2Q2kGeVIYKN1-pu_5fOKURdCBVd1UnBUFPPy9A4oqf6zJDo08rPA-/exec";

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

// โลโก้ถาวร — embed base64
const LOGO_DATA = 'data:image/png;base64,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';

function loadLogo() {
  const btn = document.getElementById('logo-btn');
  if (!btn) return;
  btn.style.border      = 'none';
  btn.style.background  = 'transparent';
  btn.style.padding     = '0';
  btn.innerHTML = '<img src="' + LOGO_DATA + '" style="width:100%;height:100%;object-fit:contain;border-radius:10px;display:block;">';
}

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
    const timer = setTimeout(() => controller.abort(), 3000);
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
    badge.className   = 's-badge ' + (paid ? 'paid' : 'unpaid-red');
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
    // sync กลับจาก Sheet ทันทีหลัง submit
    setTimeout(pollSheet, 1500);

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
// REALTIME POLL
// ─────────────────────────────────────────
let lastHash = '';

async function pollSheet() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res  = await fetch(GOOGLE_SHEET_URL + '?t=' + Date.now(), {
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data)) return;

    // เปรียบเทียบ hash — re-render เฉพาะเมื่อข้อมูลเปลี่ยน
    const hash = JSON.stringify(data);
    if (hash === lastHash) return;
    lastHash = hash;

    payments = {};
    data.forEach(item => {
      if (item.studentId) {
        payments[item.studentId] = {
          fullname : item.fullname || '',
          year     : '2/2568',
          date     : item.date ? String(item.date).split('T')[0] : '',
          lateFee  : item.lateFee === true || item.lateFee === 'true',
          total    : Number(item.total) || FIXED,
          amt      : FIXED,
        };
      }
    });

    renderGrid();
    renderSummary();
  } catch (_) {}
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // 1. render ทันทีไม่รอ network
  loadLogo();
  renderGrid();
  renderSummary();

  // 2. โหลดครั้งแรก
  pollSheet();

  // 3. poll ทุก 15 วิ — realtime
  setInterval(pollSheet, 15000);
});