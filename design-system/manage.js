/* SP-IN · Pagine di gestione della squadra e della società, stile "Almanacco" (Manage)
   Pagine per chi le gestisce (team manager, ASD manager): il tifoso non le vede.
   Script classico, senza dipendenze. Espone window.SPIN.manage:
     teamPage(d)        → pagina della squadra: intestazione, Da sistemare, Atleti, Staff, Statistiche, Eventi
     societyPage(d)     → pagina della società: intestazione, Da sistemare, Documenti della società, Affiliazioni,
                          Squadre, Documenti degli atleti
     intro(i)           → intestazione (indietro, etichetta, stemma/monogramma, nome, modifica, luogo, azioni)
     todo(t)            → "Da sistemare"
     section(s)         → sezione con filo, titolo corsivo e trattino nel colore della squadra/società
     athletes(list, c), staff(list), stats(st), events(list), docs(list), affiliations(list), teams(list),
     athleteDocs(a)     → i contenuti delle sezioni, riusabili altrove
     onColor(hex)
   Contratto dei dati: SQUADRE-SOCIETA.md, sezione 5. Ogni link o pulsante accetta `href` oppure `attrs`.
   Decisioni (Diego, 2026-10-21): stile 4 "Almanacco", leggero nei colori; priorità squadra = atleti, staff,
   statistiche, eventi; società = documenti della società, affiliazioni, squadre, stato dei documenti degli atleti.
   Stemma (squadra) o monogramma (società) a sinistra del nome; pulsante Modifica accanto al nome (su telefono solo
   la matita); nessun riquadro informativo "Modifica dati e colori"; sottotitolo della squadra = solo il luogo; la
   società non ha sottotitolo; colonna "Tessera" = numero della tessera; su PC Staff ed Eventi a destra (Staff
   allineato ad Atleti), Squadre a destra allineate a Documenti della società; statistiche: su PC squadra e per
   ruolo, su telefono solo squadra, con il numero di gare considerate accanto ai punti medi e ai falli. */
