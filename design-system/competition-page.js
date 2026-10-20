/* SP-IN · Pagina di tornei e campionati in stile "Prima serata" (CompetitionPage)
   Script classico, senza dipendenze. Espone window.SPIN.competitionPage:
     render(data)        → HTML dell'intera pagina (testata, schede, contenuto della scheda attiva)
     hero(h)             → testata scura con fascia (arancio = campionato, verde = torneo), filigrana, chip,
                           info box "Struttura", stemmi, stato, vincitore
     tabs(list)          → schede inclinate (gironi, Playoff, Tabellone, Squadre…)
     standings(s)        → classifica di un girone
     calendar(c)         → calendario per giornata (righe partita con tabellone TV)
     bracket(b)          → tabellone a eliminazione (PC: colonne con linee; mobile: turni impilati, finale per prima)
     series(s)           → una scheda di incrocio: gara unica oppure serie "al meglio di N" con G1…GN e gare vinte
     structure(s)        → contenuto del dialog "Struttura"
     structureDialog(s)  → dialog "Struttura" completo (sfondo + pannello; su schermi stretti foglio dal basso)
   Contratto dei dati: TORNEI-CAMPIONATI.md, sezione 4. Ogni elemento interattivo accetta `href` (diventa <a>)
   oppure `attrs` (oggetto di attributi su un <button>), così l'app collega i propri gestori.
   Decisioni di design (Diego, 2026-10-20): stile della scheda evento "Prima serata"; fascia arancio per i campionati
   e verde per i tornei; filigrana coppa (campionato) o scarpa che corre (torneo); "Struttura" è un info box accanto
   alle chip e apre un dialog; playoff con la stessa struttura del tabellone del torneo più le gare vinte nella serie;
   sempre il primo colore delle squadre; niente dati live.
   SP-IN (2026-10-20): hero.topAction (HTML fidato) in alto a destra, per il pulsante "Modifica" dell'app. */
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
  function tname(t) { return (t && (t.short || t.name)) || ''; }
  /* link o pulsante: href → <a>, altrimenti <button> con gli attributi dell'app */
  function tag(o, cls, inner, extra) {
    const a = attrs(o && o.attrs) + (extra || '');
    return o && o.href ? `<a class="${cls}" href="${esc(o.href)}"${a}>${inner}</a>` : `<button type="button" class="${cls}"${a}>${inner}</button>`;
  }

  /* icone: coppa e scarpa sono quelle già usate in app.js per campionato e torneo */
  const SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const I = {
    trophy: `<svg ${SV}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    shoe: `<svg ${SV}><path d="M8 15h12a2 2 0 0 0 2-2 2 2 0 0 0-1.5-1.9L16 10l-2-4h-2.5l-1 2H9a1 1 0 0 0-1 1z"/><path d="M8 18.5h14"/><path d="M12.5 9.5h2"/><path d="M13 12h2.5"/><path d="M2 9h4"/><path d="M1 12h5"/><path d="M3 15h3"/></svg>`,
    back: `<svg ${SV}><path d="m15 18-6-6 6-6"/></svg>`,
    chev: `<svg ${SV}><path d="m9 18 6-6-6-6"/></svg>`,
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };
  const KINDS = { campionato: 'Campionato', torneo: 'Torneo' };

  function crest(t, cls) {
    t = t || {};
    const inner = t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : `<b>${esc(initials(t.short || t.name))}</b>`;
    /* SP-IN (Diego, 2026-10-20): contorno dello stemma nell'altro colore della squadra, come nella scheda evento */
    const ring = t.altColor && t.color && t.altColor.toLowerCase() !== t.color.toLowerCase() ? t.altColor : (t.color || INK);
    return `<span class="${cls}" style="--c-bg:${esc(t.logoBg || '#FFFFFF')};--c-team:${esc(ring)}">${inner}</span>`;
  }
  function secTitle(text, extra) {
    return `<div class="cpx-sec"><span class="cpx-tag"><b>${esc(text)}</b></span><span class="cpx-rule"></span>${extra ? `<span class="cpx-sec-x">${esc(extra)}</span>` : ''}</div>`;
  }

  /* ---------- testata ---------- */
  function hero(h) {
    h = h || {};
    const kind = h.kind === 'torneo' ? 'torneo' : 'campionato';
    const chips = (h.chips || []).map(c => `<span class="cpx-chip"><span>${esc(c)}</span></span>`).join('');
    const info = h.structure ? tag(h.structure, 'cpx-info', `<span>${I.info}${esc(h.structure.label || 'Struttura')}</span>`, ' aria-haspopup="dialog"') : '';
    const crests = (h.teams || []).map(t => crest(t, 'cpx-hcrest')).join('');
    const st = h.status ? `<span class="cpx-status cpx-status--${esc(h.status.tone || 'info')}"><b>${esc(h.status.label)}</b></span>` : '';
    const ch = h.champion ? `<div class="cpx-champ">${crest(h.champion, 'cpx-champ-c')}<span class="cpx-champ-t"><small>${esc(h.championLabel || 'Vincitore')}</small><b>${esc(h.champion.name || h.champion.short)}</b></span><span class="cpx-champ-i">${I.trophy}</span></div>` : '';
    const back = h.back ? tag(h.back, 'cpx-back', I.back, ` aria-label="${esc(h.back.label || 'Indietro')}"`) : '<span class="cpx-back-sp"></span>';
    return `<header class="cpx-hero cpx-hero--${kind}">
  <span class="cpx-hero-band" aria-hidden="true"></span><span class="cpx-hero-tex" aria-hidden="true"></span>
  <span class="cpx-hero-wm" aria-hidden="true">${kind === 'torneo' ? I.shoe : I.trophy}</span>
  <div class="cpx-hero-in">
    <div class="cpx-hero-top">${back}<span class="cpx-kind"><b>${esc(h.kindLabel || KINDS[kind])}</b></span>${h.topAction || '<span class="cpx-back-sp"></span>'}</div>
    <div class="cpx-hero-tt">${h.sub ? `<span class="cpx-sub">${esc(h.sub)}</span>` : ''}<h1>${esc(h.title)}</h1></div>
    ${chips || info ? `<div class="cpx-chips">${chips}${info}</div>` : ''}
    ${crests || st ? `<div class="cpx-hero-row"><span class="cpx-hcrests">${crests}</span>${st}</div>` : ''}
    ${ch}
  </div>
</header>`;
  }

  /* ---------- schede ---------- */
  function tabs(list) {
    if (!list || list.length < 2) return '';
    return `<div class="cpx-tabs" role="tablist">${list.map(t => tag(t, 'cpx-tab', `<span>${esc(t.label)}</span>`, ` role="tab" aria-selected="${!!t.pressed}"`)).join('')}</div>`;
  }

  /* ---------- classifica ---------- */
  function standings(s) {
    if (!s || !s.rows) return '';
    /* SP-IN: s.noPt per i tornei, dove la classifica va per vittorie e non ci sono punti in classifica */
    const head = `<tr><th class="cpx-c-pos"><span class="cpx-vh">Posizione</span></th><th class="cpx-c-team">Squadra</th>${s.noPt ? '' : '<th title="Punti in classifica">Pt</th>'}<th title="Partite giocate">G</th><th title="Vinte">V</th><th title="Perse">P</th><th class="cpx-pf" title="Punti fatti">PF</th><th class="cpx-pf" title="Punti subiti">PS</th><th title="Differenza punti">+/−</th></tr>`;
    const rows = s.rows.map((r, i) => {
      const t = r.team || {}, c = t.color || INK, d = r.diff != null ? r.diff : (r.pf != null && r.ps != null ? r.pf - r.ps : null);
      const ds = d == null ? '' : (d > 0 ? '+' + d : String(d));
      return `<tr${r.zone ? ` class="cpx-z-${esc(r.zone)}"` : ''}>
  <td class="cpx-c-pos"><b>${esc(r.pos != null ? r.pos : i + 1)}</b></td>
  <td class="cpx-c-team"><span class="cpx-tm">${crest(t, 'cpx-crest')}<b>${esc(tname(t))}</b></span></td>
  ${s.noPt ? '' : `<td><span class="cpx-pt" style="--t:${esc(c)};--t-on:${onColor(c)}"><b>${esc(r.pt)}</b></span></td>`}
  <td>${esc(r.g)}</td><td>${esc(r.v)}</td><td>${esc(r.p)}</td>
  <td class="cpx-pf">${esc(r.pf)}</td><td class="cpx-pf">${esc(r.ps)}</td>
  <td class="cpx-d ${d > 0 ? 'is-up' : d < 0 ? 'is-down' : ''}">${esc(ds)}</td>
</tr>`;
    }).join('');
    const lg = s.legend || {};
    const zones = [lg.playoff ? `<span><i class="cpx-lg-po"></i>${esc(lg.playoff)}</span>` : '', lg.playout ? `<span><i class="cpx-lg-pl"></i>${esc(lg.playout)}</span>` : ''].join('');
    return `<section class="cpx-stand">${secTitle(s.title || 'Classifica')}
  <div class="cpx-card"><table class="cpx-table"><thead>${head}</thead><tbody>${rows}</tbody></table>
  <div class="cpx-leg">${zones ? `<div class="cpx-lg-z">${zones}</div>` : ''}${s.note ? `<small>${esc(s.note)}</small>` : ''}</div></div>
</section>`;
  }

  /* ---------- calendario ---------- */
  function matchRow(m) {
    const H = m.home || {}, A = m.away || {}, a = H.color || INK, b = A.color || INK;
    const sc = m.score && m.score.home != null;
    const mid = sc
      ? `<span class="cpx-bug-sc"><span${m.score.home < m.score.away ? ' class="is-lost"' : ''}>${esc(m.score.home)}</span><i>–</i><span${m.score.away < m.score.home ? ' class="is-lost"' : ''}>${esc(m.score.away)}</span></span>`
      : `<span>${esc(m.time || '—')}</span>`;
    const title = `${tname(H)} – ${tname(A)}`;
    const inner = `<span class="cpx-m-band" aria-hidden="true">${crest(H, 'cpx-crest cpx-crest--l')}
      <span class="cpx-bug" style="--a:${esc(a)};--a-on:${onColor(a)};--b:${esc(b)};--b-on:${onColor(b)}"><span class="cpx-bug-t cpx-bug-t--a"><b>${esc(abbr(H))}</b></span><span class="cpx-bug-mid">${mid}</span><span class="cpx-bug-t cpx-bug-t--b"><b>${esc(abbr(A))}</b></span></span>
      ${crest(A, 'cpx-crest cpx-crest--l')}</span>
      <span class="cpx-m-t"><b>${esc(title)}</b><span>${esc([m.when, m.place].filter(Boolean).join(' · '))}</span></span>
      <span class="cpx-chev">${I.chev}</span>`;
    return tag(m, 'cpx-m', inner, ` aria-label="${esc(title + (sc ? `, ${m.score.home} a ${m.score.away}` : m.time ? ', ore ' + m.time : ''))}"`);
  }
  function calendar(c) {
    if (!c) return '';
    const rounds = (c.rounds || []).map(r => `<div class="cpx-round">${secTitle(r.title, r.note)}${(r.matches || []).map(matchRow).join('')}</div>`).join('');
    return `<section class="cpx-cal">${c.title ? secTitle(c.title) : ''}${rounds || `<div class="cpx-empty">${esc(c.empty || 'Calendario non ancora pubblicato.')}</div>`}</section>`;
  }

  /* ---------- incrocio (gara unica o serie) ---------- */
  function gameWins(games, side) {
    return (games || []).filter(g => g && typeof g === 'object' && g.home != null && g.away != null && (side === 'home' ? g.home > g.away : g.away > g.home)).length;
  }
  function series(s) {
    s = s || {};
    const best = Math.max(1, +s.best || 1), need = Math.floor(best / 2) + 1;
    const games = best === 1 ? [] : Array.from({ length: best }, (_, i) => (s.games || [])[i] === undefined ? null : s.games[i]);
    const H = s.home || {}, A = s.away || {};
    let hw, aw, winner = null;
    if (best === 1) {
      const g = (s.games || [])[0], hs = H.score != null ? H.score : g && g.home, as = A.score != null ? A.score : g && g.away;
      H._s = hs; A._s = as;
      if (hs != null && as != null && hs !== as) winner = hs > as ? 'home' : 'away';
    } else {
      hw = H.wins != null ? H.wins : gameWins(games, 'home');
      aw = A.wins != null ? A.wins : gameWins(games, 'away');
      if (hw >= need) winner = 'home'; else if (aw >= need) winner = 'away';
    }
    function line(side) {
      const P = side === 'home' ? H : A, t = P.team || {}, c = t.color || INK;
      const out = winner && winner !== side;
      let cells = '';
      if (best === 1) {
        cells = `<span class="cpx-s-score">${P._s == null ? '–' : esc(P._s)}</span>`;
      } else {
        cells = games.map(g => {
          if (g === 'ifneeded') return `<span class="cpx-s-g is-tbd">${esc(s.ifNeededLabel || 'se nec.')}</span>`;
          if (!g || g.home == null) return '<span class="cpx-s-g is-tbd">–</span>';
          const me = side === 'home' ? g.home : g.away, op = side === 'home' ? g.away : g.home;
          return `<span class="cpx-s-g${me > op ? ' is-won' : ''}">${esc(me)}</span>`;
        }).join('');
        const w = side === 'home' ? hw : aw;
        const st = winner === side ? 'is-through' : (w > 0 && !winner ? 'is-lead' : '');
        cells += `<span class="cpx-s-w ${st}" style="--t:${esc(c)};--t-on:${onColor(c)}" aria-label="${esc(w)} ${w === 1 ? 'gara vinta' : 'gare vinte'}"><b>${esc(w)}</b></span>`;
      }
      return `<span class="cpx-s-line${best === 1 && out ? ' is-out' : ''}" style="--t:${esc(c)}"><span class="cpx-s-stripe"></span>${crest(t, 'cpx-crest')}<span class="cpx-s-n"><b>${esc(t.name ? tname(t) : P.placeholder || '—')}</b>${P.seed ? `<small>${esc(P.seed)}</small>` : ''}</span>${cells}</span>`;
    }
    const fmt = best === 1 ? (s.formatLabel || 'Gara unica') : (s.formatLabel || `Al meglio delle ${best}`);
    const labels = best === 1 ? `<span class="cpx-s-when">${esc(s.when || '')}</span>` : games.map((_, i) => `<span class="cpx-s-gl">G${i + 1}</span>`).join('') + '<span class="cpx-s-wl">Serie</span>';
    const foot = best > 1 || s.note || s.state
      ? `<span class="cpx-s-f"><span><b>${esc(fmt)}</b>${s.note ? ' · ' + esc(s.note) : ''}</span>${s.state ? `<span class="cpx-s-st cpx-s-st--${esc(s.stateTone || 'muted')}">${esc(s.state)}</span>` : ''}</span>` : '';
    const inner = `<span class="cpx-s-h"><span class="cpx-s-name">${esc(s.name || '')}</span>${labels}</span>${line('home')}<span class="cpx-s-sep"></span>${line('away')}${foot}`;
    const label = `${s.name ? s.name + ': ' : ''}${tname(H.team)} – ${tname(A.team)}${best > 1 ? `, serie ${hw}–${aw}` : (H._s != null && A._s != null ? `, ${H._s} a ${A._s}` : '')}`;
    return tag(s, `cpx-ser${best > 1 ? ' cpx-ser--bo' : ''}`, inner, ` style="--ng:${best === 1 ? 0 : best}" aria-label="${esc(label)}"`);
  }

  /* ---------- tabellone ---------- */
  function bracket(b) {
    if (!b || !b.rounds || !b.rounds.length) return '';
    const n = b.rounds.length;
    const rounds = b.rounds.map((r, i) => {
      const last = i === n - 1, ss = r.series || [];
      let body = '';
      if (last) body = ss.map(x => `<div class="cpx-slot">${series(x)}</div>`).join('');
      else for (let k = 0; k < ss.length; k += 2) body += `<div class="cpx-pair">${ss.slice(k, k + 2).map(x => `<div class="cpx-slot">${series(x)}</div>`).join('')}</div>`;
      return `<div class="cpx-rd${i === 0 ? ' cpx-rd--first' : ''}${last ? ' cpx-rd--last' : ''}" style="--o:${(n - i) * 2}">${secTitle(r.title)}<div class="cpx-rd-b">${body}</div></div>`;
    }).join('');
    const extra = (b.extra || []).map(r => `<div class="cpx-xtra" style="--o:3">${secTitle(r.title)}${(r.series || []).map(series).join('')}</div>`).join('');
    return `<section class="cpx-br" style="--n:${n}" aria-label="${esc(b.label || 'Tabellone')}">${rounds}${extra}</section>`;
  }

  /* ---------- dialog "Struttura" ---------- */
  function structure(s) {
    s = s || {};
    const kind = s.kind === 'torneo' ? 'torneo' : 'campionato';
    const secs = (s.sections || []).map(x => `<section class="cpx-st-sec">${secTitle(x.title)}<dl>${(x.rows || []).map(r => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl></section>`).join('');
    return `<div class="cpx-dlg cpx-dlg--${kind}" role="dialog" aria-modal="true" aria-labelledby="cpx-dlg-t">
  <div class="cpx-dlg-h"><span class="cpx-dlg-band" aria-hidden="true"></span><span class="cpx-dlg-tt">${s.eyebrow ? `<small>${esc(s.eyebrow)}</small>` : ''}<h2 id="cpx-dlg-t">${esc(s.title || 'Struttura')}</h2></span>${tag(s.close || {}, 'cpx-dlg-x', I.close, ' aria-label="Chiudi"')}</div>
  <div class="cpx-dlg-b">${secs}</div>
</div>`;
  }
  function structureDialog(s) {
    return `<div class="cpx-scrim"${attrs(s && s.scrimAttrs)}>${structure(s)}</div>`;
  }

  /* ---------- pagina ---------- */
  function render(d) {
    d = d || {};
    let body = '';
    if (d.view === 'bracket') body = bracket(d.bracket);
    else if (d.view === 'custom') body = d.html || '';
    else body = `<div class="cpx-cols">${standings(d.standings)}${calendar(d.calendar)}</div>`;
    return `<div class="cpx">${hero(d.hero)}<div class="cpx-main">${tabs(d.tabs)}${body}</div>${d.dialog ? structureDialog(d.dialog) : ''}</div>`;
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.competitionPage = { render, hero, tabs, standings, calendar, bracket, series, structure, structureDialog, abbr, onColor };
})();
