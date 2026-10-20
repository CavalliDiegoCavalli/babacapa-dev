/* SP-IN · Tab "Eventi" in stile "Prima serata" (EventsTab)
   Script classico, senza dipendenze. Espone window.SPIN.eventsTab:
     render(data)          → HTML dell'intero contenuto del tab (intestazione, elenco, colonna laterale)
     header(h)             → solo intestazione: titolo, "Crea evento", selettore Prossimi/orologio, filtri
     list(groups, empty)   → solo elenco per giorno
     card(item)            → una card (partita, torneo/campionato, bozza)
     calendar(c)           → solo calendario del mese
     competitions(list)    → solo riquadro "Competizioni"
   Contratto dei dati: TAB-EVENTI.md, sezione 4. Ogni elemento interattivo accetta `attrs` (oggetto di attributi,
   es. {"data-act": "evseg", "data-v": "1"}) così l'app collega i propri gestori senza cambiare il componente.
   Decisioni di design (Diego, 2026-10-20): niente dati live; selettore "Prossimi" + orologio (già giocati);
   filtri multipli senza "Tutti" (nessun filtro attivo = tutti), pollice "Le mie squadre" per primo; niente ricerca;
   colori delle squadre sempre il primo colore; su PC selettore e filtri su una riga, calendario sopra "Competizioni".
   Correzioni di Diego del 2026-10-20 (SP-IN): niente titolo se header.title è vuoto; "Prossimi" senza numero se manca
   count; colori di fasce e stemmi con le regole della scheda evento (SPIN.eventPoster.teamColors: ospite al secondo colore
   se si confonde con la casa, contorno dello stemma nell'altro colore della squadra); pollice = icona thumbs-up del design
   system; colori dei tipi (Diego, 2026-10-20, con la pagina tornei/campionati): campionato arancio, torneo verde,
   amichevole blu; la card torneo usa la scarpa che corre, quella campionato la coppa; header.extra (HTML fidato) per i filtri propri dell'app, sotto la barra; header.titleExtra (HTML fidato) a
   sinistra di "Crea evento". */
