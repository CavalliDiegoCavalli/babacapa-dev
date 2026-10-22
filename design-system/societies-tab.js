/* SP-IN · Tab "Società": le società di cui l'utente fa parte come staff (SocietiesTab)
   Script classico; usa window.SPIN.core (spin-core.js, da caricare prima). Espone window.SPIN.societiesTab:
     render(data)      → HTML dell'intero tab: titolo, "Crea una società", "Le tue società", schede, nota
     card(s)           → scheda di una società
     onColor(hex)
   Contratto dei dati: SOCIETA.md, sezione 4. Ogni link o pulsante accetta `href` oppure `attrs`.
   Decisioni (Diego, 2026-10-21): l'utente vede SOLO le società di cui fa parte (membro dello staff); niente "Segui";
   niente muro di loghi: una scheda per società, con il proprio ruolo e, per gli ASD manager, lo stato della società
   (Da sistemare, documenti della società, affiliazione, squadre, documenti degli atleti). Per gli altri ruoli dello
   staff solo le proprie squadre e chi gestisce la società. Stile coerente con le pagine di gestione (Almanacco). */
(function () {
  'use strict';
  // design system v2 (2026-10-22): utilità comuni da spin-core (window.SPIN.core, caricato prima)
  const core = window.SPIN.core, esc = core.esc, onColor = core.onColor;

  const INK = '#14202B';
  function attrs(o) { return Object.keys(o || {}).map(k => ` ${esc(k)}="${esc(o[k])}"`).join(''); }
  function initials(n) { return String(n || '').split(/\s+/).filter(w => /^[A-Za-zÀ-ÿ]/.test(w) && !/^(asd|ssd|a\.s\.d\.|s\.s\.d\.)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  function tag(o, cls, inner, extra) {
    const a = attrs(o && o.attrs) + (extra || '');
    return o && o.href ? `<a class="${cls}" href="${esc(o.href)}"${a}>${inner}</a>` : `<button type="button" class="${cls}"${a}>${inner}</button>`;
  }

  const SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const I = {
    plus: `<svg ${SV} stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>`,
    chev: `<svg ${SV}><path d="m9 18 6-6-6-6"/></svg>`,
    pin: `<svg ${SV}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
    users: `<svg ${SV}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14c2.7 0 4.5 1.9 4.5 4.8"/></svg>`,
    ok: `<svg ${SV} stroke-width="3"><path d="M5 12l5 5 9-10"/></svg>`,
    alert: `<svg ${SV} stroke-width="2.6"><path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9.5"/></svg>`
  };

  function st(kind, text) {
    const k = ['ok', 'warn', 'crit'].includes(kind) ? kind : 'mut';
    return `<span class="stx-st stx-st--${k}">${k === 'ok' ? I.ok : k === 'mut' ? '' : I.alert}${text ? `<span>${esc(text)}</span>` : ''}</span>`;
  }
  function crest(t, i) {
    const inner = t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : `<b>${esc(initials(t.short || t.name))}</b>`;
    return `<span class="stx-crest" style="--c-bg:${esc(t.logoBg || '#FFFFFF')};--c-ring:${esc(t.color || INK)};z-index:${10 - (i || 0)}" title="${esc(t.name || t.short || '')}">${inner}</span>`;
  }
  function fact(label, value, sub) {
    return `<div class="stx-fact"><span class="stx-lab">${esc(label)}</span><span class="stx-fv">${value}</span>${sub || ''}</div>`;
  }
  function frac(done, total) { return `<b class="stx-frac">${esc(done)}<small>/${esc(total)}</small></b>`; }

  /* Società = vedi SOCIETA.md, sezione 4 */
  function card(s) {
    s = s || {};
    const c = s.color || INK;
    const head = `<div class="stx-ch">
      <span class="stx-mono" aria-hidden="true"><b>${esc(s.monogram || initials(s.name))}</b></span>
      <span class="stx-ch-t">
        ${s.role ? `<span class="stx-role"><span>${I.users}${esc(s.role)}</span></span>` : ''}
        <h2>${esc(s.name)}</h2>
        ${s.city ? `<small class="stx-city">${I.pin}<span>${esc(s.city)}</span></small>` : ''}
      </span>
    </div>`;
    let body = '';
    /* SP-IN (2026-10-21): stato della società ancora in lettura (s.loading), per non mostrare "Tutto in regola" prima dei dati */
    if (s.manager && s.loading) body = `<div class="stx-todo stx-todo--wait"><span class="stx-mut">${esc(typeof s.loading === 'string' ? s.loading : 'Lettura della società…')}</span></div>`;
    else if (s.manager) {
      const t = s.todo;
      const todo = t && t.count ? tag(t, 'stx-todo', `${st('warn', '')}<span class="stx-grow"><b class="stx-todo-t">${esc(t.title || 'Da sistemare')}</b> <span class="stx-mut">· ${esc(t.count)} ${t.count === 1 ? 'cosa' : 'cose'}</span>${(t.items || []).length ? `<br><small>${t.items.map(esc).join(' · ')}</small>` : ''}</span><span class="stx-chev">${I.chev}</span>`)
        : `<div class="stx-todo stx-todo--ok">${st('ok', 'Tutto in regola')}</div>`;
      const d = s.docs || {}, a = s.affiliation, tm = s.teams || [], ad = s.athleteDocs || {};
      const pct = ad.total ? Math.round(ad.done / ad.total * 100) : 0;
      const athletes = s.athletes != null ? s.athletes : tm.reduce((n, x) => n + (x.athletes || 0), 0);
      body = `${todo}<div class="stx-facts">
        ${fact('Documenti della società', frac(d.done, d.total), d.issue ? st(d.issue.state, d.issue.text) : (d.done === d.total ? st('ok', 'In regola') : ''))}
        ${fact('Affiliazione', a ? st(a.state || 'ok', a.label) : st('warn', 'Nessuna affiliazione'), a && a.sub ? `<small class="stx-mut">${esc(a.sub)}</small>` : '')}
        ${fact('Squadre', `<span class="stx-crests">${tm.slice(0, 5).map((x, i) => crest(x.team || x, i)).join('')}</span><b class="stx-n">${tm.length}</b>`, `<small class="stx-mut">${esc(athletes)} atleti</small>`)}
        ${fact('Documenti degli atleti', frac(ad.done, ad.total), `<span class="stx-bar" role="img" aria-label="${esc(`${ad.done} su ${ad.total} in regola`)}"><span style="width:${pct}%"></span></span>`)}
      </div>`;
    } else {
      const mine = s.myTeams || [];
      body = `<div class="stx-facts stx-facts--one">
        ${fact(mine.length === 1 ? 'La tua squadra' : 'Le tue squadre', mine.map((x, i) => `<span class="stx-my">${crest(x.team, i)}<b>${esc(x.team.short || x.team.name)}</b></span>`).join('') || '<span class="stx-mut">—</span>',
          mine.length === 1 && mine[0].sub ? `<small class="stx-mut">${esc(mine[0].sub)}</small>` : '')}
        ${fact('Gestione', `<span class="stx-mut stx-txt">${esc(s.managedBy || 'Documenti, affiliazioni e squadre li curano gli ASD manager.')}</span>`)}
      </div>`;
    }
    const open = s.open ? tag(s.open, 'stx-open', `<b>${esc(s.open.label || 'Apri la società')} ›</b>`) : '';
    return `<section class="stx-card" style="--c:${esc(c)}" aria-label="${esc(s.name)}">${head}${body}${open}</section>`;
  }

  /* d = { title?, create?: { label, short, href|attrs }, sectionTitle?, sectionNote?, societies: [Società], note?, empty? } */
  function render(d) {
    d = d || {};
    const list = d.societies || [];
    const create = d.create ? tag(d.create, 'stx-create', `<span>${I.plus}<b class="stx-l">${esc(d.create.label || 'Crea una società')}</b><b class="stx-s">${esc(d.create.short || 'Crea')}</b></span>`) : '';
    const n = list.length;
    const sub = d.sectionNote != null ? d.sectionNote : `${n} · ne fai parte come staff`;
    const empty = `<div class="stx-empty">${esc(d.empty || 'Non fai parte di nessuna società. Crea la tua società sportiva oppure chiedi a un ASD manager di una società già registrata di invitarti.')}</div>`;
    return `<div class="stx">
  <div class="stx-title">${d.title === '' ? '' : `<h1>${esc(d.title || 'Società')}</h1>`}${create}</div>
  ${n ? `<div class="stx-sec"><span class="stx-tag"><b>${esc(d.sectionTitle || 'Le tue società')}</b></span><span class="stx-rule"></span><span class="stx-sec-x"><span class="stx-l">${esc(sub)}</span><span class="stx-s">${esc(n)}</span></span></div>` : ''}
  ${n ? `<div class="stx-grid">${list.map(card).join('')}</div>` : empty}
  ${n && d.note !== false ? `<p class="stx-note">${esc(d.note || 'Qui vedi solo le società di cui fai parte come staff. Per entrare in un’altra società chiedi a un suo ASD manager di invitarti.')}</p>` : ''}
</div>`;
  }

  window.SPIN = window.SPIN || {};
  window.SPIN.societiesTab = { render, card, onColor };
})();
