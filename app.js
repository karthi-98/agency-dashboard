/* Spark Pixel agency dashboard: sample data and interactions. Everything stays in this browser. */
'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const hydrateIcons = (root = document) => $$('[data-icon]', root).forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const money = value => '$' + value.toLocaleString('en-US');

/* ---------- KPIs ---------- */
const kpis = [
  { label: 'Total Revenue', value: '$20,320', bars: [27, 35, 27, 35, 39, 28, 28] },
  { label: 'Total Orders', value: '10,320', unit: 'Orders', bars: [27, 36, 29, 45, 20, 28, 30] },
  { label: 'New Customers', value: '4,305', unit: 'New Users', bars: [28, 36, 30, 35, 40, 28, 28] },
  { label: 'Conversion Rate', value: '3.9%', bars: [28, 36, 29, 35, 41, 29, 29] }
];
$('#kpis').innerHTML = kpis.map(kpi => `
  <article class="card kpi">
    <div class="card-body">
      <h3 class="kpi-label">${kpi.label}</h3>
      <p class="kpi-value"><strong>${kpi.value}</strong>${kpi.unit ? `<span>${kpi.unit}</span>` : ''}</p>
      <div class="sparkline" aria-hidden="true">${kpi.bars.map((h, i) => `<span class="${i === 3 ? 'on' : ''}" style="height:${h}px"></span>`).join('')}</div>
    </div>
    <footer class="kpi-foot"><i data-icon="arrowUpCircle" class="solid-icon"></i><p><span class="delta">+0,94</span> last year</p></footer>
  </article>`).join('');

