/* SP-IN · Landing "Baskin" in stile "Prima serata" (Landing)
   Script classico, senza dipendenze. Espone window.SPIN.landing:
     render(data)      → HTML dell'intera landing (testata, numeri, ruoli, invito con prossimi eventi, pilastri)
     hero(h)           → testata scura con fascia arancio e campo inclinato
     numbers(list)     → striscia dei numeri da tabellone TV
     roles(r)          → "Cinque ruoli, una squadra": card dei ruoli
     cta(c)            → invito "Vederlo dal vivo" con i prossimi eventi
     pillars(p)        → i pilastri numerati 01–04
     court(opts)       → SVG del campo da Baskin (regolamento: campo da basket + 2 canestri laterali a metà campo)
   Contratto dei dati: LANDING-BASKIN.md, sezione 4. Ogni link o pulsante accetta `href` oppure `attrs`
   (oggetto di attributi su un <button>), così l'app collega i propri gestori.
   Decisioni (Diego, 2026-10-21): proposta 1 "Prima serata"; il nome dello sport è "Baskin"; nessun riferimento a
   Cremona; campo nell'azzurro del logo (--brand-blue); niente riquadro informativo sotto i ruoli. */
(function () {
  'use strict';

  const INK = '#14202B';
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function lum(h) { return rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); }
  function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function onColor(h) { return contrast(h, '#FFFFFF') >= contrast(h, INK) ? '#FFFFFF' : INK; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  /* testo con grassetti: accetta solo **così** e lo trasforma in <b>, tutto il resto è escapato */
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function attrs(o) { return Object.keys(o || {}).map(k => ` ${esc(k)}="${esc(o[k])}"`).join(''); }
  function abbr(t) { return (t.abbr || String(t.short || t.name || '').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '—'; }
  function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  function tag(o, cls, inner, extra) {
    const a = attrs(o && o.attrs) + (extra || '');
    return o && o.href ? `<a class="${cls}" href="${esc(o.href)}"${a}>${inner}</a>` : `<button type="button" class="${cls}"${a}>${inner}</button>`;
  }

  const SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const I = {
    arrow: `<svg ${SV} stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    chev: `<svg ${SV}><path d="m9 18 6-6-6-6"/></svg>`,
    team: `<svg ${SV}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14c2.7 0 4.5 1.9 4.5 4.8"/></svg>`,
    star: `<svg ${SV}><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/></svg>`,
    trophy: `<svg ${SV}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    heart: `<svg ${SV}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>`
  };
  const TYLBL = { amichevole: 'Amichevole', torneo: 'Torneo', campionato: 'Campionato' };
  const TYCOL = { amichevole: 'var(--brand-blue)', torneo: 'var(--brand-green)', campionato: 'var(--brand-orange)' };
  const ROLECOL = { pivot: 'var(--brand-orange)', movimento: 'var(--brand-blue)', regola: 'var(--brand-green)' };

  /* ---------- campo da Baskin ----------
     Regolamento Baskin: campo da basket regolamentare (28 × 15 m) con i due canestri frontali; a metà campo, sulle
     due linee laterali, un canestro laterale alto (2,20 m) con sotto, facoltativo, uno basso (1,10 m) per il ruolo 1;
     davanti a ciascuno l'area del pivot, semicerchio di 3 m, con la linea tratteggiata a 3,70 m.
     Unità del disegno: 1 = 5 cm, quindi 560 × 300. */
  function court(o) {
    o = o || {};
    const label = o.label || 'Campo da Baskin: due canestri frontali e, a metà campo sulle linee laterali, due canestri laterali alti e bassi con l’area semicircolare del pivot';
    const hoop = (x, y, side) => `<circle class="lpx-hp" cx="${x}" cy="${y}" r="7"/>${side ? `<circle class="lpx-hp-lo" cx="${x}" cy="${y}" r="3"/>` : ''}`;
    return `<svg class="lpx-court${o.className ? ' ' + esc(o.className) : ''}" viewBox="0 0 568 308" role="img" aria-label="${esc(label)}">
  <g transform="translate(4 4)">
    <rect class="lpx-cf" x="0" y="0" width="560" height="300" rx="6"/>
    <g class="lpx-cl">
      <path d="M280 0V300"/><circle cx="280" cy="150" r="36"/>
      <path d="M0 101H116V199H0"/><path d="M116 114A36 36 0 0 1 116 186"/>
      <path d="M560 101H444V199H560"/><path d="M444 114A36 36 0 0 0 444 186"/>
      <path d="M0 18H59.8A135 135 0 0 1 59.8 282H0"/><path d="M560 18H500.2A135 135 0 0 0 500.2 282H560"/>
      <path class="lpx-bb" d="M24 132V168M536 132V168"/>
      <path d="M220 0A60 60 0 0 0 340 0"/><path d="M220 300A60 60 0 0 1 340 300"/>
      <path class="lpx-dash" d="M206 0A74 74 0 0 0 354 0"/><path class="lpx-dash" d="M206 300A74 74 0 0 1 354 300"/>
      <path class="lpx-sb" d="M268 2H292M268 298H292"/>
    </g>
    ${hoop(31.5, 150)}${hoop(528.5, 150)}${hoop(280, 12, true)}${hoop(280, 288, true)}
  </g>
</svg>`;
  }

  function btn(o, cls, label, arrow) {
    return tag(o, `lpx-btn ${cls}`, `<span>${esc(label)}${arrow === false ? '' : I.arrow}</span>`);
  }
  function sec(text, extra) {
    return `<div class="lpx-sec"><span class="lpx-tag"><b>${esc(text)}</b></span><span class="lpx-rule"></span>${extra ? `<span class="lpx-sec-x">${esc(extra)}</span>` : ''}</div>`;
  }

  /* ---------- testata ---------- */
  function hero(h) {
    h = h || {};
    const lines = h.title || ['Un campo.', 'Sei canestri.', 'Tutti in gioco.'];
    const title = lines.map((l, i) => `<span${i === lines.length - 1 ? ' class="lpx-accent"' : ''}>${esc(l)}</span>`).join('');
    const b1 = h.primary ? btn(h.primary, 'lpx-btn--pri', h.primary.label || 'Vedi gli eventi') : '';
    const b2 = h.secondary ? btn(h.secondary, 'lpx-btn--ghost', h.secondary.label || 'Come si gioca', false) : '';
    return `<header class="lpx-hero">
  <span class="lpx-hero-band" aria-hidden="true"></span><span class="lpx-tex" aria-hidden="true"></span>
  <div class="lpx-hero-in">
    <div class="lpx-hero-t">
      ${h.kicker ? `<span class="lpx-kick"><b>${esc(h.kicker)}</b></span>` : ''}
      <h1>${title}</h1>
      ${h.lead ? `<p>${rich(h.lead)}</p>` : ''}
      ${b1 || b2 ? `<div class="lpx-hero-b">${b1}${b2}</div>` : ''}
    </div>
    <div class="lpx-hero-c">${court()}</div>
  </div>
</header>`;
  }

  /* ---------- numeri ---------- */
  function numbers(list) {
    if (!list || !list.length) return '';
    return `<div class="lpx-nums-wrap"><ul class="lpx-nums" aria-label="Il Baskin in numeri">${list.map(n => `<li><b>${esc(n.value)}</b><span>${esc(n.label)}</span><small>${esc(n.sub || '')}</small></li>`).join('')}</ul></div>`;
  }

  /* ---------- ruoli ---------- */
  function roles(r) {
    if (!r || !r.items) return '';
    return `<section class="lpx-roles">${sec(r.title || 'Cinque ruoli, una squadra', r.sub)}
  ${r.sub ? `<p class="lpx-roles-sub">${esc(r.sub)}</p>` : ''}
  <div class="lpx-roles-g">${r.items.map(x => `<div class="lpx-role" style="--rc:${ROLECOL[x.kind] || 'var(--brand-blue)'}"><span class="lpx-role-n"><b>${esc(x.n)}</b></span><span class="lpx-role-t"><b>${esc(x.title)}</b><span>${esc(x.text)}</span></span></div>`).join('')}</div>
</section>`;
  }

  /* ---------- invito + prossimi eventi ---------- */
  /* Colori come nel tab Eventi e nella scheda evento (Diego, 2026-10-21): primo colore delle squadre, ospite al secondo
     colore se si confonde con la casa, contorno dello stemma nell'altro colore (SPIN.eventPoster.teamColors) */
  function ringOf(t) { const c = t.color || INK, a = t.altColor; return a && a.toLowerCase() !== c.toLowerCase() ? a : onColor(c); }
  function pairColors(H, A) {
    const P = window.SPIN && window.SPIN.eventPoster;
    if (P && P.teamColors) { const c = P.teamColors(H, A); return { a: c.a, b: c.b, aRing: c.aRing, bRing: c.bRing }; }
    return { a: H.color || INK, b: A.color || INK, aRing: ringOf(H), bRing: ringOf(A) };
  }
  function evRow(e) {
    const H = e.home || {}, A = e.away || {}, C = pairColors(H, A), a = C.a, b = C.b;
    const crest = (t, ring) => `<span class="lpx-crest" style="--c-bg:${esc(t.logoBg || '#FFFFFF')};--c-team:${esc(ring)}">${t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : `<b>${esc(initials(t.short || t.name))}</b>`}</span>`;
    const title = `${H.short || H.name || ''} – ${A.short || A.name || ''}`;
    /* Diego, 2026-10-21: nel tabellone giorno sopra e ora sotto; accanto il tipo di evento (non i nomi delle squadre,
       che restano nell'etichetta per gli screen reader) e sotto la competizione */
    const inner = `<span class="lpx-ev-band" aria-hidden="true">${crest(H, C.aRing)}<span class="lpx-bug"><span style="background:${esc(a)};color:${onColor(a)}"><b>${esc(abbr(H))}</b></span><span class="lpx-bug-mid">${e.day ? `<small>${esc(e.day)}</small>` : ''}<b>${esc(e.time || '—')}</b></span><span style="background:${esc(b)};color:${onColor(b)}"><b>${esc(abbr(A))}</b></span></span>${crest(A, C.bRing)}</span>
      <span class="lpx-ev-t"><b>${esc(e.typeLabel || TYLBL[e.type] || '')}</b>${e.comp ? `<span>${esc(e.comp)}</span>` : ''}</span><span class="lpx-chev">${I.chev}</span>`;
    return tag(e, 'lpx-ev', inner, ` style="--ty:${TYCOL[e.type] || 'var(--brand-blue)'}" aria-label="${esc(title + (e.time ? ', ' + (e.day ? e.day + ' ' : '') + 'ore ' + e.time : ''))}"`);
  }
  function cta(c) {
    if (!c) return '';
    const evs = (c.events || []).slice(0, 3);
    return `<section class="lpx-cta">
  <span class="lpx-cta-band" aria-hidden="true"></span><span class="lpx-tex" aria-hidden="true"></span>
  <div class="lpx-cta-in">
    <div class="lpx-cta-t"><b>${esc(c.title)}</b>${c.sub ? `<span>${esc(c.sub)}</span>` : ''}${c.button ? btn(c.button, 'lpx-btn--acc', c.button.label || 'Vedi gli eventi') : ''}</div>
    ${evs.length ? `<div class="lpx-cta-ev">${sec(c.eventsTitle || 'Prossimi eventi')}${evs.map(evRow).join('')}</div>` : ''}
  </div>
</section>`;
  }

  /* ---------- pilastri ---------- */
  function pillars(p) {
    if (!p || !p.items) return '';
    const ic = [I.team, I.star, I.trophy, I.heart], col = ['var(--brand-orange)', 'var(--brand-blue)', 'var(--brand-green)', 'var(--brand-orange)'];
    return `<section class="lpx-pil">${sec(p.title || 'I pilastri del Baskin')}<div class="lpx-pil-g">${p.items.map((x, i) => `<div class="lpx-pil-c"><b class="lpx-pil-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</b><span class="lpx-pil-i" style="color:${col[i % 4]}"><span>${ic[i % 4]}</span></span><b class="lpx-pil-h">${esc(x.title)}</b><span>${esc(x.text)}</span></div>`).join('')}</div></section>`;
  }

  function render(d) {
    d = d || {};
    return `<div class="lpx">${hero(d.hero)}${numbers(d.numbers)}<div class="lpx-main">${roles(d.roles)}${cta(d.cta)}${pillars(d.pillars)}</div></div>`;
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.landing = { render, hero, numbers, roles, cta, pillars, court, onColor };
})();
