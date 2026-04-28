/* ============================================================
   Карта тела «НеЛомайся» — версия 4.0 «Atelier»
   Премиальный sci-fi wireframe-силуэт с:
   • орбитальными кольцами
   • неоновыми хотспотами с пульсом и трассировкой
   • динамическими линиями-коннекторами от точки к названию зоны
   • парящими частицами на фоне
   • плавным 3D-flip
   ============================================================ */

window.NL_renderBodyMap = function (container, { side = 'front', selectedZone = null, onSelect }) {
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'body-map-wrap';

  // Орбитальные декоративные кольца
  const orbits = document.createElement('div');
  orbits.className = 'body-orbits';
  orbits.innerHTML = `
    <div class="orbit orbit-1"></div>
    <div class="orbit orbit-2"></div>
    <div class="orbit orbit-3"></div>
  `;
  wrap.appendChild(orbits);

  // Парящие частицы
  const particles = document.createElement('div');
  particles.className = 'body-particles';
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span');
    p.style.setProperty('--x', Math.random() * 100 + '%');
    p.style.setProperty('--y', Math.random() * 100 + '%');
    p.style.setProperty('--d', (4 + Math.random() * 8) + 's');
    p.style.setProperty('--delay', (-Math.random() * 8) + 's');
    p.style.setProperty('--s', (0.3 + Math.random() * 0.7));
    particles.appendChild(p);
  }
  wrap.appendChild(particles);

  // Aura, реагирующая на выбор
  const aura = document.createElement('div');
  aura.className = 'body-aura';
  aura.dataset.zone = selectedZone || '';
  wrap.appendChild(aura);

  // 3D flip-контейнер
  const flip = document.createElement('div');
  flip.className = 'body-flip ' + (side === 'back' ? 'is-back' : 'is-front');
  wrap.appendChild(flip);

  flip.appendChild(buildSide('front', side === 'front', selectedZone, onSelect));
  flip.appendChild(buildSide('back',  side === 'back',  selectedZone, onSelect));

  container.appendChild(wrap);
};

