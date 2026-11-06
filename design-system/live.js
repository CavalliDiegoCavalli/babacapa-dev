/* Babacapa · Live per i tifosi (1.34.0, docs/Live/LIVE.md; mockup approvato da Diego il 2026-11-06, docs/Live/mockup/Main.dc.html).
   Script classico; usa window.SPIN.core e window.SPIN.eventPoster (colori delle squadre). Espone window.SPIN.live:
     mount(el, opts) → controller { load(g), push(g), gate(kind), destroy() }
       opts.teams   {A:{name, full, sig, logo}, B:{…}}   squadre (A in casa, B ospite)
       opts.colors  risultato di SPIN.eventPoster.teamColors
       opts.gate    '' | 'login' | 'web'                 Live bloccato e sfocato (sez. 8)
       opts.links   {login, register, app, store}        indirizzi dei riquadri bloccati
       opts.onExit()                                     "Esci dal live" e "Vai alla scheda della gara"
       opts.onInfo(code)                                 apertura di una spiegazione (i) (metriche)
     g (la gara, dalla fotografia del tablet): {fase:'gioco'|'pausa'|'fine', q, ev:[…], lu:{q:{A:[…],B:[…]}}, gioc:{A:[{n,r}],B:[…]}, nomi:{A:{n:nome},B:{…}}}
       azione: {i, q, t:'A'|'B', y:'score'|'foul'|'cfoul'|'to'|'sub', n, p, k, w, o (esce), e (entra), own, h:'hh:mm', z: secondi dell'azione (regola di recupero)}
       fase 'pausa' con q = quarto appena finito; 'fine' = gara chiusa dal refertista; 'attesa' = referto aperto, formazioni
       di ingresso non ancora confermate (Diego, 2026-11-06: "La gara sta per iniziare. Preparati per lo spettacolo!").
     demo(el, opts) → controller della demo (gara del mockup che si ripete; opts.teams con i colori della gara vera)
   load() mostra lo stato senza animazioni (ingresso nel Live o arrivo a metà gara); push() mette in coda solo quello che è
   cambiato e lo mostra un evento alla volta con le durate della specifica (sez. 4 e 5). L'animazione degli eventi si vede
   solo nella vista Live (sul tablet sempre); le pagine a tutto schermo in ogni vista. Fine quarto e Fine gara restano finché
   non arriva altro. La (i) ferma il Live finché non si torna. Regola di recupero (1.34.0-dev.17): più di 2 eventi insieme o il
   più vecchio di più di 15 s prima → tutto subito, animato solo l'ultimo, pagine a tutto schermo solo se valgono ancora. */
