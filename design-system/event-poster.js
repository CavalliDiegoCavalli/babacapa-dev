/* SP-IN · Scheda evento "Faccia a faccia" (EventPoster)
   Script classico, senza dipendenze. Espone window.SPIN.eventPoster:
     render(data)        → stringa HTML dell'<article class="ep">
     mount(el, data)     → scrive il markup dentro el
     teamColors(a, b)    → colori calcolati (utile per test)
   Il contratto dei dati è descritto in SCHEDA-EVENTO.md, sezione 4.
   Aggiunte per SP-IN (2026-10-16, manuale sezione 17): start nullo ("Data da definire"), competitionHref, venue.href e
   venue.ext (mappe), Team.href (stemma che apre la squadra), Team.attrs/nameClass (trascinamento casa/ospite), data-back
   sulla freccia (nell'app torna alla schermata lasciata), cta come
   azione dell'app ({label, act, id}; senza cta niente pulsante), calendarHref facoltativo, nomi lunghi rimpiccioliti.
   Dal 2026-10-19 (Diego): Condividi solo con share: true; competitionIcon (HTML fidato, prima del nome della competizione);
   topAction (HTML fidato, in alto a destra); when {day, date, time} al posto della data calcolata da start; statRows
   (righe scelte dall'app: numeri con barre, kind 'form' con i pallini, kind 'text' con HTML fidato, "—" se manca un
   valore) e statsNote; more (HTML fidato: il resto della pagina, sotto le statistiche, nella stessa scheda). */