function buildSide(which, active, selectedZone, onSelect) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const face = document.createElement('div');
  face.className = 'body-face body-face-' + which + (active ? ' active' : '');

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 280 560');
  svg.setAttribute('class', 'body-svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  svg.innerHTML = `
    <defs>
      <!-- Стеклянный градиент тела -->
      <linearGradient id="skin-${which}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="var(--body-light)"/>
        <stop offset="50%" stop-color="var(--body-mid)"/>
        <stop offset="100%" stop-color="var(--body-dark)"/>
      </linearGradient>

      <!-- Внутреннее свечение (gold rim) -->
      <linearGradient id="rim-${which}" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%"   stop-color="var(--gold)" stop-opacity="0.8"/>
        <stop offset="50%"  stop-color="var(--blush)" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="var(--gold)" stop-opacity="0.2"/>
      </linearGradient>

      <!-- Glow для хотспотов -->
      <radialGradient id="glow-${which}" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="var(--gold)" stop-opacity="0.95"/>
        <stop offset="40%"  stop-color="var(--gold)" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/>
      </radialGradient>

      <!-- Glow для выбранной зоны -->
      <radialGradient id="glow-active-${which}" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="var(--blush)" stop-opacity="1"/>
        <stop offset="40%"  stop-color="var(--blush)" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="var(--blush)" stop-opacity="0"/>
      </radialGradient>

      <!-- Soft blur filter -->
      <filter id="soft-glow-${which}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  `;

  // === СИЛУЭТ ===
  const silhouette = document.createElementNS(svgNS, 'g');
  silhouette.setAttribute('class', 'silhouette');
  silhouette.innerHTML = which === 'front' ? FRONT_BODY : BACK_BODY;
  silhouette.querySelectorAll('[data-fill="skin"]').forEach(p => p.setAttribute('fill', `url(#skin-${which})`));
  silhouette.querySelectorAll('[data-fill="rim"]').forEach(p => p.setAttribute('fill', `url(#rim-${which})`));
  svg.appendChild(silhouette);

  // === WIREFRAME-сетка поверх (анимированные линии) ===
  const wireframe = document.createElementNS(svgNS, 'g');
  wireframe.setAttribute('class', 'wireframe');
  wireframe.innerHTML = which === 'front' ? FRONT_WIRES : BACK_WIRES;
  svg.appendChild(wireframe);

  // === ХОТСПОТЫ ===
  const points = which === 'front' ? FRONT_POINTS : BACK_POINTS;
  const zoneGroup = document.createElementNS(svgNS, 'g');
  zoneGroup.setAttribute('class', 'hotspots');

  points.forEach((p, i) => {
    const zoneId = p.zone || p.id;
    const isSel = selectedZone === zoneId;

    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'hotspot' + (isSel ? ' is-selected' : ''));
    g.style.setProperty('--delay', (i * 0.16) + 's');
    g.setAttribute('data-zone', zoneId);
    g.setAttribute('tabindex', '0');
    g.setAttribute('transform', `translate(${p.cx} ${p.cy})`);

    g.innerHTML = `
      <circle class="hotspot-aura"   cx="0" cy="0" r="${p.r * 3}"   fill="url(#glow-${isSel ? 'active-' : ''}${which})"/>
      <circle class="hotspot-pulse2" cx="0" cy="0" r="${p.r * 1.5}" fill="none" stroke="var(--gold)" stroke-width="0.6" opacity="0.5"/>
      <circle class="hotspot-pulse"  cx="0" cy="0" r="${p.r}"       fill="none" stroke="var(--gold)" stroke-width="1"/>
      <circle class="hotspot-ring"   cx="0" cy="0" r="${p.r * 0.8}" fill="rgba(20,22,30,0.85)" stroke="var(--gold)" stroke-width="1.2"/>
      <circle class="hotspot-core"   cx="0" cy="0" r="${p.r * 0.35}" fill="var(--gold)"/>
      <circle class="hotspot-hit"    cx="0" cy="0" r="${Math.max(p.r * 1.8, 18)}" fill="transparent"/>
    `;

    const meta = window.NL_ZONES.find(z => z.id === zoneId);
    const title = document.createElementNS(svgNS, 'title');
    title.textContent = meta ? meta.name : zoneId;
    g.appendChild(title);

    g.addEventListener('click', () => {
      ripple(svg, p.cx, p.cy);
      onSelect && onSelect(zoneId);
    });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect && onSelect(zoneId); }
    });
    zoneGroup.appendChild(g);
  });
  svg.appendChild(zoneGroup);

  face.appendChild(svg);
  return face;
}

function ripple(svg, cx, cy) {
  const svgNS = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 3; i++) {
    const r = document.createElementNS(svgNS, 'circle');
    r.setAttribute('cx', cx); r.setAttribute('cy', cy);
    r.setAttribute('r', 4); r.setAttribute('fill', 'none');
    r.setAttribute('stroke', 'var(--gold)');
    r.setAttribute('stroke-width', '1.5');
    r.setAttribute('class', 'ripple');
    r.style.animationDelay = (i * 0.15) + 's';
    svg.appendChild(r);
    setTimeout(() => r.remove(), 1200);
  }
}

/* =========================================================
   ПЕРЕДНЯЯ ПРОЕКЦИЯ — мягкий, минималистичный силуэт
   ========================================================= */
