(function () {
  const STORE = 'daily-calendar-v1';
  const $ = (id) => document.getElementById(id);

  let data = {};
  try { data = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {} };

  // Merge starter tasks once (tracked by id so deleted ones stay deleted).
  const SEEDED = STORE + '-seeded';
  let seeded = [];
  try { seeded = JSON.parse(localStorage.getItem(SEEDED)) || []; } catch (e) {}
  (window.SEED_TASKS || []).forEach((s) => {
    if (seeded.includes(s.id)) return;
    (data[s.date] = data[s.date] || []).push({ text: s.text, done: false });
    seeded.push(s.id);
  });
  try { localStorage.setItem(SEEDED, JSON.stringify(seeded)); } catch (e) {}
  save();

  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = new Date();
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = key(today);

  const list = (k) => data[k] || [];

  function renderCalendar() {
    $('month-label').textContent = view.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    const box = $('days');
    box.innerHTML = '';
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay());
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const k = key(d);
      const b = document.createElement('button');
      b.className = 'cell' + (d.getMonth() !== view.getMonth() ? ' other' : '') +
        (k === key(today) ? ' today' : '') + (k === selected ? ' selected' : '');
      const items = list(k);
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = d.getDate();
      b.appendChild(num);
      items.slice(0, 3).forEach((t) => {
        const line = document.createElement('span');
        line.className = 'item' + (t.done ? ' done' : '');
        line.textContent = t.text;
        line.title = t.text;
        b.appendChild(line);
      });
      if (items.length > 3) {
        const more = document.createElement('span');
        more.className = 'more';
        more.textContent = '+' + (items.length - 3) + ' more';
        b.appendChild(more);
      }
      b.onclick = () => { selected = k; renderAll(); };
      box.appendChild(b);
    }
  }

  function renderDay() {
    const [y, m, d] = selected.split('-').map(Number);
    $('day-label').textContent = new Date(y, m - 1, d).toLocaleDateString(undefined,
      { weekday: 'long', month: 'long', day: 'numeric' }) + (selected === key(today) ? ' (today)' : '');
    const ul = $('todos');
    ul.innerHTML = '';
    const items = list(selected);
    $('todos-empty').hidden = items.length > 0;
    items.forEach((t, i) => {
      const li = document.createElement('li');
      if (t.done) li.className = 'done';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = t.done;
      cb.onchange = () => { t.done = cb.checked; save(); renderAll(); };
      const span = document.createElement('span');
      span.textContent = t.text;
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '✕'; del.setAttribute('aria-label', 'Delete');
      del.onclick = () => { items.splice(i, 1); if (!items.length) delete data[selected]; save(); renderAll(); };
      li.append(cb, span, del);
      ul.appendChild(li);
    });
  }

  function renderAll() { renderCalendar(); renderDay(); }

  $('add-form').onsubmit = (e) => {
    e.preventDefault();
    const text = $('add-input').value.trim();
    if (!text) return;
    (data[selected] = data[selected] || []).push({ text, done: false });
    $('add-input').value = '';
    save(); renderAll();
  };
  $('prev').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCalendar(); };
  $('next').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCalendar(); };
  $('today-btn').onclick = () => {
    selected = key(today);
    view = new Date(today.getFullYear(), today.getMonth(), 1);
    renderAll();
  };

  // ---- Daily "what's on today" notification, fired when the app is opened ----
  function todaysPending() { return list(key(today)).filter((t) => !t.done); }

  function showBanner() {
    const items = todaysPending();
    $('banner-title').textContent = 'Today, ' + today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const ul = $('banner-list');
    ul.innerHTML = '';
    items.forEach((t) => { const li = document.createElement('li'); li.textContent = t.text; ul.appendChild(li); });
    $('banner-empty').hidden = items.length > 0;
    $('banner').hidden = false;
  }
  $('banner-close').onclick = () => { $('banner').hidden = true; };

  function systemNotify() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const items = todaysPending();
    const body = items.length ? items.map((t) => '• ' + t.text).join('\n') : 'Nothing planned yet — add your to-dos.';
    try { new Notification('Today: ' + items.length + ' thing' + (items.length === 1 ? '' : 's') + ' to do', { body }); } catch (e) {}
  }

  const btn = $('notify-btn');
  if ('Notification' in window && Notification.permission === 'default') {
    btn.hidden = false;
    btn.onclick = () => Notification.requestPermission().then(() => { btn.hidden = true; systemNotify(); });
  }

  const themeBtn = $('theme-btn');
  const syncTheme = () => {
    themeBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  };
  themeBtn.onclick = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('daily-calendar-theme', next); } catch (e) {}
    syncTheme();
  };
  syncTheme();

  renderAll();
  showBanner();
  systemNotify();
})();
