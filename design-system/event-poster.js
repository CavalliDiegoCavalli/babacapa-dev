/* SP-IN · Scheda evento "Prima serata" (EventPoster v2)
   Script classico; usa window.SPIN.core (spin-core.js, da caricare prima). Espone window.SPIN.eventPoster:
     render(data)        → stringa HTML dell'<article class="ep">
     mount(el, data)     → scrive il markup dentro el
     teamColors(a, b)    → colori calcolati (utile per test)
   Sostituisce la versione "Faccia a faccia" mantenendo lo stesso contratto dei dati
   (SCHEDA-EVENTO-PRIMA-SERATA.md, sezione 4): l'app non deve cambiare per vederla.
   Novità facoltative del contratto: Team.abbr (sigla di 3 lettere), elementi di statRows kind 'form' con score/opp,
   kind 'player' (miglior realizzatore e simili, dati strutturati invece di HTML).
   Decisioni di design (Diego, 2026-10-20): i fondi delle squadre, le caselle dei valori, le ultime partite e le schede
   dei giocatori usano il primo colore della squadra; niente "Condividi" salvo share: true; niente statistiche live durante
   la gara. Dal 2026-10-20 (Diego): se il primo colore dell'ospite si confonde con quello di casa (clash), l'ospite prende
   il secondo colore (altColor), in tutta la scheda; se manca o si confonde anche quello, resta il primo. */