/* ---------- Sales trend (57 columns × 25 rows of 10px cells, 2px gaps) ---------- */
const COLS = 57, ROWS = 25, PITCH = 12, CELL = 10, STEP_K = 2.5;
const CHART_LEFT = 76, CHART_TOP = 19;
const monthly = {
  // Gray stack height (new users) and orange height (existing users), in cells.
  total: [4, 5, 6, 8, 11, 9, 7, 10, 15, 13, 9, 6, 10, 9, 7, 6, 8, 12, 15, 20, 10, 7, 4, 2, 5, 9, 15, 11, 6, 9, 13, 16, 12, 9, 7, 3, 1, 8, 10, 13, 9, 8, 6, 4, 8, 10, 6, 5, 7, 10, 15, 13, 8, 6, 7, 8, 12],
  existing: [1, 2, 3, 2, 5, 7, 5, 6, 3, 1, 5, 3, 4, 6, 4, 3, 1, 3, 8, 5, 3, 2, 1, 2, 3, 6, 4, 5, 3, 1, 2, 8, 5, 2, 2, 1, 1, 3, 4, 7, 3, 3, 2, 1, 2, 8, 3, 4, 5, 3, 1, 2, 2, 4, 6, 3, 1],
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  title: i => `${monthly.labels[i]} 2025`,
  revenue: '$20,320',
  overrides: { 26: 18 }
};
function seeded(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function makeSeries(seed, base, spread) {
  const rand = seeded(seed);
  const existing = [], total = [];
  for (let i = 0; i < COLS; i++) {
    const wave = Math.sin(i / 2.6 + seed) * 0.5 + 0.5;
    const ex = Math.max(1, Math.round(1 + wave * spread * rand() + rand() * 2));
    existing.push(Math.min(ex, 12));
    total.push(Math.min(ROWS - 1, ex + Math.round(base * rand() + wave * 4)));
  }
  return { existing, total };
}
const ranges = {
  weekly: { ...makeSeries(7, 9, 6), labels: Array.from({ length: 12 }, (_, i) => `W${i + 1}`), title: i => `Week ${i + 1}, 2025`, revenue: '$4,860', overrides: {} },
  monthly,
  yearly: { ...makeSeries(19, 12, 8), labels: Array.from({ length: 12 }, (_, i) => String(2014 + i)), title: i => String(2014 + i), revenue: '$236,480', overrides: {} }
};
let range = 'monthly';
let activeCol = 26;
const cells = $('#cells');
const chart = $('#sales-chart');
const tooltip = $('#chart-tooltip');
const crosshair = $('#crosshair');
const periodOf = col => Math.min(11, Math.floor(col * 12 / COLS));
const valuesAt = col => {
  const data = ranges[range];
  return { newK: Math.round(data.total[col] * STEP_K), existingK: data.overrides[col] ?? Math.round(data.existing[col] * STEP_K) };
};

function renderCells() {
  const data = ranges[range];
  let svg = '';
  for (let c = 0; c < COLS; c++) {
    let g = `<g data-col="${c}"${c === activeCol ? ' class="hover"' : ''}>`;
    for (let r = 0; r < ROWS; r++) {
      const kind = r < data.existing[c] ? 'ex' : r < data.total[c] ? 'new' : '';
      g += `<rect x="${c * PITCH}" y="${(ROWS - 1 - r) * PITCH}" width="${CELL}" height="${CELL}" rx="2"${kind ? ` class="${kind}"` : ''}/>`;
    }
    svg += g + '</g>';
  }
  cells.innerHTML = svg;
  $('#sales-total').textContent = data.revenue;
  const yLabels = $$('.y-axis li');
  yLabels.forEach((li, i) => { li.style.top = `${30 + i * 46.4}px`; });
  const axis = $('#x-axis');
  axis.innerHTML = data.labels.map((label, i) => {
    const x = 103 + i * 57;
    const dot = i < 11 ? `<li class="dot" style="left:${x + 28.5}px"></li>` : '';
    return `<li data-period="${i}" style="left:${x}px">${label}</li>${dot}`;
  }).join('');
}

// Pointer moves glide (interruptible translate transitions); keyboard and data changes jump instantly.
function setActiveCol(col, announce = false, instant = announce) {
  activeCol = Math.max(0, Math.min(COLS - 1, col));
  chart.classList.toggle('instant', instant);
  $$('g.hover', cells).forEach(g => g.classList.remove('hover'));
  cells.querySelector(`g[data-col="${activeCol}"]`)?.classList.add('hover');
  const data = ranges[range];
  const period = periodOf(activeCol);
  const { newK, existingK } = valuesAt(activeCol);
  const centerX = CHART_LEFT + activeCol * PITCH + CELL / 2;
  const stackTop = CHART_TOP + (ROWS - data.total[activeCol]) * PITCH;
  const dotY = Math.max(CHART_TOP + 4, stackTop - 7);
  crosshair.style.translate = `${centerX}px 0`;
  $('.crosshair-dot', crosshair).style.translate = `0 ${dotY - CHART_TOP - 4.5}px`;
  $('#tooltip-title').textContent = data.title(period);
  $('#tooltip-new').textContent = `${newK}k`;
  $('#tooltip-existing').textContent = `${existingK}k`;
  const width = 157, flip = centerX + 6 + width > chart.clientWidth - 8;
  tooltip.style.translate = `${flip ? centerX - 6 - width : centerX + 6}px ${Math.max(4, Math.min(dotY - 19, 300 - 108))}px`;
  $$('#x-axis li[data-period]').forEach(li => li.classList.toggle('current', Number(li.dataset.period) === period));
  if (announce) $('#chart-live').textContent = `${data.title(period)}: new users ${newK}k, existing users ${existingK}k`;
}

chart.addEventListener('pointermove', event => {
  const rect = cells.getBoundingClientRect();
  const x = event.clientX - rect.left;
  if (x < -PITCH || x > rect.width + PITCH) return;
  const col = Math.round((x - CELL / 2) / PITCH);
  if (col !== activeCol) setActiveCol(col);
});
chart.addEventListener('keydown', event => {
  const step = event.shiftKey ? 5 : 1;
  if (event.key === 'ArrowRight') { event.preventDefault(); setActiveCol(activeCol + step, true); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); setActiveCol(activeCol - step, true); }
  if (event.key === 'Home') { event.preventDefault(); setActiveCol(0, true); }
  if (event.key === 'End') { event.preventDefault(); setActiveCol(COLS - 1, true); }
});

