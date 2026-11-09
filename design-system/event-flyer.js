/* SP-IN · Locandina dell'evento per i tifosi. Copyright (c) 2026 Diego Cavalli. Tutti i diritti riservati.
   Autore: Diego Cavalli. È vietato copiare, modificare, distribuire o usare questo codice, in tutto o in parte, senza l'autorizzazione scritta dell'autore.

   SPIN.eventFlyer (1.34.4, Diego 2026-11-09): il template della locandina A4 approvata da Diego il 2026-11-06
   (docs/Locandine/LOCANDINE.md, "2026-11-15 Almenno-Bergamo Blu/locandina.html"), disegnato su canvas a 300 dpi e messo in un
   PDF da una pagina (pdf-lib): il PDF è un'immagine, come quello approvato (le ombre vettoriali di Chrome diventavano riquadri
   grigi). Misure in mm, le stesse del sorgente HTML. Testi di Diego: cambiarli solo con la sua approvazione.

   API
     draw(canvas, data, dpi=300) → Promise    disegna la locandina (canvas 2480×3508 a 300 dpi)
     pdf(data) → Promise<Blob>               PDF A4 (application/pdf)
     assets                                  percorsi delle immagini fisse (base: cartella di questo file)
   data = {
     kind: 'campionato'|'torneo'|'amichevole', competition: 'Sezione territoriale Lombardia Est · 2026/2027',
     home: {name, sub, abbr, logo, color, ring}, away: {…},   (name grande, sub piccolo sotto, split() li ricava dal nome
                                                             ufficiale; color: fascia; ring: contorno dello stemma; logo: url)
     when: {day: 'Domenica', date: '15 · 11 · 26', time: '9:00'},
     venue: {name: 'PalaLemine', address: 'Via Montale 24, Almenno San Bartolomeo (BG)'},
     androidSoon: true                       QR di Google Play sfocato con "Coming soon" (finché Android non è in produzione)
   } */
