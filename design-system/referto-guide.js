/* SP-IN · Copyright (c) 2026 Diego Cavalli. Tutti i diritti riservati.
   Autore: Diego Cavalli. È vietato copiare, modificare, distribuire o usare questo codice, in tutto o in parte, senza l'autorizzazione scritta dell'autore. */
/* window.SPIN.refGuide · Guida al referto (solo refertisti, tablet e computer).
   - welcomeHTML(opts) / bindWelcome(root, handlers): schermata di benvenuto
   - start(opts) / stop(): giro guidato con faretto e fumetto sopra le schermate vere del referto
   - endHTML() / bindEnd(root, handlers): schermata finale
   - voteHTML(opts) / bindVote(root, handlers): riquadro "Com'è andata con il referto?"
   - prefs: preferenze per utente (localStorage)
   Nessuna dipendenza. Stile: design system del referto (tokens.css + components.css, classi .btn). */
(function () {
  'use strict';
  const NS = (window.SPIN = window.SPIN || {});
  const VERSION = 1; // alzarlo quando la guida cambia molto: il benvenuto torna a comparire a chi l'aveva già vista

  /* ---------- icone (24×24, tratto) ---------- */
  const P = {
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    hand: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V4a1.5 1.5 0 0 1 3 0v7"/><path d="M15 10.5V6a1.5 1.5 0 0 1 3 0v8.5a6.5 6.5 0 0 1-6.5 6.5H11a6 6 0 0 1-4.6-2.2L3.5 15a1.6 1.6 0 0 1 2.4-2.1L9 15.5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    doc: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    star: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    right: '<path d="m9 18 6-6-6-6"/>'
  };
  const ico = (k, s = 20, sw = 2) => `<svg class="rgd-i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- campo stilizzato (landing.js court()) con i colori del referto ---------- */
  function court(w) {
    const h = Math.round(w * 308 / 568);
    const hoop = (x, y, side) => `<circle cx="${x}" cy="${y}" r="7" class="rgd-hp"/>${side ? `<circle cx="${x}" cy="${y}" r="3" class="rgd-hp-lo"/>` : ''}`;
    return `<svg class="rgd-court" viewBox="0 0 568 308" width="${w}" height="${h}" role="img" aria-label="Campo da Baskin"><g transform="translate(4 4)">
<rect class="rgd-cf" x="0" y="0" width="560" height="300" rx="6"/>
<g class="rgd-cl"><path d="M280 0V300"/><circle cx="280" cy="150" r="36"/>
<path d="M0 101H116V199H0"/><path d="M116 114A36 36 0 0 1 116 186"/><path d="M560 101H444V199H560"/><path d="M444 114A36 36 0 0 0 444 186"/>
<path d="M0 18H59.8A135 135 0 0 1 59.8 282H0"/><path d="M560 18H500.2A135 135 0 0 0 500.2 282H560"/>
<path class="rgd-bb" d="M24 132V168M536 132V168"/>
<path d="M220 0A60 60 0 0 0 340 0"/><path d="M220 300A60 60 0 0 1 340 300"/>
<path class="rgd-dash" d="M206 0A74 74 0 0 0 354 0"/><path class="rgd-dash" d="M206 300A74 74 0 0 1 354 300"/>
<path class="rgd-sb" d="M268 2H292M268 298H292"/></g>
${hoop(31.5, 150)}${hoop(528.5, 150)}${hoop(280, 12, true)}${hoop(280, 288, true)}</g></svg>`;
  }

  /* ---------- testi (approvati da Diego, canvas "Referto · benvenuto e guida all'uso") ----------
     SP-IN (2026-10-26): "quarto" al posto di "tempo" (decisione di Diego del 2026-10-26: quarti in tutta l'app e nel referto). */
  const COPY = {
    kicker: 'Benvenuto',
    title: 'Guida alla compilazione del referto di gara del Baskin',
    lead: 'Prepari le liste, segni ogni azione con un tocco e chiudi la gara con il referto pronto da firmare. I controlli del regolamento lavorano per te.',
    duration: '2', durationUnit: 'min', durationLabel: 'la guida',
    phases: [
      { title: 'Prepara', sub: 'Prima della gara, al tavolo.', icon: 'list',
        items: ['Dati della gara e arbitri', 'Liste R delle due squadre: il riquadro <b>Cosa manca</b> controlla le regole', 'I sei giocatori che iniziano'] },
      { title: 'Segna', sub: 'Durante la gara, un tocco per azione.', icon: 'hand',
        items: ['Tocca un giocatore in campo: tiri, canestri, falli', 'Tocca un giocatore in panchina per farlo entrare', 'Hai sbagliato? <b>Correggi</b> in cronologia'] },
      { title: 'Chiudi e firma', sub: 'A fine quarto e a fine gara.', icon: 'flag',
        items: ['<b>Chiudi il quarto</b> quando suona la sirena', 'Raccogli le <b>firme</b> di arbitri, refertista e capitani', 'Attendi il <b>caricamento</b> e lascia un voto sul referto'] }
    ],
    start: 'Inizia la guida', demo: 'Prova con una gara di esempio', skip: 'Salta, so già come fare',
    mute: 'Non mostrare più all’apertura',
    where: 'Puoi rivedere la guida quando vuoi dal <b>Tuo profilo › Guida al referto</b>.',
    endTitle: 'Sei pronto per la gara',
    endText: 'Prepara, segna, chiudi, firma e consegna. Se hai un dubbio, rivedi la guida dal <b>Tuo profilo › Guida al referto</b>.',
    endAgain: 'Rivedi la guida', endGo: 'Vai al referto'
  };

  /* screen = schermata del referto che l'app deve mostrare (in modalità guida, con la gara di esempio)
     target = valore dell'attributo data-guida dell'elemento da evidenziare
     place  = lato preferito del fumetto rispetto all'elemento: top | bottom | left | right */
  const STEPS = [
    { id: 'passi', screen: 'prep-gara', target: 'stepper', place: 'bottom', icon: 'list',
      title: 'Tre passi per preparare la gara',
      text: 'Gara, Squadre e Quintetti. Il passo completato diventa verde; puoi tornare indietro quando vuoi, fino al fischio d’inizio.' },
    { id: 'regole', screen: 'prep-squadre', target: 'cosa-manca', place: 'left', icon: 'check',
      title: 'Verifica automatica delle regole',
      text: 'Mentre scrivi la lista R, questo riquadro controlla le regole: numero di giocatori, ruoli, quota femminile, capitano. Quando è tutto verde la squadra è pronta.' },
    { id: 'quintetti', screen: 'prep-quintetti', target: 'quintetto', place: 'bottom', icon: 'hand',
      title: 'Quintetti iniziali',
      text: 'Tocca i sei giocatori del quintetto iniziale. I requisiti in alto diventano verdi man mano; quelli mancanti saranno cerchiati in rosso sul referto.' },
    { id: 'tocco', screen: 'live', target: 'giocatore-in-campo', place: 'right', icon: 'hand',
      title: 'Un tocco per ogni azione',
      text: 'Tocca un giocatore in campo per segnare tiri, canestri e falli. Tocca un giocatore in panchina per farlo entrare.' },
    { id: 'correggi', screen: 'live', target: 'cronologia', place: 'right', icon: 'undo',
      title: 'Hai sbagliato? Si corregge',
      text: 'Ogni azione finisce in cronologia con l’ora e il punteggio. <b>Correggi</b> la modifica o la toglie: il referto si aggiorna da solo.' },
    { id: 'fine-tempo', screen: 'live', target: 'fine-tempo', place: 'bottom', icon: 'flag',
      title: 'Fine quarto e referto',
      text: '<b>Chiudi il quarto</b> quando suona la sirena. In <b>Referto</b> vedi in ogni momento il modulo ufficiale; dopo il 4° quarto si passa alle firme.' },
    { id: 'firme', screen: 'firme', target: 'firme', place: 'left', icon: 'doc',
      title: 'Le firme',
      text: 'Dopo il 4° quarto si raccolgono le firme di arbitri, refertista, cronometrista e capitani. Tocca <b>Tocca per firmare</b>, firma con il dito e conferma. Se il capitano non può, firma il vicecapitano.' },
    { id: 'caricamento', screen: 'consegna', target: 'consegna', place: 'bottom', icon: 'check',
      title: 'Controllo e caricamento',
      text: 'Il referto ripassa controlli e firme, si salva sul tablet e si carica sulla piattaforma. Aspetta la spunta verde: senza rete resta al sicuro e si ricarica dopo.' },
    { id: 'voto', screen: 'consegnato', target: 'voto', place: 'top', icon: 'star',
      title: 'Com’è andata?',
      text: 'A consegna fatta dai un voto al referto e dicci cosa ha funzionato. Due tocchi, oppure <b>Non ora</b>.' }
  ];

  /* ---------- preferenze per utente ---------- */
  const storeKey = uid => 'spin.refGuide.' + (uid || 'anon');
  const prefs = {
    get(uid) {
      try { const v = JSON.parse(localStorage.getItem(storeKey(uid)) || '{}'); return v && v.v === VERSION ? v : {}; } catch (e) { return {}; }
    },
    set(uid, patch) {
      const next = Object.assign({}, prefs.get(uid), patch, { v: VERSION, at: new Date().toISOString() });
      try { localStorage.setItem(storeKey(uid), JSON.stringify(next)); } catch (e) { /* storage non disponibile: pazienza */ }
      return next;
    },
    /* il benvenuto si apre da solo finché l'utente non completa la guida o spunta "Non mostrare più" */
    shouldAutoOpen(uid) { const p = prefs.get(uid); return !p.done && !p.mute; }
  };

  /* ---------- benvenuto ---------- */
  function welcomeHTML(o) {
    o = o || {};
    const phase = (p, i) => `<section class="rgd-ph"><header><span class="rgd-n">${i + 1}</span><b>${esc(p.title)}</b><span class="rgd-ph-i">${ico(p.icon, 26)}</span></header>
      <p>${esc(p.sub)}</p><ul>${p.items.map(t => `<li>${ico('check', 15, 2.6)}<span>${t}</span></li>`).join('')}</ul></section>`;
    return `<div class="rgd-wel" role="region" aria-labelledby="rgd-wel-t">
  <div class="rgd-hero">
    <span class="rgd-hero-c">${court(220)}</span>
    <div class="rgd-hero-t"><span class="rgd-kick">${esc(COPY.kicker)}</span><h1 id="rgd-wel-t">${esc(COPY.title)}</h1><p>${esc(COPY.lead)}</p></div>
    <span class="rgd-dur"><b>${COPY.duration} <small>${COPY.durationUnit}</small></b><span>${esc(COPY.durationLabel)}</span></span>
  </div>
  <div class="rgd-phs">${COPY.phases.map(phase).join('')}</div>
  <div class="rgd-act">
    <button type="button" class="btn primary big" data-rgd="start">${esc(COPY.start)}</button>
    <button type="button" class="btn big" data-rgd="demo">${esc(COPY.demo)}</button>
    <button type="button" class="btn ghost big" data-rgd="skip">${esc(COPY.skip)}</button>
    <span class="rgd-grow"></span>
    ${o.auto ? `<label class="rgd-mute"><input type="checkbox" data-rgd="mute"${o.muted ? ' checked' : ''}><span>${esc(COPY.mute)}</span></label>` : ''}
  </div>
  ${o.auto ? `<p class="rgd-where">${ico('list', 16)}<span>${COPY.where}</span></p>` : ''}
</div>`;
  }
  /* handlers: { start(), demo(), skip(), mute(checked) } */
  function bindWelcome(root, h) {
    h = h || {};
    root.addEventListener('click', e => {
      const b = e.target.closest('button[data-rgd]'); if (!b) return;
      const f = h[b.dataset.rgd]; if (f) f();
    });
    const m = root.querySelector('input[data-rgd="mute"]');
    if (m) m.addEventListener('change', () => h.mute && h.mute(m.checked));
    const first = root.querySelector('[data-rgd="start"]'); if (first) first.focus({ preventScroll: true });
  }

  /* ---------- fine guida ---------- */
  function endHTML() {
    return `<div class="rgd-scrim rgd-scrim--solid"></div><div class="rgd-end" role="dialog" aria-modal="true" aria-labelledby="rgd-end-t">
  <span class="rgd-end-i">${ico('check', 34, 2.6)}</span><h2 id="rgd-end-t">${esc(COPY.endTitle)}</h2><p>${COPY.endText}</p>
  <div><button type="button" class="btn" data-rgd="again">${esc(COPY.endAgain)}</button><button type="button" class="btn primary" data-rgd="go">${esc(COPY.endGo)}</button></div></div>`;
  }
  function bindEnd(root, h) {
    root.addEventListener('click', e => { const b = e.target.closest('button[data-rgd]'); if (b && h[b.dataset.rgd]) h[b.dataset.rgd](); });
    const go = root.querySelector('[data-rgd="go"]'); if (go) go.focus({ preventScroll: true });
  }

  /* ---------- giro guidato ---------- */
  let T = null; // stato del giro in corso

  /* opts: {
       steps: STEPS (default),
       startAt: 0,
       root: document.body,
       prepare(step, index) → Promise|void   mostra la schermata step.screen (gara di esempio, modalità guida)
       find(step) → Element|null              default: document.querySelector('[data-guida="'+step.target+'"]')
       onExit(reason, index)                  reason: 'done' | 'exit'
     } */
  function start(opts) {
    stop();
    const o = Object.assign({ steps: STEPS, startAt: 0, root: document.body }, opts || {});
    o.find = o.find || (s => document.querySelector(`[data-guida="${s.target}"]`));
    const layer = document.createElement('div');
    layer.className = 'rgd-layer';
    layer.innerHTML = '<div class="rgd-block"></div><div class="rgd-spot" hidden></div><div class="rgd-card" role="dialog" aria-modal="true" tabindex="-1"></div><div class="rgd-live" aria-live="polite"></div>';
    o.root.appendChild(layer);
    T = { o, layer, i: -1, el: null, ro: null, prevFocus: document.activeElement };
    const re = () => T && place();
    T.onResize = re; T.onKey = onKey;
    window.addEventListener('resize', re); window.addEventListener('scroll', re, true); document.addEventListener('keydown', onKey, true);
    layer.addEventListener('click', e => {
      const b = e.target.closest('button[data-rgd]'); if (!b) return;
      ({ next, back, exit: () => end('exit'), done: () => end('done') })[b.dataset.rgd]();
    });
    go(o.startAt);
  }
  function stop() {
    if (!T) return;
    window.removeEventListener('resize', T.onResize); window.removeEventListener('scroll', T.onResize, true); document.removeEventListener('keydown', T.onKey, true);
    if (T.ro) T.ro.disconnect();
    T.layer.remove();
    const pf = T.prevFocus; T = null;
    if (pf && pf.focus) try { pf.focus({ preventScroll: true }); } catch (e) { /* elemento sparito */ }
  }
  function end(reason) { const o = T.o, i = T.i; stop(); if (o.onExit) o.onExit(reason, i); }
  function next() { if (T.i < T.o.steps.length - 1) go(T.i + 1); else end('done'); }
  function back() { if (T.i > 0) go(T.i - 1); }
  function onKey(e) {
    if (!T) return;
    if (e.key === 'Escape') { e.preventDefault(); end('exit'); }
    else if (e.key === 'ArrowRight' && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); back(); }
    else if (e.key === 'Tab') trap(e);
  }
  function trap(e) {
    const f = [...T.layer.querySelectorAll('.rgd-card button')]; if (!f.length) return;
    const a = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(a + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }

  async function go(i) {
    const s = T.o.steps[i]; const tot = T.o.steps.length; const my = T;
    T.i = i;
    T.layer.classList.add('is-busy');
    if (T.o.prepare) await T.o.prepare(s, i);
    if (T !== my) return; // giro chiuso nel frattempo
    await frame(); await frame();
    T.el = T.o.find(s);
    if (T.el && T.el.scrollIntoView) T.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const last = i === tot - 1;
    const card = T.layer.querySelector('.rgd-card');
    card.setAttribute('aria-label', `Guida, passo ${i + 1} di ${tot}`);
    card.innerHTML = `<span class="rgd-arrow" aria-hidden="true"></span>
  <header><span class="rgd-step">Guida · ${i + 1} di ${tot}</span><button type="button" class="rgd-exit" data-rgd="exit">Esci</button></header>
  <div class="rgd-body">${s.icon ? `<span class="rgd-ic">${ico(s.icon, 20)}</span>` : ''}<div><h2>${esc(s.title)}</h2><p>${s.text}</p></div></div>
  <footer><span class="rgd-dots" aria-hidden="true">${T.o.steps.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('')}</span>
    <span class="rgd-btns">${i ? '<button type="button" class="btn" data-rgd="back">Indietro</button>' : ''}${last ? '<button type="button" class="btn go" data-rgd="done">Fine</button>' : `<button type="button" class="btn primary" data-rgd="next">Avanti ${ico('right', 16, 2.4)}</button>`}</span></footer>`;
    if (T.ro) T.ro.disconnect();
    if (T.el && window.ResizeObserver) { T.ro = new ResizeObserver(() => T && place()); T.ro.observe(T.el); }
    place();
    T.layer.classList.remove('is-busy');
    T.layer.querySelector('.rgd-live').textContent = `Passo ${i + 1} di ${tot}: ${s.title}`;
    const f = card.querySelector(last ? '[data-rgd="done"]' : '[data-rgd="next"]'); if (f) f.focus({ preventScroll: true });
  }
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));

  /* posizione del faretto e del fumetto */
  const PAD = 8, GAP = 16, M = 16;
  function place() {
    const spot = T.layer.querySelector('.rgd-spot'), card = T.layer.querySelector('.rgd-card'), arrow = card.querySelector('.rgd-arrow');
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = T.o.steps[T.i];
    card.style.width = Math.min(s.width || (s.text.length > 150 ? 420 : 380), vw - 2 * M) + 'px';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    const r0 = T.el && T.el.getBoundingClientRect();
    if (!r0 || (!r0.width && !r0.height)) { // elemento non trovato: fumetto al centro, senza faretto
      spot.hidden = true; T.layer.classList.add('is-free');
      Object.assign(card.style, { left: (vw - cw) / 2 + 'px', top: (vh - ch) / 2 + 'px' }); arrow.hidden = true; return;
    }
    T.layer.classList.remove('is-free');
    const r = { l: Math.max(r0.left - PAD, 4), t: Math.max(r0.top - PAD, 4), r: Math.min(r0.right + PAD, vw - 4), b: Math.min(r0.bottom + PAD, vh - 4) };
    const rad = parseFloat(getComputedStyle(T.el).borderTopLeftRadius) || 12;
    spot.hidden = false;
    Object.assign(spot.style, { left: r.l + 'px', top: r.t + 'px', width: r.r - r.l + 'px', height: r.b - r.t + 'px', borderRadius: Math.min(rad + PAD, 28) + 'px' });
    const cx = (r.l + r.r) / 2, cy = (r.t + r.b) / 2;
    const clampX = x => Math.max(M, Math.min(x, vw - cw - M)), clampY = y => Math.max(M, Math.min(y, vh - ch - M));
    const opts = {
      bottom: () => r.b + GAP + ch <= vh - M && { x: clampX(cx - cw / 2), y: r.b + GAP },
      top: () => r.t - GAP - ch >= M && { x: clampX(cx - cw / 2), y: r.t - GAP - ch },
      right: () => r.r + GAP + cw <= vw - M && { x: r.r + GAP, y: clampY(cy - ch / 2) },
      left: () => r.l - GAP - cw >= M && { x: r.l - GAP - cw, y: clampY(cy - ch / 2) }
    };
    const order = [s.place || 'bottom', 'bottom', 'top', 'right', 'left'];
    let side = null, pos = null;
    for (const k of order) { const p = opts[k](); if (p) { side = k; pos = p; break; } }
    if (!pos) { // nessun lato libero (elemento molto grande): fumetto sul lato con più spazio, appoggiato al bordo dello schermo
      const room = { bottom: vh - r.b, top: r.t, right: vw - r.r, left: r.l };
      const best = Object.keys(room).sort((a, b) => room[b] - room[a])[0];
      side = null;
      pos = best === 'top' ? { x: clampX(cx - cw / 2), y: M } : best === 'bottom' ? { x: clampX(cx - cw / 2), y: vh - ch - M }
        : best === 'left' ? { x: M, y: clampY(cy - ch / 2) } : { x: vw - cw - M, y: clampY(cy - ch / 2) };
    }
    Object.assign(card.style, { left: pos.x + 'px', top: pos.y + 'px' });
    arrow.hidden = !side;
    if (side) {
      const ax = Math.max(20, Math.min(cx - pos.x, cw - 20)), ay = Math.max(20, Math.min(cy - pos.y, ch - 20));
      arrow.dataset.side = side;
      arrow.style.left = side === 'top' || side === 'bottom' ? ax - 8 + 'px' : '';
      arrow.style.top = side === 'left' || side === 'right' ? ay - 8 + 'px' : '';
    }
  }

  /* ---------- voto sul referto (dopo la consegna) ---------- */
  const STARS = ['Male', 'Così così', 'Discreto', 'Bene', 'Benissimo'];
  const TAGS = ['Veloce in gara', 'Firme semplici', 'Lista R chiara', 'Difficile correggere', 'Lento a caricare', 'Altro'];
  function voteHTML(o) {
    o = o || {};
    const st = o.stars || 0, tags = o.tags || [];
    return `<section class="rgd-vote card" aria-labelledby="rgd-vote-t" data-guida="voto">
  <h2 id="rgd-vote-t">Com’è andata con il referto?</h2><p class="rgd-vote-sub">Il tuo voto ci aiuta a migliorarlo. Bastano due tocchi.</p>
  <div class="rgd-stars" role="radiogroup" aria-label="Voto da 1 a 5">${STARS.map((l, k) => `<button type="button" role="radio" aria-checked="${k + 1 === st}" aria-label="${k + 1} su 5 · ${l}" data-star="${k + 1}"${k < st ? ' class="on"' : ''}>${ico('star', 46, 1.6)}</button>`).join('')}<b class="rgd-star-l">${st ? STARS[st - 1] : ''}</b></div>
  <fieldset class="rgd-tags"><legend>Cosa ti è piaciuto o cosa possiamo migliorare?</legend>${TAGS.map(t => `<button type="button" aria-pressed="${tags.includes(t)}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</fieldset>
  <textarea class="rgd-note" rows="3" maxlength="500" placeholder="Vuoi aggiungere qualcosa? (facoltativo)" aria-label="Commento facoltativo">${esc(o.comment || '')}</textarea>
  <div class="rgd-vote-act"><button type="button" class="btn ghost" data-rgd="later">Non ora</button><button type="button" class="btn primary" data-rgd="send"${st ? '' : ' disabled'}>Invia il voto</button></div>
</section>`;
  }
  /* handlers: { send({stars, tags, comment}), later() }; readOnly: true in modalità guida (niente invio) */
  function bindVote(root, h, readOnly) {
    const box = root.matches && root.matches('.rgd-vote') ? root : root.querySelector('.rgd-vote');
    const state = { stars: 0, tags: [] };
    const paint = () => {
      box.querySelectorAll('[data-star]').forEach(b => { const n = +b.dataset.star; b.classList.toggle('on', n <= state.stars); b.setAttribute('aria-checked', String(n === state.stars)); });
      box.querySelector('.rgd-star-l').textContent = state.stars ? STARS[state.stars - 1] : '';
      box.querySelector('[data-rgd="send"]').disabled = !state.stars;
    };
    box.addEventListener('click', e => {
      const s = e.target.closest('[data-star]'), t = e.target.closest('[data-tag]'), b = e.target.closest('button[data-rgd]');
      if (s) { state.stars = +s.dataset.star; paint(); }
      else if (t) { const on = t.getAttribute('aria-pressed') !== 'true'; t.setAttribute('aria-pressed', String(on)); state.tags = on ? state.tags.concat(t.dataset.tag) : state.tags.filter(x => x !== t.dataset.tag); }
      else if (b && !readOnly) {
        if (b.dataset.rgd === 'send' && h.send) h.send({ stars: state.stars, tags: state.tags.slice(), comment: box.querySelector('.rgd-note').value.trim() });
        if (b.dataset.rgd === 'later' && h.later) h.later();
      }
    });
    return state;
  }

  /* dopo l'invio: sostituisce il riquadro del voto */
  function voteDoneHTML() { return `<p class="rgd-vote-done card" role="status">${ico('check', 18, 2.6)}<span>Grazie, voto inviato.</span></p>`; }

  NS.refGuide = { VERSION, COPY, STEPS, STARS, TAGS, prefs, court, welcomeHTML, bindWelcome, endHTML, bindEnd, start, stop, voteHTML, bindVote, voteDoneHTML };
})();