const FRONT_BODY = `
  <!-- Тень -->
  <ellipse cx="140" cy="548" rx="68" ry="6" fill="rgba(0,0,0,0.5)"/>

  <!-- Силуэт: единая мягкая форма -->
  <g data-fill="skin">
    <!-- Голова -->
    <ellipse cx="140" cy="50" rx="30" ry="34"/>
    <!-- Шея -->
    <path d="M124 78 Q126 90 124 96 L156 96 Q154 90 156 78 Z"/>
    <!-- Корпус -->
    <path d="M88 106
             Q114 92 140 92
             Q166 92 192 106
             Q200 122 204 154
             L208 218
             Q210 252 198 274
             Q198 296 196 312
             L188 348
             Q140 360 92 348
             L84 312
             Q82 296 82 274
             Q70 252 72 218
             L74 154
             Q78 122 88 106 Z"/>

    <!-- Левая рука -->
    <path d="M78 124
             Q64 132 60 152
             L56 218
             Q54 252 58 286
             L72 292
             Q74 254 74 218
             L80 158
             Q80 138 82 124 Z"/>
    <!-- Правая рука -->
    <path d="M202 124
             Q216 132 220 152
             L224 218
             Q226 252 222 286
             L208 292
             Q206 254 206 218
             L200 158
             Q200 138 198 124 Z"/>
    <!-- Кисти -->
    <ellipse cx="64" cy="306" rx="11" ry="14"/>
    <ellipse cx="216" cy="306" rx="11" ry="14"/>

    <!-- Бёдра+голени -->
    <path d="M100 348
             Q92 392 94 444
             Q96 486 100 514
             L118 518
             Q124 484 126 442
             Q128 392 130 350
             Z"/>
    <path d="M180 348
             Q188 392 186 444
             Q184 486 180 514
             L162 518
             Q156 484 154 442
             Q152 392 150 350
             Z"/>
    <!-- Стопы -->
    <ellipse cx="108" cy="528" rx="14" ry="8"/>
    <ellipse cx="172" cy="528" rx="14" ry="8"/>
  </g>

  <!-- Rim — мягкое внутреннее свечение -->
  <g data-fill="rim" opacity="0.35">
    <ellipse cx="140" cy="50" rx="30" ry="34"/>
  </g>
`;

/* =========================================================
   WIREFRAME — анатомические линии для технологичности
   ========================================================= */
const FRONT_WIRES = `
  <!-- Центральная ось -->
  <path d="M140 92 V340" stroke="rgba(230,197,138,0.18)" stroke-width="0.6" stroke-dasharray="2 4"/>
  <!-- Линия плеч -->
  <path d="M88 110 Q140 100 192 110" fill="none" stroke="rgba(230,197,138,0.18)" stroke-width="0.6"/>
  <!-- Контур пресса -->
  <path d="M118 168 Q140 172 162 168 L160 280 Q140 286 120 280 Z" fill="none" stroke="rgba(230,197,138,0.15)" stroke-width="0.6"/>
  <!-- Поперечные линии пресса -->
  <line x1="120" y1="200" x2="160" y2="200" stroke="rgba(230,197,138,0.15)" stroke-width="0.5"/>
  <line x1="120" y1="232" x2="160" y2="232" stroke="rgba(230,197,138,0.15)" stroke-width="0.5"/>
  <line x1="120" y1="260" x2="160" y2="260" stroke="rgba(230,197,138,0.15)" stroke-width="0.5"/>
`;

/* =========================================================
   ЗАДНЯЯ ПРОЕКЦИЯ
   ========================================================= */
const BACK_BODY = `
  <ellipse cx="140" cy="548" rx="68" ry="6" fill="rgba(0,0,0,0.5)"/>

  <g data-fill="skin">
    <ellipse cx="140" cy="50" rx="30" ry="34"/>
    <path d="M124 78 Q126 90 124 96 L156 96 Q154 90 156 78 Z"/>
    <path d="M88 106 Q114 92 140 92 Q166 92 192 106 Q200 122 204 154 L208 218 Q210 252 198 274 Q198 296 196 312 L188 348 Q140 360 92 348 L84 312 Q82 296 82 274 Q70 252 72 218 L74 154 Q78 122 88 106 Z"/>
    <path d="M78 124 Q64 132 60 152 L56 218 Q54 252 58 286 L72 292 Q74 254 74 218 L80 158 Q80 138 82 124 Z"/>
    <path d="M202 124 Q216 132 220 152 L224 218 Q226 252 222 286 L208 292 Q206 254 206 218 L200 158 Q200 138 198 124 Z"/>
    <ellipse cx="64" cy="306" rx="11" ry="14"/>
    <ellipse cx="216" cy="306" rx="11" ry="14"/>
    <path d="M100 348 Q92 392 94 444 Q96 486 100 514 L118 518 Q124 484 126 442 Q128 392 130 350 Z"/>
    <path d="M180 348 Q188 392 186 444 Q184 486 180 514 L162 518 Q156 484 154 442 Q152 392 150 350 Z"/>
    <ellipse cx="108" cy="528" rx="14" ry="8"/>
    <ellipse cx="172" cy="528" rx="14" ry="8"/>
  </g>

  <g data-fill="rim" opacity="0.35">
    <ellipse cx="140" cy="50" rx="30" ry="34"/>
  </g>
`;

