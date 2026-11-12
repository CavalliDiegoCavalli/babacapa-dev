/* SP-IN · Tab "Squadre" per i tifosi, proposta 5 "Muro degli stemmi" (TeamsTab)
   Script classico; usa window.SPIN.core (spin-core.js, da caricare prima). Espone window.SPIN.teamsTab:
     render(data)        → HTML dell'intero tab: intestazione, muro degli stemmi e (da 900px) anteprima a destra
     header(h)           → titolo "Squadre", ricerca, pollice "Le mie squadre", "Registra una squadra"
     wall(teams)         → muro degli stemmi in ordine alfabetico
     card(c, opts)       → scheda della squadra (anteprima su PC; opts.closable = versione del dialog)
     dialog(c)           → scheda dentro un dialog a foglio dal basso (telefono)
     onColor(hex)        → colore del testo leggibile su un fondo
   Contratto dei dati: SQUADRE-SOCIETA.md, sezione 4. Ogni elemento interattivo accetta `href` oppure `attrs`
   (oggetto di attributi su un <button>), così l'app collega i propri gestori.
   Decisioni (Diego, 2026-10-21): proposta 5; su telefono il muro mostra tutte le squadre e la scheda si apre in un
   dialog; la testata della scheda usa il PRIMO colore (fascia con lo stemma) e il SECONDO colore (fondo), mai il grigio
   scuro; statistiche come nella scheda evento: punti medi a partita non di campionato e di campionato, miglior
   realizzatore, miglior realizzatore da 3, V/P delle ultime 3 partite, più il prossimo evento. Niente dati live.
   SP-IN (2026-11-12, Diego): nessuna linea colorata sotto le caselle; la casella di una squadra seguita prende il primo
   colore con la filigrana obliqua e lo stemma in evidenza; il "segui" è un cuore (non più il pollice); nella scheda
   atleti (totale e per ruolo), punti medi a partita (tutte le gare), punti medi per ruolo, % dei punti da 3, poi le ultime
   3 partite e il prossimo evento; il nome della squadra si adatta su al massimo 3 righe senza spezzare le parole (fit);
   senza accesso il contenuto è poco sfocato sotto "Diventa tifoso per seguire le tue squadre preferite". */
