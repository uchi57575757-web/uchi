/* Shared wiring for every page.
   Load order: supabase-js CDN -> supabase.js -> site.js -> page script -> fx.js -> fallback */

var SOOP_ID = 'uchi5757';
var SITE_NAME = '우치';
var BIRTH_MMDD = '12-20';

/* Site design width. The whole site is a fixed 1200px layout; fitShell() scales it
   down instead of switching to a mobile branch, so phones and the SOOP iframe keep
   the desktop arrangement. */
var DESIGN_W = 1200;

var EMBED = (function () {
  try { return window.self !== window.top; } catch (e) { return true; }
})();

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function soopAvatar(id) {
  if (!id) return null;
  id = String(id).trim().toLowerCase();
  if (id.length < 2) return null;
  return 'https://profile.img.sooplive.co.kr/LOGO/' + id.slice(0, 2) + '/' + id + '/' + id + '.jpg';
}

function fmtDate(s) {
  try {
    var d = new Date(s);
    if (isNaN(d)) return '';
    return String(d.getFullYear()).slice(2) + '.' +
      String(d.getMonth() + 1).padStart(2, '0') + '.' +
      String(d.getDate()).padStart(2, '0');
  } catch (e) { return ''; }
}

/* Days until the next MM-DD. Lives here so pages do not have to wait for fx.js. */
function siteDday(mmdd) {
  try {
    var m = String(mmdd).match(/(\d{1,2})\D+(\d{1,2})/);
    if (!m) return null;
    var mo = parseInt(m[1], 10), da = parseInt(m[2], 10);
    if (!mo || !da || mo > 12 || da > 31) return null;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var next = new Date(now.getFullYear(), mo - 1, da);
    if (next < now) next = new Date(now.getFullYear() + 1, mo - 1, da);
    return Math.round((next - now) / 86400000);
  } catch (e) { return null; }
}

/* ---- fit ---- */

function fitShell() {
  var outer = document.getElementById('fitOuter');
  var inner = document.getElementById('fitInner');
  if (!outer || !inner) return;
  var avail = document.documentElement.clientWidth || window.innerWidth || DESIGN_W;
  var s = Math.min(1, avail / DESIGN_W);
  if (s >= 1) {
    inner.style.transform = '';
    outer.style.height = '';
    return;
  }
  inner.style.transform = 'scale(' + s.toFixed(5) + ')';
  outer.style.height = Math.ceil(inner.offsetHeight * s) + 'px';
}

/* ---- dark mode ---- */

function bindDark() {
  var box = document.getElementById('dkbox');
  if (!box) return;
  box.addEventListener('click', function () {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

/* ---- shared profile data (one request per page) ---- */

window.profileData = (function () {
  if (typeof db === 'undefined' || !db) return Promise.resolve({});
  return db.from('profile').select('data').eq('id', 1)
    .then(function (r) { return (r.data && r.data[0] && r.data[0].data) || {}; })
    .catch(function () { return {}; });
})();

/* Page heading text comes from the admin words tab: {slug}-kicker / -title / -sub / -lead */
function wireHeading(slug) {
  window.profileData.then(function (d) {
    [['hd-kicker', slug + '-kicker'], ['hd-title', slug + '-title'],
     ['hd-sub', slug + '-sub'], ['page-lead', slug + '-lead']].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      var v = d[pair[1]];
      if (el && typeof v === 'string' && v.trim()) el.textContent = v.trim();
    });
  });
}

/* Fill the top bar avatar button from the saved avatar URL, else the SOOP profile picture. */
function wireNavAvatar() {
  window.profileData.then(function (d) {
    var img = document.getElementById('navAvatar');
    if (!img) return;
    var url = (typeof d.avatar === 'string' && d.avatar.trim())
      ? d.avatar.trim()
      : soopAvatar((typeof d['soop-id'] === 'string' && d['soop-id'].trim()) || SOOP_ID);
    if (!url) return;
    img.onload = function () { img.style.display = 'block'; };
    img.src = url;
  });
  window.profileData.then(function (d) {
    var a = document.getElementById('navSoop');
    if (a && typeof d['link-soop'] === 'string' && d['link-soop'].trim()) a.href = d['link-soop'].trim();
  });
}

/* ---- inquiry modal ---- */

function openAsk() {
  var m = document.getElementById('askmask');
  if (!m) return;
  m.classList.add('on');
  placeOverlay(m);
  var t = document.getElementById('askmsg');
  if (t) setTimeout(function () { t.focus(); }, 60);
}
function closeAsk() {
  var m = document.getElementById('askmask');
  if (m) m.classList.remove('on');
}
async function sendAsk() {
  var t = document.getElementById('askmsg');
  var n = document.getElementById('asknick');
  var v = (t.value || '').trim();
  if (!v) { showToast('내용을 입력해 주세요'); return; }
  var row = { message: v };
  if (n && n.value.trim()) row.nickname = n.value.trim();
  var ok = false;
  try { ok = await insertRow('inquiries', row); } catch (e) { ok = false; }
  showToast(ok ? '문의를 보냈어요' : '전송에 실패했어요. 잠시 후 다시 시도해 주세요');
  if (ok) { t.value = ''; if (n) n.value = ''; closeAsk(); }
}

/* ---- overlays ----
   In an iframe `position:fixed` is measured against the whole frame box, which the
   SOOP app makes thousands of px tall, so overlays are absolute and placed near the
   last click instead. */
var lastClickY = 0;
document.addEventListener('click', function (e) {
  if (e.pageY) lastClickY = e.pageY;
}, true);

function placeOverlay(ov) {
  if (!ov) return;
  var dh = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  var inner = ov.querySelector('.askmodal, .ovbox, .lb-inner');
  var ih = inner ? inner.offsetHeight : 280;
  var base = lastClickY || (window.scrollY + 160);
  var y = Math.round(Math.max(16, Math.min(base - ih / 2, Math.max(16, dh - ih - 16))));
  ov.style.height = dh + 'px';
  if (inner) inner.style.marginTop = y + 'px';
}

function closeAllOverlays() {
  closeAsk();
  ['ov', 'lightbox'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('show', 'open');
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeAllOverlays();
});

/* Any overlay that gets opened elsewhere is repositioned the same way. */
new MutationObserver(function (muts) {
  muts.forEach(function (r) {
    var t = r.target;
    if (t.matches && t.matches('.askmask, .ov, .lightbox') &&
        (t.classList.contains('on') || t.classList.contains('show') || t.classList.contains('open'))) {
      placeOverlay(t);
    }
  });
}).observe(document.documentElement, { attributes: true, attributeFilter: ['class'], subtree: true });

/* ---- boot ---- */

function siteBoot() {
  bindDark();
  wireNavAvatar();
  fitShell();
  var mask = document.getElementById('askmask');
  if (mask) {
    mask.addEventListener('click', function (e) { if (e.target === mask) closeAsk(); });
  }
  window.addEventListener('resize', fitShell);
  window.addEventListener('load', fitShell);
  if (window.ResizeObserver) {
    var inner = document.getElementById('fitInner');
    if (inner) new ResizeObserver(fitShell).observe(inner);
  }
  [200, 700, 1500].forEach(function (t) { setTimeout(fitShell, t); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', siteBoot);
else siteBoot();
