/* Estima Odontologia — interações (v2) */
(() => {
  'use strict';

  const CONFIG = {
    // Formulário: envia para o e-mail da clínica via FormSubmit (https://formsubmit.co).
    // No primeiro envio o FormSubmit manda um e-mail de ativação para este endereço.
    formEndpoint: 'https://formsubmit.co/ajax/estimaodonto20@gmail.com',
    whatsapp: '5553997006047',
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Cabeçalho e menu ---------- */
  const header = $('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menuBtn = $('[data-menu]');
  const nav = $('#menu');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  const navLinks = $$('.nav a[href^="#"]:not(.btn)');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* ---------- Abrir ficha de tratamento a partir de links ---------- */
  const openRecord = (id) => {
    const rec = document.getElementById(id);
    if (rec && rec.tagName === 'DETAILS') rec.open = true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#t-"]');
    if (a) openRecord(a.getAttribute('href').slice(1));
  });
  if (location.hash.startsWith('#t-')) openRecord(location.hash.slice(1));

  /* ==========================================================================
     Odontograma (notação FDI)
     ========================================================================== */
  const chartSvg = $('[data-chart-svg]');
  const chartNote = $('[data-chart-note]');
  const teeth = {}; // fdi -> { el, num, x, y, ang, w, d }

  const el = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };

  const buildArch = (svg, { cx, cy, rx, ry, upper, widths, depths }) => {
    // Pontos da semi-elipse, do lado esquerdo do observador para o direito.
    const N = 400;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = upper ? Math.PI + (Math.PI * i) / N : Math.PI - (Math.PI * i) / N;
      // Forma de U: as laterais ficam mais retas que numa semi-elipse
      const c = Math.cos(t);
      const sx = Math.sign(c) * Math.pow(Math.abs(c), 0.72);
      pts.push({ x: cx + rx * sx, y: cy + ry * Math.sin(t), t });
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const arc = cum[cum.length - 1];

    // Ordem visual: quadrante direito do paciente (à esquerda de quem olha) e depois o esquerdo.
    const qRight = upper ? 1 : 4;
    const qLeft = upper ? 2 : 3;
    const order = [];
    for (let p = 8; p >= 1; p--) order.push({ fdi: qRight * 10 + p, p });
    for (let p = 1; p <= 8; p++) order.push({ fdi: qLeft * 10 + p, p });

    const gapMM = 0.7;
    const total = order.reduce((s, o) => s + widths[o.p - 1], 0) + gapMM * order.length;
    const scale = arc / total;

    let acc = gapMM / 2;
    order.forEach(({ fdi, p }) => {
      const w = widths[p - 1] * scale;
      const d = depths[p - 1] * scale * 0.82;
      const mid = acc + widths[p - 1] / 2;
      acc += widths[p - 1] + gapMM;
      const target = mid * scale;
      let i = cum.findIndex((c) => c >= target);
      if (i < 1) i = 1;
      const pt = pts[i];
      const prev = pts[i - 1];
      const tx = pt.x - prev.x;
      const ty = pt.y - prev.y;
      const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
      const g = el('g', { transform: `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${ang.toFixed(1)})` }, svg);
      const r = p <= 2 ? Math.min(w, d) * 0.32 : p === 3 ? Math.min(w, d) * 0.48 : Math.min(w, d) * 0.3;
      const rect = el('rect', { class: 'tooth', x: (-w / 2 + 0.6).toFixed(1), y: (-d / 2).toFixed(1), width: (w - 1.2).toFixed(1), height: d.toFixed(1), rx: r.toFixed(1) }, g);
      // Número fora da arcada
      const nx = pt.x - cx;
      const ny = pt.y - cy;
      const len = Math.hypot(nx / rx, ny / ry) || 1;
      const off = d / 2 + 11;
      const ux = nx / Math.hypot(nx, ny);
      const uy = ny / Math.hypot(nx, ny);
      const num = el('text', { class: 'num', x: (pt.x + ux * off).toFixed(1), y: (pt.y + uy * off).toFixed(1) }, svg);
      num.textContent = fdi;
      teeth[fdi] = { el: rect, num, x: pt.x, y: pt.y, ux, uy, ang, w, d, len };
    });
  };

  const overlayGroup = () => {
    const old = $('.overlay', chartSvg);
    if (old) old.remove();
    return el('g', { class: 'overlay' }, chartSvg);
  };

  const MODES = {
    checkup: {
      teeth: 'all',
      note: 'Check-up: os 32 dentes avaliados um a um, com imagem ampliada e raio X periapical quando necessário.',
      link: 't-checkup',
      draw(g) {
        const line = el('line', { class: 'scan', x1: 0, y1: 22, x2: 0, y2: 418 }, g);
        if (!reduceMotion) {
          el('animateTransform', { attributeName: 'transform', type: 'translate', values: '30 0; 430 0; 30 0', dur: '5s', repeatCount: 'indefinite' }, line);
        } else {
          line.setAttribute('transform', 'translate(230 0)');
        }
      },
    },
    clinica: {
      teeth: [18, 28, 38, 48, 16, 36],
      note: 'Clínica geral: limpeza, restaurações (como nos dentes 16 e 36) e extração dos sisos (18, 28, 38 e 48).',
      link: 't-clinica',
      draw(g) {
        [16, 36].forEach((n) => { const t = teeth[n]; el('circle', { class: 'mark', cx: t.x, cy: t.y, r: 3.6 }, g); });
        [18, 28, 38, 48].forEach((n) => {
          const t = teeth[n]; const s = 5;
          el('path', { d: `M${t.x - s} ${t.y - s}L${t.x + s} ${t.y + s}M${t.x + s} ${t.y - s}L${t.x - s} ${t.y + s}`, class: 'wire' }, g);
        });
      },
    },
    implantes: {
      teeth: [25],
      implants: [24, 26, 36],
      note: 'Implantes: unitário (dente 36) ou reabilitação parcial, com 2 implantes sustentando 3 dentes (24 a 26).',
      link: 't-implantes',
      draw(g) {
        const a = teeth[24]; const b = teeth[25]; const c = teeth[26];
        const k = 1;
        el('path', { class: 'bridge', d: `M${a.x + a.ux * k} ${a.y + a.uy * k} Q${b.x + b.ux * 2} ${b.y + b.uy * 2} ${c.x + c.ux * k} ${c.y + c.uy * k}` }, g);
        [24, 26, 36].forEach((n) => {
          const t = teeth[n];
          el('circle', { class: 'mark', cx: t.x, cy: t.y, r: 4 }, g);
          el('circle', { cx: t.x, cy: t.y, r: 7.5, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 1 }, g);
        });
      },
    },
    orto: {
      teeth: [],
      note: 'Ortodontia: aparelho autoligado ou alinhadores transparentes para alinhar as duas arcadas.',
      link: 't-orto',
      draw(g) {
        const arcs = [[17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27], [47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37]];
        arcs.forEach((arc) => {
          const pts = arc.map((n) => `${teeth[n].x.toFixed(1)},${teeth[n].y.toFixed(1)}`).join(' ');
          el('polyline', { class: 'wire', points: pts }, g);
          arc.forEach((n) => {
            const t = teeth[n];
            el('rect', { class: 'mark', x: -3, y: -3, width: 6, height: 6, rx: 1, transform: `translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) rotate(${t.ang.toFixed(1)})` }, g);
          });
        });
      },
    },
    estetica: {
      teeth: [13, 12, 11, 21, 22, 23],
      note: 'Estética: facetas, clareamento e plástica gengival na região do sorriso, do dente 13 ao 23.',
      link: 't-estetica',
      draw(g) {
        const lbl = el('text', { class: 'lbl', x: 230, y: 14 }, g);
        lbl.textContent = 'ZONA DO SORRISO';
      },
    },
    canal: {
      teeth: [46],
      note: 'Canal: tratamento do dente 46 com localizador apical e limas rotatórias.',
      link: 't-canal',
      draw(g) {
        const t = teeth[46];
        [[-4, -3], [4, -3], [0, 4]].forEach(([dx, dy]) => {
          const a = (t.ang * Math.PI) / 180;
          const x = t.x + dx * Math.cos(a) - dy * Math.sin(a);
          const y = t.y + dx * Math.sin(a) + dy * Math.cos(a);
          el('circle', { class: 'mark', cx: x.toFixed(1), cy: y.toFixed(1), r: 2.2 }, g);
        });
      },
    },
  };

  const setMode = (key) => {
    const m = MODES[key];
    const on = m.teeth === 'all' ? Object.keys(teeth).map(Number) : m.teeth;
    const implants = m.implants || [];
    Object.entries(teeth).forEach(([fdi, t], i) => {
      const n = Number(fdi);
      const isOn = on.includes(n);
      t.el.classList.toggle('is-on', isOn && !implants.includes(n));
      t.el.classList.toggle('is-implant', implants.includes(n));
      t.num.classList.toggle('is-on', isOn || implants.includes(n));
      t.el.style.transitionDelay = m.teeth === 'all' && !reduceMotion ? `${(i % 16) * 22}ms` : '0ms';
    });
    m.draw(overlayGroup());
    chartNote.innerHTML = `${m.note} <a href="#${m.link}">Ver tratamento</a>`;
    $$('.chart__modes button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === key)));
  };

  if (chartSvg) {
    el('line', { class: 'mid', x1: 230, y1: 24, x2: 230, y2: 416 }, chartSvg);
    el('line', { class: 'mid', x1: 40, y1: 220, x2: 420, y2: 220 }, chartSvg);
    [['DIREITO', 22, 224], ['ESQUERDO', 438, 224]].forEach(([t, x, y]) => {
      const n = el('text', { class: 'lbl', x, y, transform: `rotate(-90 ${x} ${y})` }, chartSvg);
      n.textContent = t;
    });
    // Larguras e profundidades médias (mm) por posição: 1 = incisivo central ... 8 = terceiro molar
    buildArch(chartSvg, { cx: 230, cy: 204, rx: 132, ry: 168, upper: true, widths: [8.5, 6.5, 7.5, 7, 6.5, 10, 9, 8.5], depths: [7, 6.2, 8, 9, 9, 11, 11, 10.5] });
    buildArch(chartSvg, { cx: 230, cy: 236, rx: 124, ry: 162, upper: false, widths: [5.5, 6, 7, 7, 7, 11, 10.5, 10], depths: [6, 6.2, 7.5, 7.5, 8, 10.5, 10, 10] });
    $$('.chart__modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    const modeBtns = $$('.chart__modes button');
    modeBtns.forEach((b, i) => b.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = modeBtns[(i + dir + modeBtns.length) % modeBtns.length];
      next.focus(); setMode(next.dataset.mode);
    }));
    setMode('checkup');
  }

  /* ==========================================================================
     Comparador antes/depois — dentes anteriores em estilo de modelo de laboratório
     ========================================================================== */
  // Escala VITA (aproximação visual): cervical, corpo, incisal
  const SHADES = {
    'A3,5': ['#c49d62', '#d9bc88', '#b4b3a5'],
    A3: ['#cfae78', '#e2ca9c', '#c0c1b7'],
    A2: ['#d9c296', '#ebdec0', '#c9cfcc'],
    B1: ['#e6e0cf', '#f6f3ea', '#d3dbe1'],
  };

  const toothPath = (w, h, kind) => {
    const tip = kind === 'canine' ? h * 1.035 : h;
    const flat = kind === 'canine' ? 0.5 : 0.8;
    return [
      `M${w * 0.2} 0`,
      `C${w * 0.06} ${h * 0.14} ${w * 0.0} ${h * 0.45} ${w * 0.02} ${h * 0.78}`,
      `C${w * 0.04} ${h * 0.94} ${w * (0.5 - flat * 0.3)} ${tip} ${w * 0.5} ${tip}`,
      `C${w * (0.5 + flat * 0.3)} ${tip} ${w * 0.96} ${h * 0.94} ${w * 0.98} ${h * 0.78}`,
      `C${w} ${h * 0.45} ${w * 0.94} ${h * 0.14} ${w * 0.8} 0`,
      `Q${w * 0.5} ${-h * 0.05} ${w * 0.2} 0Z`,
    ].join(' ');
  };

  // Arco anterior: 14, 13, 12, 11, 21, 22, 23, 24
  const BASE = [
    { fdi: 14, w: 50, h: 126, top: 186, kind: 'pm' },
    { fdi: 13, w: 66, h: 158, top: 170, kind: 'canine' },
    { fdi: 12, w: 80, h: 146, top: 182, kind: 'lateral' },
    { fdi: 11, w: 106, h: 170, top: 168, kind: 'central' },
    { fdi: 21, w: 106, h: 170, top: 168, kind: 'central' },
    { fdi: 22, w: 80, h: 146, top: 182, kind: 'lateral' },
    { fdi: 23, w: 66, h: 158, top: 170, kind: 'canine' },
    { fdi: 24, w: 50, h: 126, top: 186, kind: 'pm' },
  ];

  // Incisivos e caninos inferiores, parcialmente atrás dos superiores
  const lowerSvg = (id, shade, mod = {}) => {
    const row = [
      { w: 56, h: 118, kind: 'canine' }, { w: 48, h: 112 }, { w: 44, h: 110 },
      { w: 44, h: 110 }, { w: 48, h: 112 }, { w: 56, h: 118, kind: 'canine' },
    ];
    const total = row.reduce((s, t) => s + t.w, 0);
    let x = 400 - total / 2;
    const top = 318;
    let out = '';
    let gum = `M-100 700 L-100 ${top + 150}`;
    row.forEach((t, i) => {
      const m = mod[i] || {};
      const d = toothPath(t.w, t.h, t.kind);
      // espelhado: borda incisal para cima
      out += `<g transform="translate(${(x + (m.dx || 0)).toFixed(1)} ${(top + t.h + (m.dy || 0)).toFixed(1)}) scale(1 -1) rotate(${m.rot || 0} ${t.w / 2} ${t.h / 2})">
        <path d="${d}" fill="url(#${id}-enamel)"/><path d="${d}" fill="url(#${id}-side)"/>
        <path d="${d}" fill="#0b0f20" opacity=".24"/></g>`;
      const pz = top + t.h * 0.72;
      gum += ` L${x} ${pz} Q${x + t.w / 2} ${2 * (top + t.h - 8) - pz} ${x + t.w} ${pz}`;
      x += t.w;
    });
    gum += ` L900 ${top + 150} L900 700 Z`;
    return `${out}<path d="${gum}" fill="url(#${id}-gum)" opacity=".9"/>`;
  };

  const scene = (id, opts) => {
    const shade = SHADES[opts.shade];
    const mod = opts.mod || {};
    const totalW = BASE.reduce((s, t) => s + t.w, 0);
    let x = 400 - totalW / 2;
    const items = BASE.map((t) => {
      const m = mod[t.fdi] || {};
      const w = t.w * (m.sx || 1);
      const h = t.h + (m.dh || 0);
      const it = { ...t, x: x + (t.w - w) / 2 + (m.dx || 0), y: t.top + (m.dy || 0), w, h, rot: m.rot || 0, back: !!m.back, chip: !!m.chip, z: m.z ?? ({ central: 3, lateral: 2, canine: 1, pm: 0 }[t.kind]) };
      x += t.w;
      return it;
    });

    // Gengiva: papilas entre os dentes, zênite no centro de cada dente
    let gum = `M0 0 L800 0 L800 ${items[7].y + 40}`;
    for (let i = items.length - 1; i >= 0; i--) {
      const t = items[i];
      const pR = t.y + t.h * 0.3;
      const pL = t.y + t.h * 0.3;
      const c = 2 * (t.y + 10) - (pL + pR) / 2;
      gum += ` L${t.x + t.w} ${pR} Q${t.x + t.w / 2} ${c} ${t.x} ${pL}`;
    }
    gum += ` L0 ${items[0].y + 40} Z`;

    const teethSvg = items
      .slice()
      .sort((a, b) => a.z - b.z)
      .map((t) => {
        const d = toothPath(t.w, t.h, t.kind);
        const cx = t.x + t.w / 2;
        const cy = t.y + t.h / 2;
        const shadeDim = t.kind === 'pm' || t.back ? `<path d="${d}" fill="#0b0f20" opacity="${t.kind === 'pm' ? 0.42 : 0.26}"/>` : '';
        const chip = t.chip ? `<path d="M${t.w * 0.52} ${t.h + 2} L${t.w * 0.98} ${t.h * 0.8} L${t.w} ${t.h + 2}Z" fill="#0d1124"/>` : '';
        return `<g transform="translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) rotate(${t.rot} ${(cx - t.x).toFixed(1)} ${(cy - t.y).toFixed(1)})">
          <path d="${d}" fill="url(#${id}-enamel)"/>
          <path d="${d}" fill="url(#${id}-side)"/>
          <ellipse cx="${t.w * 0.42}" cy="${t.h * 0.45}" rx="${t.w * 0.12}" ry="${t.h * 0.24}" fill="#fff" opacity=".22"/>
          ${shadeDim}${chip}
        </g>`;
      })
      .join('');

    return `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="${NS}" role="img" aria-label="Ilustração dos dentes anteriores">
      <defs>
        <radialGradient id="${id}-bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#1c2246"/><stop offset="1" stop-color="#090c1b"/></radialGradient>
        <linearGradient id="${id}-enamel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${shade[0]}"/><stop offset=".42" stop-color="${shade[1]}"/>
          <stop offset=".8" stop-color="${shade[1]}"/><stop offset="1" stop-color="${shade[2]}"/>
        </linearGradient>
        <linearGradient id="${id}-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".22" stop-color="#000" stop-opacity="0"/>
          <stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
        </linearGradient>
        <linearGradient id="${id}-gum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3f4b"/><stop offset="1" stop-color="#c98a8f"/></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#${id}-bg)"/>
      <g transform="translate(400 318) scale(1.22) translate(-400 -268)">
        ${lowerSvg(id, shade, opts.lowerMod)}
        ${teethSvg}
        <path d="${gum}" fill="url(#${id}-gum)"/>
        <path d="${gum}" fill="none" stroke="#e3b3b5" stroke-opacity=".35" stroke-width="2"/>
      </g>
    </svg>`;
  };

  const CASES = {
    clareamento: {
      tags: ['Antes · A3,5', 'Depois · B1'],
      caption: 'Clareamento supervisionado: dentes mais brancos, com segurança para o esmalte.',
      before: { shade: 'A3,5' },
      after: { shade: 'B1' },
    },
    alinhamento: {
      tags: ['Antes', 'Depois'],
      caption: 'Ortodontia: dentes alinhados facilitam a higiene e equilibram o sorriso.',
      before: {
        shade: 'A2',
        mod: {
          13: { dy: -26, dx: 10, rot: 6, z: 4 },
          12: { rot: -12, dx: 18, dy: 6, back: true, z: 0 },
          11: { rot: 5, dx: 6 },
          21: { rot: -4, dy: 8, dx: -4, z: 4 },
          22: { rot: 10, dx: -14, back: true, z: 0 },
          23: { dy: -12, rot: -5 },
        },
        lowerMod: { 1: { rot: 8, dx: 6 }, 2: { rot: -6, dy: -6 }, 3: { rot: 7, dx: -4 }, 4: { rot: -9, dx: -6 } },
      },
      after: { shade: 'A2' },
    },
    facetas: {
      tags: ['Antes · A3', 'Depois · B1'],
      caption: 'Facetas: forma, proporção e cor em harmonia com o rosto.',
      before: {
        shade: 'A3',
        mod: {
          11: { dx: -12, dh: -12, sx: .94 },
          21: { dx: 12, dh: -8, sx: .94, chip: true },
          12: { sx: .78, dh: -24, dx: -6 },
          22: { sx: .78, dh: -22, dx: 6 },
          13: { dx: -8 },
          23: { dx: 8 },
        },
      },
      after: { shade: 'B1' },
    },
  };
  // Para usar fotos reais (com autorização por escrito do paciente), defina
  // CASES.<caso>.beforeImg / afterImg com o caminho das imagens.

  const compare = $('[data-compare]');
  if (compare) {
    const stage = $('[data-stage]', compare);
    const range = $('#compare-range');
    const setPos = (v) => stage.style.setProperty('--pos', `${v}%`);
    range.addEventListener('input', () => setPos(range.value));

    const render = (key) => {
      const c = CASES[key];
      $('[data-before]', compare).innerHTML = c.beforeImg ? `<img src="${c.beforeImg}" alt="Antes">` : scene(`${key}-b`, c.before);
      $('[data-after]', compare).innerHTML = c.afterImg ? `<img src="${c.afterImg}" alt="Depois">` : scene(`${key}-a`, c.after);
      $('[data-tag-before]', compare).textContent = c.tags[0];
      $('[data-tag-after]', compare).textContent = c.tags[1];
      $('[data-caption]', compare).textContent = c.caption;
    };
    const caseBtns = $$('[data-cases] button');
    caseBtns.forEach((b) => b.addEventListener('click', () => {
      caseBtns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      render(b.dataset.case);
      range.value = 50; setPos(50);
    }));
    render('clareamento');
  }

  /* ==========================================================================
     Formulário de agendamento
     ========================================================================== */
  const form = $('[data-form]');
  if (form) {
    const steps = $$('[data-step]', form);
    const bar = $('[data-progress]', form);
    const done = $('[data-done]', form);
    const phone = $('[data-phone]', form);
    const submit = $('[data-submit]', form);
    const err1 = $('[data-err="1"]', form);
    const err2 = $('[data-err="2"]', form);
    const consent = form.elements.consentimento;

    const goTo = (n) => {
      steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
      bar.style.width = n === 1 ? '50%' : '100%';
      if (n === 2) form.elements.nome.focus({ preventScroll: true });
    };

    $$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      const input = $(`input[name="tratamento"][value="${b.dataset.pick}"]`, form);
      if (input) { input.checked = true; err1.hidden = true; }
      goTo(1);
    }));

    phone.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').slice(0, 11);
      const cut = d.length === 11 ? 7 : 6;
      phone.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, cut)}-${d.slice(cut)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    });

    const rules = {
      nome: (v) => v.trim().length >= 3,
      whatsapp: (v) => /^\d{10,11}$/.test(v.replace(/\D/g, '')),
      email: (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    };
    const check = (input) => {
      const ok = rules[input.name](input.value);
      input.closest('.field').classList.toggle('is-invalid', !ok);
      return ok;
    };
    Object.keys(rules).forEach((n) => {
      const input = form.elements[n];
      input.addEventListener('blur', () => { if (input.value) check(input); });
      input.addEventListener('input', () => { if (input.closest('.is-invalid')) check(input); });
    });

    $('[data-next]', form).addEventListener('click', () => {
      const ok = !!$('input[name="tratamento"]:checked', form);
      err1.hidden = ok;
      if (ok) goTo(2);
    });
    $('[data-prev]', form).addEventListener('click', () => goTo(1));
    $$('input[name="tratamento"]', form).forEach((r) => r.addEventListener('change', () => { err1.hidden = true; }));
    consent.addEventListener('change', () => consent.closest('.consent').classList.toggle('is-invalid', !consent.checked));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fieldsOk = Object.keys(rules).map((n) => check(form.elements[n])).every(Boolean);
      consent.closest('.consent').classList.toggle('is-invalid', !consent.checked);
      const ok = fieldsOk && consent.checked;
      err2.textContent = 'Confira os campos destacados.';
      err2.hidden = ok;
      if (!ok) { const bad = $('.is-invalid input', form); if (bad) bad.focus(); return; }
      if (form.elements._honey.value) return;

      const data = Object.fromEntries(new FormData(form));
      const waText = encodeURIComponent(`Olá! Meu nome é ${data.nome}. Tenho interesse em: ${data.tratamento}. Melhor período: ${data.periodo}.${data.mensagem ? `\n${data.mensagem}` : ''}`);
      const waLink = `https://wa.me/${CONFIG.whatsapp}?text=${waText}`;
      $('[data-done-wa]', form).href = waLink;

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
        Origem: location.href,
      };
      if (data.email) payload._replyto = data.email;

      submit.classList.add('is-loading');
      submit.disabled = true;
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
        bar.style.width = '100%';
        done.hidden = false;
        done.focus();
      } catch {
        err2.innerHTML = `Não conseguimos enviar agora. <a href="${waLink}" target="_blank" rel="noopener">Envie pelo WhatsApp</a> ou ligue para (53) 3224-6047.`;
        err2.hidden = false;
      } finally {
        submit.classList.remove('is-loading');
        submit.disabled = false;
      }
    });
  }

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