/* Tabs with a sliding pill. The first placement skips the transition. */
const tabs = $$('.tab');
const indicator = $('.tab-indicator');
function placeIndicator(tab, animate = true) {
  if (!animate) indicator.style.transition = 'none';
  indicator.style.setProperty('--x', `${tab.offsetLeft}px`);
  indicator.style.setProperty('--w', `${tab.offsetWidth}px`);
  if (!animate) { indicator.offsetWidth; indicator.style.transition = ''; }
}
function selectTab(tab, focus = false) {
  tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  placeIndicator(tab);
  if (focus) tab.focus();
  range = tab.dataset.range;
  renderCells();
  setActiveCol(range === 'monthly' ? 26 : activeCol);
}
tabs.forEach((tab, i) => {
  tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[(next + tabs.length) % tabs.length], true);
  });
});

/* ---------- Revenue breakdown ---------- */
const categories = ['Chairs', 'Desks', 'Shelves', 'Lamps', 'Storage', 'Sofas', 'Tables', 'Rugs', 'Workstations', 'Decor', 'Cabinets', 'Lighting', 'Outdoor'];
const capacity = [142, 174, 119, 198, 155, 109, 143, 109, 186, 129, 166, 143, 126];
const revenue = [96, 128, 73, 155, 102, 73, 110, 67, 147, 82, 120, 85, 82];
$('#bars').innerHTML =
  Array.from({ length: 8 }, (_, i) => `<span class="grid-line" style="top:${12 + i * 32}px"></span>`).join('') +
  capacity.map((h, i) => `<span class="bar" style="left:${19.5 + i * 24}px;height:${h}px;bottom:1px" title="${categories[i]}: ${money(revenue[i] * 26)}"><span style="height:${revenue[i]}px"></span></span>`).join('');

/* ---------- Transactions ---------- */
const statusIcon = { Success: 'checkCircle', Pending: 'clock', Refunded: 'refundCircle' };
let transactions = [
  { id: '04910', customer: 'Ryan Korsgaard', product: 'Ergo Office Chair', status: 'Success', qty: 12, price: 3450, total: 41400 },
  { id: '04911', customer: 'Madelyn Lubin', product: 'Sunset Desk 02', status: 'Success', qty: 20, price: 2980, total: 89200 },
  { id: '04912', customer: 'Abram Bergson', product: 'Eco Bookshelf', status: 'Pending', qty: 22, price: 1750, total: 75900 },
  { id: '04913', customer: 'Phillip Mango', product: 'Green Leaf Desk', status: 'Refunded', qty: 24, price: 1950, total: 19500 }
];
const selected = new Set();
let sortKey = null, sortDir = 1, query = '';

function visibleRows() {
  const q = query.trim().toLowerCase();
  let rows = transactions.filter(t => !q || [t.id, t.customer, t.product, t.status].some(v => v.toLowerCase().includes(q)));
  if (sortKey) rows = [...rows].sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : a[sortKey] < b[sortKey] ? -1 : 0) * sortDir);
  return rows;
}
function renderRows(addedId) {
  const rows = visibleRows();
  $('#rows').innerHTML = rows.map(t => `
    <tr data-id="${t.id}" class="${selected.has(t.id) ? 'selected' : ''}${t.id === addedId ? ' added' : ''}">
      <td class="col-check"><input type="checkbox" aria-label="Select transaction #${t.id}"${selected.has(t.id) ? ' checked' : ''}></td>
      <td class="col-id">#${t.id}</td>
      <td class="col-customer">${escapeHTML(t.customer)}</td>
      <td class="col-product">${escapeHTML(t.product)}</td>
      <td><span class="status ${t.status.toLowerCase()}"><i class="solid-icon">${icon(statusIcon[t.status])}</i>${t.status}</span></td>
      <td class="num">${t.qty}</td>
      <td class="num money">${money(t.price)}</td>
      <td class="num money">${money(t.total)}</td>
      <td class="col-actions"><button class="row-action" type="button" aria-label="Actions for #${t.id}" aria-haspopup="menu" aria-expanded="false">${icon('more')}</button></td>
    </tr>`).join('');
  $('#table-empty').hidden = rows.length > 0;
  const all = $('#select-all');
  const picked = rows.filter(t => selected.has(t.id)).length;
  all.checked = rows.length > 0 && picked === rows.length;
  all.indeterminate = picked > 0 && picked < rows.length;
}
$('#rows').addEventListener('change', event => {
  if (!event.target.matches('input[type=checkbox]')) return;
  const id = event.target.closest('tr').dataset.id;
  event.target.checked ? selected.add(id) : selected.delete(id);
  renderRows();
});
$('#select-all').addEventListener('change', event => {
  visibleRows().forEach(t => event.target.checked ? selected.add(t.id) : selected.delete(t.id));
  renderRows();
});
$$('.sort').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.sort;
  sortDir = sortKey === key ? -sortDir : 1;
  sortKey = key;
  $$('.sort').forEach(b => { delete b.dataset.dir; b.closest('th').removeAttribute('aria-sort'); });
  button.dataset.dir = sortDir > 0 ? 'asc' : 'desc';
  button.closest('th').setAttribute('aria-sort', sortDir > 0 ? 'ascending' : 'descending');
  renderRows();
}));
const tableSearch = $('#table-search');
tableSearch.addEventListener('input', () => { query = tableSearch.value; renderRows(); });
$('#global-search').addEventListener('input', event => { tableSearch.value = event.target.value; query = event.target.value; renderRows(); });