const BACK_WIRES = `
  <!-- Позвоночник -->
  <path d="M140 100 V300" stroke="rgba(230,197,138,0.3)" stroke-width="0.8"/>
  <!-- Поперечные позвоночные -->
  ${[120, 144, 168, 192, 220, 250, 280].map(y => `<line x1="132" y1="${y}" x2="148" y2="${y}" stroke="rgba(230,197,138,0.22)" stroke-width="0.6"/>`).join('')}
  <!-- Линия плеч -->
  <path d="M88 110 Q140 100 192 110" fill="none" stroke="rgba(230,197,138,0.18)" stroke-width="0.6"/>
  <!-- Лопатки -->
  <path d="M104 130 Q116 160 124 180" fill="none" stroke="rgba(230,197,138,0.16)" stroke-width="0.6"/>
  <path d="M176 130 Q164 160 156 180" fill="none" stroke="rgba(230,197,138,0.16)" stroke-width="0.6"/>
  <!-- Поясничная зона -->
  <path d="M114 240 Q140 270 166 240" fill="none" stroke="rgba(230,197,138,0.16)" stroke-width="0.6"/>
`;

/* =========================================================
   ХОТСПОТЫ (координаты подогнаны под viewBox 280×560)
   ========================================================= */
const FRONT_POINTS = [
  { id: 'shoulderL', zone: 'shoulder', cx: 88,  cy: 122, r: 12 },
  { id: 'shoulderR', zone: 'shoulder', cx: 192, cy: 122, r: 12 },
  { id: 'wristL',    zone: 'wrist',    cx: 64,  cy: 292, r: 9  },
  { id: 'wristR',    zone: 'wrist',    cx: 216, cy: 292, r: 9  },
  { id: 'hipL',      zone: 'hip',      cx: 110, cy: 338, r: 11 },
  { id: 'hipR',      zone: 'hip',      cx: 170, cy: 338, r: 11 },
  { id: 'kneeL',     zone: 'knee',     cx: 110, cy: 448, r: 12 },
  { id: 'kneeR',     zone: 'knee',     cx: 170, cy: 448, r: 12 },
  { id: 'shinL',     zone: 'shin',     cx: 109, cy: 488, r: 10 },
  { id: 'shinR',     zone: 'shin',     cx: 171, cy: 488, r: 10 },
  { id: 'ankleL',    zone: 'ankle',    cx: 108, cy: 518, r: 9  },
  { id: 'ankleR',    zone: 'ankle',    cx: 172, cy: 518, r: 9  },
];

const BACK_POINTS = [
  { id: 'neck',       zone: 'neck',      cx: 140, cy: 86,  r: 11 },
  { id: 'shoulderL',  zone: 'shoulder',  cx: 88,  cy: 122, r: 12 },
  { id: 'shoulderR',  zone: 'shoulder',  cx: 192, cy: 122, r: 12 },
  { id: 'thoracic',   zone: 'thoracic',  cx: 140, cy: 168, r: 14 },
  { id: 'lumbar',     zone: 'lumbar',    cx: 140, cy: 256, r: 16 },
  { id: 'hipL',       zone: 'hip',       cx: 116, cy: 332, r: 11 },
  { id: 'hipR',       zone: 'hip',       cx: 164, cy: 332, r: 11 },
  { id: 'hamstringL', zone: 'hamstring', cx: 110, cy: 400, r: 12 },
  { id: 'hamstringR', zone: 'hamstring', cx: 170, cy: 400, r: 12 },
  { id: 'shinL',      zone: 'shin',      cx: 108, cy: 488, r: 10 },
  { id: 'shinR',      zone: 'shin',      cx: 172, cy: 488, r: 10 },
];