(function () {
  'use strict';
  // design system v2 (2026-10-22): utilità comuni da spin-core (window.SPIN.core, caricato prima)
  const core = window.SPIN.core, esc = core.esc, onColor = core.onColor;

  /* ---------- colore ---------- */
  const INK = '#14202B';
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function lum(h) { return rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); }
  function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function hue(h) { const [r, g, b] = rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const H = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (H * 60 + 360) % 360; }
  /* due colori "si confondono" se hanno tinta e luminosità vicine, o se sono entrambi molto scuri */
  function clash(a, b) {
    const d = Math.abs(hue(a) - hue(b));
    return (Math.min(d, 360 - d) < 35 && Math.abs(lum(a) - lum(b)) < .25) || (lum(a) < .06 && lum(b) < .06);
  }
  /* primo colore di ciascuna squadra; l'ospite passa al secondo se il primo si confonde con quello di casa */
  function teamColors(home, away) {
    const a = home.color || INK, b0 = away.color || INK, alt = away.altColor;
    const awayKit = clash(a, b0) && !!alt && alt.toLowerCase() !== b0.toLowerCase() && !clash(a, alt);
    const b = awayKit ? alt : b0;
    /* contorno dello stemma (Diego, 2026-10-20): l'altro colore della squadra rispetto a quello della fascia (primo → secondo,
       secondo → primo); se la squadra ha un solo colore, il colore del testo sulla fascia */
    const other = (x, y) => y && y.toLowerCase() !== x.toLowerCase() ? y : '';
    const aRing = other(a, home.altColor) || onColor(a), bRing = (awayKit ? b0 : other(b, alt)) || onColor(b);
    return { a, aOn: onColor(a), aBar: a, aRing, b, bOn: onColor(b), bBar: b, bRing, awayKit };
  }

  /* ---------- testo ---------- */
  function fmtNum(v) { return Number.isInteger(v) ? String(v) : Number(v).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function when(iso, tz) {
    if (!iso) return { day: '', date: 'Data da definire', time: '' };
    const d = new Date(iso), o = { timeZone: tz || 'Europe/Rome' };
    return {
      day: cap(d.toLocaleDateString('it-IT', Object.assign({ weekday: 'long' }, o))),
      date: d.toLocaleDateString('it-IT', Object.assign({ day: 'numeric', month: 'long' }, o)),
      time: d.toLocaleTimeString('it-IT', Object.assign({ hour: '2-digit', minute: '2-digit' }, o))
    };
  }
  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  /* sigla del tabellone: Team.abbr, altrimenti le prime 3 lettere del nome breve */
  function abbr(t) { return (t.abbr || String(t.short || t.name || '').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '—'; }
  /* nomi lunghi: il corpo scende con la parola più lunga e con la lunghezza totale (al massimo 2 righe) */
  function nameScale(s) {
    const w = Math.max(0, ...String(s).split(/\s+/).map(x => x.length)), k = Math.min(1, 9 / Math.max(w, 1), 18 / Math.max(String(s).length, 1));
    return Math.max(.42, Math.round(k * 100) / 100);
  }
  function attrs(o) { return Object.keys(o || {}).map(k => ` ${esc(k)}="${esc(o[k])}"`).join(''); }

  /* ---------- icone (set SP-IN, tratto 2px) ---------- */
  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
  };
  const NONE = '<b class="is-none">—</b>';

  /* ---------- testata ---------- */
  function crest(t, side) {
    const inner = t.logo ? `<img src="${esc(t.logo)}" alt="Logo ${esc(t.name)}" loading="lazy">` : `<b aria-hidden="true">${esc(initials(t.short || t.name))}</b>`;
    return t.href ? `<a class="ep-crest ep-crest--${side}" href="${esc(t.href)}" aria-label="${esc(t.name)}">${inner}</a>` : `<span class="ep-crest ep-crest--${side}">${inner}</span>`;
  }
  function side(t, s) {
    return `<div class="ep-side ep-side--${s}">${crest(t, s)}<div class="ep-team">` +
      (t.kicker ? `<span class="ep-kicker">${esc(t.kicker)}</span>` : '') +
      `<h2 class="ep-name${t.nameClass ? ' ' + esc(t.nameClass) : ''}" title="${esc(t.name)}" style="--ep-k:${nameScale(t.short || t.name)};--ep-w:${Math.max(4, ...String(t.short || t.name).split(/\s+/).map(x => x.length))}"${attrs(t.attrs)}>${esc(t.short || t.name)}</h2>` +
      (t.sub ? `<span class="ep-sub">${esc(t.sub)}</span>` : '') +
      '</div></div>';
  }
  function bug(H, A, d, hasScore, lostA, lostB, w) {
    const mid = hasScore
      ? `<span class="ep-bug-score" aria-label="Risultato ${d.score.home} a ${d.score.away}"><span${lostA ? ' class="is-lost"' : ''}>${d.score.home}</span><i>–</i><span${lostB ? ' class="is-lost"' : ''}>${d.score.away}</span></span>`
      : `<span class="ep-bug-time">${esc(w.time || 'VS')}</span>`;
    return `<div class="ep-bug"><span class="ep-bug-t ep-bug-t--a" title="${esc(H.name)}"><span>${esc(abbr(H))}</span></span><span class="ep-bug-mid">${mid}</span><span class="ep-bug-t ep-bug-t--b" title="${esc(A.name)}"><span>${esc(abbr(A))}</span></span></div>`;
  }

  /* ---------- righe statistiche ---------- */
  function lbl(r) { return `<span class="ep-lbl"><b>${esc(r.label)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>`; }
  function numRow(r) {
    const x = r.home == null ? null : +r.home, y = r.away == null ? null : +r.away;
    const lowA = x != null && y != null && x < y, lowB = x != null && y != null && y < x;
    const v = (n, lo, s) => `<span class="ep-val ep-val--${s}${lo ? ' is-low' : ''}"><b>${n == null ? '—' : fmtNum(n)}</b></span>`;
    return `<div class="ep-row">${v(x, lowA, 'a')}<span class="ep-row-l">${lbl(r)}</span>${v(y, lowB, 'b')}</div>`;
  }
  function formLine(t, list, s) {
    const items = Array.isArray(list) && list.length
      ? list.map(x => {
          const win = !!x.w, txt = x.score ? `<b>${win ? 'V' : 'P'}</b><span>${esc(x.score)}</span>` : `<b>${win ? 'V' : 'P'}</b>`;
          const tip = x.title || [win ? 'Vinta' : 'Persa', x.score, x.opp ? 'contro ' + x.opp : ''].filter(Boolean).join(' ');
          return `<span class="ep-fm${win ? ' w' : ''}" title="${esc(tip)}"><span>${txt}</span></span>`;
        }).join('')
      : `<span class="ep-fm is-empty"><span>${NONE}</span></span>`;
    return `<div class="ep-form-line ep-form-line--${s}"><b class="ep-abbr">${esc(abbr(t))}</b>${items}</div>`;
  }
  function formRow(r, H, A) {
    const names = l => (Array.isArray(l) ? l : []).map(x => (x.w ? 'vinta' : 'persa') + (x.score ? ' ' + x.score : '') + (x.opp ? ' contro ' + x.opp : '')).join(', ');
    return `<div class="ep-form" role="group" aria-label="${esc(r.label)}: ${esc(H.short || H.name)} ${esc(names(r.home))}; ${esc(A.short || A.name)} ${esc(names(r.away))}">
      <span class="ep-form-l">${esc(r.label)}${r.sub ? ' · ' + esc(r.sub) : ''}</span>${formLine(H, r.home, 'a')}${formLine(A, r.away, 'b')}</div>`;
  }
  function card(t, p, s) {
    if (!p || !p.name) return `<div class="ep-card ep-card--${s} is-empty">${NONE}</div>`;
    return `<div class="ep-card ep-card--${s}">
        ${p.num != null && p.num !== '' ? `<span class="ep-card-ghost" aria-hidden="true">${esc(p.num)}</span>` : ''}
        <span class="ep-card-k">${esc(abbr(t))}${p.num != null && p.num !== '' ? ` · n. ${esc(p.num)}` : ''}</span>
        <b class="ep-card-n">${esc(p.name)}</b>
        <span class="ep-card-v"><b>${p.value == null ? '—' : esc(typeof p.value === 'number' ? fmtNum(p.value) : p.value)}</b>${p.unit ? `<span>${esc(p.unit)}</span>` : ''}</span>
        ${p.sub ? `<small>${esc(p.sub)}</small>` : ''}
      </div>`;
  }
  function playerRow(r, H, A) {
    return `<div class="ep-players"><span class="ep-form-l">${esc(r.label)}${r.sub ? ' · ' + esc(r.sub) : ''}</span><div class="ep-cards">${card(H, r.home, 'a')}${card(A, r.away, 'b')}</div></div>`;
  }
  function textRow(r) {
    return `<div class="ep-players"><span class="ep-form-l">${esc(r.label)}${r.sub ? ' · ' + esc(r.sub) : ''}</span><div class="ep-cards">` +
      `<div class="ep-card ep-card--a ep-card--html">${r.home || NONE}</div><div class="ep-card ep-card--b ep-card--html">${r.away || NONE}</div></div></div>`;
  }
  /* le righe "giocatore" (player e text) vanno nella colonna Protagonisti, le altre in Statistiche */
  function isPlayer(r) { return r && (r.kind === 'player' || r.kind === 'text'); }
  function anyRow(r, H, A) {
    if (r.kind === 'form') return formRow(r, H, A);
    if (r.kind === 'player') return playerRow(r, H, A);
    if (r.kind === 'text') return textRow(r);
    return numRow(r);
  }
  /* righe di riserva se l'app non passa statRows (contratto della prima versione) */
  function legacyRows(d) {
    const s = d.stats || {}, h = s.home || {}, a = s.away || {};
    const rows = [];
    if (h.ptsAvg != null || a.ptsAvg != null) rows.push({ label: 'Punti medi a partita', home: h.ptsAvg, away: a.ptsAvg });
    if (h.h2hWins != null || a.h2hWins != null) rows.push({ label: 'Scontri diretti vinti', home: h.h2hWins, away: a.h2hWins });
    const f = x => String(x || '').toUpperCase().split('').filter(c => c === 'V' || c === 'P').map(c => ({ w: c === 'V' }));
    if (d.home.form || d.away.form) rows.push({ kind: 'form', label: 'Ultime partite', home: f(d.home.form), away: f(d.away.form) });
    return rows;
  }

  /* ---------- render ---------- */
  function render(d) {
    const H = d.home, A = d.away, C = teamColors(H, A);
    const live = d.state === 'live', final = d.state === 'final', hasScore = (live || final) && d.score;
    const w = d.when || when(d.start, d.timeZone);
    const lostA = final && d.score && d.score.home < d.score.away, lostB = final && d.score && d.score.away < d.score.home;
    const style = [
      `--ep-a:${C.a}`, `--ep-a-on:${C.aOn}`, `--ep-a-ring:${C.aRing}`, `--ep-a-crest:${H.logoBg || '#FFFFFF'}`,
      `--ep-b:${C.b}`, `--ep-b-on:${C.bOn}`, `--ep-b-ring:${C.bRing}`, `--ep-b-crest:${A.logoBg || '#FFFFFF'}`
    ].join(';');
    const rows = Array.isArray(d.statRows) ? d.statRows : legacyRows(d);
    const statsHtml = rows.filter(r => !isPlayer(r)).map(r => anyRow(r, H, A)).join('');
    const playersHtml = rows.filter(isPlayer).map(r => anyRow(r, H, A)).join('');
    /* PC (Diego, 2026-10-20): simmetria verticale, statistiche al centro e i migliori realizzatori di ciascuna squadra dal
       suo lato (casa a sinistra, ospite a destra); sotto 1280 px resta "Protagonisti" sotto le statistiche */
    const sideCol = s => rows.filter(isPlayer).map(r => `<div class="ep-players"><span class="ep-form-l">${esc(r.label)}${r.sub ? ' · ' + esc(r.sub) : ''}</span>` +
      (r.kind === 'text' ? `<div class="ep-card ep-card--${s} ep-card--html">${(s === 'a' ? r.home : r.away) || NONE}</div>` : card(s === 'a' ? H : A, s === 'a' ? r.home : r.away, s)) + '</div>').join('');
    const cta = d.cta && (d.cta.label || (live ? 'Segui il referto live' : final ? 'Vedi il referto' : 'Segui l’evento'));
    const comp = esc([d.competition, d.round].filter(Boolean).join(' · '));
    const placeTxt = d.venue ? esc([d.venue.name, d.venue.city].filter(Boolean).join(' · ')) : '';
    const place = placeTxt ? (d.venue.href
      ? `<a class="ep-place" href="${esc(d.venue.href)}"${d.venue.ext ? ' target="_blank" rel="noopener"' : ''} aria-label="Apri ${esc(d.venue.name)} nelle mappe">${I.pin}<span>${placeTxt}</span></a>`
      : `<span class="ep-place">${I.pin}<span>${placeTxt}</span></span>`) : '';
    const whenTxt = [[w.day, w.date].filter(Boolean).join(' '), w.time ? 'ore ' + w.time : ''].filter(Boolean).join(' · ');
    const liveTxt = ['Live', [d.live && d.live.period, d.live && d.live.clock].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
    const title = `${H.name} contro ${A.name}`;

    return `<article class="ep ep--${esc(d.state)}" style="${style}" aria-label="${esc(title)}">
<header class="ep-hero">
  <span class="ep-slab ep-slab--a" aria-hidden="true"></span><span class="ep-slab ep-slab--b" aria-hidden="true"></span><span class="ep-tex" aria-hidden="true"></span>
  <div class="ep-top">
    <a class="ep-icon" href="${esc(d.backHref || '#')}" data-back aria-label="Indietro">${I.back}</a>
    ${d.competitionHref ? `<a class="ep-comp" href="${esc(d.competitionHref)}">${d.competitionIcon || ''}<span>${comp}</span></a>` : `<span class="ep-comp">${d.competitionIcon || ''}<span>${comp}</span></span>`}
    ${d.topAction || (d.share ? `<button type="button" class="ep-icon" data-ep-share aria-label="Condividi">${I.share}</button>` : '<span class="ep-icon ep-icon--void" aria-hidden="true"></span>')}
  </div>
  ${side(H, 'a')}${side(A, 'b')}
  ${bug(H, A, d, hasScore, lostA, lostB, w)}
</header>
<div class="ep-info">
  ${live ? `<span class="ep-live">${esc(liveTxt)}</span>` : ''}
  <b class="ep-when${d.start || d.when ? '' : ' is-tbd'}">${esc(whenTxt)}</b>
  ${place}
</div>
${statsHtml || playersHtml ? `<div class="ep-body">
  ${statsHtml ? `<section class="ep-col ep-col--stats" aria-label="Statistiche"><h3 class="ep-tag"><span>Statistiche</span></h3>${statsHtml}${d.statsNote ? `<small class="ep-note">${esc(d.statsNote)}</small>` : ''}</section>` : ''}
  ${playersHtml ? `<section class="ep-col ep-col--players" aria-label="Protagonisti"><h3 class="ep-tag"><span>Protagonisti</span></h3>${playersHtml}</section>
  <section class="ep-col ep-side3 ep-side3--a" aria-label="Migliori realizzatori: ${esc(H.short || H.name)}">${sideCol('a')}</section>
  <section class="ep-col ep-side3 ep-side3--b" aria-label="Migliori realizzatori: ${esc(A.short || A.name)}">${sideCol('b')}</section>` : ''}
</div>` : ''}
${cta ? `<footer class="ep-actions">
  ${d.cta.act ? `<button type="button" class="ep-cta" data-act="${esc(d.cta.act)}" data-id="${esc(d.cta.id || '')}"><span>${esc(cta)}</span></button>` : `<a class="ep-cta" href="${esc(d.cta.href || '#')}"><span>${esc(cta)}</span></a>`}
  ${d.state === 'pre' && d.calendarHref ? `<a class="ep-cal" href="${esc(d.calendarHref)}" aria-label="Aggiungi al calendario">${I.cal}</a>` : ''}
</footer>` : ''}
${d.more ? `<div class="ep-more">${d.more}</div>` : ''}
</article>`;
  }

  function mount(el, data) { el.innerHTML = render(data); fitAll(el); return el.firstElementChild; }

  /* ---------- nomi dentro la propria metà (SP-IN, Diego 2026-10-20) ----------
     Le fasce sono divise da una diagonale (--ep-cut-top in alto, --ep-cut-bot in basso): lo spazio per il nome cambia con
     l'altezza. Per ogni riga del nome si controlla che stia dal proprio lato della diagonale (con la linea bianca e un
     margine per il corsivo); se no il corpo scende del 6% alla volta, fino al 40%. Si rifà quando la scheda cambia
     larghezza, quando arriva nella pagina e quando i font sono caricati. */
  function fitName(n, side, hero, top, bot, gap) {
    n.style.fontSize = '';
    const H = hero.getBoundingClientRect(), slab = hero.querySelector('.ep-slab'), sh = slab ? slab.getBoundingClientRect().height : H.height;
    if (!H.width || !sh) return;
    const x = y => H.left + H.width * (top + (bot - top) * Math.min(1, Math.max(0, (y - H.top) / sh)));
    const base = parseFloat(getComputedStyle(n).fontSize) || 0; let fs = base;
    const r = document.createRange();
    for (let i = 0; i < 16 && fs > base * .4; i++) {
      r.selectNodeContents(n); const m = fs * .14;
      const ok = [...r.getClientRects()].every(q => side === 'a' ? q.right <= x(q.bottom) - m : q.left >= x(q.top) + gap + m);
      if (ok) return;
      fs *= .94; n.style.fontSize = fs + 'px';
    }
  }
  function fitEp(ep) {
    const hero = ep.querySelector('.ep-hero'); if (!hero) return;
    const cs = getComputedStyle(hero), pc = v => (parseFloat(cs.getPropertyValue(v)) || 0) / 100;
    const top = pc('--ep-cut-top'), bot = pc('--ep-cut-bot'), gap = parseFloat(cs.getPropertyValue('--ep-gap')) || 0;
    ep.querySelectorAll('.ep-side--a .ep-name').forEach(n => fitName(n, 'a', hero, top, bot, gap));
    ep.querySelectorAll('.ep-side--b .ep-name').forEach(n => fitName(n, 'b', hero, top, bot, gap));
  }
  const RO = typeof ResizeObserver === 'function' ? new ResizeObserver(es => es.forEach(e => {
    const w = Math.round(e.contentRect.width); if (e.target.__epW === w) return; e.target.__epW = w; fitEp(e.target);
  })) : null;
  function fitAll(root) {
    (root || document).querySelectorAll('.ep').forEach(ep => { if (RO && !ep.__epRO) { ep.__epRO = 1; RO.observe(ep); } fitEp(ep); });
  }
  if (typeof document !== 'undefined' && typeof MutationObserver === 'function') {
    const start = () => {
      new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes].some(x => x.nodeType === 1 && (x.matches('.ep') || x.querySelector('.ep'))))) fitAll(); })
        .observe(document.body, { childList: true, subtree: true });
      fitAll();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { document.querySelectorAll('.ep').forEach(ep => fitEp(ep)); });
    };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.eventPoster = { render, mount, teamColors, clash, onColor, abbr, fit: fitAll };
})();