const pool = [
  ['Lena Ortiz', 'Nordic Lounge Chair', 1280], ['Marcus Hale', 'Oak Standing Desk', 2640], ['Priya Nair', 'Arc Floor Lamp', 640],
  ['Tomás Reyes', 'Modular Shelf Set', 1890], ['Ava Lindqvist', 'Walnut Side Table', 720]
];
$('#add-transaction').addEventListener('click', () => {
  const next = String(Math.max(...transactions.map(t => Number(t.id))) + 1).padStart(5, '0');
  const [customer, product, price] = pool[(Number(next) - 4914) % pool.length];
  const qty = 4 + (Number(next) % 9);
  transactions = [{ id: next, customer, product, status: 'Pending', qty, price, total: qty * price }, ...transactions];
  renderRows(next);
  showToast(`Transaction #${next} added`);
});

$('#export-csv').addEventListener('click', () => {
  const header = ['ID', 'Customer', 'Product', 'Status', 'Qty', 'Unit Price', 'Total Revenue'];
  const lines = visibleRows().map(t => [`#${t.id}`, t.customer, t.product, t.status, t.qty, t.price, t.total]);
  const csv = [header, ...lines].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'transactions-2025-11-06.csv' });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast(`Exported ${lines.length} transactions`);
});

/* ---------- Menus ---------- */
let openMenu = null;
function closeMenu(restoreFocus = true) {
  if (!openMenu) return;
  const { menu, trigger } = openMenu;
  menu.dataset.state = 'closed';
  trigger.setAttribute('aria-expanded', 'false');
  setTimeout(() => { if (menu.dataset.state === 'closed') menu.hidden = true; }, 150);
  if (restoreFocus) trigger.focus();
  openMenu = null;
}
function showMenu(menu, trigger) {
  if (openMenu?.trigger === trigger) { closeMenu(); return; }
  closeMenu(false);
  menu.hidden = false;
  menu.dataset.state = 'open';
  trigger.setAttribute('aria-expanded', 'true');
  openMenu = { menu, trigger };
  const first = menu.querySelector('[aria-selected="true"]') || menu.querySelector('.menu-item');
  first?.focus({ preventScroll: true });
}
document.addEventListener('pointerdown', event => {
  if (openMenu && !openMenu.menu.contains(event.target) && !openMenu.trigger.contains(event.target)) closeMenu(false);
});
document.addEventListener('keydown', event => {
  if (!openMenu) return;
  // The date picker handles its own arrow keys; it only shares Escape.
  if (openMenu.menu === datePicker) { if (event.key === 'Escape') { event.preventDefault(); closeMenu(); } return; }
  const items = $$('.menu-item', openMenu.menu);
  const index = items.indexOf(document.activeElement);
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
  if (event.key === 'ArrowDown') { event.preventDefault(); items[(index + 1) % items.length].focus(); }
  if (event.key === 'ArrowUp') { event.preventDefault(); items[(index - 1 + items.length) % items.length].focus(); }
  if (event.key === 'Tab') closeMenu(false);
});

