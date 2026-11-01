/* SP-IN · Landing "Baskin" in stile "Prima serata" (Landing)
   Script classico; usa window.SPIN.core (spin-core.js, da caricare prima). Espone window.SPIN.landing:
     render(data)      → HTML dell'intera landing (testata, numeri, ruoli, invito con prossimi eventi, pilastri)
     hero(h)           → testata scura con fascia arancio e campo inclinato
     numbers(list)     → striscia dei numeri da tabellone TV
     roles(r)          → "Cinque ruoli, una squadra": card dei ruoli
     cta(c)            → invito "Vederlo dal vivo" con i prossimi eventi
     pillars(p)        → i pilastri numerati 01–04
     court(opts)       → SVG del campo da Baskin (regolamento: campo da basket + 2 canestri laterali a metà campo)
     animate(svg, o)   → SP-IN (2026-11-01): gara simulata in continuo sul campo disegnato da court(); { stop, pause }
   Contratto dei dati: LANDING-BASKIN.md, sezione 4. Ogni link o pulsante accetta `href` oppure `attrs`
   (oggetto di attributi su un <button>), così l'app collega i propri gestori.
   Decisioni (Diego, 2026-10-21): proposta 1 "Prima serata"; il nome dello sport è "Baskin"; nessun riferimento a
   Cremona; campo nell'azzurro del logo (--brand-blue); niente riquadro informativo sotto i ruoli. */