(function () {
  'use strict';

  /* ---------- colore ---------- */
  const INK = '#14202B';
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function lum(h) { return rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); }
  function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  /* testo sul colore squadra: bianco o inchiostro, quello con più contrasto */
  function onColor(h) { return contrast(h, '#FFFFFF') >= contrast(h, INK) ? '#FFFFFF' : INK; }
  function hue(h) { const [r, g, b] = rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const H = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (H * 60 + 360) % 360; }
  /* due colori "si confondono" se hanno tinta e luminosità vicine, o se sono entrambi molto scuri */
  function clash(a, b) {
    const d = Math.abs(hue(a) - hue(b));
    return (Math.min(d, 360 - d) < 35 && Math.abs(lum(a) - lum(b)) < .25) || (lum(a) < .06 && lum(b) < .06);
  }
  /* la squadra ospite passa alla maglia trasferta (secondo colore) se il suo primo colore si confonde con quello di casa */
  function teamColors(home, away) {
    const awayKit = !!away.altColor && clash(home.color, away.color);
    const a = home.color, b = awayKit ? away.altColor : away.color;
    return {
      a, aOn: onColor(a), aBar: home.color,
      b, bOn: onColor(b), bBar: away.color,          /* barre e pallini: sempre il primo colore della squadra */
      awayKit
    };
  }

  /* ---------- testo ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
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

  /* ---------- icone (set SP-IN, tratto 2px) ---------- */
  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
  };

  /* ---------- pezzi ---------- */
  function crest(t, side) {
    const inner = t.logo ? `<img src="${esc(t.logo)}" alt="Logo ${esc(t.name)}" loading="lazy">` : `<b aria-hidden="true">${esc(initials(t.short || t.name))}</b>`;
    return t.href ? `<a class="ep-crest ep-crest--${side}" href="${esc(t.href)}" aria-label="${esc(t.name)}">${inner}</a>` : `<span class="ep-crest ep-crest--${side}">${inner}</span>`;
  }
  /* nomi senza sigla breve: il corpo scende con la parola più lunga e con la lunghezza totale (al massimo 2 righe) */
  function nameScale(s) {
    const w = Math.max(0, ...String(s).split(/\s+/).map(x => x.length)), k = Math.min(1, 9 / Math.max(w, 1), 18 / Math.max(String(s).length, 1));
    return Math.max(.42, Math.round(k * 100) / 100);
  }
  function attrs(o) { return Object.keys(o || {}).map(k => ` ${esc(k)}="${esc(o[k])}"`).join(''); }
  function team(t, side, awayKit) {
    return `<div class="ep-team ep-team--${side}">` +
      (t.kicker ? `<span class="ep-kicker">${esc(t.kicker)}</span>` : '') +
      `<h2 class="ep-name${t.nameClass ? ' ' + esc(t.nameClass) : ''}" title="${esc(t.name)}" style="--ep-k:${nameScale(t.short || t.name)}"${attrs(t.attrs)}>${esc(t.short || t.name)}</h2>` +
      (t.sub ? `<span class="ep-sub">${esc(t.sub)}</span>` : '') +
      (awayKit ? '<span class="ep-kit">Maglia trasferta</span>' : '') +
      '</div>';
  }
  function watermark(t, side) {
    /* niente filigrana per i loghi su fondo scuro: col "multiply" diventerebbero un rettangolo nero */
    if (!t.logo || (t.logoBg && lum(t.logoBg) < .2)) return '';
    return `<div class="ep-wm ep-wm--${side}" aria-hidden="true"><img src="${esc(t.logo)}" alt=""></div>`;
  }
  function statRow(label, x, y) {
    if (x == null || y == null) return '';
    const mx = Math.max(x, y) || 1, lowA = x < y ? ' class="is-low"' : '', lowB = y < x ? ' class="is-low"' : '';
    return `<div class="ep-stat"><div class="ep-stat-head"><b${lowA}>${fmtNum(x)}</b><span>${esc(label)}</span><b${lowB}>${fmtNum(y)}</b></div>` +
      `<div class="ep-bars" aria-hidden="true"><span><i${lowA} style="width:${Math.round(x / mx * 100)}%"></i></span><span><i${lowB} style="width:${Math.round(y / mx * 100)}%"></i></span></div></div>`;
  }
  function numRow(r) {
    const x = r.home == null ? null : +r.home, y = r.away == null ? null : +r.away, mx = Math.max(x || 0, y || 0) || 1;
    const lowA = x != null && y != null && x < y ? ' class="is-low"' : '', lowB = x != null && y != null && y < x ? ' class="is-low"' : '';
    const v = (n, lo) => n == null ? '<b class="is-none">—</b>' : `<b${lo}>${fmtNum(n)}</b>`;
    return `<div class="ep-stat"><div class="ep-stat-head">${v(x, lowA)}<span>${esc(r.label)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>${v(y, lowB)}</div>` +
      `<div class="ep-bars" aria-hidden="true"><span><i${lowA} style="width:${x == null ? 0 : Math.round(x / mx * 100)}%"></i></span><span><i${lowB} style="width:${y == null ? 0 : Math.round(y / mx * 100)}%"></i></span></div></div>`;
  }
  function formDots(l, side) {
    if (!Array.isArray(l) || !l.length) return `<span class="ep-dots ep-dots--${side}"><b class="is-none">—</b></span>`;
    return `<span class="ep-dots ep-dots--${side}" role="img" aria-label="${esc(l.map(x => x.title || (x.w ? 'vinta' : 'persa')).join(', '))}">${l.map(x => `<i class="${x.w ? 'w' : ''}" title="${esc(x.title || '')}"></i>`).join('')}</span>`;
  }
  function anyRow(r) {
    const lbl = `<span class="ep-lbl">${esc(r.label)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>`;
    if (r.kind === 'form') return `<div class="ep-form">${formDots(r.home, 'a')}${lbl}${formDots(r.away, 'b')}</div>`;
    if (r.kind === 'text') return `<div class="ep-txt"><span class="ep-tv ep-tv--a">${r.home || '<b class="is-none">—</b>'}</span>${lbl}<span class="ep-tv ep-tv--b">${r.away || '<b class="is-none">—</b>'}</span></div>`;
    return numRow(r);
  }
  function dots(form, side) {
    const f = String(form || '').toUpperCase().split('').filter(c => c === 'V' || c === 'P');
    return `<span class="ep-dots ep-dots--${side}" role="img" aria-label="Ultime partite: ${f.map(c => c === 'V' ? 'vinta' : 'persa').join(', ') || 'nessuna'}">${f.map(c => `<i class="${c === 'V' ? 'w' : ''}"></i>`).join('')}</span>`;
  }

  /* ---------- render ---------- */
  function render(d) {
    const H = d.home, A = d.away, C = teamColors(H, A);
    const live = d.state === 'live', final = d.state === 'final', hasScore = (live || final) && d.score;
    const w = d.when || when(d.start, d.timeZone);
    const lostA = final && d.score.home < d.score.away, lostB = final && d.score.away < d.score.home;
    const style = [
      `--ep-a:${C.a}`, `--ep-a-on:${C.aOn}`, `--ep-a-bar:${C.aBar}`, `--ep-a-crest:${H.logoBg || '#FFFFFF'}`,
      `--ep-b:${C.b}`, `--ep-b-on:${C.bOn}`, `--ep-b-bar:${C.bBar}`, `--ep-b-crest:${A.logoBg || '#FFFFFF'}`
    ].join(';');
    const s = d.stats || {};
    const stats = Array.isArray(d.statRows) ? d.statRows.map(anyRow).join('') : [
      statRow('Punti a partita', s.home && s.home.ptsAvg, s.away && s.away.ptsAvg),
      statRow('Vittorie in stagione', s.home && s.home.wins, s.away && s.away.wins),
      statRow('Precedenti vinti', s.home && s.home.h2hWins, s.away && s.away.h2hWins)
    ].join('');
    const form = !Array.isArray(d.statRows) && (H.form || A.form) ? `<div class="ep-form">${dots(H.form, 'a')}<span class="ep-lbl">Ultime partite</span>${dots(A.form, 'b')}</div>` : '';
    const periods = final && Array.isArray(d.periods) && d.periods.length
      ? `<div class="ep-periods">${d.periods.slice(0, 4).map((p, i) => `<span class="${p[0] > p[1] ? 'pa' : p[1] > p[0] ? 'pb' : ''}"><small>${i + 1}° T</small><b>${p[0]}–${p[1]}</b></span>`).join('')}</div>`
      : '';
    const cta = d.cta && (d.cta.label || (live ? 'Segui il referto live' : final ? 'Vedi il referto' : 'Segui l’evento'));
    const comp = esc([d.competition, d.round].filter(Boolean).join(' · '));
    const place = d.venue ? `${I.pin}<span>${esc([d.venue.name, d.venue.city].filter(Boolean).join(' · '))}</span>` : '';
    const title = `${H.name} contro ${A.name}`;

    return `<article class="ep ep--${esc(d.state)}" style="${style}" aria-label="${esc(title)}">
<header class="ep-hero">
  ${watermark(H, 'a')}${watermark(A, 'b')}
  <div class="ep-top">
    <a class="ep-icon" href="${esc(d.backHref || '#')}" data-back aria-label="Indietro">${I.back}</a>
    ${d.competitionHref ? `<a class="ep-comp" href="${esc(d.competitionHref)}">${d.competitionIcon || ''}<span>${comp}</span></a>` : `<span class="ep-comp">${d.competitionIcon || ''}<span>${comp}</span></span>`}
    ${d.topAction || (d.share ? `<button type="button" class="ep-icon" data-ep-share aria-label="Condividi">${I.share}</button>` : '<span class="ep-icon ep-icon--void" aria-hidden="true"></span>')}
  </div>
  ${crest(H, 'a')}${crest(A, 'b')}
  ${team(H, 'a', false)}${team(A, 'b', C.awayKit)}
  ${hasScore ? `<span class="ep-score ep-score--a${lostA ? ' is-lost' : ''}" aria-label="${esc(H.short || H.name)} ${d.score.home}">${d.score.home}</span><span class="ep-score ep-score--b${lostB ? ' is-lost' : ''}" aria-label="${esc(A.short || A.name)} ${d.score.away}">${d.score.away}</span>` : ''}
  <div class="ep-when">
    ${live ? `<span class="ep-status">${esc(['In diretta', [d.live && d.live.period, d.live && d.live.clock].filter(Boolean).join(' ')].filter(Boolean).join(' · '))}</span>` : ''}
    ${w.day ? `<span class="ep-day">${esc(w.day)}</span>` : ''}
    <b class="ep-date${d.start || d.when ? '' : ' is-tbd'}">${esc(w.date)}</b>
    ${w.time ? `<span class="ep-time">${esc(w.time)}</span>` : ''}
    ${place ? (d.venue.href ? `<a class="ep-place" href="${esc(d.venue.href)}"${d.venue.ext ? ' target="_blank" rel="noopener"' : ''} aria-label="Apri ${esc(d.venue.name)} nelle mappe">${place}</a>` : `<span class="ep-place">${place}</span>`) : ''}
  </div>
</header>
${stats || form || periods ? `<section class="ep-stats" aria-label="Statistiche"><h3>Statistiche</h3>${stats}${form}${periods}${d.statsNote ? `<small class="ep-note">${esc(d.statsNote)}</small>` : ''}</section>` : ''}
${cta ? `<footer class="ep-actions">
  ${d.cta.act ? `<button type="button" class="btn big primary" data-act="${esc(d.cta.act)}" data-id="${esc(d.cta.id || '')}">${esc(cta)}</button>` : `<a class="btn big primary" href="${esc(d.cta.href || '#')}">${esc(cta)}</a>`}
  ${d.state === 'pre' && d.calendarHref ? `<a class="ep-cal" href="${esc(d.calendarHref)}" aria-label="Aggiungi al calendario">${I.cal}</a>` : ''}
</footer>` : ''}
${d.more ? `<div class="ep-more">${d.more}</div>` : ''}
</article>`;
  }

  function mount(el, data) { el.innerHTML = render(data); return el.firstElementChild; }

  window.SPIN = window.SPIN || {};
  window.SPIN.eventPoster = { render, mount, teamColors, clash, onColor };
})();
