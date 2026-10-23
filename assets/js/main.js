/* Estima Odontologia — interações */
(() => {
  'use strict';

  const CONFIG = {
    // Formulário: envia para o e-mail da clínica via FormSubmit (https://formsubmit.co).
    // No primeiro envio o FormSubmit manda um e-mail de ativação para este endereço.
    formEndpoint: 'https://formsubmit.co/ajax/estimaodonto20@gmail.com',
    whatsapp: '5553997006047',
  };

  document.documentElement.classList.add('js');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cabeçalho ---------- */
  const header = $('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const toggle = $('[data-menu-toggle]');
  const nav = $('#menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Link ativo no menu ---------- */
  const navLinks = $$('.nav a[href^="#"]:not(.btn)');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

  /* ---------- Animações de entrada ---------- */
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Abas de tratamentos ---------- */
  const tabs = $$('[data-tabs] [role="tab"]');
  const selectTab = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in keys) {
        e.preventDefault();
        selectTab(tabs[(i + keys[e.key] + tabs.length) % tabs.length], true);
      } else if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      else if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });
  $$('[data-tab-link]').forEach((a) => a.addEventListener('click', () => {
    const tab = $(`#tab-${a.dataset.tabLink}`);
    if (tab) selectTab(tab);
  }));

  /* ---------- Comparador antes/depois ---------- */
  // Ilustrações vetoriais geradas aqui. Para usar fotos reais (com autorização do paciente),
  // preencha `before`/`after` com o caminho das imagens.
  const CASES = {
    clareamento: {
      caption: 'Clareamento supervisionado: dentes mais brancos preservando o esmalte.',
      before: null, after: null,
      smile: { before: { color: ['#d9c08a', '#c9a96a'] }, after: { color: ['#fbf9f3', '#ebe5d6'] } },
    },
    alinhamento: {
      caption: 'Ortodontia: dentes alinhados facilitam a higiene e equilibram o sorriso.',
      before: null, after: null,
      smile: {
        before: { color: ['#f1e9d6', '#ddd0b2'], misalign: true },
        after: { color: ['#f6f2e8', '#e4dbc6'] },
      },
    },
    facetas: {
      caption: 'Facetas e forma: proporção, cor e contorno em harmonia.',
      before: null, after: null,
      smile: {
        before: { color: ['#eadcb9', '#d5c191'], gaps: true },
        after: { color: ['#fbfaf5', '#ece7da'] },
      },
    },
  };

  const smileSVG = (opts, id) => {
    const cx = 400;
    const upperW = [74, 62, 54, 46, 40];
    const lowerW = [44, 42, 44, 44, 40];
    const misalign = { rot: [-7, 9, -4, 6, -3, 5, -8, 4, -5, 3], dy: [6, -4, 8, 0, 3, -2, 5, 7, -3, 2], dx: [-6, 5, -3, 4, 0, -4, 6, -5, 2, 0] };
    const tooth = (x, w, yTop, yBot, k, upper) => {
      let rot = 0, dy = 0, dx = 0, gap = 0, chip = '';
      if (opts.misalign && upper) { rot = misalign.rot[k]; dy = misalign.dy[k]; dx = misalign.dx[k]; }
      if (opts.misalign && !upper) { rot = -misalign.rot[k] / 1.5; dy = misalign.dy[k] / 2; }
      if (opts.gaps && upper) {
        gap = [5, 7, 3, 2, 1, 5, 7, 3, 2, 1][k];
        if (k === 1 || k === 6) yBot -= 12; // laterais menores
        if (k === 0) chip = `<path d="M${x + w / 2 - 16} ${yBot + 2} L${x + w / 2 + 2} ${yBot - 16} L${x + w / 2 + 2} ${yBot + 2}Z" fill="#3b1519"/>`;
      }
      const left = x - w / 2 + 1 + gap + dx;
      const width = w - 2 - gap * 2;
      const h = yBot - yTop;
      const ccx = left + width / 2, ccy = yTop + h / 2 + dy;
      const fill = upper ? `url(#${id}-u)` : `url(#${id}-l)`;
      return `<g transform="rotate(${rot} ${ccx} ${ccy}) translate(0 ${dy})">
        <rect x="${left}" y="${yTop}" width="${width}" height="${h}" rx="${width * 0.3}" fill="${fill}"/>
        <rect x="${left + width * 0.22}" y="${yTop + h * 0.25}" width="${width * 0.16}" height="${h * 0.5}" rx="${width * 0.08}" fill="#fff" opacity=".28"/>
        ${chip}
      </g>`;
    };
    const row = (widths, top, bot, upper) => {
      let out = '';
      let acc = 0;
      const half = [];
      widths.forEach((w) => { half.push({ c: acc + w / 2, w }); acc += w; });
      // ordem: de fora para dentro, para os centrais ficarem por cima
      const items = [];
      half.forEach((t, i) => {
        items.push({ x: cx - t.c, w: t.w, i, k: i });
        items.push({ x: cx + t.c, w: t.w, i, k: i + 5 });
      });
      items.sort((a, b) => b.i - a.i).forEach((t) => {
        const d = t.x - cx;
        out += tooth(t.x, t.w, top(d), bot(d), t.k, upper);
      });
      return out;
    };
    const opening = 'M140 285 C 250 205, 550 205, 660 285 C 570 410, 230 410, 140 285 Z';
    return `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustração de sorriso">
      <defs>
        <radialGradient id="${id}-skin" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#e9b99a"/><stop offset="1" stop-color="#b9805f"/></radialGradient>
        <linearGradient id="${id}-lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c46f6c"/><stop offset=".5" stop-color="#a9504f"/><stop offset="1" stop-color="#c77a74"/></linearGradient>
        <linearGradient id="${id}-u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opts.color[1]}"/><stop offset=".35" stop-color="${opts.color[0]}"/><stop offset="1" stop-color="${opts.color[0]}"/></linearGradient>
        <linearGradient id="${id}-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opts.color[0]}"/><stop offset="1" stop-color="${opts.color[1]}"/></linearGradient>
        <clipPath id="${id}-m"><path d="${opening}"/></clipPath>
      </defs>
      <rect width="800" height="600" fill="url(#${id}-skin)"/>
      <path d="M88 287 C 210 150, 330 186, 400 204 C 470 186, 590 150, 712 287 C 610 500, 190 500, 88 287 Z" fill="url(#${id}-lip)"/>
      <g clip-path="url(#${id}-m)">
        <rect width="800" height="600" fill="#3b1519"/>
        <path d="M100 180 H700 V262 Q400 222 100 262 Z" fill="#d97a80"/>
        ${row(lowerW, (d) => 356 + 0.0009 * d * d, () => 470, false)}
        <rect y="350" width="800" height="40" fill="#2a0e11" opacity=".3"/>
        ${row(upperW, (d) => 228 + 0.0011 * d * d, (d) => 362 - 0.0008 * d * d, true)}
      </g>
      <path d="M260 430 C 340 458, 460 458, 540 430" stroke="#fff" stroke-opacity=".18" stroke-width="10" fill="none" stroke-linecap="round"/>
    </svg>`;
  };

  const compare = $('[data-compare]');
  if (compare) {
    const stage = $('.compare__stage', compare);
    const range = $('.compare__range', compare);
    const beforeEl = $('[data-before]', compare);
    const afterEl = $('[data-after]', compare);
    const caption = $('[data-caption]', compare);
    const setPos = (v) => stage.style.setProperty('--pos', `${v}%`);
    range.addEventListener('input', () => setPos(range.value));

    const render = (key) => {
      const c = CASES[key];
      beforeEl.innerHTML = c.before ? `<img src="${c.before}" alt="Antes">` : smileSVG(c.smile.before, `${key}-b`);
      afterEl.innerHTML = c.after ? `<img src="${c.after}" alt="Depois">` : smileSVG(c.smile.after, `${key}-a`);
      caption.textContent = c.caption;
    };

    $$('[data-cases] button').forEach((btn) => btn.addEventListener('click', () => {
      $$('[data-cases] button').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      render(btn.dataset.case);
      range.value = 50; setPos(50);
    }));
    render('clareamento');

    // Pequena demonstração do arraste quando o comparador aparece
    if (!reduceMotion) {
      const demo = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        demo.disconnect();
        const start = performance.now();
        const step = (t) => {
          const p = Math.min((t - start) / 1600, 1);
          const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
          range.value = v; setPos(v);
          if (p < 1) requestAnimationFrame(step);
        };
        setTimeout(() => requestAnimationFrame(step), 500);
      }, { threshold: 0.6 });
      demo.observe(stage);
    }
  }

  /* ---------- Formulário de lead ---------- */
  const form = $('[data-lead-form]');
  if (form) {
    const steps = $$('[data-step]', form);
    const progress = $('[data-progress]', form);
    const done = $('[data-done]', form);
    const phone = $('[data-phone]', form);
    const submitBtn = $('[data-submit]', form);

    const goTo = (n) => {
      steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
      progress.style.width = n === 1 ? '50%' : '100%';
      const first = $(`[data-step="${n}"] input:not([type="hidden"])`, form);
      if (first && n === 2) first.focus({ preventScroll: true });
    };

    // Pré-seleciona o tratamento a partir dos botões das abas
    $$('[data-pick]').forEach((btn) => btn.addEventListener('click', () => {
      const input = $(`input[name="tratamento"][value="${btn.dataset.pick}"]`, form);
      if (input) { input.checked = true; $('[data-error="step1"]', form).hidden = true; }
      goTo(1);
    }));

    // Máscara de telefone: (53) 99999-9999
    phone.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').slice(0, 11);
      let out = d;
      if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 6) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length === 11 ? 7 : 6)}-${d.slice(d.length === 11 ? 7 : 6)}`;
      phone.value = out;
    });

    const validators = {
      nome: (v) => v.trim().length >= 3,
      whatsapp: (v) => /^\d{10,11}$/.test(v.replace(/\D/g, '')),
      email: (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    };
    const checkField = (input) => {
      const ok = validators[input.name](input.value);
      const field = input.closest('.field');
      field.classList.toggle('is-invalid', !ok);
      field.classList.toggle('is-valid', ok && input.value !== '');
      return ok;
    };
    Object.keys(validators).forEach((name) => {
      const input = form.elements[name];
      input.addEventListener('blur', () => { if (input.value) checkField(input); });
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('is-invalid')) checkField(input); });
    });

    $('[data-next]', form).addEventListener('click', () => {
      const ok = !!form.querySelector('input[name="tratamento"]:checked');
      $('[data-error="step1"]', form).hidden = ok;
      if (ok) goTo(2);
    });
    $('[data-prev]', form).addEventListener('click', () => goTo(1));
    $$('input[name="tratamento"]', form).forEach((r) => r.addEventListener('change', () => { $('[data-error="step1"]', form).hidden = true; }));

    const consent = form.elements.consentimento;
    consent.addEventListener('change', () => consent.closest('.consent').classList.toggle('is-invalid', !consent.checked));

    const whatsappText = (data) => encodeURIComponent(
      `Olá! Meu nome é ${data.nome}. Tenho interesse em: ${data.tratamento}. Melhor período: ${data.periodo}.` +
      (data.mensagem ? `\n${data.mensagem}` : '')
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fieldsOk = Object.keys(validators).map((n) => checkField(form.elements[n])).every(Boolean);
      consent.closest('.consent').classList.toggle('is-invalid', !consent.checked);
      const ok = fieldsOk && consent.checked;
      $('[data-error="step2"]', form).hidden = ok;
      if (!ok) { const bad = $('.is-invalid input', form); if (bad) bad.focus(); return; }
      if (form.elements._honey.value) return; // bot

      const data = Object.fromEntries(new FormData(form));
      delete data._honey;
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      const payload = {
        _subject: `Novo agendamento pelo site: ${data.tratamento} — ${data.nome}`,
        _template: 'table',
        _captcha: 'false',
        Nome: data.nome,
        WhatsApp: data.whatsapp,
        'E-mail': data.email || '—',
        Tratamento: data.tratamento,
        'Melhor período': data.periodo,
        Mensagem: data.mensagem || '—',
        'Consentimento LGPD': 'Sim',
        Origem: window.location.href,
      };
      if (data.email) payload._replyto = data.email;

      const waLink = `https://wa.me/${CONFIG.whatsapp}?text=${whatsappText(data)}`;
      $('[data-done-wa]', form).href = waLink;

      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) === 'false') throw new Error(json.message || 'Falha no envio');
        if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { treatment: data.tratamento });
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: data.tratamento });
        steps.forEach((s) => { s.hidden = true; });
        progress.style.width = '100%';
        done.hidden = false;
        done.focus();
      } catch (err) {
        const msg = $('[data-error="step2"]', form);
        msg.innerHTML = `Não foi possível enviar agora. <a href="${waLink}" target="_blank" rel="noopener">Envie seu pedido pelo WhatsApp</a> ou ligue (53) 3224-6047.`;
        msg.hidden = false;
      } finally {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- Ano no rodapé ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