(function () {
  'use strict';

  const INK = '#14202B';
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function lum(h) { return rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); }
  function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function onColor(h) { return contrast(h, '#FFFFFF') >= contrast(h, INK) ? '#FFFFFF' : INK; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  /* testo con grassetti: solo **così** diventa <b>, il resto è escapato */
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function attrs(o) { return Object.keys(o || {}).map(k => ` ${esc(k)}="${esc(o[k])}"`).join(''); }
  function abbr(t) { return (t.abbr || String(t.short || t.name || '').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '—'; }
  function initials(n) { return String(n || '').split(/\s+/).filter(w => /^[A-Za-zÀ-ÿ]/.test(w) && !/^(asd|ssd|a\.s\.d\.|s\.s\.d\.)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  function tag(o, cls, inner, extra) {
    const a = attrs(o && o.attrs) + (extra || '');
    return o && o.href ? `<a class="${cls}" href="${esc(o.href)}"${a}>${inner}</a>` : `<button type="button" class="${cls}"${a}>${inner}</button>`;
  }
  function dec(v) { return v == null || v === '' ? '—' : Number(v).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function pct(v) { return v == null || v === '' ? '—' : dec(v) + '%'; }
  function int(v) { return v == null || v === '' ? '—' : Number(v).toLocaleString('it-IT'); }

  const SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const I = {
    left: `<svg ${SV} stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>`,
    chev: `<svg ${SV}><path d="m9 18 6-6-6-6"/></svg>`,
    plus: `<svg ${SV} stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>`,
    up: `<svg ${SV} stroke-width="2.2"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>`,
    pencil: `<svg ${SV} stroke-width="2.2"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>`,
    pin: `<svg ${SV}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
    ok: `<svg ${SV} stroke-width="3"><path d="M5 12l5 5 9-10"/></svg>`,
    alert: `<svg ${SV} stroke-width="2.6"><path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9.5"/></svg>`
  };
  const ICONS = { plus: I.plus, upload: I.up, pencil: I.pencil };

  /* ---------- pezzi ---------- */
  /* stato leggero: icona + testo colorato. kind: ok | warn | crit | mut */
  function st(kind, text) {
    const k = ['ok', 'warn', 'crit'].includes(kind) ? kind : 'mut';
    return `<span class="mgx-st mgx-st--${k}">${k === 'ok' ? I.ok : k === 'mut' ? '' : I.alert}${text ? `<span>${esc(text)}</span>` : ''}</span>`;
  }
  /* pulsante inclinato. b = { label, icon?: 'plus'|'upload'|'pencil', primary?, href|attrs } */
  function btn(b, small) {
    if (!b) return '';
    return tag(b, `mgx-btn${b.primary ? ' mgx-btn--pri' : ''}${small ? ' mgx-btn--sm' : ''}`, `<span>${ICONS[b.icon] || ''}${esc(b.label)}</span>`);
  }
  function crest(t, cls) {
    const c = t.color || INK;
    const inner = t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : `<b>${esc(initials(t.short || t.name))}</b>`;
    return `<span class="${cls}" style="--c-bg:${esc(t.logoBg || '#FFFFFF')};--c-ring:${esc(c)}">${inner}</span>`;
  }
  function chev() { return `<span class="mgx-chev">${I.chev}</span>`; }
  function games(n) { return n == null ? '' : `<span class="mgx-games">${esc(n)} ${n === 1 ? 'gara' : 'gare'}</span>`; }
  function sec(s) {
    s = s || {};
    const x = s.extra ? `<span class="mgx-sec-x${s.extraWide ? ' mgx-wide' : ''}">${esc(s.extra)}</span>` : '';
    const xs = s.extraNarrow ? `<span class="mgx-sec-x mgx-narrow">${esc(s.extraNarrow)}</span>` : '';
    return `<section class="mgx-sec mgx-o-${esc(s.key || 'x')}"${s.id ? ` id="${esc(s.id)}"` : ''}>
    <div class="mgx-sec-h"><h2>${esc(s.title)}</h2><span class="mgx-dash" aria-hidden="true"></span>${x}${xs}<span class="mgx-grow"></span>${s.action ? `<span class="mgx-wide">${btn(s.action, true)}</span>` : ''}</div>
    ${s.inner || ''}
  </section>`;
  }

  /* ---------- intestazione ---------- */
  function intro(i) {
    i = i || {};
    const mark = i.society
      ? `<span class="mgx-mono" style="--c:${esc(i.color || INK)}" aria-hidden="true"><b>${esc(i.monogram || initials(i.title))}</b></span>`
      : crest(i.team || { name: i.title, color: i.color }, 'mgx-crest');
    const edit = i.edit ? tag(i.edit, 'mgx-edit', `<span>${I.pencil}<b>${esc(i.edit.label || 'Modifica')}</b></span>`, ` aria-label="${esc(i.edit.ariaLabel || 'Modifica ' + (i.society ? 'la società' : 'la squadra'))}"`) : '';
    return `<div class="mgx-intro mgx-o-intro">
    ${i.back ? tag(i.back, 'mgx-back', `${I.left}<span>${esc(i.back.label)}</span>`) : ''}
    ${i.kicker ? `<span class="mgx-kick">${esc(i.kicker)}</span>` : ''}
    <div class="mgx-name">${mark}<h1>${esc(i.title)}</h1>${edit}</div>
    ${i.place ? `<p class="mgx-place">${I.pin}<span>${esc(i.place)}</span></p>` : ''}
    ${(i.actions || []).length ? `<div class="mgx-acts">${i.actions.map(a => btn(a)).join('')}</div>` : ''}
  </div>`;
  }

  /* ---------- da sistemare ---------- */
  function todo(t) {
    const items = (t && t.items) || [];
    if (!items.length) return `<div class="mgx-todo mgx-o-todo"><div class="mgx-todo-h"><b class="mgx-todo-t mgx-todo-t--ok">Tutto in regola</b></div></div>`;
    const li = items.map(x => tag(x, 'mgx-todo-i', `${st(x.state || 'warn', '')}<span class="mgx-grow">${rich(x.text)}</span>${chev()}`)).join('');
    /* SP-IN (Diego, 2026-10-21): l'elenco scorre dentro un'altezza massima (quella del nome, la imposta l'app con
       --mgx-todo-max) e lo dice: ombre ai bordi e la scritta "Scorri per vedere le altre" finché non si arriva in fondo */
    return `<div class="mgx-todo mgx-o-todo"><div class="mgx-todo-h"><b class="mgx-todo-t">${esc((t && t.title) || 'Da sistemare')}</b><span>${items.length} ${items.length === 1 ? 'cosa' : 'cose'}</span></div><div class="mgx-todo-l" tabindex="0" aria-label="${esc((t && t.title) || 'Da sistemare')}: ${items.length} ${items.length === 1 ? 'cosa' : 'cose'}">${li}</div><span class="mgx-todo-more" aria-hidden="true">Scorri per vedere le altre ↓</span></div>`;
  }

  /* ---------- squadra: atleti ----------
     Atleta = { num, name, role?, card: { number } | { pending: true }, medical: { state: 'ok'|'warn'|'crit', date },
                release: 'ok' | 'todo', href|attrs }
     Un solo markup: tabella da 900px, elenco sotto. */
  function medTxt(m) {
    if (!m) return ['mut', '—', ''];
    if (m.state === 'crit') return ['crit', m.text || `scaduta il ${m.date}`, ''];
    if (m.state === 'warn') return ['warn', m.text || `scade il ${m.date}`, ''];
    return ['ok', 'Valida', m.date ? `fino al ${m.date}` : ''];
  }
  /* SP-IN (2026-10-21): card.text per gli stati diversi dall'ordine in corso (es. "Non tesserato") */
  function cardCell(a) {
    return a.card && a.card.number ? `<span class="mgx-mono-t">${esc(a.card.number)}</span>` : st(a.card && a.card.state || 'warn', a.card && a.card.text || 'Ordine in corso');
  }
  function athletes(list, color) {
    list = list || [];
    if (!list.length) return '<div class="mgx-empty">Nessun atleta nella rosa.</div>';
    const role = a => a.role != null ? a.role : Math.floor(Number(a.num) / 10);
    const rows = list.map(a => {
      const [mk, mt, ms] = medTxt(a.medical);
      const link = a.href || a.attrs ? tag(a, 'mgx-rowlink', `<span class="mgx-sr">Apri ${esc(a.name)}</span>${I.chev}`) : '';
      return `<tr><td><b class="mgx-num">${esc(a.num)}</b></td><td><b>${esc(a.name)}</b></td><td class="mgx-mut">Ruolo ${esc(role(a))}</td><td>${cardCell(a)}</td>
        <td>${st(mk, mt)}${ms ? `<small class="mgx-sub">${esc(ms)}</small>` : ''}</td><td>${a.release === 'ok' ? st('ok', 'Firmata') : st('warn', 'Da caricare')}</td><td class="mgx-r">${link}</td></tr>`;
    }).join('');
    const items = list.map(a => {
      const [mk, mt] = medTxt(a.medical), iss = [];
      if (!(a.card && a.card.number)) iss.push(st(a.card && a.card.state || 'warn', a.card && a.card.text ? 'Tessera: ' + a.card.text.toLowerCase() : 'Tessera in ordine'));
      if (mk === 'warn' || mk === 'crit') iss.push(st(mk, 'Visita ' + mt));
      if (a.release !== 'ok') iss.push(st('warn', 'Liberatoria da caricare'));
      const inner = `<b class="mgx-num">${esc(a.num)}</b><span class="mgx-grow mgx-col">
          <b>${esc(a.name)} <small class="mgx-mut">· Ruolo ${esc(role(a))}</small></b>
          ${a.card && a.card.number ? `<small class="mgx-mut">Tessera <span class="mgx-mono-t">${esc(a.card.number)}</span></small>` : ''}
          ${iss.length ? `<span class="mgx-iss">${iss.join('')}</span>` : st('ok', 'Documenti in regola')}</span>${chev()}`;
      return a.href || a.attrs ? tag(a, 'mgx-li', inner) : `<div class="mgx-li">${inner}</div>`;
    }).join('');
    return `<div class="mgx-ath" style="--c:${esc(color || INK)}">
    <table class="mgx-tbl mgx-wide"><thead><tr><th>#</th><th>Atleta</th><th>Ruolo</th><th>Tessera</th><th>Visita medica</th><th>Liberatoria</th><th><span class="mgx-sr">Apri</span></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="mgx-narrow">${items}</div>
  </div>`;
  }

  /* ---------- squadra: staff ----------
     Persona = { role, name, card?: '2026/003118', note?: { state: 'ok'|'warn'|'crit'|'mut', text } } */
  function staff(list) {
    list = list || [];
    if (!list.length) return '<div class="mgx-empty">Nessuno nello staff.</div>';
    return list.map(p => {
      const right = p.card ? `<span class="mgx-tess"><small>Tessera</small><span class="mgx-mono-t">${esc(p.card)}</span></span>`
        : p.note ? (p.note.state && p.note.state !== 'mut' ? st(p.note.state, p.note.text) : `<small class="mgx-mut">${esc(p.note.text)}</small>`) : '';
      /* SP-IN (2026-10-21): una persona con href o attrs è toccabile (team manager: inviti e uscita) */
      const inner = `<span class="mgx-stf-r">${esc(p.role)}</span><b class="mgx-stf-n">${esc(p.name)}</b><span class="mgx-stf-x">${right}</span>`;
      return p.href || p.attrs ? tag(p, 'mgx-stf mgx-stf--lk', inner + chev()) : `<div class="mgx-stf">${inner}</div>`;
    }).join('');
  }

  /* ---------- squadra: statistiche ----------
     st = { games: { league, other, all }, team: Valori, roles: { 1: Valori, …, 5: Valori } }
     Valori = { ppgOther, ppgLeague, q: [q1, q2, q3, q4], total, pct3, fouls, illegal, unsport, tech }
     ppgOther = punti medi a partita non di campionato; illegal/unsport/tech = percentuali medie per partita di
     campionato di difese illegali, falli antisportivi e falli tecnici. Un valore mancante si mostra "—". */
  function statRows(g) {
    g = g || {};
    return [
      ['Punti', 'Punti medi a partita', 'non di campionato', v => dec(v.ppgOther), g.other],
      ['Punti', 'Punti medi a partita', 'di campionato', v => dec(v.ppgLeague), g.league],
      ['Punti', 'Punti medi', '1° quarto', v => dec((v.q || [])[0]), g.all, 'q'],
      ['Punti', 'Punti medi', '2° quarto', v => dec((v.q || [])[1]), g.all, 'q'],
      ['Punti', 'Punti medi', '3° quarto', v => dec((v.q || [])[2]), g.all, 'q'],
      ['Punti', 'Punti medi', '4° quarto', v => dec((v.q || [])[3]), g.all, 'q'],
      ['Punti', 'Punti totali realizzati', '', v => int(v.total)],
      ['Tiro', 'Canestri da 3', 'sul totale dei canestri realizzati', v => pct(v.pct3)],
      ['Falli', 'Falli medi a partita', '', v => dec(v.fouls), g.all],
      ['Falli', 'Difese illegali', 'sul totale dei falli, partite di campionato', v => pct(v.illegal), g.league],
      ['Falli', 'Falli antisportivi', 'sul totale dei falli, partite di campionato', v => pct(v.unsport), g.league],
      ['Falli', 'Falli tecnici', 'sul totale dei falli, partite di campionato', v => pct(v.tech), g.league]
    ];
  }
  function stats(s) {
    s = s || {};
    const T = s.team || {}, R = s.roles || {}, rows = statRows(s.games);
    let tb = '', grp = null;
    rows.forEach(([gr, lab, det, f, n]) => {
      if (gr !== grp) { grp = gr; tb += `<tr class="mgx-grp"><th colspan="7" scope="colgroup">${esc(gr)}</th></tr>`; }
      tb += `<tr><th scope="row">${esc(lab)}${det ? ` <small class="mgx-mut">· ${esc(det)}</small>` : ''}${games(n)}</th><td class="mgx-team">${f(T)}</td>${[1, 2, 3, 4, 5].map(r => `<td>${f(R[r] || {})}</td>`).join('')}</tr>`;
    });
    let li = ''; grp = null;
    rows.forEach(([gr, lab, det, f, n, kind], i) => {
      if (gr !== grp) { grp = gr; li += `<div class="mgx-st-g">${esc(gr)}</div>`; }
      if (kind === 'q') {
        if (det.startsWith('1')) {
          li += `<div class="mgx-st-r mgx-st-r--q"><span class="mgx-mut">Punti medi per quarto${games(n)}</span><div class="mgx-qs">${[0, 1, 2, 3].map(k => `<span><small>${k + 1}° quarto</small><b>${dec((T.q || [])[k])}</b></span>`).join('')}</div></div>`;
        }
        return;
      }
      li += `<div class="mgx-st-r"><span class="mgx-mut">${esc(lab)}${det ? `<br><small>${esc(det)}</small>` : ''}${games(n)}</span><b>${f(T)}</b></div>`;
    });
    return `<div class="mgx-stats">
    <table class="mgx-tbl mgx-stbl mgx-wide"><thead><tr><th><span class="mgx-sr">Statistica</span></th><th class="mgx-team">Squadra</th>${[1, 2, 3, 4, 5].map(r => `<th>Ruolo ${r}</th>`).join('')}</tr></thead><tbody>${tb}</tbody></table>
    <div class="mgx-narrow">${li}<small class="mgx-note">${esc(s.narrowNote || 'Le statistiche per ruolo sono nella vista PC.')}</small></div>
  </div>`;
  }

  /* ---------- squadra: eventi con convocazione ----------
     Evento = { home: Team, away: Team, day, time, comp, href|attrs,
                conv: { state: 'ok'|'warn'|'crit', label, sub, action: { label, primary?, href|attrs } } } */
  function bug(H, A, time) {
    const hc = H.color || INK, ac = A.color || INK;
    return `<span class="mgx-bug" aria-hidden="true"><span style="--x:${esc(hc)};--x-on:${onColor(hc)}"><b>${esc(abbr(H))}</b></span><span class="mgx-bug-m"><b>${esc(time || '—')}</b></span><span style="--x:${esc(ac)};--x-on:${onColor(ac)}"><b>${esc(abbr(A))}</b></span></span>`;
  }
  function events(list) {
    list = list || [];
    if (!list.length) return '<div class="mgx-empty">Nessun evento in programma.</div>';
    return list.map(e => {
      const H = e.home || {}, A = e.away || {}, title = `${H.short || H.name || ''} – ${A.short || A.name || ''}`;
      const cv = e.conv;
      const head = tag(e, 'mgx-ev-a', `${bug(H, A, e.time)}<span class="mgx-col mgx-min"><b>${esc(title)}</b><small class="mgx-mut mgx-ell">${esc([e.day, e.comp].filter(Boolean).join(' · '))}</small></span>`, ` aria-label="${esc(`${title}, ${e.day || ''} ore ${e.time || ''}`)}"`);
      return `<div class="mgx-ev">${head}${cv ? `<div class="mgx-ev-c"><span class="mgx-col">${st(cv.state || 'warn', cv.label)}${cv.sub ? `<small class="mgx-mut">${esc(cv.sub)}</small>` : ''}</span>${btn(cv.action, true)}</div>` : ''}</div>`;
    }).join('');
  }

  /* ---------- società: documenti ----------
     Documento = { name, state: 'ok'|'warn'|'crit', sub, action: { label, icon?, primary?, href|attrs } } */
  function docs(list) {
    return (list || []).map(d => `<div class="mgx-doc"><span class="mgx-col mgx-min"><b>${esc(d.name)}</b>${d.state === 'ok' ? `<small class="mgx-mut">${esc(d.sub || '')}</small>` : st(d.state, d.sub)}</span>
      <span class="mgx-doc-a">${d.state === 'ok' ? `<span class="mgx-wide">${st('ok', 'In regola')}</span>` : ''}${btn(d.action, true)}</span></div>`).join('') || '<div class="mgx-empty">Nessun documento.</div>';
  }

  /* ---------- società: affiliazioni ----------
     Affiliazione = { name, season, state: 'ok'|'warn'|'crit', stateLabel, steps: [{ label, date, done }],
                      facts: [{ value, label }], notes: [{ state, text }] } */
  function affiliations(list) {
    return (list || []).map(a => `<div class="mgx-aff">
      ${(h => a.href || a.attrs ? tag(a, 'mgx-aff-h mgx-aff-h--lk', h + chev()) : `<div class="mgx-aff-h">${h}</div>`)(`<span class="mgx-col"><b class="mgx-aff-n">${esc(a.name)}</b>${a.season ? `<small class="mgx-mut">${esc(a.season)}</small>` : ''}</span>${st(a.state || 'ok', a.stateLabel || 'Attiva')}`)}
      ${(a.steps || []).length ? `<div class="mgx-steps">${a.steps.map(s => `<span class="mgx-step${s.done ? ' is-done' : ''}"><span class="mgx-step-i">${s.done ? `<span>${I.ok}</span>` : ''}</span><span>${esc(s.label)}${s.date ? ` <span class="mgx-mut">· ${esc(s.date)}</span>` : ''}</span></span>`).join('')}</div>` : ''}
      ${(a.facts || []).length || (a.notes || []).length ? `<div class="mgx-facts">${(a.facts || []).map(f => `<span><b class="mgx-mono-t">${esc(f.value)}</b> <span class="mgx-mut">${esc(f.label)}</span></span>`).join('')}${(a.notes || []).map(n => st(n.state, n.text)).join('')}</div>` : ''}
    </div>`).join('') || '<div class="mgx-empty">Nessuna affiliazione.</div>';
  }

  /* ---------- società: squadre (righe compatte che aprono la pagina della squadra) ----------
     Riga = { team: Team, athletes, ok, href|attrs } */
  function teams(list) {
    return (list || []).map(r => {
      const t = r.team || {}, full = r.ok === r.athletes;
      return tag(r, 'mgx-tm', `${crest(t, 'mgx-crest mgx-crest--sm')}<b class="mgx-grow mgx-ell">${esc(t.name)} <small class="mgx-mut">· ${esc(r.athletes)} atleti</small></b>${st(full ? 'ok' : 'warn', `${r.ok}/${r.athletes} in regola`)}${chev()}`);
    }).join('') || '<div class="mgx-empty">Nessuna squadra registrata.</div>';
  }

  /* ---------- società: documenti degli atleti ----------
     a = { summary: [{ label, done, total, issues: [{ state, text }] }], issues: [{ num, name, team: Team, state, text, href|attrs }] } */
  function athleteDocs(a) {
    a = a || {};
    const sums = (a.summary || []).map(s => {
      const p = s.total ? Math.round(s.done / s.total * 100) : 0;
      return `<div class="mgx-sum"><span class="mgx-sum-h"><span class="mgx-mut">${esc(s.label)}</span><b class="mgx-mono-t">${esc(s.done)}<small>/${esc(s.total)}</small></b></span>
        <span class="mgx-bar" role="img" aria-label="${esc(`${s.done} su ${s.total}`)}"><span style="width:${p}%"></span></span><span class="mgx-iss">${(s.issues || []).map(x => st(x.state, x.text)).join('')}</span></div>`;
    }).join('');
    const iss = a.issues || [];
    const rows = iss.map(x => tag(x, 'mgx-ai', `<b class="mgx-num" style="--c:${esc((x.team || {}).color || INK)}">${esc(x.num)}</b><span class="mgx-col mgx-min"><b>${esc(x.name)} <small class="mgx-mut">· ${esc((x.team || {}).short || (x.team || {}).name || '')}</small></b>${st(x.state, x.text)}</span>${chev()}`)).join('');
    return `<div class="mgx-sums">${sums}</div>${iss.length ? `<div class="mgx-col"><span class="mgx-lab">${esc(a.issuesTitle || 'Atleti da sistemare')} · ${iss.length}</span>${rows}</div>` : ''}`;
  }

  /* ---------- pagine ----------
     Due colonne da 900px: [intestazione | Da sistemare], poi [colonna principale | colonna laterale] che partono alla
     stessa altezza. Sotto i 900px le colonne si sciolgono (display: contents) e l'ordine delle sezioni è quello del
     telefono (classi mgx-o-*). */
  function page(kind, d, main, side) {
    const c = d.color || (d.team && d.team.color) || INK;
    return `<div class="mgx mgx--${kind}" style="--c:${esc(c)};--c-on:${onColor(c)}">
  <div class="mgx-grid">
    ${main.intro}${main.todo}
    <div class="mgx-main">${main.cols.join('')}</div>
    <div class="mgx-side">${side.join('')}</div>
  </div>
</div>`;
  }

  /* d = { team: Team, kicker, back, place, edit, actions: [btn], todo: { items }, athletes: [], staff: [], stats, events: [],
         extras?: { athletes, staff, events } (testi accanto ai titoli, solo su PC), actionsAthletes?, actionsStaff? } */
  function teamPage(d) {
    d = d || {};
    const t = d.team || {}, c = t.color || INK, x = d.extras || {};
    const i = intro({ team: t, title: t.name, kicker: d.kicker, back: d.back, place: d.place, edit: d.edit, actions: d.actions });
    const ath = sec({ key: 'ath', title: 'Atleti', extra: x.athletes, extraWide: true, action: d.addAthlete, inner: athletes(d.athletes, c) });
    const stf = sec({ key: 'stf', title: 'Staff', extra: x.staff, extraWide: true, action: d.addStaff, inner: staff(d.staff) });
    const sts = sec({ key: 'sts', title: 'Statistiche', extra: 'squadra e per ruolo', extraWide: true, extraNarrow: 'della squadra', inner: stats(d.stats) });
    const evs = sec({ key: 'evs', title: 'Eventi', extra: x.events, extraWide: true, inner: events(d.events) });
    return page('team', { color: c }, { intro: i, todo: todo(d.todo), cols: [ath, sts] }, [stf, evs]);
  }

  /* d = { society: { name, monogram?, color }, kicker, back, edit, actions: [btn], todo: { items }, docs: [], affiliations: [],
         teams: [], athleteDocs, extras?: { docs, affiliations, teams, athleteDocs }, addAffiliation?, addTeam? } */
  function societyPage(d) {
    d = d || {};
    const s = d.society || {}, c = s.color || INK, x = d.extras || {};
    const i = intro({ society: true, title: s.name, monogram: s.monogram, color: c, kicker: d.kicker, back: d.back, edit: d.edit, actions: d.actions });
    const dc = sec({ key: 'doc', title: 'Documenti della società', extra: x.docs, inner: docs(d.docs) });
    const af = sec({ key: 'aff', title: 'Affiliazioni', extra: x.affiliations, action: d.addAffiliation, inner: affiliations(d.affiliations) });
    const tm = sec({ key: 'tms', title: 'Squadre', extra: x.teams, action: d.addTeam, inner: teams(d.teams) });
    const ad = sec({ key: 'ads', title: 'Documenti degli atleti', extra: x.athleteDocs, inner: athleteDocs(d.athleteDocs) });
    return page('society', { color: c }, { intro: i, todo: todo(d.todo), cols: [dc, af, ad] }, [tm]);
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.manage = { teamPage, societyPage, intro, todo, section: sec, athletes, staff, stats, events, docs, affiliations, teams, athleteDocs, onColor };
})();