(function () {
  'use strict';
  // design system v2 (2026-10-22): utilità comuni da spin-core (window.SPIN.core, caricato prima)
  const core = window.SPIN.core, esc = core.esc, onColor = core.onColor;

  const INK = '#14202B';
  function attrs(o) { return Object.keys(o || {}).map(k => ` ${esc(k)}="${esc(o[k])}"`).join(''); }
  function abbr(t) { return (t.abbr || String(t.short || t.name || '').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '—'; }
  function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  function num(v) { return v == null || v === '' ? '—' : (typeof v === 'number' ? v.toLocaleString('it-IT', { minimumFractionDigits: Number.isInteger(v) ? 0 : 1, maximumFractionDigits: 1 }) : String(v)); }
  function dec(v) { return v == null || v === '' ? '—' : Number(v).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function tag(o, cls, inner, extra) {
    const a = attrs(o && o.attrs) + (extra || '');
    return o && o.href ? `<a class="${cls}" href="${esc(o.href)}"${a}>${inner}</a>` : `<button type="button" class="${cls}"${a}>${inner}</button>`;
  }
  function name(t) { return t.short || t.name || ''; }

  const SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const I = {
    plus: `<svg ${SV} stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>`,
    search: `<svg ${SV}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
    heart: `<svg ${SV}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
    chev: `<svg ${SV}><path d="m9 18 6-6-6-6"/></svg>`,
    close: `<svg ${SV}><path d="M6 6l12 12M18 6L6 18"/></svg>`
  };

  /* stemma tondo: contorno nel PRIMO colore della squadra (come nella tavola) */
  function crest(t, cls) {
    const inner = t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : `<b>${esc(initials(name(t)))}</b>`;
    return `<span class="${cls}" style="--c-bg:${esc(t.logoBg || '#FFFFFF')};--c-ring:${esc(t.color || INK)}">${inner}</span>`;
  }
  function sec(text, extra) {
    return `<div class="tmx-sec"><span class="tmx-tag"><b>${esc(text)}</b></span><span class="tmx-rule"></span>${extra ? `<span class="tmx-sec-x">${esc(extra)}</span>` : ''}</div>`;
  }
  function follow(f, t, cls) {
    if (!f) return '';
    const on = !!f.pressed, lab = (on ? 'Segui già ' : 'Segui ') + (t.name || name(t));
    return tag(f, `tmx-follow ${cls || ''}`, `<span>${I.heart}</span>`, ` aria-pressed="${on}" aria-label="${esc(f.label || lab)}" title="${on ? 'La segui' : 'Segui'}"`);
  }

  /* ---------- intestazione ---------- */
  function header(h) {
    h = h || {};
    const s = h.search || {}, m = h.mine;
    const create = h.create ? tag(h.create, 'tmx-create', `<span>${I.plus}<b class="tmx-l">${esc(h.create.label || 'Registra una squadra')}</b><b class="tmx-s">${esc(h.create.short || 'Registra')}</b></span>`) : '';
    const search = h.search === false ? '' : `<label class="tmx-search"><span>${I.search}<input type="search" placeholder="${esc(s.placeholder || 'Cerca una squadra o una società')}" aria-label="${esc(s.label || 'Cerca una squadra o una società')}" value="${esc(s.value || '')}"${attrs(s.attrs)}></span></label>`;
    const mine = m ? tag(m, 'tmx-mine', `<span>${I.heart}</span>`, ` aria-pressed="${!!m.pressed}" aria-label="${esc(m.label || 'Solo le squadre che segui')}" title="Le mie squadre"`) : '';
    return `<div class="tmx-head">
  <div class="tmx-title">${h.title === '' ? '' : `<h1>${esc(h.title || 'Squadre')}</h1>`}${create}</div>
  ${search || mine ? `<div class="tmx-tools">${search}${mine}</div>` : ''}
</div>`;
  }

  /* ---------- muro degli stemmi ---------- */
  function tile(t) {
    const sel = !!t.selected, f = !!t.followed, c = t.color || INK;
    return tag(t, 'tmx-tile' + (f ? ' tmx-tile--f' : ''), `${f ? '<span class="tmx-tex" aria-hidden="true"></span>' : ''}${crest(t, 'tmx-crest')}<b class="tmx-tile-n">${esc(name(t))}</b>${f ? `<span class="tmx-tile-f" title="La segui">${I.heart}</span>` : ''}`,
      ` style="--c:${esc(c)};--c-on:${onColor(c)}" aria-current="${sel}" aria-label="${esc((t.name || name(t)) + (f ? ', la segui' : ''))}"`);
  }
  function wall(teams, empty) {
    const list = (teams || []).slice().sort((a, b) => name(a).localeCompare(name(b), 'it'));
    return list.length ? `<div class="tmx-wall">${list.map(tile).join('')}</div>` : `<div class="tmx-empty">${esc(empty || 'Nessuna squadra trovata.')}</div>`;
  }

  /* ---------- scheda della squadra ---------- */
  function head(c, closable) {
    const t = c.team || {}, a = t.color || INK, b = t.altColor && t.altColor.toLowerCase() !== a.toLowerCase() ? t.altColor : INK;
    const bOn = onColor(b);
    /* Diego, 2026-10-21: nel dialog il pollice "Segui" sta in alto, a sinistra della X */
    const right = closable
      ? follow(c.follow, t, 'tmx-follow--head') + tag(c.close || {}, 'tmx-close', I.close, ' aria-label="Chiudi"')
      : follow(c.follow, t, 'tmx-follow--head');
    return `<div class="tmx-ch" style="--a:${esc(a)};--b:${esc(b)};--b-on:${bOn}">
    <span class="tmx-ch-band" aria-hidden="true"></span><span class="tmx-tex" aria-hidden="true"></span>
    <b class="tmx-ch-wm" aria-hidden="true">${esc(abbr(t))}</b>
    ${crest(t, 'tmx-ch-crest')}
    <span class="tmx-ch-t"><small>Squadra</small><b>${esc(name(t))}</b></span>
    <span class="tmx-ch-r">${right}</span>
  </div>`;
  }
  function avg(label, v) {
    return `<div class="tmx-avg"><span>${esc(label)}</span><b class="tmx-avg-v">${esc(v)}</b></div>`;
  }
  function pct(v) { return v == null || v === '' ? '—' : Number(v).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + '%'; }
  /* SP-IN (2026-11-12): atleti e punti medi a partita per ruolo, una colonna per ruolo (1–5) */
  function roles(list) {
    if (!list || !list.length) return '';
    const row = (lab, f) => `<tr><th scope="row">${esc(lab)}</th>${list.map(r => `<td>${esc(f(r))}</td>`).join('')}</tr>`;
    return `<div class="tmx-blk"><span class="tmx-lab" aria-hidden="true">Per ruolo</span><table class="tmx-rt" aria-label="Atleti e punti a partita per ruolo">
      <thead><tr><th scope="col"><span class="tmx-vh">Ruolo</span></th>${list.map(r => `<th scope="col"><span><b>${esc(r.role)}</b></span></th>`).join('')}</tr></thead>
      <tbody>${row('Atleti', r => num(r.athletes))}${row('Punti a partita', r => dec(r.ppg))}</tbody></table></div>`;
  }
  function player(label, p, value, unit, t) {
    if (!p) return '';
    return `<div class="tmx-pl"><span class="tmx-pl-n" style="--a:${esc(t.color || INK)};--a-on:${onColor(t.color || INK)}"><b>${esc(p.num == null ? '' : p.num)}</b></span>
      <span class="tmx-pl-t"><small>${esc(label)}</small><b>${esc(p.name)}</b></span>
      <span class="tmx-pl-v"><b>${num(value)}</b><small>${esc(unit)}</small></span></div>`;
  }
  function last3(list) {
    if (!list || !list.length) return '';
    const it = list.slice(-3).map(g => {
      const o = g.opp || {}, oc = o.color || INK, w = g.result === 'V';
      const inner = `<span class="tmx-l3-r tmx-l3-r--${w ? 'v' : 'p'}" title="${w ? 'Vinta' : 'Persa'}"><b>${w ? 'V' : 'P'}</b></span><b class="tmx-l3-s">${esc(g.score || '')}</b>
        <span class="tmx-l3-o">vs <span style="--o:${esc(oc)};--o-on:${onColor(oc)}"><b>${esc(abbr(o))}</b></span></span>`;
      const lab = `${w ? 'Vinta' : 'Persa'} ${g.score || ''} contro ${o.name || name(o)}`;
      return g.href || g.attrs ? tag(g, 'tmx-l3', inner, ` aria-label="${esc(lab)}"`) : `<span class="tmx-l3" aria-label="${esc(lab)}">${inner}</span>`;
    }).join('');
    return `<div class="tmx-blk"><span class="tmx-lab">Ultime 3 partite</span><div class="tmx-l3s">${it}</div></div>`;
  }
  function nextEv(n) {
    if (!n) return '';
    const H = n.home || {}, A = n.away || {}, hc = H.color || INK, ac = A.color || INK;
    const when = [n.day, n.time].filter(Boolean).join(' · ');
    const inner = `<span class="tmx-bug" aria-hidden="true"><span style="--x:${esc(hc)};--x-on:${onColor(hc)}"><b>${esc(abbr(H))}</b></span><span class="tmx-bug-vs"><b>vs</b></span><span style="--x:${esc(ac)};--x-on:${onColor(ac)}"><b>${esc(abbr(A))}</b></span></span>
      <span class="tmx-nx-t"><b>${esc(when)}</b>${n.comp ? `<small>${esc(n.comp)}</small>` : ''}</span><span class="tmx-chev">${I.chev}</span>`;
    return `<div class="tmx-blk tmx-blk--line"><span class="tmx-lab">Prossimo evento</span>${tag(n, 'tmx-nx', inner, ` aria-label="${esc(`${name(H)} – ${name(A)}, ${when}`)}"`)}</div>`;
  }
  function body(c, closable) {
    const t = c.team || {}, s = c.stats || {};
    const open = c.open ? tag(c.open, 'tmx-open', `<b>${esc(c.open.label || 'Apri la squadra')} ›</b>`) : '';
    const actions = open ? `<div class="tmx-acts">${open}</div>` : '';   // "Apri la squadra" solo a chi può aprirla (Diego, 2026-10-21)
    return `<div class="tmx-cb">
    ${sec(c.statsTitle || 'Statistiche')}
    <div class="tmx-stx" style="--a:${esc(t.color || INK)};--a-on:${onColor(t.color || INK)}">
    <div class="tmx-avgs">${avg('Atleti', num(c.athletes))}${avg('Punti a partita', dec(s.ppg))}${avg('Punti da 3', pct(s.pct3))}</div>
    ${roles(s.roles)}</div>
    <div class="tmx-pls">${player('Miglior realizzatore', c.top, c.top && c.top.points, c.top && c.top.perGame != null ? `punti · ${dec(c.top.perGame)} a gara` : 'punti', t)}${player('Miglior realizzatore da 3', c.top3, c.top3 && c.top3.made, 'canestri da 3', t)}</div>
    ${last3(c.last)}
    ${nextEv(c.next)}
    ${actions}
  </div>`;
  }
  /* SP-IN (2026-10-23): senza accesso la scheda resta con stemma e nome nitidi; il resto (dati finti, dell'app) è sfocato
     e inerte, con in evidenza l'invito a registrarsi. c.locked = {title, text, login, signup} (href o attrs). */
  function lock(c, closable) {
    const L = c.locked;
    if (!L) return body(c, closable);
    const btn = (o, cls, t) => o ? tag(o, cls, `<b>${esc(o.label || t)}</b>`) : '';
    return `<div class="tmx-lock"><div class="tmx-lock-b" aria-hidden="true" inert>${body(c, closable)}</div>
    <div class="tmx-lock-cta"><b class="tmx-lock-t">${esc(L.title || 'Diventa tifoso per seguire le tue squadre preferite')}</b>${L.text ? `<p>${esc(L.text)}</p>` : ''}
      <div class="tmx-lock-a">${btn(L.login, 'tmx-lock-in', 'Accedi')}${btn(L.signup, 'tmx-lock-up', 'Registrati')}</div></div></div>`;
  }
  function card(c, o) {
    c = c || {}; o = o || {};
    return `<section class="tmx-card" aria-label="${esc('Scheda di ' + ((c.team || {}).name || name(c.team || {})))}">${head(c, !!o.closable)}${lock(c, !!o.closable)}</section>`;
  }

  /* ---------- dialog (telefono) ----------
     Markup del solo dialog: l'app lo aggiunge al body quando si tocca una squadra del muro sotto i 900px, porta il
     focus sul pulsante di chiusura, lo chiude con il pulsante, con Esc o toccando il fondo (.tmx-dlg-bg) e riporta il
     focus sulla squadra toccata. */
  function dialog(c) {
    c = c || {};
    const t = c.team || {};
    return `<div class="tmx tmx-dlg">
  ${tag(c.close || {}, 'tmx-dlg-bg', '', ' aria-label="Chiudi" tabindex="-1"')}
  <div class="tmx-sheet" role="dialog" aria-modal="true" aria-label="${esc('Scheda di ' + (t.name || name(t)))}">
    <span class="tmx-grip" aria-hidden="true"></span>
    ${head(c, true)}
    <div class="tmx-sheet-sc">${lock(c, true)}</div>
  </div>
</div>`;
  }

  /* ---------- tab ---------- */
  function render(d) {
    d = d || {};
    const teams = d.teams || [];
    const n = teams.length;
    const wallSub = d.wallNote != null ? d.wallNote : `${n} · A–Z`;
    const aside = d.preview ? `<aside class="tmx-aside">${sec('Anteprima')}${card(d.preview)}</aside>` : '';
    return `<div class="tmx">
  ${header(d.header)}
  <div class="tmx-cols${aside ? '' : ' tmx-cols--one'}">
    <div class="tmx-main">${sec(d.wallTitle || 'Tutte le squadre', wallSub)}${wall(teams, d.empty)}${d.hint === false ? '' : `<small class="tmx-hint">Tocca una squadra per vedere la sua scheda. <span>${I.heart}</span> = la segui</small>`}</div>
    ${aside}
  </div>
</div>`;
  }

  /* SP-IN (2026-11-12): il nome nella testata della scheda sta su al massimo 3 righe senza spezzare le parole: si parte
     dal corpo del CSS e si rimpicciolisce finché righe e parole ci stanno (come fitEp della scheda evento) */
  function fitName(n) {
    n.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(n).fontSize) || 40;
    for (let i = 0; i < 30 && fs > 12; i++) {
      const lh = parseFloat(getComputedStyle(n).lineHeight) || fs * .86;
      if (n.scrollWidth <= n.clientWidth + 1 && n.offsetHeight <= lh * 3 + 2) return;
      fs *= .92; n.style.fontSize = fs + 'px';
    }
  }
  const RO = typeof ResizeObserver === 'function' ? new ResizeObserver(es => es.forEach(e => {
    const w = Math.round(e.contentRect.width); if (e.target.__tmxW === w) return; e.target.__tmxW = w; const n = e.target.querySelector(':scope>b'); if (n) fitName(n);
  })) : null;
  function fit(root) { (root || document).querySelectorAll('.tmx-ch-t>b').forEach(n => { if (RO && !n.__tmxRO) { n.__tmxRO = 1; RO.observe(n.parentNode); } fitName(n); }); }
  if (typeof document !== 'undefined' && typeof MutationObserver === 'function') {
    const start = () => {
      new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes].some(x => x.nodeType === 1 && (x.matches('.tmx-ch') || x.querySelector('.tmx-ch'))))) fit(); })
        .observe(document.body, { childList: true, subtree: true });
      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fit());
    };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.teamsTab = { render, header, wall, card, dialog, abbr, onColor, fit };
})();