(function () {
  'use strict';
  // design system v2 (2026-10-22): utilità comuni da spin-core (window.SPIN.core, caricato prima)
  const core = window.SPIN.core, esc = core.esc, onColor = core.onColor, rich = core.rich;

  const INK = '#14202B';
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
    const label = o.label || 'Campo da basket inclusivo: due canestri frontali e, a metà campo sulle linee laterali, due canestri laterali alti e bassi con l’area semicircolare del pivot';
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
    return `<div class="lpx-nums-wrap"><ul class="lpx-nums" aria-label="Il basket inclusivo in numeri">${list.map(n => `<li><b>${esc(n.value)}</b><span>${esc(n.label)}</span><small>${esc(n.sub || '')}</small></li>`).join('')}</ul></div>`;
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
    return `<section class="lpx-pil">${sec(p.title || 'I pilastri del basket inclusivo')}<div class="lpx-pil-g">${p.items.map((x, i) => `<div class="lpx-pil-c"><b class="lpx-pil-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</b><span class="lpx-pil-i" style="color:${col[i % 4]}"><span>${ic[i % 4]}</span></span><b class="lpx-pil-h">${esc(x.title)}</b><span>${esc(x.text)}</span></div>`).join('')}</div></section>`;
  }

  function render(d) {
    d = d || {};
    return `<div class="lpx">${hero(d.hero)}${numbers(d.numbers)}<div class="lpx-main">${roles(d.roles)}${cta(d.cta)}${pillars(d.pillars)}</div></div>`;
  }

  /* ---------- gara animata sul campo (SP-IN 2026-11-01, richiesta di Diego) ----------
     Simulazione continua e decorativa di una gara di basket inclusivo, coerente con il regolamento (Rev. 20):
     6 giocatori per squadra (Diego: 1, 3, 3, 4, 5, 5 e 2, 3, 3, 4, 5, 5); il pivot di ogni squadra resta nell'area del
     canestro laterale alla destra di chi attacca, non è marcato e riceve la palla consegnata da un compagno che entra
     nell'area dopo un palleggio; nelle aree laterali entra solo chi porta la palla al pivot; i 3 tirano al canestro
     laterale da fuori area marcati dai 3 avversari; 4 e 5 tirano ai canestri frontali, marcati dai pari ruolo. La
     squadra A attacca a destra e ha il pivot in basso, la B il contrario. Ogni 3 tiri cambia il colore di una squadra,
     a turno, tra giallo, verde, rosso, blu, nero e bianco (Diego), mai troppo simile all'altra. Niente punteggio né dati: solo
     movimento. Velocità in unità del disegno (1 = 5 cm) al secondo. Si ferma fuori schermo e con la scheda nascosta;
     con "riduci movimento" i giocatori restano fermi nello schieramento. */
  function animate(svg, o) {
    o = o || {};
    if (!svg || svg.__lpxAnim) return svg && svg.__lpxAnim;
    const NS = 'http://www.w3.org/2000/svg', W = 560, H = 300;
    const root = svg.querySelector('g') || svg;
    const layer = document.createElementNS(NS, 'g');
    layer.setAttribute('class', 'lpx-anim'); layer.setAttribute('aria-hidden', 'true'); root.appendChild(layer);
    const mk = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (p || layer).appendChild(e); return e; };
    const rnd = (a, b) => a + Math.random() * (b - a), pick = l => l[Math.floor(Math.random() * l.length)];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const other = t => t === 'A' ? 'B' : 'A';
    const mir = p => ({ x: W - p.x, y: H - p.y });
    const HOOP = { A: { main: { x: 528.5, y: 150 }, side: { x: 280, y: 288 } }, B: { main: { x: 31.5, y: 150 }, side: { x: 280, y: 12 } } };
    const IN = { A: -1, B: 1 };   // verso del campo rispetto al canestro laterale della squadra (A: in su)
    const AREA = [{ x: 280, y: 0 }, { x: 280, y: 300 }], AR = 64;   // aree laterali (3 m) con un margine per il corpo
    // posizioni d'attacco della squadra A (la B le ha specchiate)
    const SPOT = { p: { x: 280, y: 264 }, r3a: { x: 338, y: 210 }, r3b: { x: 392, y: 268 }, f4: { x: 400, y: 138 }, f5a: { x: 452, y: 62 }, f5b: { x: 502, y: 232 } };
    const SLOTS = { A: [['p', 1], ['r3a', 3], ['r3b', 3], ['f4', 4], ['f5a', 5], ['f5b', 5]], B: [['p', 2], ['r3a', 3], ['r3b', 3], ['f4', 4], ['f5a', 5], ['f5b', 5]] };
    // colori delle squadre (Diego, 2026-11-01): giallo, verde, rosso, blu (più scuro del campo), nero, bianco
    const COL = ['#ffd23f', '#2bb673', '#d7263d', '#1c3faa', '#111111', '#ffffff'];
    const ink = c => { const n = parseInt(c.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; return l > 0.6 ? '#14202b' : '#ffffff'; };
    const C = { A: COL[2], B: COL[0] }; let shots = 0, turn = 'A';
    const SPEED = { 1: 16, 2: 28, 3: 64, 4: 100, 5: 130 };   // velocità massime; il pivot di ruolo 1 si sposta solo per il tiro
    const ACC = { 1: 40, 2: 70, 3: 150, 4: 240, 5: 300 };   // accelerazioni: partenze e frenate non sono istantanee
    const spot = (t, s) => t === 'A' ? SPOT[s] : mir(SPOT[s]);

    // giocatori
    const P = [];
    ['A', 'B'].forEach(t => SLOTS[t].forEach(([s, r]) => {
      const g = mk('g', { class: 'lpx-pl lpx-pl--' + t });
      const ci = mk('circle', { r: 9 }, g), tx = mk('text', { y: 3.4 }, g); tx.textContent = r;
      const at = spot(t, s);
      P.push({ t, s, r, el: g, ci, txt: tx, x: at.x, y: at.y, tx: at.x, ty: at.y, vx: 0, vy: 0, jx: 0, jy: 0, jt: 0 });
    }));
    function paint() { P.forEach(p => { p.ci.style.fill = C[p.t]; p.txt.style.fill = ink(C[p.t]); }); if (o.onColors) o.onColors(Object.assign({}, C)); }
    // distanza tra colori in Lab (ΔE 1976): le due squadre devono restare ben distinguibili
    const lab = c => { const n = parseInt(c.slice(1), 16), f = v => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
      const R = f(n >> 16), G = f(n >> 8 & 255), Bl = f(n & 255), q = v => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
      const X = q((R * 0.4124 + G * 0.3576 + Bl * 0.1805) / 0.95047), Y = q(R * 0.2126 + G * 0.7152 + Bl * 0.0722), Z = q((R * 0.0193 + G * 0.1192 + Bl * 0.9505) / 1.08883);
      return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]; };
    const dE = (a, b) => { const x = lab(a), y = lab(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
    function recolor() {   // ogni 3 tiri, a turno, una squadra prende un colore nuovo, lontano da quello dell'altra
      const t = turn; turn = other(t);
      const ok = COL.filter(c => c !== C[t] && dE(c, C[other(t)]) > 55);
      if (ok.length) { C[t] = pick(ok); paint(); }
    }
    const team = t => P.filter(p => p.t === t);
    const pl = (t, s) => P.find(p => p.t === t && p.s === s);
    const shadow = mk('ellipse', { class: 'lpx-bs', rx: 4.5, ry: 2.2 });
    const ball = mk('circle', { class: 'lpx-ball', r: 4.2 });
    const flash = mk('circle', { class: 'lpx-flash', r: 7, cx: 280, cy: 150, style: 'display:none' });
    const B = { owner: null, x: 0, y: 0, z: 0, fly: null, loose: null, flashT: -9, flashAt: { x: 0, y: 0 } };

    // tempo della simulazione e attese
    let T = 0, off = 'A', alive = true, run = false, paused = false, last = 0, mode = 'set';
    const waits = [];
    const wait = s => new Promise(r => waits.push({ at: T + s, r }));
    const until = (fn, max) => new Promise(r => waits.push({ fn, r, at: T + (max || 8) }));
    const arrive = (p, max) => until(() => dist(p, { x: p.tx, y: p.ty }) < 2.5, max || 4);
    const go = (p, at) => { p.tx = clamp(at.x, 12, W - 12); p.ty = clamp(at.y, 12, H - 12); };   // dentro il campo (rimesse con i piedi sulla linea): niente esce dal disegno inclinato

    function fly(to, dur, h, cb) {   // to: punto o giocatore (la palla lo insegue)
      B.fly = { fx: B.x, fy: B.y, fz: B.z, to, t0: T, dur, h, cb }; B.owner = null; B.loose = null;
    }
    const flyP = (to, dur, h) => new Promise(r => fly(to, dur, h, r));
    async function pass(a, b) {
      const d = dist(a, b); await flyP(b, 0.12 + d / 340, 4 + d * 0.06); B.owner = b;
    }
    async function shoot(p, hoop, pm, h, dur) {
      if (++shots % 3 === 0) setTimeout(recolor, 0);
      B.owner = null; await wait(0.18);
      await flyP(hoop, dur, h);
      if (Math.random() < pm) {
        B.flashT = T; B.flashAt = hoop; B.z = 0; await wait(0.35); return 'made';
      }
      const dir = hoop.x > 280 ? -1 : hoop.x < 280 ? 1 : 0, vy = hoop.y < 150 ? 1 : -1;
      const R = hoop.y === 150 ? { x: hoop.x + dir * rnd(20, 55), y: hoop.y + rnd(-45, 45) } : { x: hoop.x + rnd(-55, 55), y: hoop.y + vy * rnd(72, 95) };
      await flyP(R, 0.45, 12);
      return 'miss';
    }
    // rimbalzo: corrono i due più vicini di ogni squadra (i pivot no); prende la palla il primo che arriva
    async function rebound() {
      B.loose = { vx: rnd(-14, 14), vy: rnd(-14, 14) };
      const ch = ['A', 'B'].flatMap(t => team(t).filter(p => p.s !== 'p').sort((a, b) => dist(a, B) - dist(b, B)).slice(0, 2));
      mode = 'loose'; let got = null;
      await until(() => { ch.forEach(p => go(p, B)); got = ch.find(p => dist(p, B) < 7); return !!got; }, 6);
      if (!got) got = ch[0];
      B.owner = got; B.loose = null; mode = 'set'; return got;
    }
    function jitterOff(t) {
      team(t).forEach(p => {
        if (T < p.jt) return; p.jt = T + rnd(0.9, 3.4);
        if (p.s === 'p') { const k = p.r === 1 ? 0 : 7; p.jx = rnd(-k, k); p.jy = rnd(-k, k); return; }
        const cut = Math.random() < 0.25, k = cut ? 46 : rnd(8, 28);   // ogni tanto un taglio deciso, di solito piccoli aggiustamenti
        p.jx = rnd(-k, k); p.jy = rnd(-k, k); p.eff = cut ? 1 : rnd(0.45, 0.9);
      });
    }
    function placeOffense(t, hold) {
      team(t).forEach(p => { if (p === hold || p.lock) return; const s = spot(t, p.s); go(p, { x: s.x + p.jx, y: s.y + p.jy }); });
    }
    function guard() {   // difesa a uomo per ruolo; i pivot restano nella loro area
      if (mode === 'loose') return;
      const d = other(off);
      team(d).forEach(p => {
        if (p.s === 'p') { const s = spot(d, 'p'); go(p, { x: s.x + p.jx * 0.5, y: s.y + p.jy * 0.5 }); return; }
        const m = pl(off, p.s), tg = p.r === 3 ? HOOP[off].side : HOOP[off].main;
        // il difensore vede l'attaccante con un ritardo di reazione (e ne anticipa un po' la corsa), cambia distanza nel
        // tempo e si stacca in aiuto quando il suo uomo è lontano dalla palla
        if (!p.seen || T >= p.rt) { p.rt = T + rnd(0.18, 0.55); p.seen = { x: m.x + m.vx * rnd(0.1, 0.35), y: m.y + m.vy * rnd(0.1, 0.35) }; if (Math.random() < 0.3) p.k = rnd(16, 30); }
        const far = dist(m, B) > 150, k = mode === 'inbound' ? 60 : far ? (p.k || 22) + 22 : (p.k || 22);
        const v = { x: tg.x - p.seen.x, y: tg.y - p.seen.y }, l = Math.hypot(v.x, v.y) || 1;
        go(p, { x: p.seen.x + v.x / l * k + p.jx * 0.25, y: p.seen.y + v.y / l * k + p.jy * 0.25 });
      });
    }

    // azioni dell'attacco
    async function pivotPlay(c) {   // palla portata al pivot dentro l'area, poi tiro al canestro laterale alto
      const h = HOOP[off].side, s = IN[off], pv = pl(off, 'p');
      go(c, { x: h.x + rnd(-14, 14), y: h.y + s * 78 }); await arrive(c, 4);
      c.carry = true; go(c, { x: pv.x + rnd(-6, 6), y: pv.y + s * 13 }); await arrive(c, 3);
      await flyP(pv, 0.22, 2); B.owner = pv;
      c.lock = true; const out = { x: h.x + rnd(-40, 40), y: h.y + s * 84 }; go(c, out);
      until(() => dist(c, out) < 4, 3).then(() => { c.carry = false; c.lock = false; });
      // il pivot esce per tirare: a volte appena fuori dalla linea continua (3 m), a volte da quella tratteggiata (3,70 m).
      // Il ruolo 2 a volte di fronte, a volte di lato (a 90°), nella metà dell'area lontana dal canestro frontale
      // d'attacco, così è rivolto verso di esso (Diego, 2026-11-01); il ruolo 1 tira solo di fronte al canestro
      const ctr = { x: 280, y: s < 0 ? 300 : 0 }, rad = Math.random() < 0.5 ? 66 : 80, side90 = pv.r === 2 && Math.random() < 0.5;
      const a = side90 ? (off === 'A' ? -1 : 1) * 1.42 : rnd(-0.1, 0.1);
      await wait(rnd(0.2, 0.5)); go(pv, { x: ctr.x + Math.sin(a) * rad, y: ctr.y + s * Math.cos(a) * rad }); await arrive(pv, 6);
      await wait(rnd(0.3, 0.7));
      return { r: await shoot(pv, h, 0.58, 14, 0.6), side: true };
    }
    async function r3Shot(c) {   // il 3 riceve fuori area e tira al canestro laterale
      const r3 = c.r === 3 ? c : pick(team(off).filter(p => p.r === 3)), h = HOOP[off].side, s = IN[off];
      if (c !== r3) { await pass(c, r3); c = r3; }
      const a = rnd(-0.9, 0.9);
      go(c, { x: h.x + Math.sin(a) * 74, y: h.y + s * Math.cos(a) * 74 }); await arrive(c, 4); await wait(0.25);
      return { r: await shoot(c, h, 0.45, 22, 0.75), side: true };
    }
    async function mainShot(c) {   // 4 o 5: penetrazione e appoggio, oppure tiro da fuori
      if (c.r < 4) { const to = pick(team(off).filter(p => p.r >= 4)); await pass(c, to); c = to; }
      const h = HOOP[off].main, dx = h.x > 280 ? -1 : 1;
      if (Math.random() < 0.55) {
        go(c, { x: h.x + dx * 24, y: h.y + rnd(-14, 14) }); await arrive(c, 4);
        return { r: await shoot(c, h, 0.62, 14, 0.5), side: false };
      }
      const a = rnd(-1.1, 1.1);
      go(c, { x: h.x + dx * Math.cos(a) * 138, y: h.y + Math.sin(a) * 138 }); await arrive(c, 4); await wait(0.3);
      return { r: await shoot(c, h, 0.36, 40, 0.95), side: false };
    }
    async function possession(hold) {
      mode = 'set';
      const fwd = spot(off, hold.s);
      go(hold, fwd); await until(() => dist(hold, fwd) < 6 || T < 0, 5);
      for (let i = 0, n = 1 + Math.floor(rnd(0, 3)); i < n; i++) {
        await wait(rnd(0.35, 0.9));
        const to = pick(team(off).filter(p => p !== hold && p.s !== 'p'));
        await pass(hold, to); hold = to;
      }
      await wait(rnd(0.2, 0.6));
      const x = Math.random();
      return x < 0.38 ? pivotPlay(hold) : x < 0.58 ? r3Shot(hold) : mainShot(hold);
    }
    // rimessa: dal fondo dopo un canestro frontale, dalla linea laterale dopo i tiri al canestro laterale
    async function inbound(t, side) {
      off = t; mode = 'inbound';
      const back = HOOP[other(t)].main, s = IN[t];
      const ib = pl(t, 'r3b');
      const at = side ? { x: 280 - (t === 'A' ? 72 : -72), y: t === 'A' ? -3 : H + 3 } : { x: back.x + (back.x > 280 ? 14 : -14), y: back.y + 34 * s };
      B.owner = null; B.loose = null; await flyP(at, 0.5, 6);
      ib.lock = true; go(ib, at);
      await until(() => dist(ib, at) < 4, 5); B.owner = ib; await wait(0.45);
      const rc = pl(t, 'f5a'); await pass(ib, rc); ib.lock = false; mode = 'set';
      return rc;
    }

    async function game() {
      let hold = pl('A', 'f5a'); B.owner = hold; B.x = hold.x; B.y = hold.y;
      while (alive) {
        let res = await possession(hold);
        while (alive && res.r === 'miss') {
          const got = await rebound();
          if (got.t !== off) { off = got.t; hold = got; mode = 'set'; res = null; break; }
          res = await mainShot(got);
        }
        if (!alive) break;
        if (res) hold = await inbound(other(off), res.side);
      }
    }

    // movimento, palla e disegno
    function step(dt) {
      T += dt;
      jitterOff('A'); jitterOff('B');
      if (mode !== 'loose') placeOffense(off, B.owner && B.owner.t === off ? B.owner : null);
      guard();
      P.forEach(p => {
        // velocità desiderata verso il bersaglio (rallenta arrivando), raggiunta con un'accelerazione limitata
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
        if (T >= (p.et || 0)) { p.et = T + rnd(1, 3); if (!p.eff || Math.random() < 0.5) p.eff = rnd(0.55, 1); }
        const eff = d > 110 ? 1 : (p.eff || 0.8), want = d < 0.4 ? 0 : Math.min(SPEED[p.r] * eff, d * 2.6);
        const ax = (d ? dx / d : 0) * want - p.vx, ay = (d ? dy / d : 0) * want - p.vy, al = Math.hypot(ax, ay), A = ACC[p.r] * dt;
        if (al > A) { p.vx += ax / al * A; p.vy += ay / al * A; } else { p.vx += ax; p.vy += ay; }
        p.x = clamp(p.x + p.vx * dt, 12, W - 12); p.y = clamp(p.y + p.vy * dt, 12, H - 12);
        if (p.s !== 'p' && !p.carry) AREA.forEach(a => {   // fuori dalle aree laterali: si scivola lungo il bordo
          const ex = p.x - a.x, ey = p.y - a.y, e = Math.hypot(ex, ey);
          if (e < AR) { const k = AR / (e || 1); p.x = a.x + (e ? ex * k : AR); p.y = a.y + (e ? ey * k : (a.y ? -AR : AR));
            const nx = ex / (e || 1), ny = ey / (e || 1), vn = p.vx * nx + p.vy * ny; if (vn < 0) { p.vx -= vn * nx; p.vy -= vn * ny; } }
        });
      });
      if (B.fly) {
        const f = B.fly, k = Math.min(1, (T - f.t0) / f.dur), to = f.to;
        B.x = f.fx + (to.x - f.fx) * k; B.y = f.fy + (to.y - f.fy) * k; B.z = f.fz * (1 - k) + 4 * f.h * k * (1 - k);
        if (k >= 1) { B.fly = null; B.z = 0; f.cb && f.cb(); }
      } else if (B.owner) {
        const p = B.owner, mv = Math.hypot(p.tx - p.x, p.ty - p.y) > 3;
        const tg = HOOP[p.t].main, l = Math.hypot(tg.x - p.x, tg.y - p.y) || 1;
        B.x = p.x + (tg.x - p.x) / l * 7; B.y = p.y + (tg.y - p.y) / l * 7 + 2;
        B.z = mv && p.s !== 'p' ? Math.abs(Math.sin(T * 9)) * 7 : 5;   // palleggio in corsa, palla in mano da fermo
      } else if (B.loose) {
        B.x += B.loose.vx * dt; B.y += B.loose.vy * dt; B.loose.vx *= 0.97; B.loose.vy *= 0.97; B.z = Math.abs(Math.sin(T * 7)) * 3;
        AREA.forEach(q => { const ex = B.x - q.x, ey = B.y - q.y, e = Math.hypot(ex, ey); if (e < AR + 6) { B.x = q.x + ex / (e || 1) * (AR + 6); B.y = q.y + ey / (e || 1) * (AR + 6); } });   // la palla vagante esce dall'area: nessuno può entrarci
      }
      B.x = clamp(B.x, 5, W - 5); B.y = clamp(B.y, 5, H - 5);
      for (let i = waits.length - 1; i >= 0; i--) { const w = waits[i]; if ((w.fn && w.fn()) || T >= w.at) { waits.splice(i, 1); w.r(); } }
    }
    function draw() {
      P.forEach(p => p.el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`));
      ball.setAttribute('cx', B.x.toFixed(1)); ball.setAttribute('cy', (B.y - B.z * 0.7).toFixed(1)); ball.setAttribute('r', (4.2 + B.z * 0.06).toFixed(2));
      shadow.setAttribute('cx', B.x.toFixed(1)); shadow.setAttribute('cy', (B.y + 1.5).toFixed(1)); shadow.setAttribute('opacity', Math.max(0.12, 0.45 - B.z * 0.01).toFixed(2));
      const fk = (T - B.flashT) / 0.6;
      flash.style.display = fk >= 0 && fk < 1 ? '' : 'none';
      if (fk >= 0 && fk < 1) { flash.setAttribute('cx', B.flashAt.x); flash.setAttribute('cy', B.flashAt.y); flash.setAttribute('r', (7 + fk * 18).toFixed(1)); flash.setAttribute('opacity', (1 - fk).toFixed(2)); }
    }
    function frame(now) {
      if (!alive) return;
      if (!svg.isConnected) { stop(); return; }
      if (run && !paused) { const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; step(dt); draw(); }
      requestAnimationFrame(frame);
    }
    function stop() { alive = false; if (io) io.disconnect(); document.removeEventListener('visibilitychange', vis); }
    let seen = true; const vis = () => { run = seen && !document.hidden; last = 0; };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(e => { seen = e[0].isIntersecting; vis(); }) : null;
    if (io) io.observe(svg); document.addEventListener('visibilitychange', vis);
    const still = o.still || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    paint(); B.owner = pl('A', 'f5a'); step(0); draw();
    if (!still) { vis(); game().catch(() => {}); requestAnimationFrame(frame); }
    return (svg.__lpxAnim = { stop, pause: v => { paused = !!v; last = 0; } });
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.landing = { render, hero, numbers, roles, cta, pillars, court, animate, onColor };
})();
