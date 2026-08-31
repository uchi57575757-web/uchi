/* Swap these two lines only when moving to a different Supabase project. */
const SUPABASE_URL  = 'https://wxriequozugedpzayfjx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cmllcXVvenVnZWRwemF5Zmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTExNjQsImV4cCI6MjEwMzcyNzE2NH0.bk6SQj2N4H8NwgZCgFjswJWvR7ELIK3wB33du99XJYE';

const STORAGE_BUCKET = 'uploads';

const { createClient } = (window.supabase || { createClient: null });
const READY = !!createClient;
const db = READY ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

async function fetchAll(table, options = {}) {
  if (!db) return [];
  try {
    let query = db.from(table).select('*');
    if (options.order)  query = query.order(options.order, { ascending: options.asc ?? false });
    if (options.limit)  query = query.limit(options.limit);
    if (options.filter) query = query.eq(options.filter.col, options.filter.val);
    const { data, error } = await query;
    if (error) { console.error(`fetchAll(${table})`, error); return []; }
    return data || [];
  } catch (e) { console.error(`fetchAll(${table})`, e); return []; }
}

async function insertRow(table, row) {
  if (!db) return false;
  try {
    const { error } = await db.from(table).insert(row);
    if (error) { console.error(`insertRow(${table})`, error); return false; }
    return true;
  } catch (e) { console.error(`insertRow(${table})`, e); return false; }
}

async function deleteRow(table, id) {
  if (!db) return false;
  try {
    const { error } = await db.from(table).delete().eq('id', id);
    if (error) { console.error(`deleteRow(${table})`, error); return false; }
    return true;
  } catch (e) { console.error(`deleteRow(${table})`, e); return false; }
}

async function updateRow(table, id, updates) {
  if (!db) return false;
  try {
    const { error } = await db.from(table).update(updates).eq('id', id);
    if (error) { console.error(`updateRow(${table})`, error); return false; }
    return true;
  } catch (e) { console.error(`updateRow(${table})`, e); return false; }
}

async function compressImage(file, maxW = 1200, quality = 0.8) {
  if (file.type === 'image/gif') return file;
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = URL.createObjectURL(file);
    });
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(img.src);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
    return blob || file;
  } catch (e) {
    console.error('compressImage', e);
    return file;
  }
}

async function uploadImage(file, folder = 'uploads') {
  if (!db) return null;
  try {
    const blob = await compressImage(file);
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${folder}/${Date.now()}_${rand}.jpg`;
    const { error } = await db.storage.from(STORAGE_BUCKET).upload(path, blob, {
      upsert: true, contentType: 'image/jpeg'
    });
    if (error) { console.error('uploadImage', error); return null; }
    const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    console.error('uploadImage', e);
    return null;
  }
}

function showToast(msg, duration = 2500) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* Height postMessage stays off: the SOOP post viewer does not listen, and reacting to
   frame size changes caused a reload loop. */
function initIframeResize() { }
function enableIframeAutoHeight() { initIframeResize(); }

async function applyTheme() {
  if (!db) return;
  try {
    const { data } = await db.from('profile').select('data').eq('id', 1).single();
    const p = (data && data.data) || {};
    const map = {
      'theme-main': '--main',
      'theme-main-dark': '--main-dark',
      'theme-main-deep': '--main-deep',
      'theme-main-light': '--main-light',
      'theme-sub': '--sub',
      'theme-bg': '--bg',
      'theme-logo': '--logo',
      'type-display': '--fs-display',
      'type-title': '--fs-title',
      'type-body': '--fs-body',
      'type-label': '--fs-label'
    };
    Object.keys(map).forEach(function (k) {
      if (p[k]) document.documentElement.style.setProperty(map[k], p[k]);
    });
  } catch (e) { }
}
applyTheme();