(function () {
  const NS = (window.SPIN = window.SPIN || {});
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');
  const assets = {
    logo: BASE + '../icons/babacapa-logo-horizontal-reverse.svg',
    qrIos: BASE + 'flyer/qr-app-store.svg', qrPlay: BASE + 'flyer/qr-play-sfocato.png',
    badgeIos: BASE + 'flyer/badge-app-store.svg', badgePlay: BASE + 'flyer/badge-google-play.png'
  };
  // token del registro Tribuna (platform/design-system/tokens.css), come nel sorgente HTML della locandina
  const C = { stage: '#14202b', onStage: '#ffffff', onStageMuted: '#c9d0d6', ink: '#14202b', muted: '#5b6b78', sunk: '#eef1f4', accent: '#ff9300', live: '#C62828' };
  const TYPE = { campionato: '#ff9300', torneo: '#2e9e4f', amichevole: '#0077cc' };
  const KIND = { campionato: 'Campionato', torneo: 'Torneo', amichevole: 'Amichevole' };
  const W = 210, H = 297, M = 12, SK = Math.tan(12 * Math.PI / 180);
  const FAM = '"Archivo","Helvetica Neue",Arial,sans-serif';

  // testo scuro solo sulle fasce molto chiare (nel sorgente HTML i nomi sono sempre bianchi)
  function light(h) { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return false; const n = parseInt(m[1], 16), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(n >> 16) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255) > .5; }
  /* nome grande e riga piccola dal nome ufficiale (come nella locandina approvata): "ALMENNO BASKIN VALLE IMAGNA" → ALMENNO /
     BASKIN VALLE IMAGNA; "BASKIN BERGAMO BLU" → BERGAMO BLU / BASKIN BERGAMO BLU; senza "Baskin" il nome e, sotto, il comune */
  function split(name, sub) {
    const w = String(name || '').trim().split(/\s+/).filter(Boolean), i = w.findIndex(x => /^baskin$/i.test(x));
    if (i > 0) return { name: w.slice(0, i).join(' '), sub: w.slice(i).join(' ') };
    if (i === 0 && w.length > 1) return { name: w.slice(1).join(' '), sub: w.join(' ') };
    return { name: w.join(' '), sub: sub || '' };
  }
  function img(src, cors) {
    return new Promise(res => { if (!src) return res(null); const i = new Image(); if (cors) i.crossOrigin = 'anonymous';
      i.onload = () => res(i); i.onerror = () => res(null); i.src = cors ? src + (src.includes('?') ? '&' : '?') + 'flyer' : src; });   // copia a parte, con CORS: il canvas resta esportabile
  }
  async function fonts() {
    if (!document.fonts || !document.fonts.load) return;
    try { await Promise.all(['italic 900 extra-condensed 40px Archivo', '600 20px Archivo', '500 20px Archivo', '700 20px Archivo'].map(f => document.fonts.load(f))); } catch (e) { /* carattere di sistema */ }
  }

  function draw(canvas, d, dpi) {
    return render(canvas, d, (dpi || 300) / 25.4);
  }
  async function render(canvas, d, k) {
    await fonts();
    const [logo, qrIos, qrPlay, badgeIos, badgePlay, crA, crB] = await Promise.all([assets.logo, assets.qrIos, assets.qrPlay, assets.badgeIos, assets.badgePlay]
      .map(s => img(s)).concat([img(d.home.logo, true), img(d.away.logo, true)]));
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    const x = canvas.getContext('2d');
    x.setTransform(k, 0, 0, k, 0, 0);   // da qui in poi tutto in mm
    const disp = s => { x.font = `italic 900 extra-condensed ${s}px ${FAM}`; if ('fontStretch' in x) x.fontStretch = 'extra-condensed'; };
    const body = (s, w) => { x.font = `${w || 600} ${s}px ${FAM}`; if ('fontStretch' in x) x.fontStretch = 'normal'; };
    const up = s => String(s || '').toUpperCase();
    const tw = s => x.measureText(s).width;
    const poly = (pts, fill) => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } };
    // riquadro inclinato come skewX(-12deg) attorno al centro
    const skewBox = (bx, by, bw, bh, fill) => { const s = bh * SK / 2; poly([[bx + s, by], [bx + bw + s, by], [bx + bw - s, by + bh], [bx - s, by + bh]], fill); };
    // gessato: righe a 115° larghe 2 px ogni 14 px (in mm a 96 dpi)
    const pin = (clip, a) => {
      x.save(); clip(); x.clip(); x.fillStyle = `rgba(255,255,255,${a})`;
      x.translate(W / 2, H / 2); x.rotate(25 * Math.PI / 180);
      for (let t = -H; t < H; t += 3.704) x.fillRect(t, -H, .529, 2 * H);
      x.restore();
    };
    const rect = (rx, ry, rw, rh) => () => { x.beginPath(); x.rect(rx, ry, rw, rh); };
    const wrap = (s, max) => { const out = []; let l = ''; String(s).split(/\s+/).filter(Boolean).forEach(w => { const t = l ? l + ' ' + w : w; if (l && tw(t) > max) { out.push(l); l = w; } else l = t; }); if (l) out.push(l); return out; };
    // corpo più piccolo finché il testo non sta in max righe larghe w
    const fit = (s, size, min, w, lines, font) => { let z = size; for (; z > min; z -= .25) { font(z); if (wrap(s, w).length <= lines && wrap(s, w).every(l => tw(l) <= w)) break; } font(z); return { z, l: wrap(s, w) }; };

    x.textBaseline = 'alphabetic'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    /* ---------- Palco ---------- */
    const TOP = 12, LOGO_H = 13, CALL_Y = TOP + LOGO_H + 7, CALL = 16, SL_Y = CALL_Y + CALL * .9 + 6, SL_H = 80, SL_B = SL_Y + SL_H;
    x.fillStyle = C.stage; x.fillRect(0, 0, W, SL_B);
    pin(rect(0, 0, W, SL_Y), .06);
    poly([[198 + 16 * .45, 0], [W, 0], [W, SL_Y], [198, SL_Y]], C.accent);   // fascia arancio inclinata a destra
    if (logo) x.drawImage(logo, M, TOP, LOGO_H * logo.width / logo.height, LOGO_H);
    // tipo di evento e competizione, allineati a destra prima della fascia
    disp(6); const kind = up(KIND[d.kind] || KIND.amichevole); body(3.6);
    const comp = String(d.competition || ''), cw = Math.min(86, tw(comp)); disp(6);
    const cx = W - M - 12 - Math.max(tw(kind), cw), cy = TOP + LOGO_H / 2;
    x.save(); x.translate(cx - 3 - 9 + 1.2 * SK, cy - 1.2); poly([[2.4 * Math.tan(20 * Math.PI / 180), 0], [9 + 2.4 * Math.tan(20 * Math.PI / 180), 0], [9, 2.4], [0, 2.4]], TYPE[d.kind] || TYPE.amichevole); x.restore();
    x.fillStyle = C.onStage; x.fillText(kind, cx, cy - .4);
    body(3.6); x.fillStyle = C.onStageMuted; let cs = comp; while (cs.length > 4 && tw(cs) > cw) cs = cs.slice(0, -2).trim() + '…'; x.fillText(cs, cx, cy + 4.2);
    // "Vieni a fare il tifo!" su una riga (Diego)
    disp(CALL); const c1 = 'VIENI A FARE ', c2 = 'IL TIFO!'; x.fillStyle = C.onStage; x.fillText(c1, M, CALL_Y + CALL * .74); x.fillStyle = C.accent; x.fillText(c2, M + tw(c1), CALL_Y + CALL * .74);

    /* ---------- Fasce delle squadre ---------- */
    const ca = d.home.color || '#0077CC', cb = d.away.color || '#E08000';
    x.fillStyle = '#fff'; x.fillRect(0, SL_Y, W, SL_H);
    const pa = [[0, SL_Y], [W * .61, SL_Y], [W * .39, SL_B], [0, SL_B]], pb = [[W * .61 + 3, SL_Y], [W, SL_Y], [W, SL_B], [W * .39 + 3, SL_B]];
    const clipP = p => () => { x.beginPath(); p.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); };
    poly(pa, ca); pin(clipP(pa), .08); poly(pb, cb); pin(clipP(pb), .08);
    const team = (t, cr, right, col) => {
      const ring = t.ring || '#fff', on = light(col) ? C.ink : '#fff', r = 20, ccx = right ? W - M - r : M + r;
      const nm = fit(up(t.name), 9.5, 6, 66, 2, disp), lh = nm.z * .9, sub = up(t.sub || '');
      const blockH = 2 * r + 7 + nm.l.length * lh + (sub ? 1.2 + 5.4 * .9 : 0), y0 = SL_Y + (SL_H - blockH) / 2, ccy = y0 + r;
      x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 8; x.shadowOffsetY = 3;
      x.beginPath(); x.arc(ccx, ccy, r + 2, 0, 2 * Math.PI); x.fillStyle = ring; x.fill(); x.restore();
      x.beginPath(); x.arc(ccx, ccy, r, 0, 2 * Math.PI); x.fillStyle = '#fff'; x.fill();
      x.save(); x.beginPath(); x.arc(ccx, ccy, 18, 0, 2 * Math.PI); x.clip();
      if (cr) { const s = Math.min(36 / cr.width, 36 / cr.height), iw = cr.width * s, ih = cr.height * s; x.drawImage(cr, ccx - iw / 2, ccy - ih / 2, iw, ih); }
      else { disp(16); x.fillStyle = col; x.textAlign = 'center'; x.fillText(up(t.abbr || ''), ccx, ccy + 5.6); x.textAlign = 'left'; }
      x.restore();
      x.textAlign = right ? 'right' : 'left'; const tx = right ? W - M : M;
      disp(nm.z); x.fillStyle = on; let y = ccy + r + 7 + lh * .78;
      nm.l.forEach(l => { x.fillText(l, tx, y); y += lh; });
      if (sub) { disp(5.4); x.globalAlpha = .85; let s2 = sub; while (s2.length > 4 && tw(s2) > 66) s2 = s2.slice(0, -2).trim() + '…'; x.fillText(s2, tx, y - lh + 1.2 + 5.4 * .9 + .2); x.globalAlpha = 1; }
      x.textAlign = 'left';
    };
    team(Object.assign({ ring: d.home.ring, on: d.home.on }, d.home), crA, false, ca);
    team(Object.assign({ ring: d.away.ring, on: d.away.on }, d.away), crB, true, cb);

    /* ---------- Quando e dove ---------- */
    const IN_Y = SL_B, wh = d.when || {}, date = wh.date || 'Data da definire';
    disp(15); const ww = Math.max(tw(date), (disp(6.5), tw(up(wh.day || ''))));
    disp(15); const dw = tw(date), whenW = Math.max(dw, ww);
    const vx = M + whenW + 10, vw = W - M - vx, vn = d.venue || {};
    const vName = fit(up(vn.name || 'Campo da definire'), 7.5, 5, vw, 2, disp), vAddr = (body(4.4, 500), wrap([vn.address, wh.time ? 'ore ' + wh.time : ''].filter(Boolean).join(' · '), vw));
    const whereH = vName.l.length * vName.z + vAddr.length * 4.4 * 1.35, whenH = 6.5 + 1.5 + 15 * .9, inH = 15 + Math.max(whereH, whenH) + 8, IN_B = IN_Y + inH;
    x.fillStyle = C.sunk; x.fillRect(0, IN_Y, W, inH);
    const bot = IN_B - 8;
    disp(6.5); x.fillStyle = C.muted; x.fillText(up(wh.day || ''), M, bot - 15 * .9 - 1.5 - .9);
    disp(15); x.fillStyle = C.ink; x.fillText(date, M, bot - 1.5);
    let vy = bot - 1 - vAddr.length * 4.4 * 1.35 - vName.l.length * vName.z;
    disp(vName.z); vName.l.forEach(l => { vy += vName.z; x.fillText(l, vx, vy - vName.z * .12); });
    body(4.4, 500); vAddr.forEach(l => { vy += 4.4 * 1.35; x.fillText(l, vx, vy - 1.1); });
    // tabellone: sigla della casa · ora · sigla dell'ospite, a cavallo tra fasce e blocco grigio (disegnato dopo entrambi)
    { disp(9); const sa = up(d.home.abbr || '—'), sb = up(d.away.abbr || '—'), wa = tw(sa) + 12, wb = tw(sb) + 12; disp(11); const tm = wh.time || '', wm = tw(tm) + 16;
      const bh = 16, by = SL_B + 8 - bh, bx = W / 2 - (wa + wm + wb) / 2;
      x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 6; x.shadowOffsetY = 2;
      skewBox(bx, by, wa, bh, ca); skewBox(bx + wa, by, wm, bh, '#fff'); skewBox(bx + wa + wm, by, wb, bh, cb); x.shadowColor = 'transparent';
      x.textAlign = 'center'; disp(9); x.fillStyle = d.home.on || '#fff'; x.fillText(sa, bx + wa / 2, by + bh / 2 + 3.2);
      x.fillStyle = d.away.on || '#fff'; x.fillText(sb, bx + wa + wm + wb / 2, by + bh / 2 + 3.2);
      disp(11); x.fillStyle = C.ink; x.fillText(tm, bx + wa + wm / 2, by + bh / 2 + 3.9); x.textAlign = 'left'; x.restore(); }

    /* ---------- Piè di pagina ---------- */
    const FT_H = 14.4, FT_Y = H - FT_H;
    x.fillStyle = C.stage; x.fillRect(0, FT_Y, W, FT_H); pin(rect(0, FT_Y, W, FT_H), .05);
    disp(5); x.fillStyle = C.onStage; x.fillText('BABACAPA.COM', M, FT_Y + FT_H / 2 + 1.8);
    body(3.6); x.fillStyle = C.onStageMuted; x.textAlign = 'right'; x.fillText('Inquadra il QR, scarica l\'app e accedi: il Live parte con la gara', W - M, FT_Y + FT_H / 2 + 1.3); x.textAlign = 'left';

    /* ---------- App ---------- */
    const QW = 44, q2 = W - M - QW, q1 = q2 - 8 - QW, LW = q1 - 8 - M, AP_Y = IN_B, AP_H = FT_Y - IN_B;
    // colonna del testo: altezza totale per centrarla nello spazio
    body(3.8, 700); const liveTxt = wrap('Collegati all\'app per assistere in diretta alla cronaca e alle statistiche di gara*', LW - 22);
    body(4.2, 500); const pTxt = wrap('Sei sugli spalti o a casa? Con l\'app gratuita del basket inclusivo non perdi nemmeno un canestro.', LW);
    const li = ['Punteggio, cronaca e statistiche azione per azione', d.kind === 'campionato' ? 'Calendario e classifica del campionato' : d.kind === 'torneo' ? 'Calendario e classifica del torneo' : 'Calendario delle gare e risultati', 'Segui le tue squadre preferite'];
    body(4, 600); const liL = li.map(s => wrap(s, LW - 6));
    const rowH = Math.max(9.2, liveTxt.length * 3.8 * 1.35), colH = rowH + 4 + 2 * 9 * .9 + 3 + pTxt.length * 4.2 * 1.45 + 3 + liL.flat().length * 4 * 1.5 + 3 + 3 * 1.4;
    let y = AP_Y + (AP_H - colH) / 2;
    disp(6); const lw = tw('LIVE') + 2.6 + 2.2 + 9; skewBox(M, y + (rowH - 9.2) / 2, lw, 9.2, C.live);
    x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(M + 4.5 + 1.3, y + rowH / 2, 2.3, 0, 2 * Math.PI); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(M + 4.5 + 1.3, y + rowH / 2, 1.3, 0, 2 * Math.PI); x.fill();
    x.fillText('LIVE', M + 4.5 + 2.6 + 2.2, y + rowH / 2 + 2.1);
    body(3.8, 700); x.fillStyle = C.live; liveTxt.forEach((l, i) => x.fillText(l, M + lw + 4, y + (rowH - liveTxt.length * 3.8 * 1.35) / 2 + (i + 1) * 3.8 * 1.35 - 1.2));
    y += rowH + 4;
    disp(9); x.fillStyle = C.ink; x.fillText('SEGUI LA GARA', M, y + 9 * .72); x.fillText('IN LIVE SU BABACAPA', M, y + 9 * .9 + 9 * .72); y += 2 * 9 * .9 + 3;
    body(4.2, 500); pTxt.forEach(l => { y += 4.2 * 1.45; x.fillText(l, M, y - 1.5); }); y += 3;
    body(4, 600); liL.forEach(ls => { x.save(); x.translate(M, y + 1.9); poly([[1.3 * Math.tan(20 * Math.PI / 180), 0], [3.4 + 1.3 * Math.tan(20 * Math.PI / 180), 0], [3.4, 1.3], [0, 1.3]], C.accent); x.restore();
      x.fillStyle = C.ink; ls.forEach(l => { y += 4 * 1.5; x.fillText(l, M + 6, y - 1.6); }); });
    y += 3; body(3, 500); x.fillStyle = C.muted; x.fillText('* solo per le gare supportate', M, y + 3 * 1.2);
    // QR: App Store nitido; Google Play sfocato con "Coming soon" finché Android non è in produzione
    const qrH = QW + 3.5 + 12 + 1 + 3.2 * 1.4, qy = AP_Y + (AP_H - qrH) / 2;
    const qr = (qx, im, badge, sub, soon) => {
      x.fillStyle = '#fff'; x.fillRect(qx, qy, QW, QW); x.strokeStyle = C.ink; x.lineWidth = .6; x.strokeRect(qx + .3, qy + .3, QW - .6, QW - .6);
      if (im) { x.globalAlpha = soon ? .55 : 1; x.drawImage(im, qx + 3, qy + 3, QW - 6, QW - 6); x.globalAlpha = 1; }
      if (soon) { disp(6); const t = 'COMING SOON', sw = tw(t) + 8, sh = 8.6; x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 4; x.shadowOffsetY = 1.5;
        skewBox(qx + QW / 2 - sw / 2, qy + QW / 2 - sh / 2, sw, sh, C.stage); x.restore(); x.fillStyle = C.onStage; x.textAlign = 'center'; x.fillText(t, qx + QW / 2, qy + QW / 2 + 2.1); x.textAlign = 'left'; }
      if (badge) { const bw = 12 * badge.width / badge.height; x.drawImage(badge, qx + QW / 2 - bw / 2, qy + QW + 3.5, bw, 12); }
      body(3.2, 600); x.fillStyle = C.muted; x.textAlign = 'center'; x.fillText(sub, qx + QW / 2, qy + QW + 3.5 + 12 + 1 + 3.2); x.textAlign = 'left';
    };
    qr(q1, qrIos, badgeIos, 'iPhone e iPad', false);
    qr(q2, qrPlay, badgePlay, 'Android', d.androidSoon !== false);
    return { crests: [!!crA, !!crB], images: [logo, qrIos, qrPlay, badgeIos, badgePlay].every(Boolean) };
  }

  async function pdf(d) {
    const cv = document.createElement('canvas'), r = await draw(cv, d, 300);
    const L = window.PDFLib, doc = await L.PDFDocument.create(), pt = 72 / 25.4;
    doc.setTitle('Locandina ' + (d.home.name || '') + ' – ' + (d.away.name || '')); doc.setCreator('Babacapa');
    const page = doc.addPage([W * pt, H * pt]), jpg = await doc.embedJpg(cv.toDataURL('image/jpeg', .92));
    page.drawImage(jpg, { x: 0, y: 0, width: W * pt, height: H * pt });
    cv.width = cv.height = 0;   // libera la memoria del canvas (iPad)
    const b = new Blob([await doc.save()], { type: 'application/pdf' }); b.check = r; return b;
  }

  NS.eventFlyer = { draw, pdf, assets, split };
})();