const periodMenu = $('#period-menu');
$('#period-button').addEventListener('click', event => showMenu(periodMenu, event.currentTarget));
periodMenu.addEventListener('click', event => {
  const item = event.target.closest('.menu-item');
  if (!item) return;
  $$('.menu-item', periodMenu).forEach(i => i.setAttribute('aria-selected', i === item));
  $('#period-label').textContent = item.dataset.period;
  closeMenu();
});

/* ---------- Date picker ---------- */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const datePicker = $('#date-picker');
const dateButton = $('#date-button');
const dpDays = $('#dp-days');
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const shortDate = d => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
const today = startOfDay(new Date());
let selectedDate = new Date(2025, 10, 6);
let focusDate = selectedDate;
let viewMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

function addMonths(d, n) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay));
}
function renderPicker() {
  $('#dp-title').textContent = `${MONTHS[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;
  // Always 6 rows, Monday first, so the popover height never jumps between months.
  const first = addDays(viewMonth, -((viewMonth.getDay() + 6) % 7));
  let html = '';
  for (let week = 0; week < 6; week++) {
    html += '<div class="dp-row" role="row">';
    for (let day = 0; day < 7; day++) {
      const d = addDays(first, week * 7 + day);
      const classes = ['dp-day', d.getMonth() !== viewMonth.getMonth() && 'outside', sameDay(d, today) && 'today'].filter(Boolean).join(' ');
      const future = d > today;
      html += `<div role="gridcell" aria-selected="${sameDay(d, selectedDate)}"><button type="button" class="${classes}" data-date="${d.getFullYear()}-${d.getMonth()}-${d.getDate()}" tabindex="${sameDay(d, focusDate) ? 0 : -1}" aria-label="${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}${sameDay(d, today) ? ' (today)' : ''}"${future ? ' aria-disabled="true"' : ''}>${d.getDate()}</button></div>`;
    }
    html += '</div>';
  }
  dpDays.innerHTML = html;
  $('[data-step="1"]', datePicker).disabled = viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();
  $('#dp-selected').textContent = `${WEEKDAYS[selectedDate.getDay()]}, ${shortDate(selectedDate)}`;
}
const dateFromButton = button => { const [y, m, d] = button.dataset.date.split('-').map(Number); return new Date(y, m, d); };
const focusDay = () => $('.dp-day[tabindex="0"]', dpDays)?.focus({ preventScroll: true });

// Month change: page-slide tokens (250ms, 8px, 3px blur) for pointer clicks; keyboard paging stays instant.
function moveFocus(date, { animate = false } = {}) {
  if (date > today) date = today;
  const monthChanged = date.getMonth() !== viewMonth.getMonth() || date.getFullYear() !== viewMonth.getFullYear();
  const direction = date < viewMonth ? -1 : 1;
  focusDate = date;
  viewMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  renderPicker();
  if (monthChanged && animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dpDays.animate(
      [{ opacity: 0, translate: `${direction * 8}px 0`, filter: 'blur(3px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0)' }],
      { duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
  }
}
function selectDate(date) {
  selectedDate = date;
  focusDate = date;
  $('#date-label').textContent = shortDate(date);
  renderPicker();
  closeMenu();
}

dateButton.addEventListener('click', () => {
  focusDate = selectedDate;
  viewMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  renderPicker();
  showMenu(datePicker, dateButton);
  if (openMenu?.menu === datePicker) focusDay();
});
$$('.dp-nav', datePicker).forEach(button => button.addEventListener('click', () => {
  moveFocus(addMonths(focusDate, Number(button.dataset.step)), { animate: true });
}));
dpDays.addEventListener('click', event => {
  const button = event.target.closest('.dp-day');
  if (!button || button.getAttribute('aria-disabled') === 'true') return;
  selectDate(dateFromButton(button));
});
dpDays.addEventListener('keydown', event => {
  const button = event.target.closest('.dp-day');
  if (!button) return;
  const current = dateFromButton(button);
  const weekday = (current.getDay() + 6) % 7;
  const moves = {
    ArrowLeft: () => addDays(current, -1), ArrowRight: () => addDays(current, 1),
    ArrowUp: () => addDays(current, -7), ArrowDown: () => addDays(current, 7),
    Home: () => addDays(current, -weekday), End: () => addDays(current, 6 - weekday),
    PageUp: () => addMonths(current, event.shiftKey ? -12 : -1), PageDown: () => addMonths(current, event.shiftKey ? 12 : 1)
  };
  if (moves[event.key]) { event.preventDefault(); moveFocus(moves[event.key]()); focusDay(); return; }
  if ((event.key === 'Enter' || event.key === ' ') && button.getAttribute('aria-disabled') === 'true') event.preventDefault();
});
$('#dp-today').addEventListener('click', () => selectDate(today));
datePicker.addEventListener('focusout', event => {
  if (openMenu?.menu === datePicker && event.relatedTarget && !datePicker.contains(event.relatedTarget) && event.relatedTarget !== dateButton) closeMenu(false);
});

const rowMenu = $('#row-menu');
let rowMenuId = null;
$('#rows').addEventListener('click', event => {
  const button = event.target.closest('.row-action');
  if (!button) return;
  rowMenuId = button.closest('tr').dataset.id;
  showMenu(rowMenu, button);
  if (openMenu?.menu !== rowMenu) return;
  // Open below the trigger, or above it when the viewport has no room; scale from that edge.
  const rect = button.getBoundingClientRect();
  const height = rowMenu.offsetHeight;
  const above = rect.bottom + 6 + height > window.innerHeight && rect.top - 6 - height > 0;
  rowMenu.style.setProperty('--origin', above ? 'bottom right' : 'top right');
  rowMenu.style.top = `${(above ? rect.top - 6 - height : rect.bottom + 6) + window.scrollY}px`;
  rowMenu.style.left = `${Math.max(8, rect.right - rowMenu.offsetWidth) + window.scrollX}px`;
});
rowMenu.addEventListener('click', async event => {
  const item = event.target.closest('.menu-item');
  if (!item) return;
  const row = transactions.find(t => t.id === rowMenuId);
  const action = item.dataset.rowAction;
  closeMenu(false);
  if (!row) return;
  if (action === 'view') showToast(`#${row.id} · ${row.customer} · ${row.qty} × ${row.product}`);
  if (action === 'copy') {
    try { await navigator.clipboard.writeText(`#${row.id}`); showToast(`Copied #${row.id}`); }
    catch { showToast(`#${row.id}`); }
  }
  if (action === 'refund') { row.status = 'Refunded'; renderRows(); showToast(`#${row.id} marked as refunded`); }
});