(function () {
  'use strict';

  const INK = '#14202B';
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function lum(h) { return rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); }
  function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function onColor(h) { return contrast(h, '#FFFFFF') >= contrast(h, INK) ? '#FFFFFF' : INK; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  function attrs(o) { return Object.keys(o || {}).map(k => ` ${esc(k)}="${esc(o[k])}"`).join(''); }
  function abbr(t) { return (t.abbr || String(t.short || t.name || '').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '—'; }
  function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  /* link o pulsante: href → <a>, altrimenti <button> con gli attributi dell'app */
  function tag(o, cls, inner, extra) {
    const a = attrs(o && o.attrs) + (extra || '');
    return o && o.href ? `<a class="${cls}" href="${esc(o.href)}"${a}>${inner}</a>` : `<button type="button" class="${cls}"${a}>${inner}</button>`;
  }

  const I = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    thumb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    shoe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 15h12a2 2 0 0 0 2-2 2 2 0 0 0-1.5-1.9L16 10l-2-4h-2.5l-1 2H9a1 1 0 0 0-1 1z"/><path d="M8 18.5h14"/><path d="M12.5 9.5h2"/><path d="M13 12h2.5"/><path d="M2 9h4"/><path d="M1 12h5"/><path d="M3 15h3"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>'
  };
  const TYPES = { amichevole: 'Amichevole', torneo: 'Torneo', campionato: 'Campionato' };

  /* ---------- intestazione ---------- */
  function header(h) {
    h = h || {};
    const seg = h.seg || {}, nx = seg.next || {}, ps = seg.past || {};
    const create = h.create ? tag(h.create, 'evx-create', `<span>${I.plus}${esc(h.create.label || 'Crea evento')}</span>`) : '';
    const fl = (h.filters || []).map(f => f.key === 'mine'
      ? tag(f, 'evx-f evx-f--mine', `<span>${I.thumb}</span>`, ` aria-pressed="${!!f.pressed}" aria-label="${esc(f.label || 'Le mie squadre')}" title="${esc(f.label || 'Le mie squadre')}"`)
      : tag(f, 'evx-f', `<span>${esc(f.label || TYPES[f.key] || f.key)}</span>`, ` aria-pressed="${!!f.pressed}"`)).join('');
    return `<div class="evx-head">
  ${h.title || create || h.titleExtra ? `<div class="evx-title">${h.title ? `<h1>${esc(h.title)}</h1>` : ''}${h.titleExtra ? `<span class="evx-title-x">${h.titleExtra}</span>` : ''}${create}</div>` : ''}
  <div class="evx-bar">
    <div class="evx-seg" role="group" aria-label="Quali eventi">
      ${tag(nx, 'evx-s evx-s--next', `<span>${esc(nx.label || 'Prossimi')}${nx.count != null ? `<small>${esc(nx.count)}</small>` : ''}</span>`, ` aria-pressed="${!ps.pressed}"`)}
      ${tag(ps, 'evx-s evx-s--past', `<span>${I.clock}</span>`, ` aria-pressed="${!!ps.pressed}" aria-label="${esc(ps.label || 'Già giocati')}" title="${esc(ps.label || 'Già giocati')}"`)}
    </div>
    ${fl ? `<span class="evx-sep" aria-hidden="true"></span><div class="evx-filters" role="group" aria-label="Filtra gli eventi">${fl}</div>` : ''}
  </div>
  ${h.extra ? `<div class="evx-extra">${h.extra}</div>` : ''}
</div>`;
  }

  /* ---------- card ---------- */
  /* contorno dello stemma: l'altro colore della squadra (come nella scheda evento), o il colore del testo sulla fascia */
  function ringOf(t) { const c = t.color || INK, a = t.altColor; return a && a.toLowerCase() !== c.toLowerCase() ? a : onColor(c); }
  function crest(t, cls, ring) {
    const inner = t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : `<b>${esc(initials(t.short || t.name))}</b>`;
    return `<span class="${cls}" style="--c-bg:${esc(t.logoBg || '#FFFFFF')};--c-ring:${esc(ring || ringOf(t))}">${inner}</span>`;
  }
  function pairColors(H, A) {
    const P = window.SPIN && window.SPIN.eventPoster;
    if (P && P.teamColors) { const c = P.teamColors(H, A); return { a: c.a, b: c.b, aRing: c.aRing, bRing: c.bRing }; }
    return { a: H.color || INK, b: A.color || INK, aRing: ringOf(H), bRing: ringOf(A) };
  }
  function meta(it, title) {
    return `<span class="evx-meta">
      ${it.comp || it.round ? `<span class="evx-comp">${esc([it.comp, it.round].filter(Boolean).join(' · '))}</span>` : ''}
      <b class="evx-name">${esc(title)}</b>
      ${it.extra ? `<span class="evx-next">${esc(it.extra)}</span>` : ''}
      ${it.place || it.city ? `<span class="evx-place">${I.pin}<span>${esc([it.place, it.city].filter(Boolean).join(' · '))}</span></span>` : ''}
    </span>`;
  }
  function typeChip(it) { return it.type ? `<span class="evx-type"><span>${esc(TYPES[it.type] || it.type)}</span></span>` : ''; }
  function matchCard(it) {
    const H = it.home || {}, A = it.away || {}, C = pairColors(H, A), a = C.a, b = C.b;
    const sc = it.score && it.score.home != null;
    const lostA = sc && it.score.home < it.score.away, lostB = sc && it.score.away < it.score.home;
    const mid = sc
      ? `<span class="evx-sc" aria-label="Risultato ${it.score.home} a ${it.score.away}"><span${lostA ? ' class="is-lost"' : ''}>${esc(it.score.home)}</span><i>–</i><span${lostB ? ' class="is-lost"' : ''}>${esc(it.score.away)}</span></span>`
      : `<span>${esc(it.time || '—')}</span>`;
    const title = `${H.short || H.name || ''} – ${A.short || A.name || ''}`;
    const inner = `<span class="evx-band" style="--a:${esc(a)};--a-on:${onColor(a)};--b:${esc(b)};--b-on:${onColor(b)}" aria-hidden="true">
        <span class="evx-slab evx-slab--a"></span><span class="evx-slab evx-slab--b"></span><span class="evx-tex"></span>
        ${crest(H, 'evx-crest evx-crest--a', C.aRing)}${crest(A, 'evx-crest evx-crest--b', C.bRing)}
        <span class="evx-bug"><span class="evx-bug-t evx-bug-t--a"><b>${esc(abbr(H))}</b></span><span class="evx-bug-mid">${mid}</span><span class="evx-bug-t evx-bug-t--b"><b>${esc(abbr(A))}</b></span></span>
      </span>
      <span class="evx-body">${meta(it, title)}${typeChip(it)}<span class="evx-chev">${I.chev}</span></span>`;
    return tag(it, 'evx-card evx-card--match', inner, ` aria-label="${esc(title + (sc ? `, ${it.score.home} a ${it.score.away}` : it.time ? ', ore ' + it.time : ''))}"`);
  }
  function stackCard(it) {
    const crests = (it.crests || []).slice(0, 5).map(t => crest(t, 'evx-mini')).join('');
    const inner = `<span class="evx-sband" aria-hidden="true"><span class="evx-sband-acc" style="background:${TYCOL[it.type] || 'var(--accent)'}"></span><span class="evx-tex"></span><span class="evx-trophy">${it.type === 'torneo' ? I.shoe : I.trophy}</span><span class="evx-minis">${crests}</span></span>
      <span class="evx-body">${meta({ comp: it.info, extra: it.nextLine, place: it.place, city: it.city }, it.name)}${typeChip(it)}<span class="evx-chev">${I.chev}</span></span>`;
    return tag(it, 'evx-card evx-card--stack', inner);
  }
  function draftCard(it) {
    const inner = `<span class="evx-draft-tag"><b>${esc(it.tag || 'Bozza')}</b></span><span class="evx-draft-t"><b>${esc(it.name)}</b>${it.info ? `<span>${esc(it.info)}</span>` : ''}</span><span class="evx-chev">${I.chev}</span>`;
    return tag(it, 'evx-card evx-card--draft', inner);
  }
  function card(it) { return it.kind === 'stack' ? stackCard(it) : it.kind === 'draft' ? draftCard(it) : matchCard(it); }

  /* ---------- elenco ---------- */
  function dayTag(text, extra) {
    return `<div class="evx-day"><span class="evx-tag"><b>${esc(text)}</b></span><span class="evx-rule"></span>${extra ? `<span class="evx-count">${esc(extra)}</span>` : ''}</div>`;
  }
  function list(groups, empty) {
    if (!groups || !groups.length) return `<div class="evx-empty">${esc(empty || 'Nessun evento.')}</div>`;
    return groups.map(g => `<section class="evx-group"${g.id ? ` id="${esc(g.id)}"` : ''}>${dayTag(g.day, g.count)}${(g.items || []).map(card).join('')}</section>`).join('');
  }

  /* ---------- colonna laterale ---------- */
  const TYCOL = { amichevole: 'var(--brand-blue)', torneo: 'var(--brand-green)', campionato: 'var(--brand-orange)' };
  function calendar(c) {
    if (!c) return '';
    const head = ['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => `<span class="evx-cw">${d}</span>`).join('');
    const blanks = '<span></span>'.repeat(Math.max(0, Math.min(6, c.offset || 0)));
    const days = (c.days || []).map(d => {
      const ev = d.events || [];
      const cls = ['evx-cd', d.today ? 'is-today' : '', ev.length ? 'has' : '', d.past ? 'is-past' : '', d.selected ? 'is-sel' : ''].filter(Boolean).join(' ');
      const lbl = d.label || `${d.n}${ev.length ? `, ${ev.length} ${ev.length === 1 ? 'evento' : 'eventi'}` : ''}${d.today ? ', oggi' : ''}`;
      return tag(d, cls, `<span><b>${esc(d.n)}</b><span class="evx-dots">${ev.map(t => `<i style="background:${TYCOL[t] || 'var(--muted)'}"></i>`).join('')}</span></span>`, ` aria-label="${esc(lbl)}"${d.today ? ' aria-current="date"' : ''}`);
    }).join('');
    const legend = Object.keys(TYPES).map(k => `<span><i style="background:${TYCOL[k]}"></i>${TYPES[k]}</span>`).join('');
    return `<section class="evx-box evx-cal">${dayTag(c.title || 'Calendario')}
      <div class="evx-mhead">${tag(c.prev || {}, 'evx-mnav', `<span>${I.left}</span>`, ' aria-label="Mese precedente"')}<b>${esc(c.month)}</b>${tag(c.next || {}, 'evx-mnav evx-mnav--next', `<span>${I.chev}</span>`, ' aria-label="Mese successivo"')}</div>
      <div class="evx-grid">${head}${blanks}${days}</div>
      <div class="evx-leg">${legend}</div>
    </section>`;
  }
  function competitions(listc, title) {
    if (!listc || !listc.length) return '';
    return `<section class="evx-box evx-comps">${dayTag(title || 'Competizioni')}${listc.map(k => tag(k, 'evx-compr',
      `${k.lead ? crest(k.lead, 'evx-mini evx-mini--lead') : ''}<span class="evx-compt"><b>${esc(k.name)}</b><span>${esc([k.info, k.leadTxt].filter(Boolean).join(' · '))}</span>${k.pct != null ? `<span class="evx-prog"><i style="width:${Math.max(0, Math.min(100, +k.pct))}%"></i></span>` : ''}</span><span class="evx-chev">${I.chev}</span>`)).join('')}</section>`;
  }

  /* ---------- intero tab ---------- */
  function render(d) {
    d = d || {};
    const side = calendar(d.calendar) + competitions(d.competitions, d.competitionsTitle);
    return `<div class="evx">
${header(d.header)}
<div class="evx-cols">
  <div class="evx-list">${list(d.groups, d.empty)}</div>
  ${side ? `<aside class="evx-side">${side}</aside>` : ''}
</div>
</div>`;
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.eventsTab = { render, header, list, card, calendar, competitions, abbr, onColor };
})();
