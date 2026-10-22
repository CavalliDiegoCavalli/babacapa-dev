/* SP-IN · design system v2 · spin-core (window.SPIN.core). Contratto e regole: DESIGN-SYSTEM-V2.md. Script classico senza dipendenze: ogni funzione restituisce HTML (stringa) che usa
   le classi di bundle.css. Testi sempre escapati; colori delle squadre passati come variabili CSS. */
(function () {
  'use strict';
  var INK = '#14202B';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; }); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function lum(h) { return rgb(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [.2126, .7152, .0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  /* colore del testo leggibile su un fondo (bianco o inchiostro) */
  function onColor(h) { return contrast(h, '#FFFFFF') >= contrast(h, INK) ? '#FFFFFF' : INK; }
  /* testo con grassetti: solo **così** diventa <b> */
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  var SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var IC = {
    plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12l5 5 9-10"/>', alert: '<path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9.5"/>',
    left: '<path d="m15 18-6-6 6-6"/>', chev: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    doc: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>', circle: '<circle cx="12" cy="12" r="8.5"/>',
    thumb: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', star: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>', team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14c2.7 0 4.5 1.9 4.5 4.8"/>'
  };
  function icon(n, w) { return '<span class="sp-ic"' + (w ? ' style="--ic:' + w + 'px"' : '') + '><svg ' + SV + '>' + (IC[n] || '') + '</svg></span>'; }
  function tagOf(o, cls, inner, extra) {
    o = o || {}; var a = extra || '';
    return o.href ? '<a class="' + cls + '" href="' + esc(o.href) + '"' + a + '>' + inner + '</a>' : '<button type="button" class="' + cls + '"' + a + '>' + inner + '</button>';
  }
  function crestHTML(t, size, cls) {
    t = t || {}; var inner = t.logo ? '<img src="' + esc(t.logo) + '" alt="">' : '<b>' + esc(t.abbr || '') + '</b>';
    return '<span class="' + (cls || 'sp-crest') + '" style="--s:' + (size || 56) + 'px;--c:' + esc(t.color || INK) + ';--crest-bg:' + esc(t.logoBg || '#FFFFFF') + '">' + inner + '</span>';
  }

  /* ---------- azioni ---------- */
  /* kind: primary | secondary | danger | cta | stage | link | quiet */
  function Button(o) {
    o = o || {};
    if (o.kind === 'link' || o.kind === 'quiet') return tagOf(o, 'sp-link' + (o.kind === 'quiet' ? ' sp-link--quiet' : ''), esc(o.label));
    var cls = 'sp-btn' + (o.kind && o.kind !== 'secondary' ? ' sp-btn--' + o.kind : '') + (o.small ? ' sp-btn--sm' : '') + (o.block ? ' sp-btn--block' : '');
    return tagOf(o, cls, '<span>' + (o.icon ? icon(o.icon, 16) : '') + esc(o.label) + '</span>', o.disabled ? ' aria-disabled="true"' : '');
  }
  function Follow(o) { o = o || {}; return '<button type="button" class="sp-follow" aria-pressed="' + !!o.on + '" aria-label="' + esc((o.on ? 'Segui già ' : 'Segui ') + (o.name || '')) + '"><span>' + icon('thumb', 18) + '</span></button>'; }

  /* ---------- moduli (Segreteria) ---------- */
  function Field(o) {
    o = o || {}; var st = o.state === 'focus' ? ' is-focus' : o.state === 'error' ? ' is-error' : '';
    var v = o.value ? '<span class="sp-v">' + esc(o.value) + '</span>' : '<span class="sp-v is-ph">' + esc(o.placeholder || '') + '</span>';
    var hint = o.state === 'error' && o.hint ? '<small class="sp-hint sp-hint--error">' + icon('alert', 13) + esc(o.hint) + '</small>' : o.hint ? '<small class="sp-hint">' + esc(o.hint) + '</small>' : '';
    return '<label class="sp-field' + (o.wide ? ' sp-wide' : '') + '"><span class="sp-field-l">' + esc(o.label) + (o.optional ? ' <small>(facoltativo)</small>' : '') + '</span>' +
      '<span class="sp-input' + st + '">' + (o.crest ? crestHTML(o.crest, 24, 'sp-crest-s') : '') + v + (o.icon ? icon(o.icon, 17) : '') + '</span>' + hint + '</label>';
  }
  function Select(o) { o = o || {}; var c = {}; for (var k in o) c[k] = o[k]; c.icon = 'down'; return Field(c); }
  function Segmented(o) { o = o || {}; return '<span class="sp-seg" role="group">' + (o.items || []).map(function (t, i) { return '<button type="button" aria-pressed="' + (i === (o.active || 0)) + '">' + esc(t) + '</button>'; }).join('') + '</span>'; }
  function Stepper(o) { o = o || {}; return '<span class="sp-step"><button type="button" aria-label="Meno">−</button><b>' + esc(o.value) + '</b><button type="button" aria-label="Più">+</button></span>'; }
  function Checkbox(o) {
    o = o || {}; var on = !!o.checked;
    var mark = o.toggle ? '<span class="sp-switch" aria-hidden="true"></span>' : '<span class="sp-box" aria-hidden="true">' + (on ? '<svg ' + SV + ' stroke-width="3">' + IC.check + '</svg>' : '') + '</span>';
    return '<span class="sp-check' + (on ? ' is-on' : '') + '" role="' + (o.toggle ? 'switch' : 'checkbox') + '" aria-checked="' + on + '" tabindex="0">' + mark + esc(o.label) + '</span>';
  }

  /* ---------- stati ---------- */
  function Status(o) {
    o = o || {}; var k = ['ok', 'warn', 'crit'].indexOf(o.kind) >= 0 ? o.kind : 'mut';
    var ic = k === 'ok' ? '<svg ' + SV + ' stroke-width="3">' + IC.check + '</svg>' : k === 'mut' ? '' : '<svg ' + SV + ' stroke-width="2.6">' + IC.alert + '</svg>';
    return '<span class="sp-st sp-st--' + k + '">' + ic + (o.text ? '<span>' + esc(o.text) + '</span>' : '') + '</span>';
  }

  /* ---------- struttura ---------- */
  function Section(o) {
    o = o || {};
    return '<section class="sp-sec" style="--c:' + esc(o.color || 'var(--type-friendly)') + '"><div class="sp-sec-h">' + (o.n ? '<span class="sp-sec-n">' + esc(String(o.n).padStart(2, '0')) + '</span>' : '') +
      '<h2>' + esc(o.title) + '</h2><span class="sp-dash" aria-hidden="true"></span>' + (o.extra ? '<span class="sp-sec-x">' + esc(o.extra) + '</span>' : '') + (o.action ? '<span class="sp-grow"></span>' + o.action : '') + '</div>' + (o.html || '') + '</section>';
  }
  function SectionTag(o) { o = o || {}; return '<div class="sp-tagline"><span class="sp-tag"><b>' + esc(o.text) + '</b></span><span class="sp-rule"></span>' + (o.extra ? '<small>' + esc(o.extra) + '</small>' : '') + '</div>'; }
  function PageHeader(o) {
    o = o || {};
    var mark = o.crest ? crestHTML(o.crest, 56) : '';
    var edit = o.edit ? '<button type="button" class="sp-edit" aria-label="Modifica"><span>' + icon('edit', 16) + '<b>Modifica</b></span></button>' : '';
    return '<div class="sp-head">' + (o.back ? '<a class="sp-back" href="#">' + icon('left', 16) + esc(o.back) + '</a>' : '') +
      (o.kicker ? '<span class="sp-row" style="gap:8px"><span class="sp-kick">' + esc(o.kicker) + '</span>' + (o.color ? '<span class="sp-dash" style="--c:' + esc(o.color) + ';width:18px;height:5px"></span>' : '') + '</span>' : '') +
      '<div class="sp-head-name">' + mark + '<h1>' + esc(o.title) + '</h1>' + edit + '</div>' + (o.sub ? '<p>' + esc(o.sub) + '</p>' : '') +
      ((o.actions || []).length ? '<div class="sp-row" style="gap:8px">' + o.actions.join('') + '</div>' : '') + '</div>';
  }
  function Todo(o) {
    o = o || {}; var it = o.items || [];
    return '<div class="sp-todo"><div class="sp-todo-h"><b>Da sistemare</b><span>' + it.length + ' cose</span></div>' + it.map(function (x) { return '<a href="#">' + Status({ kind: x.kind }) + '<span class="sp-grow">' + rich(x.text) + '</span><span class="sp-chev">' + icon('chev') + '</span></a>'; }).join('') + '</div>';
  }
  function Table(o) {
    o = o || {};
    return '<table class="sp-tbl" style="--c:' + esc(o.color || INK) + '"><thead><tr>' + (o.cols || []).map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (o.rows || []).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function WorkRow(o) { o = o || {}; return '<a class="sp-wrow" href="#"><span class="sp-wrow-i"><span>' + icon(o.icon || 'doc', 16) + '</span></span><span class="sp-grow sp-col" style="gap:2px"><b>' + esc(o.title) + '</b><small>' + esc(o.sub) + '</small></span><span class="sp-chev sp-muted">' + icon('chev') + '</span></a>'; }
  function Checklist(o) {
    o = o || {};
    return '<div class="sp-checklist">' + (o.items || []).map(function (x) { return '<span class="' + (x[1] ? 'is-done' : 'is-todo') + '"><svg ' + SV + ' stroke-width="2.6">' + (x[1] ? IC.check : IC.circle) + '</svg>' + esc(x[0]) + '</span>'; }).join('') + '</div>';
  }

  /* ---------- Tribuna ---------- */
  function Stage(o) { o = o || {}; return '<div class="sp-stage">' + (o.band === false ? '' : '<span class="sp-stage-band" aria-hidden="true"></span>') + (o.html || '') + '</div>'; }
  function Crest(o) { o = o || {}; return crestHTML(o, o.size); }
  function Scoreboard(o) {
    o = o || {}; var H = o.home || {}, A = o.away || {};
    function side(t) { var c = t.color || INK; return '<span style="--x:' + esc(c) + ';--x-on:' + onColor(c) + '"><b>' + esc(t.abbr) + '</b></span>'; }
    return '<span class="sp-bug" style="--h:' + (o.height || 28) + 'px" aria-label="' + esc((H.name || H.abbr) + ' – ' + (A.name || A.abbr) + ', ' + (o.mid || '')) + '">' + side(H) + '<span class="sp-bug-m"><b>' + esc(o.mid || 'vs') + '</b></span>' + side(A) + '</span>';
  }
  function TeamTile(o) { o = o || {}; return '<a class="sp-tile" href="#">' + crestHTML(o, 56) + '<b>' + esc(o.name) + '</b>' + (o.followed ? '<span class="sp-tile-f" title="La segui">' + icon('thumb', 14) + '</span>' : '') + '</a>'; }
  function StatTile(o) { o = o || {}; return '<div class="sp-stat" style="--c:' + esc(o.color || 'var(--accent)') + '"><span>' + esc(o.label) + '<br><b>' + esc(o.sub || '') + '</b></span><b>' + esc(o.value) + '</b></div>'; }
  function MatchRow(o) {
    o = o || {}; var t = { campionato: 'var(--type-league)', torneo: 'var(--type-cup)', amichevole: 'var(--type-friendly)' }[o.type] || 'var(--type-league)';
    return '<a class="sp-match" href="#" style="--t:' + t + '">' + Scoreboard({ home: o.home, away: o.away, mid: o.time }) + '<span class="sp-grow sp-col" style="gap:0"><b>' + esc(o.home.name + ' – ' + o.away.name) + '</b><small>' + esc(o.meta) + '</small></span><span class="sp-chev">' + icon('chev') + '</span></a>';
  }

  /* ---------- finestre e avvisi ---------- */
  function Dialog(o) { o = o || {}; return '<div class="sp-dialog" role="dialog" aria-label="' + esc(o.title) + '"><div class="sp-dialog-h"><b>' + esc(o.title) + '</b><span>' + esc(o.text) + '</span></div><div class="sp-dialog-f">' + (o.actions || []).join('') + '</div></div>'; }
  function Toast(o) { o = o || {}; return '<div class="sp-toast" role="status">' + icon('check', 16) + '<span class="sp-v">' + esc(o.text) + '</span>' + (o.action ? '<button type="button" class="sp-link">' + esc(o.action) + '</button>' : '') + '</div>'; }
  function Sheet(o) {
    o = o || {}; var t = o.team || {}, a = t.color || INK, b = t.altColor || INK;
    return '<div class="sp-sheet" role="dialog" aria-label="' + esc('Scheda di ' + t.name) + '"><span class="sp-grip" aria-hidden="true"></span><div class="sp-sheet-h" style="--a:' + esc(a) + ';--b:' + esc(b) + ';--b-on:' + onColor(b) + '"><span class="sp-sheet-band"></span>' +
      crestHTML({ logo: t.logo, abbr: t.abbr, color: t.color }, 68) + '<span class="sp-sheet-t"><small>Squadra · ' + esc(t.athletes) + ' atleti</small><b>' + esc(t.name) + '</b></span><button type="button" class="sp-sheet-x" aria-label="Chiudi">' + icon('close', 20) + '</button></div>' + (o.html || '') + '</div>';
  }

  /* ---------- barre ---------- */
  function ActionBar(o) { o = o || {}; return '<div class="sp-actionbar">' + (o.note ? '<span class="sp-actionbar-n">' + Status({ kind: 'warn' }) + '<span>' + rich(o.note) + '</span></span>' : '') + '<div class="sp-actionbar-a">' + (o.left || '') + '<span class="sp-grow"></span>' + (o.actions || []).join('') + '</div></div>'; }
  function TabBar(o) {
    o = o || {}; var items = [['Baskin', 'home'], ['Eventi', 'cal'], ['Sponsor', 'star'], ['Profilo', 'user']];
    return '<nav class="sp-tabbar" aria-label="Sezioni">' + items.map(function (x) { return '<a href="#"' + (x[0] === o.active ? ' aria-current="page"' : '') + '><span>' + icon(x[1], 22) + esc(x[0]) + '</span></a>'; }).join('') + '</nav>';
  }
  function TopBar(o) {
    o = o || {};
    return '<header class="sp-topbar"><div class="sp-topbar-in">' + (o.logo ? '<img src="' + esc(o.logo) + '" alt="SP-IN">' : '<b class="sp-display" style="font-size:24px">SP-IN</b>') + '<nav>' +
      ['Baskin', 'Eventi', 'Sponsor'].map(function (n) { return '<a href="#"' + (n === o.active ? ' aria-current="page"' : '') + '><span>' + n + '</span></a>'; }).join('') + '</nav><span class="sp-avatar">PR</span></div></header>';
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.core = { rich: rich, esc: esc, onColor: onColor, icon: icon, Button: Button, Follow: Follow, Field: Field, Select: Select, Segmented: Segmented, Stepper: Stepper, Checkbox: Checkbox, Status: Status,
    Section: Section, SectionTag: SectionTag, PageHeader: PageHeader, Todo: Todo, Table: Table, WorkRow: WorkRow, Checklist: Checklist, Stage: Stage, Crest: Crest, Scoreboard: Scoreboard,
    TeamTile: TeamTile, StatTile: StatTile, MatchRow: MatchRow, Dialog: Dialog, Toast: Toast, Sheet: Sheet, ActionBar: ActionBar, TabBar: TabBar, TopBar: TopBar };
})();