/* ---------- Toast, navigation, shortcuts ---------- */
const toast = $('#toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}
$$('[data-toast]').forEach(el => el.addEventListener('click', () => showToast(el.dataset.toast)));

$$('.nav-item').forEach(item => item.addEventListener('click', event => {
  event.preventDefault();
  $$('.nav-item').forEach(i => { i.classList.toggle('active', i === item); i.toggleAttribute('aria-current', i === item); });
  document.body.classList.remove('nav-open');
}));
const menuButton = $('.menu-button');
menuButton.addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  menuButton.setAttribute('aria-expanded', open);
});
$('.sidebar-backdrop').addEventListener('click', () => { document.body.classList.remove('nav-open'); menuButton.setAttribute('aria-expanded', 'false'); });

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#global-search').focus(); }
  const typing = event.target.matches('input, textarea, select, [contenteditable]');
  if (event.key === '/' && !typing) { event.preventDefault(); tableSearch.focus(); }
  if (event.key === 'Escape' && document.body.classList.contains('nav-open')) { document.body.classList.remove('nav-open'); menuButton.setAttribute('aria-expanded', 'false'); }
});

/* ---------- Init ---------- */
hydrateIcons();
renderCells();
setActiveCol(activeCol, false, true);
requestAnimationFrame(() => requestAnimationFrame(() => chart.classList.add('ready')));
renderRows();
const startTab = tabs.find(t => t.getAttribute('aria-selected') === 'true');
const place = () => placeIndicator(startTab && tabs.find(t => t.getAttribute('aria-selected') === 'true'), false);
place();
document.fonts?.ready.then(place);