(function () {
  'use strict';
  const core = window.SPIN.core, esc = core.esc;

  const FN = { P: 'Fallo personale', L: 'Difesa illegale', T: 'Fallo tecnico', U: 'Fallo antisportivo', D: 'Espulsione diretta' };
  /* testi di Diego (2026-11-06): non cambiarli senza di lui; niente numero di tiri liberi nella difesa illegale */
  const INFO = {
    L: ['Si chiama difesa illegale ed è segnalata con la lettera L.',
      'Il difensore marca un avversario di ruolo minore (il ruolo è il primo numero della maglia).',
      'Chi l\'ha commessa ha un fallo in più; chi la subisce effettua i tiri liberi e la sua squadra riparte da una rimessa laterale.'],
    T: ['Si chiama fallo tecnico ed è segnalato con la lettera T.',
      'È un fallo senza contatto, dato per un comportamento scorretto come eccessive proteste o azioni strategiche scorrette nei confronti della squadra avversaria.',
      'Per l\'atleta che lo effettua conta come un fallo in più e al secondo tecnico consegue un\'espulsione diretta; la squadra che lo subisce effettua un tiro libero e riparte dalla rimessa laterale con il possesso palla.'],
    U: ['Si chiama fallo antisportivo ed è segnalato con una mano che avvolge il polso dell\'altra.',
      'È un contatto che non ha l\'intento di intervenire sul pallone oppure che è sproporzionato rispetto all\'azione.',
      'Per l\'atleta che lo effettua conta come un fallo in più e al secondo antisportivo consegue un\'espulsione diretta; la squadra che lo subisce effettua 2 tiri liberi e riparte dalla rimessa laterale con il possesso palla.'],
    D: ['Si chiama espulsione diretta ed è segnalata con entrambi i polsi chiusi rivolti verso l\'alto.',
      'È la sanzione per un comportamento gravemente scorretto verso avversari, arbitro o pubblico.',
      'L\'atleta lascia subito la gara e non può più rientrare; la squadra che lo subisce effettua 2 tiri liberi.']
  };
  /* durate (sez. 4 e 5): evento 4 s, formazioni 5 s, time out 10 s; fine quarto 4,2 s solo se dopo c'è altro */
  const DUR = { burst: 4000, lineup: 5000, to: 10000, q: 4200, end: 7000 };
  const OUT = 520, GAP = 380;
  const SV = {
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    dn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
  };
  const T2 = ['A', 'B'], other = t => t === 'A' ? 'B' : 'A', tc = t => t === 'A' ? 'lv-t-a' : 'lv-t-b';
  const qn = q => q <= 4 ? q + '° quarto' : 'Supplementare';
  const ql = q => q <= 4 ? q + 'Q' : 'S' + (q - 4);
  const asc = a => a.slice().sort((x, y) => x - y);
  const sum = a => a.reduce((x, y) => x + y, 0);
  const special = k => !!k && 'LTUD'.indexOf(String(k).charAt(0)) >= 0;
  /* "Mario Rinaldi" → "M. Rinaldi" */
  function shortName(s) { const p = String(s || '').trim().split(/\s+/).filter(Boolean); return p.length < 2 ? (p[0] || '') : p[0].charAt(0) + '. ' + p.slice(1).join(' '); }
  function nameScale(s) { const w = Math.max(1, ...String(s).split(/\s+/).map(x => x.length)); return Math.max(.5, Math.min(1, 8 / w, 14 / Math.max(1, String(s).length))).toFixed(2); }

  /* ---------- stato della gara fino all'azione n, nella fase ph ---------- */
  function snap(g, n, ph) {
    const z = k => Array.from({ length: k }, () => 0), nq = Math.max(4, ph.q || 1);
    const s = { sc: { A: 0, B: 0 }, qp: { A: z(nq), B: z(nq) }, pts: { A: {}, B: {} }, pf: { A: {}, B: {} }, dq: { A: {}, B: {} },
      tf: { A: z(nq), B: z(nq) }, to: { A: 0, B: 0 }, subs: { A: 0, B: 0 }, ft: { A: 0, B: 0 }, bk: { A: 0, B: 0 },
      ill: { A: 0, B: 0 }, tec: { A: 0, B: 0 }, uns: { A: 0, B: 0 }, esp: { A: 0, B: 0 }, rp: { A: z(5), B: z(5) },
      run: { t: null, p: 0 }, best: { A: 0, B: 0 }, court: { A: [], B: [] }, feed: [], h: '', entered: [] };
    const role = (t, x) => { const p = ((g.gioc || {})[t] || []).find(y => String(y.n) === String(x)); const r = p && p.r ? +p.r : Math.floor(+x / 10); return r >= 1 && r <= 5 ? r : 0; };
    const nm = (t, x) => shortName(((g.nomi || {})[t] || {})[x]);
    let cq = 0, ck = 'pausa';
    const push = f => { f.sa = s.sc.A; f.sb = s.sc.B; s.feed.push(f); };
    const start = q => {
      const prev = { A: s.court.A.slice(), B: s.court.B.slice() }, lu = (g.lu || {})[q];
      if (lu) T2.forEach(t => { if (Array.isArray(lu[t]) && lu[t].length) s.court[t] = lu[t].map(Number); });
      const sw = []; T2.forEach(t => s.court[t].forEach(x => { if (prev[t].length && prev[t].indexOf(x) < 0) sw.push({ t, n: x }); }));
      s.entered = sw; cq = q; ck = 'gioco';
      push({ k: 'start', q, sw, tc: 'lv-t-n', tag: 'Formazioni in campo', h: ql(q) });
    };
    const endq = q => { ck = 'pausa'; push({ k: 'endq', q, tc: 'lv-t-n', tag: 'Fine del ' + qn(q).replace('Supplementare', 'supplementare'), full: true, h: ql(q) }); };
    const reach = (k2, q2) => {
      for (let guard = 0; guard < 20 && !(ck === k2 && cq === q2); guard++) {
        if (k2 === 'fine') { if (ck === 'gioco' && cq < q2) { endq(cq); continue; } if (ck === 'pausa' && cq < q2) { start(cq + 1); continue; } break; }
        if (ck === 'gioco') { if (cq < q2 || k2 === 'pausa') { endq(cq); continue; } break; }
        if (ck === 'pausa') { if (cq < q2) { start(cq + 1); continue; } break; }
        break;
      }
    };
    const ev = g.ev || [];
    for (let i = 0; i < n && i < ev.length; i++) {
      const e = ev[i], t = e.t === 'B' ? 'B' : 'A', qi = Math.max(0, (e.q || 1) - 1);
      reach('gioco', e.q || 1);
      const f = { k: e.y, i, t, tc: tc(t), num: e.n != null ? String(e.n) : '', h: ql(e.q || 1) + (e.h ? ' · ' + e.h : '') };
      if (e.h) s.h = e.h;
      if (e.y === 'score') {
        const p = +e.p || 0;
        s.sc[t] += p; s.qp[t][qi] = (s.qp[t][qi] || 0) + p;
        if (!e.own) { s.pts[t][e.n] = (s.pts[t][e.n] || 0) + p; const r = role(t, e.n); if (r) s.rp[t][r - 1] += p; }
        if (p === 1) s.ft[t]++; else s.bk[t]++;
        if (s.run.t === t) s.run.p += p; else s.run = { t, p };
        s.best[t] = Math.max(s.best[t], s.run.p);
        f.tag = (p === 1 ? 'Tiro libero' : 'Canestro') + ' +' + p; f.who = e.own ? 'Autocanestro' : nm(t, e.n); f.p = p; f.own = !!e.own;
        if (e.own) f.num = '';
        f.hiA = t === 'A' ? 'lv-hi' : 'lv-lo'; f.hiB = t === 'B' ? 'lv-hi' : 'lv-lo';
      } else if (e.y === 'foul') {
        const L = String(e.k || 'P').charAt(0);
        s.pf[t][e.n] = (s.pf[t][e.n] || 0) + 1; s.tf[t][qi] = (s.tf[t][qi] || 0) + 1;
        if (L === 'L') s.ill[t]++; if (L === 'T') s.tec[t]++; if (L === 'U') s.uns[t]++;
        if (L === 'D') { s.esp[t]++; s.dq[t][e.n] = true; }
        f.L = L; f.ord = s.pf[t][e.n]; f.foul = true; f.tag = FN[L] || FN.P; f.who = nm(t, e.n); f.whoX = f.ord + '° fallo';
        f.info = special(L) ? L : '';
      } else if (e.y === 'cfoul') {
        f.foul = true; f.num = ''; f.tag = e.w === 'vice' || e.w === 'B' ? 'Fallo al vice allenatore' : 'Fallo all\'allenatore'; f.who = '';
        if (String(e.k || '').charAt(0) === 'D') s.esp[t]++;
      } else if (e.y === 'sub') {
        const c = s.court[t], o = +e.o, nn = +e.e, j = c.indexOf(o);
        if (j >= 0) c[j] = nn; else c.push(nn);
        s.subs[t]++; f.tag = 'Cambio'; f.isSub = true; f.inN = nn; f.inName = nm(t, nn); f.outN = o; f.outName = nm(t, o);
      } else if (e.y === 'to') {
        s.to[t]++; f.tag = 'Time out'; f.num = '';
      } else continue;
      push(f);
    }
    reach(ph.k === 'fine' ? 'fine' : ph.k, ph.q || cq || 1);
    if (ph.k === 'fine') push({ k: 'final', tc: 'lv-t-n', tag: 'Fine gara', h: '' });
    s.cq = ph.q || cq || 1; s.ck = ph.k;
    s.nq = nq; s.role = role; s.nm = nm;
    return s;
  }

  /* ---------- momenti da mostrare passando da (n0, ph0) alla gara g ---------- */
  function moments(n0, ph0, g) {
    const out = [], ev = g.ev || [];
    if (g.fase === 'attesa') return out;   // referto aperto, formazioni non ancora confermate: niente da mostrare
    let k = ph0.k === 'attesa' ? 'pausa' : ph0.k, q = ph0.k === 'attesa' ? 0 : ph0.q;
    const reach = (k2, q2) => {
      for (let guard = 0; guard < 20 && !(k === k2 && q === q2); guard++) {
        if (k2 === 'fine') { if (k === 'gioco' && q < q2) { out.push({ k: 'endq', q }); k = 'pausa'; continue; } if (k === 'pausa' && q < q2) { q++; out.push({ k: 'start', q }); k = 'gioco'; continue; } out.push({ k: 'final', q: q2 }); k = 'fine'; q = q2; break; }
        if (k === 'gioco') { if (q < q2 || k2 === 'pausa') { out.push({ k: 'endq', q }); k = 'pausa'; continue; } break; }
        if (k === 'pausa') { if (q < q2) { q++; out.push({ k: 'start', q }); k = 'gioco'; continue; } break; }
        break;
      }
    };
    for (let i = n0; i < ev.length; i++) { reach('gioco', ev[i].q || 1); out.push({ k: 'ev', i }); }
    if (k !== 'fine') reach(g.fase, g.q);
    return out;
  }

  /* ---------- markup ---------- */
  function crest(team, cls) {
    return `<span class="lv-crest${cls ? ' ' + cls : ''}">${team.logo ? `<img src="${esc(team.logo)}" alt="">` : `<b>${esc(team.sig)}</b>`}</span>`;
  }
  function bugHtml(T, sa, sb, xl, pa, pb, fa, fb) {
    return `<div class="lv-bug${xl ? ' lv-bug-xl' : ''}" role="img" aria-label="${esc(T.A.name)} ${sa}, ${esc(T.B.name)} ${sb}">
<span class="lv-bug-t lv-t-a ${fa || ''}"><b>${esc(T.A.sig)}</b></span><span class="lv-bug-m"><span class="lv-bug-sc"><b class="${pa || ''}" data-lv="sa">${sa}</b><i>–</i><b class="${pb || ''}" data-lv="sb">${sb}</b></span></span><span class="lv-bug-t lv-t-b ${fb || ''}"><b>${esc(T.B.sig)}</b></span></div>`;
  }
  function quartersHtml(s) {
    const live = s.ck === 'gioco';
    if (s.ck === 'attesa') return Array.from({ length: 4 }, (_, j) => `<span class="lv-qb lv-is-next"><span><small>${ql(j + 1)}</small><b>—</b></span></span>`).join('');
    return Array.from({ length: s.nq }, (_, j) => j + 1).map(q => {
      const done = q < s.cq || (q === s.cq && !live), cur = q === s.cq && live;
      return `<span class="lv-qb ${cur ? 'lv-is-cur' : done ? 'lv-is-done' : 'lv-is-next'}"><span><small>${ql(q)}</small><b>${done || cur ? s.qp.A[q - 1] + '–' + s.qp.B[q - 1] : '—'}</b></span></span>`;
    }).join('');
  }
  function statusTxt(s) { return s.ck === 'attesa' ? 'Prima della gara' : s.ck === 'fine' ? 'Fine gara' : s.ck === 'pausa' ? (s.cq === 2 ? 'Intervallo' : 'Fine ' + qn(s.cq)) : qn(s.cq); }
  function bestOf(s, T, t) {
    let bn = null, bp = -1;
    Object.keys(s.pts[t]).forEach(k => { if (s.pts[t][k] > bp) { bp = s.pts[t][k]; bn = k; } });
    if (bn === null) return { num: '—', name: 'Ancora nessun punto', pts: '0', team: T[t].name };
    return { num: bn, name: s.nm(t, bn) || 'N. ' + bn, pts: String(bp), team: T[t].name };
  }
  function bestsHtml(s, T) {
    const b = t => { const x = bestOf(s, T, t); return `<div class="lv-b2 ${tc(t)}${t === 'B' ? ' lv-R' : ''}"><span class="lv-b2-p"><b>${esc(x.pts)}</b><small>punti</small></span><span class="lv-b2-m"><small>${esc(x.team)}</small><span>${esc(x.name)}</span></span><span class="lv-b2-n"><b>${esc(x.num)}</b></span></div>`; };
    return `<div class="lv-bests2">${b('A')}${b('B')}</div>`;
  }
  function statsHtml(s) {
    const R = (lbl, sub, va, vb, fmt, inv) => {
      const mx = Math.max(va, vb, 1), lowA = inv ? va > vb : va < vb, lowB = inv ? vb > va : vb < va, f = fmt || String;
      return `<div class="lv-st-row"><span class="lv-st-v lv-t-a ${lowA ? 'lv-is-low' : ''}"><b>${esc(f(va))}</b></span><span class="lv-st-l"><span><b>${esc(lbl)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><i class="lv-st-ba" style="width:${Math.round(va / mx * 50)}%"></i><i class="lv-st-bb" style="width:${Math.round(vb / mx * 50)}%"></i></span><span class="lv-st-v lv-t-b ${lowB ? 'lv-is-low' : ''}"><b>${esc(f(vb))}</b></span></div>`;
    };
    const qi = s.cq - 1, rp = s.rp;
    return [R('Punti', '', s.sc.A, s.sc.B), R('Canestri', '', s.bk.A, s.bk.B), R('Tiri liberi', 'realizzati', s.ft.A, s.ft.B),
      R('Ruoli 1 e 2', 'punti', rp.A[0] + rp.A[1], rp.B[0] + rp.B[1]), R('Ruolo 3', 'punti', rp.A[2], rp.B[2]), R('Ruolo 4', 'punti', rp.A[3], rp.B[3]), R('Ruolo 5', 'punti', rp.A[4], rp.B[4]),
      R('Miglior parziale', '', s.best.A, s.best.B, v => v + '–0'),
      R('Falli di squadra', 'nel ' + qn(s.cq).toLowerCase(), s.tf.A[qi] || 0, s.tf.B[qi] || 0, null, true), R('Falli', 'in totale', sum(s.tf.A), sum(s.tf.B), null, true),
      R('Difese illegali', '', s.ill.A, s.ill.B, null, true), R('Antisportivi', '', s.uns.A, s.uns.B, null, true), R('Tecnici', '', s.tec.A, s.tec.B, null, true),
      R('Espulsioni', '', s.esp.A, s.esp.B, null, true), R('Time out', '', s.to.A, s.to.B), R('Cambi', '', s.subs.A, s.subs.B)].join('');
  }
  function feedHtml(s, T, newest, tablet) {
    const list = s.feed.slice().reverse().slice(0, tablet ? 40 : 30);
    if (!list.length) return '<li class="lv-empty">La cronaca comincia con la prima azione.</li>';
    return list.map((f, k) => {
      const anim = k === 0 && newest ? (f.t === 'B' ? 'lv-in2' : 'lv-in1') : '';
      const cls = ['lv-ev', f.foul ? 'lv-is-foul' : '', f.full ? 'lv-is-full' : '', anim].filter(Boolean).join(' ');
      const score = `<span class="lv-ev-s"><b class="${f.hiA || ''}">${f.sa}</b><i>–</i><b class="${f.hiB || ''}">${f.sb}</b></span>`;
      const info = f.info ? `<button type="button" class="lv-ibt" data-lv-info="${f.i}" aria-label="Cos'è: ${esc(f.tag)}"><span>i</span></button>` : '';
      let sub;
      if (f.isSub) sub = `<div class="lv-ev-sw"><span class="lv-sw-h lv-sw-in"><b>${f.inN}</b><i class="lv-sw-d">-</i><span>${esc(f.inName)}</span><i class="lv-ar lv-up" role="img" aria-label="entra">${SV.up}</i></span><span class="lv-sw-h lv-sw-out"><i class="lv-ar lv-dn" role="img" aria-label="esce">${SV.dn}</i><span class="lv-sw-on">${esc(f.outName)}</span><i class="lv-sw-d">-</i><b>${f.outN}</b></span></div>`;
      else {
        let who = f.who || '';
        if (f.k === 'foul') who = [f.who, f.L === 'D' ? 'lascia la gara' : f.whoX].filter(Boolean).join(' · ');
        if (f.k === 'endq') who = f === s.feed[s.feed.length - 1] && s.ck === 'pausa' ? 'In attesa delle formazioni' : '';
        if (f.k === 'start') who = qn(f.q) + (f.sw.length ? ' · ' + f.sw.map(w => 'entra ' + w.n + ' (' + T[w.t].sig + ')').join(', ') : '');
        if (f.k === 'to') who = 'Chiesto da ' + T[f.t].name;
        if (f.k === 'final') who = T.A.name + ' ' + f.sa + ' – ' + f.sb + ' ' + T.B.name;
        sub = `<div class="lv-ev-sub">${f.num ? `<b>${esc(f.num)}</b>` : ''}<span>${esc(who)}</span><small class="lv-ev-h">${esc(f.h || '')}</small></div>`;
      }
      return `<li class="${cls}"><div class="lv-ev-top"><span class="lv-ev-tag ${f.tc}"><span>${esc(f.tag)}</span></span>${info}${score}</div>${sub}</li>`;
    }).join('');
  }
  function colsHtml(s, T, g, cur) {
    return T2.map(t => {
      const all = ((g.gioc || {})[t] || []).map(p => +p.n).filter(x => !isNaN(x));
      const court = asc(s.court[t]), bench = asc(all.filter(x => court.indexOf(x) < 0));
      const row = (x, on, first) => {
        const fl = s.pf[t][x] || 0, dq = !!s.dq[t][x], pts = s.pts[t][x] || 0;
        const isNew = on && cur && ((cur.y === 'sub' && cur.t === t && +cur.e === x) || (cur.k === 'start' && s.entered.some(w => w.t === t && w.n === x)));
        const isOut = !on && cur && cur.y === 'sub' && cur.t === t && +cur.o === x;
        return `${first ? '<div class="lv-lc-sep">Panchina</div>' : ''}<div class="lv-lr ${on ? 'lv-on' : 'lv-off'} ${isNew ? 'lv-is-new' : isOut ? 'lv-is-out' : ''}"><span class="lv-lr-n"><b>${x}</b></span><span class="lv-lr-nm"><b>${esc(s.nm(t, x) || 'N. ' + x)}</b><small class="${dq ? 'lv-is-red' : ''}">${dq ? 'Espulso' : 'Ruolo ' + (s.role(t, x) || '—')}</small></span><span class="lv-lr-v" aria-label="${pts} punti">${pts}</span><span class="lv-lr-v ${dq ? 'lv-is-red' : ''}" aria-label="${fl} falli${dq ? ', espulso' : ''}">${fl}</span></div>`;
      };
      return `<div class="lv-lc ${tc(t)} ${t === 'A' ? 'lv-L' : 'lv-R'}"><div class="lv-lc-h">${crest(T[t], 'lv-crest-s')}<b class="lv-tm-n">${esc(T[t].name)}</b><span class="lv-lc-k">Punti</span><span class="lv-lc-k">Falli</span></div>
${court.map(x => row(x, true, false)).join('')}${bench.map((x, k) => row(x, false, k === 0)).join('')}</div>`;
    }).join('');
  }
  /* animazione dell'evento: canestro, tiro libero, fallo, cambio (sez. 4) */
  function burstHtml(e, s, T, f) {
    const t = e.t === 'B' ? 'B' : 'A', three = e.y === 'score' && +e.p === 3, foul = e.y === 'foul' || e.y === 'cfoul';
    let inner;
    if (e.y === 'sub') {
      const nmx = x => s.nm(t, x) || 'N. ' + x;
      inner = `<b class="lv-b-swt">Cambio</b><div class="lv-b-swr"><span class="lv-b-sw lv-in"><b class="lv-b-swn">${+e.e}</b><span class="lv-b-swm"><small>Entra</small><span>${esc(nmx(+e.e))}</span></span><i class="lv-ar lv-up lv-big" aria-hidden="true">${SV.up}</i></span><span class="lv-b-sw lv-out"><i class="lv-ar lv-dn lv-big" aria-hidden="true">${SV.dn}</i><span class="lv-b-swm"><small>Esce</small><span>${esc(nmx(+e.o))}</span></span><b class="lv-b-swn">${+e.o}</b></span></div>`;
    } else {
      let big, title, who;
      if (e.y === 'score') { big = '+' + e.p; title = +e.p === 1 ? 'Tiro libero' : 'Canestro'; who = e.own ? 'Autocanestro' : [e.n, s.nm(t, e.n)].filter(Boolean).join(' '); }
      else if (e.y === 'foul') { const L = String(e.k || 'P').charAt(0), o = s.pf[t][e.n] || 1; big = L === 'D' ? 'ESP' : o + '°'; title = FN[L] || FN.P; who = [e.n, s.nm(t, e.n)].filter(Boolean).join(' ') + (L === 'D' ? ' · lascia la gara' : ' · ' + o + '° fallo'); }
      else { big = '!'; title = f.tag; who = T[t].name; }
      inner = `${e.y !== 'cfoul' && e.n != null && !e.own ? `<span class="lv-b-ghost" aria-hidden="true">${esc(String(e.n))}</span>` : ''}<div class="lv-b-txt"><span class="lv-b-big">${esc(big)}</span><span class="lv-b-col"><span class="lv-b-title">${esc(title)}</span><span class="lv-b-who">${esc(who)}</span></span></div>`;
      if (e.y === 'foul' && special(e.k)) inner += `<button type="button" class="lv-b-info" data-lv-info="${f.i}" aria-label="Cos'è: ${esc(title)}"><span>i</span></button>`;
    }
    const cf = three ? `<div class="lv-b-three"><div class="lv-b-flash lv-b-flash2"></div><div class="lv-b-ring lv-b-ring2"></div><div class="lv-b-ring lv-b-ring3"></div><div class="lv-b-cf">${'<i></i>'.repeat(18)}</div></div>` : '';
    return `<div class="lv-burst-w ${tc(t)} ${foul ? 'lv-is-foul' : three ? 'lv-is-three' : ''}" role="status">${cf}<div class="lv-b-dim"></div><div class="lv-b-flash"></div><div class="lv-b-ring"></div>
<div class="lv-burst"><div class="lv-b-band"></div>${three ? '<div class="lv-b-rays" aria-hidden="true"></div>' : ''}<i class="lv-b-ln lv-l1"></i><i class="lv-b-ln lv-l2"></i><i class="lv-b-ln lv-l3x"></i><span class="lv-b-team"><span>${esc(T[t].name)}</span></span>${inner}</div></div>`;
  }
  function tkHtml(kind, m, s, T, g) {
    const bug = d => `<div class="lv-up" style="animation-delay:${d}s">${bugHtml(T, s.sc.A, s.sc.B, true)}</div>`;
    if (kind === 'lineup') {
      const col = t => asc(s.court[t]).map((x, k) => { const nw = s.entered.some(w => w.t === t && w.n === x);
        return `<div class="lv-lu-r" style="animation-delay:${(0.5 + k * 0.09).toFixed(2)}s"><span class="lv-lu-n"><b>${x}</b></span><span class="lv-lu-nm"><b>${esc(s.nm(t, x) || 'N. ' + x)}</b><small class="${nw ? 'lv-is-new' : ''}">${nw ? 'Entra · ruolo ' : 'Ruolo '}${s.role(t, x) || '—'}</small></span></div>`; }).join('');
      return `<div class="lv-tk lv-tk-thin" role="status"><div class="lv-tk-sa"></div><div class="lv-tk-sb"></div><div class="lv-tk-in">
<div class="lv-up" style="animation-delay:.15s"><span class="lv-tk-kick lv-t-live"><span>Si gioca · ${esc(qn(s.cq))}</span></span></div><h2 class="lv-tk-title">Formazioni in campo</h2>
<div class="lv-lu">${T2.map(t => `<div class="lv-lu-col ${tc(t)}"><div class="lv-lu-h">${crest(T[t], 'lv-crest-s')}<b class="lv-tm-n">${esc(T[t].name)}</b></div>${col(t)}</div>`).join('')}</div></div></div>`;
    }
    if (kind === 'to') {
      const t = (g.ev[m.i] || {}).t === 'B' ? 'B' : 'A';
      return `<div class="lv-tk lv-tk-to ${tc(t)}" role="status"><div class="lv-tk-tex"></div><div class="lv-tk-in">
<div class="lv-up lv-to-team" style="animation-delay:.15s">${crest(T[t], 'lv-crest-l')}<b class="lv-fg-n">${esc(T[t].name)}</b></div><h2 class="lv-tk-title">Time out</h2>${bug(.55)}</div></div>`;
    }
    if (kind === 'wait') {
      return `<div class="lv-tk lv-tk-thin lv-tk-wait" role="status"><div class="lv-tk-tex"></div><div class="lv-tk-sa"></div><div class="lv-tk-sb"></div><div class="lv-tk-in">
<div class="lv-up lv-wait-teams" style="animation-delay:.15s"><span class="lv-t-a">${crest(T.A, 'lv-crest-l')}</span><b class="lv-wait-vs">vs</b><span class="lv-t-b">${crest(T.B, 'lv-crest-l')}</span></div>
<h2 class="lv-tk-title">La gara sta per iniziare</h2><p class="lv-wait-p lv-up" style="animation-delay:.55s">Preparati per lo spettacolo!</p></div></div>`;
    }
    if (kind === 'q') {
      return `<div class="lv-tk" role="status"><div class="lv-tk-sa"></div><div class="lv-tk-sb"></div><div class="lv-tk-in">
<div class="lv-up" style="animation-delay:.15s"><span class="lv-tk-kick lv-t-n"><span>${s.cq === 2 ? 'Intervallo' : 'Pausa'}</span></span></div><h2 class="lv-tk-title">Fine ${esc(qn(s.cq))}</h2>${bug(.55)}
<div class="lv-qs lv-up" style="animation-delay:.8s">${quartersHtml(s)}</div></div></div>`;
    }
    return `<div class="lv-tk lv-tk-thin" role="status"><div class="lv-tk-sa"></div><div class="lv-tk-sb"></div><div class="lv-tk-in">
<div class="lv-up" style="animation-delay:.15s"><span class="lv-tk-kick lv-t-n"><span>Fine gara</span></span></div>
<div class="lv-fg lv-up" style="animation-delay:.35s"><div class="lv-fg-t lv-t-a">${crest(T.A, 'lv-crest-l')}<b class="lv-fg-n">${esc(T.A.full || T.A.name)}</b></div><div class="lv-fg-s"><span><b>${s.sc.A}</b><i> – </i><b>${s.sc.B}</b></span></div><div class="lv-fg-t lv-t-b">${crest(T.B, 'lv-crest-l')}<b class="lv-fg-n">${esc(T.B.full || T.B.name)}</b></div></div>
<div class="lv-qs lv-up" style="animation-delay:.6s">${quartersHtml(s)}</div>
<div class="lv-up" style="animation-delay:.85s;width:100%;display:flex;justify-content:center">${bestsHtml(s, T)}</div>
<p class="lv-tk-foot lv-up" style="animation-delay:1.1s">Il racconto della gara arriva quando l'organizzatore lo pubblica.</p>
<div class="lv-up" style="animation-delay:1.3s"><button type="button" class="lv-btn-st" data-lv-exit><span>Vai alla scheda della gara</span></button></div></div></div>`;
  }
  function gateHtml(kind, L) {
    if (kind === 'web') return `<div class="lv-gate" role="dialog" aria-label="La diretta è nell'app"><div class="lv-gate-band"></div><span class="lv-tk-kick lv-t-live"><span>In diretta</span></span>
<h2>La diretta è nell'app</h2><p>Punteggio, formazioni e cronaca in tempo reale si seguono dall'app Babacapa per iPhone, iPad e Android.</p>
<a class="lv-cta" href="${esc(L.app || '#')}"><span>Apri nell'app</span></a><a class="lv-lnk" href="${esc(L.store || '#')}">Non ce l'hai? Scaricala</a></div>`;
    return `<div class="lv-gate" role="dialog" aria-label="Accedi per seguire la diretta"><div class="lv-gate-band"></div><span class="lv-tk-kick lv-t-live"><span>In diretta</span></span>
<h2>Segui la gara mentre si gioca</h2><p>Accedi per vedere punteggio, formazioni, falli e cronaca azione per azione.</p>
<a class="lv-cta" href="${esc(L.login || '#/accedi')}"><span>Accedi</span></a><a class="lv-lnk" href="${esc(L.register || L.login || '#/accedi')}">Non hai un account? Registrati</a></div>`;
  }

  /* ---------- controller ---------- */
  function mount(el, opts) {
    const T = opts.teams, C = opts.colors || window.SPIN.eventPoster.teamColors({ color: T.A.color, altColor: T.A.altColor }, { color: T.B.color, altColor: T.B.altColor });
    const L = opts.links || {};
    const mq = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
    let G = { fase: 'gioco', q: 1, ev: [], lu: {}, gioc: { A: [], B: [] }, nomi: {} };
    let disp = { n: 0, ph: { k: 'pausa', q: 0 } }, queue = [], playing = null, timer = 0, paused = false, tab = 'live', gate = opts.gate || '', infoI = null;
    let lastSc = { A: null, B: null }, popN = { A: 0, B: 0 }, feedLen = 0, dead = false;
    const tablet = () => !!(mq && mq.matches);
    el.innerHTML = `<div class="lv" style="--lv-a:${C.a};--lv-a-on:${C.aOn};--lv-b:${C.b};--lv-b-on:${C.bOn}">
<section class="lv-hero" aria-label="Tabellone"><div class="lv-slab lv-slab-a"></div><div class="lv-slab lv-slab-b"></div><div class="lv-tex-w"><div class="lv-tex"></div></div><div class="lv-glint"></div>
<div class="lv-top"><button class="lv-xbtn" type="button" data-lv-exit><span>${SV.back}${opts.demo ? 'Esci dalla demo' : 'Esci dal live'}</span></button><span class="lv-live" data-lv="pill"><span><i class="lv-dot"></i><span data-lv="pillt">In diretta</span></span></span></div>
${T2.map(t => `<div class="lv-side lv-side-${t === 'A' ? 'a' : 'b'} ${tc(t)}" style="--lv-ring:${t === 'A' ? C.aRing : C.bRing}">${crest(T[t])}<span class="lv-tteam"><span class="lv-kk">${t === 'A' ? 'In casa' : 'Ospiti'}</span><b class="lv-tname" style="--k:${nameScale(T[t].name)}">${esc(T[t].name)}</b></span></div>`).join('')}
<div data-lv="bug"></div></section>
<div class="lv-strip"><div class="lv-info" data-lv="info"></div><div class="lv-qs" data-lv="qs"></div></div>
<nav class="lv-tabs" aria-label="Viste della diretta">${[['cronaca', 'Cronaca'], ['live', 'Live'], ['stats', 'Statistiche']].map(x => `<button type="button" class="lv-tab" data-lv-tab="${x[0]}" aria-pressed="false"><span>${x[1]}</span></button>`).join('')}</nav>
<div class="lv-panes"><section class="lv-pane lv-pane-feed" aria-label="Cronaca"><h3 class="lv-ptag"><span>Cronaca</span></h3><ol class="lv-feed" data-lv="feed"></ol></section>
<section class="lv-pane lv-pane-live" aria-label="Live"><h3 class="lv-ptag"><span>Live</span></h3><div class="lv-lcols" data-lv="cols"></div></section>
<section class="lv-pane lv-pane-stats" aria-label="Statistiche"><h3 class="lv-ptag"><span>Statistiche</span></h3><div class="lv-st-head">${crest(T.A, 'lv-crest-s lv-t-a')}<small>dal referto, azione per azione</small>${crest(T.B, 'lv-crest-s lv-t-b')}</div><div class="lv-st-rows" data-lv="stats"></div><h4 class="lv-sub-h">Migliori realizzatori</h4><div data-lv="best"></div></section></div>
<div data-lv="ov"></div><div data-lv="dlg"></div><div data-lv="gate"></div></div>`;
    const root = el.firstElementChild, $ = k => root.querySelector('[data-lv="' + k + '"]');
    const ovEl = $('ov');

    function layout() {
      root.classList.toggle('lv-tablet', tablet()); root.classList.toggle('lv-phone', !tablet());
      root.classList.toggle('lv-locked', !!gate);
      root.querySelectorAll('[data-lv-tab]').forEach(b => { const on = b.dataset.lvTab === tab; b.classList.toggle('lv-is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      root.querySelector('.lv-pane-feed').hidden = !tablet() && tab !== 'cronaca';
      root.querySelector('.lv-pane-live').hidden = !tablet() && tab !== 'live';
      root.querySelector('.lv-pane-stats').hidden = !tablet() && tab !== 'stats';
      $('gate').innerHTML = gate ? gateHtml(gate, L) : '';
    }
    function cur() { return playing && playing.k === 'ev' ? G.ev[playing.i] : playing; }
    function paint() {
      if (dead) return;
      const s = snap(G, disp.n, disp.ph);
      const ended = s.ck === 'fine';
      $('pill').className = 'lv-live' + (ended ? ' lv-is-end' : ''); $('pillt').textContent = opts.demo ? 'Demo' : ended ? 'Conclusa' : 'In diretta';
      /* tabellone: le cifre entrano dal basso quando cambiano, la sigla di chi ha segnato lampeggia */
      const pop = {}, fl = {};
      T2.forEach(t => { if (lastSc[t] !== null && s.sc[t] !== lastSc[t]) { popN[t]++; pop[t] = popN[t] % 2 ? 'lv-pop1' : 'lv-pop2'; fl[t] = popN[t] % 2 ? 'lv-fl1' : 'lv-fl2'; } lastSc[t] = s.sc[t]; });
      if (pop.A || pop.B || !$('bug').firstElementChild) $('bug').innerHTML = bugHtml(T, s.sc.A, s.sc.B, false, pop.A, pop.B, fl.A, fl.B);
      else T2.forEach(t => { const b = $('bug').querySelector('[data-lv="s' + t.toLowerCase() + '"]'); if (b && b.textContent !== String(s.sc[t])) b.textContent = s.sc[t]; });
      const run = s.ck === 'gioco' && s.run.p >= 5;
      $('info').innerHTML = `<b class="lv-status">${esc(statusTxt(s))}</b>${s.h ? `<span class="lv-upd">Agg. ${esc(s.h)}</span>` : ''}${run ? `<span class="lv-run ${tc(s.run.t)}"><span>Parziale ${s.run.p}–0 ${esc(T[s.run.t].sig)}</span></span>` : ''}`;
      $('qs').innerHTML = quartersHtml(s);
      const newest = s.feed.length > feedLen && feedLen > 0; feedLen = s.feed.length;
      $('feed').innerHTML = feedHtml(s, T, newest, tablet());
      $('cols').innerHTML = colsHtml(s, T, G, cur());
      $('stats').innerHTML = statsHtml(s);
      $('best').innerHTML = bestsHtml(s, T);
      return s;
    }
    function ovType(m) {
      if (gate) return '';
      if (m.k === 'start') return 'lineup';
      if (m.k === 'endq') return 'q';
      if (m.k === 'final') return 'end';
      const e = G.ev[m.i]; if (!e) return '';
      if (e.y === 'to') return 'to';
      return tablet() || tab === 'live' ? 'burst' : '';
    }
    function apply(m) {
      if (m.k === 'ev') { disp.n = m.i + 1; const e = G.ev[m.i]; if (e && disp.ph.k !== 'gioco') disp.ph = { k: 'gioco', q: e.q || 1 }; }
      else if (m.k === 'start') disp.ph = { k: 'gioco', q: m.q };
      else if (m.k === 'endq') disp.ph = { k: 'pausa', q: m.q };
      else if (m.k === 'final') disp.ph = { k: 'fine', q: m.q || disp.ph.q };
    }
    function show(m, typ, s) {
      const e = m.k === 'ev' ? G.ev[m.i] : null;
      const f = e ? s.feed.find(x => x.i === m.i) || {} : {};
      ovEl.innerHTML = typ === 'burst' ? burstHtml(e, s, T, f) : tkHtml(typ, m, s, T, G);
    }
    function pump() {
      if (dead || playing || paused || !queue.length) return;
      const m = queue.shift(); apply(m); playing = m;
      const s = paint(), typ = ovType(m);
      if (!typ) { playing = null; ovEl.innerHTML = ''; pump(); return; }
      show(m, typ, s); m.typ = typ;
      if ((typ === 'q' || typ === 'end') && !queue.length) { m.persist = true; return; }
      timer = setTimeout(leave, DUR[typ]);
    }
    function leave() {
      clearTimeout(timer);
      const o = ovEl.firstElementChild; if (o) o.classList.add('lv-out');
      timer = setTimeout(() => { ovEl.innerHTML = ''; playing = null; paint(); timer = setTimeout(pump, GAP); }, OUT);
    }
    /* stato senza animazioni: ingresso nel Live, arrivo a metà gara, correzioni del refertista */
    function load(g) {
      clearTimeout(timer); queue = []; playing = null; G = g; ovEl.innerHTML = '';
      disp = { n: (g.ev || []).length, ph: g.fase === 'attesa' ? { k: 'attesa', q: 0 } : { k: g.fase, q: g.q } }; feedLen = 0; lastSc = { A: null, B: null };
      layout(); const s = paint();
      if (!gate && g.fase === 'attesa') { const m = { k: 'wait', persist: true, typ: 'wait' }; playing = m; show(m, 'wait', s); return; }
      if (!gate && (g.fase === 'pausa' || g.fase === 'fine')) { const m = { k: g.fase === 'fine' ? 'final' : 'endq', q: g.q, persist: true }; m.typ = g.fase === 'fine' ? 'end' : 'q'; playing = m; show(m, m.typ, s); }
    }
    function push(g, o) {
      const back = !!(o && o.rientro);
      const old = G.ev || [], nev = g.ev || [];
      for (let i = 0; i < disp.n; i++) if (!nev[i] || nev[i].i !== old[i].i || JSON.stringify(nev[i]) !== JSON.stringify(old[i])) { load(g); return; }
      G = g; queue = moments(disp.n, disp.ph, g);
      /* regola di recupero (Diego, 2026-11-06, LIVE.md sez. 13): più di 2 eventi insieme o il più vecchio di più di 15 s
         prima → tutto aggiornato subito, animato solo l'ultimo evento; delle pagine a tutto schermo solo quella che vale
         ancora (l'ultima, dopo l'ultimo evento) */
      const fresh = nev.slice(old.length), z = fresh.reduce((a, e) => e.z ? Math.min(a, e.z) : a, Infinity);
      const pages = queue.filter(m => m.k !== 'ev').length;
      /* rientro nell'app (Diego, 2026-11-06): stessa regola, e l'ultimo evento si anima solo se è degli ultimi 5 s;
         l'animazione rimasta a metà si chiude */
      if (back || fresh.length > 2 || Date.now() / 1000 - z > 15 || pages > 1) {
        const li = queue.map(m => m.k).lastIndexOf('ev'), tail = queue.slice(li + 1);
        const le = li >= 0 ? (g.ev || [])[queue[li].i] : null, keep = li >= 0 && (!back || (le && le.z && Date.now() / 1000 - le.z <= 5));
        queue.slice(0, keep ? li : li + 1).forEach(apply);
        queue = (keep ? [queue[li]] : []).concat(tail.length ? [tail[tail.length - 1]] : []);
        const pe = playing && playing.k === 'ev' ? G.ev[playing.i] : null, recent = !!(pe && pe.z && Date.now() / 1000 - pe.z <= 5);
        if (back && playing && !playing.persist && (keep || !recent)) { clearTimeout(timer); ovEl.innerHTML = ''; playing = null; }
      }
      if (playing && playing.persist && queue.length) leave();
      else if (!playing) pump();
      if (!queue.length && !playing) paint();
    }
    function openInfo(i) {
      const e = G.ev[i]; if (!e || !special(e.k)) return;
      const L0 = String(e.k).charAt(0), t = e.t === 'B' ? 'B' : 'A', s = snap(G, disp.n, disp.ph), tx = INFO[L0];
      paused = true; clearTimeout(timer); infoI = i;
      $('dlg').innerHTML = `<div class="lv-dlg-w"><div class="lv-dlg ${tc(t)}" role="dialog" aria-modal="true" aria-label="${esc(FN[L0])}"><span class="lv-tk-kick"><span>${esc([e.n, s.nm(t, e.n)].filter(Boolean).join(' '))} · ${esc(T[t].name)}</span></span>
<h2 class="lv-dlg-t">${esc(FN[L0])}</h2>${tx.map(p => `<p class="lv-dlg-p">${esc(p)}</p>`).join('')}<button type="button" class="lv-dlg-b" data-lv-close><span>Torna al live</span></button></div></div>`;
      const b = root.querySelector('[data-lv-close]'); if (b) b.focus();
      if (opts.onInfo) try { opts.onInfo(L0); } catch (_) {}
    }
    function closeInfo() {
      $('dlg').innerHTML = ''; paused = false; infoI = null;
      if (playing && !playing.persist) timer = setTimeout(leave, 500); else if (!playing) timer = setTimeout(pump, 500); else if (queue.length) leave();
    }
    function onClick(ev) {
      const x = ev.target.closest('[data-lv-exit],[data-lv-tab],[data-lv-info],[data-lv-close]'); if (!x) return;
      if (x.hasAttribute('data-lv-exit')) { if (opts.onExit) opts.onExit(); return; }
      if (x.hasAttribute('data-lv-close')) { closeInfo(); return; }
      if (x.dataset.lvInfo != null) { openInfo(+x.dataset.lvInfo); return; }
      if (x.dataset.lvTab) {
        tab = x.dataset.lvTab; layout();
        /* l'animazione dell'evento si vede solo nella vista Live: cambiando vista si chiude */
        if (playing && playing.typ === 'burst' && tab !== 'live' && !tablet()) leave();
        paint();
      }
    }
    function onKey(ev) { if (ev.key === 'Escape' && infoI !== null) closeInfo(); }
    function onMq() { layout(); paint(); }
    root.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
    if (mq) (mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq));
    layout(); paint();
    return {
      load, push, idle: () => !queue.length && (!playing || !!playing.persist) && !paused,
      gate(k) { gate = k || ''; layout(); },
      destroy() { dead = true; clearTimeout(timer); root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); if (mq) (mq.removeEventListener ? mq.removeEventListener('change', onMq) : mq.removeListener(onMq)); el.innerHTML = ''; }
    };
  }

  /* ---------- demo (Diego, 2026-11-06): la gara del mockup tra due squadre inventate nei colori della gara vera ---------- */
  const DM = { A: { 11: 'Marco Rinaldi', 31: 'Sara Galli', 41: 'Luca Ferri', 42: 'Giulia Conti', 51: 'Andrea Moretti', 52: 'Chiara Bruno', 12: 'Paolo Villa', 34: 'Nina Rota', 43: 'Rita Marchetti', 44: 'Elena Costa', 53: 'Fabio Testa', 55: 'Davide Fontana' },
    B: { 21: 'Roberto Greco', 32: 'Francesca Marini', 33: 'Ugo Neri', 43: 'Irene Lombardi', 53: 'Tommaso Barbieri', 54: 'Nicola Serra', 22: 'Valeria Gatti', 24: 'Alessio Sala', 35: 'Martina Pellegrini', 44: 'Giorgio Riva', 45: 'Oscar Leone', 56: 'Katia Ricci' } };
  const DC = { A: [11, 31, 41, 42, 51, 52], B: [21, 32, 33, 43, 53, 54] }, DB_ = { A: [12, 34, 43, 44, 53, 55], B: [22, 24, 35, 44, 45, 56] };
  const DR = [['start'], ['score', 'A', 52, 2], ['score', 'B', 53, 2], ['score', 'A', 11, 3], ['foul', 'B', 43, 'P1'], ['score', 'A', 41, 1], ['score', 'B', 21, 2], ['sub', 'A', 42, 44], ['score', 'B', 54, 2], ['score', 'A', 31, 2], ['score', 'A', 44, 2], ['endq'],
    ['start'], ['score', 'B', 32, 2], ['score', 'B', 53, 2], ['score', 'B', 43, 2], ['to', 'A'], ['score', 'A', 51, 2], ['foul', 'A', 51, 'P'], ['sub', 'B', 33, 35], ['score', 'B', 35, 2], ['score', 'A', 11, 3], ['foul', 'B', 54, 'L2'], ['score', 'A', 52, 1], ['score', 'A', 52, 1], ['score', 'A', 41, 2], ['endq'],
    ['start', [['A', 41, 34]]], ['score', 'B', 21, 2], ['score', 'A', 34, 2], ['score', 'B', 54, 2], ['foul', 'A', 44, 'U1'], ['score', 'B', 53, 1], ['score', 'A', 52, 2], ['score', 'B', 53, 3], ['to', 'B'], ['score', 'A', 11, 3], ['endq'],
    ['start', [['B', 21, 22]]], ['score', 'B', 22, 2], ['score', 'A', 31, 2], ['foul', 'B', 32, 'T1'], ['score', 'A', 31, 1], ['foul', 'B', 43, 'D'], ['sub', 'B', 43, 45], ['score', 'B', 45, 2], ['sub', 'A', 52, 55], ['score', 'A', 55, 2], ['score', 'B', 53, 2], ['score', 'A', 51, 2], ['final']];
  function demoGame(upto) {
    const g = { fase: 'gioco', q: 1, ev: [], lu: {}, gioc: { A: [], B: [] }, nomi: DM };
    T2.forEach(t => { g.gioc[t] = DC[t].concat(DB_[t]).map(n => ({ n: String(n), r: Math.floor(n / 10) })); });
    const oc = { A: DC.A.slice(), B: DC.B.slice() }, now = new Date(); let q = 0, id = 1, m = now.getHours() * 60 + now.getMinutes();
    for (let k = 0; k < upto && k < DR.length; k++) {
      const r = DR[k]; m += k % 3 ? 1 : 2; const h = String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      if (r[0] === 'start') { q++; (r[1] || []).forEach(w => { oc[w[0]][oc[w[0]].indexOf(w[1])] = w[2]; }); g.lu[q] = { A: oc.A.map(String), B: oc.B.map(String) }; g.fase = 'gioco'; g.q = q; continue; }
      if (r[0] === 'endq') { g.fase = 'pausa'; g.q = q; continue; }
      if (r[0] === 'final') { g.fase = 'fine'; g.q = q; continue; }
      const e = { i: id++, q, t: r[1], y: r[0], h };
      if (r[0] === 'score') { e.n = String(r[2]); e.p = r[3]; } else if (r[0] === 'foul') { e.n = String(r[2]); e.k = r[3]; } else if (r[0] === 'sub') { e.o = String(r[2]); e.e = String(r[3]); oc[r[1]][oc[r[1]].indexOf(r[2])] = r[3]; }
      g.ev.push(e);
    }
    return g;
  }
  function demo(el, opts) {
    /* Diego, 2026-11-06: la demo solo nell'app nativa e con l'accesso; altrimenti sfocata sotto il riquadro (opts.gate) */
    if (opts.gate) { const c = mount(el, Object.assign({}, opts, { demo: true })); c.load(demoGame(24)); return c; }
    const ctl = mount(el, Object.assign({}, opts, { demo: true, gate: '' }));
    let k = 1, t = 0, dead = false;
    const step = () => {
      if (dead) return;
      if (!ctl.idle()) { t = setTimeout(step, 400); return; }
      if (k >= DR.length) { t = setTimeout(() => { if (dead) return; k = 1; ctl.load(demoGame(1)); t = setTimeout(step, 1500); }, 8000); return; }
      k++; ctl.push(demoGame(k));
      t = setTimeout(step, DR[k - 1][0] === 'endq' ? 3500 : 900);
    };
    ctl.load(demoGame(1)); t = setTimeout(step, 1500);
    return Object.assign({}, ctl, { destroy() { dead = true; clearTimeout(t); ctl.destroy(); } });
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.live = { mount, demo, demoGame, snap, moments, shortName };
})();
