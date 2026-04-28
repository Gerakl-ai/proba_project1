/* ============================================================
   НеЛомайся — клиентское приложение (прототип) v2
   ============================================================ */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // ====== Состояние сессии ======
  const state = {
    screen: 'home',
    bodySide: 'front',
    selectedZone: null,
    redflags: [],
    qIndex: 0,
    answers: {},
    routeResult: null,
    completedExercises: new Set(),
    history: [],
    plan: null,
    activeTab: 'map',
  };

  state.history = [
    { date: '14 апреля', zone: 'lumbar', route: 'green', nrs: 2 },
    { date: '07 апреля', zone: 'knee', route: 'yellow', nrs: 5 },
  ];
  ['ex04', 'ex09', 'ex13'].forEach(id => state.completedExercises.add(id));

  function go(screen, opts = {}) {
    state.screen = screen;
    Object.assign(state, opts);
    render();
    const content = $('.phone-content');
    if (content) content.scrollTop = 0;
  }

  function render() {
    const root = $('#phoneScreens');
    if (!root) return;
    root.innerHTML = '';
    const renderer = SCREENS[state.screen];
    const node = renderer ? renderer() : el('div', 'screen active', '<p>Экран не найден</p>');
    node.classList.add('active');
    root.appendChild(node);

    const tabbar = $('#tabbar');
    const showTabs = ['home', 'rehab', 'profile', 'partners'].includes(state.screen);
    tabbar.style.display = showTabs ? 'grid' : 'none';
    $$('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === state.activeTab));
  }

  function disclaimer(key) {
    const d = el('div', 'disclaimer');
    d.innerHTML = `<div class="ico">i</div><div>${window.NL_DISCLAIMERS[key]}</div>`;
    return d;
  }

  const SCREENS = {};

  // ----- Онбординг -----
  SCREENS.welcome = function () {
    const s = el('div', 'screen');
    s.innerHTML = `
      <h1 class="big">Добро пожаловать в&nbsp;«НеЛомайся»</h1>
      <p class="muted" style="font-size:14px;line-height:1.55">
        Цифровой ассистент для самостоятельно тренирующихся. За 2 минуты подскажет,
        что делать при появлении боли: безопасные упражнения или маршрут к врачу.
      </p>
    `;
    s.appendChild(disclaimer('start'));
    const cta = el('button', 'btn primary full', 'Войти через Yandex&nbsp;ID');
    cta.onclick = () => go('home', { activeTab: 'map' });
    s.appendChild(cta);
    const skip = el('button', 'btn ghost full', 'Продолжить без авторизации');
    skip.onclick = () => go('home', { activeTab: 'map' });
    s.appendChild(skip);
    const consent = el('p', 'soft', 'Продолжая, вы соглашаетесь с лицензионным соглашением и политикой конфиденциальности. Раздельные согласия — на маркетинговые рассылки и обработку данных — запрашиваются отдельно.');
    consent.style.cssText = 'font-size:11px;line-height:1.5;text-align:center;margin-top:12px;';
    s.appendChild(consent);
    return s;
  };

  // ----- Главный: карта тела -----
  SCREENS.home = function () {
    const s = el('div', 'screen');

    const hello = el('div');
    hello.innerHTML = `
      <div class="muted" style="font-size:13px">Привет, Герман 👋</div>
      <h1 class="big" style="margin-top:2px">Где сейчас болит?</h1>
      <p class="muted" style="font-size:13px;margin:0">Нажмите на зону на&nbsp;карте — за&nbsp;2 минуты подберём план.</p>
    `;
    s.appendChild(hello);

    const toggle = el('div', 'body-side-toggle');
    [['front', 'Спереди'], ['back', 'Сзади']].forEach(([v, lbl]) => {
      const b = el('button', state.bodySide === v ? 'active' : '', lbl);
      b.onclick = () => { state.bodySide = v; render(); };
      toggle.appendChild(b);
    });
    s.appendChild(toggle);

    const mapBox = el('div');
    s.appendChild(mapBox);
    window.NL_renderBodyMap(mapBox, {
      side: state.bodySide,
      selectedZone: state.selectedZone,
      onSelect: (zoneId) => { state.selectedZone = zoneId; render(); },
    });

    if (state.selectedZone) {
      const meta = window.NL_ZONES.find(z => z.id === state.selectedZone);
      const lbl = el('div', 'zone-label');
      lbl.innerHTML = `Выбрана зона: <strong>${meta.name}</strong>`;
      s.appendChild(lbl);
      const cta = el('button', 'btn primary full', 'Запустить Smart Routing →');
      cta.onclick = () => go('redflags', { redflags: [], qIndex: 0, answers: {} });
      s.appendChild(cta);
    } else {
      const hint = el('div', 'zone-label');
      hint.innerHTML = 'Нажмите на одну из <strong>10 пульсирующих зон</strong> на карте';
      s.appendChild(hint);
    }

    const quickHead = el('h4');
    quickHead.style.cssText = 'margin:18px 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-soft);font-weight:700';
    quickHead.textContent = 'Быстрый доступ';
    s.appendChild(quickHead);

    const ql = el('div');
    ql.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    [
      { label: 'Дневник самочувствия',     em: '📓', go: () => go('profile',  { activeTab: 'profile'  }) },
      { label: 'Последняя маршрутизация',  em: '⏱',  go: () => go('history') },
      { label: 'Программа «Без боли»',     em: '✦',  go: () => go('rehab',    { activeTab: 'rehab'    }) },
    ].forEach(item => {
      const b = el('button', 'choice');
      b.innerHTML = `<span class="em">${item.em}</span><span class="lbl">${item.label}</span><span class="arrow">→</span>`;
      b.onclick = item.go;
      ql.appendChild(b);
    });
    s.appendChild(ql);
    return s;
  };

  // ----- Стоп-сигналы -----
  SCREENS.redflags = function () {
    const s = el('div', 'screen');
    const meta = window.NL_ZONES.find(z => z.id === state.selectedZone);

    const head = el('div', 'screen-head');
    head.innerHTML = `<button class="back" aria-label="Назад">←</button><h2>Шаг 1 из 3 · Безопасность</h2>`;
    head.querySelector('.back').onclick = () => go('home');
    s.appendChild(head);

    const progress = el('div', 'progress-row');
    progress.innerHTML = `<div class="dot active"></div><div class="dot"></div><div class="dot"></div>`;
    s.appendChild(progress);

    const t = el('div');
    t.innerHTML = `
      <div class="tag brand" style="margin-bottom:8px">Зона: ${meta ? meta.short : '—'}</div>
      <h1 class="big">Что-то из этого про&nbsp;вас?</h1>
      <p class="muted" style="font-size:13px;margin:0 0 4px">Если хотя бы один пункт совпадает — мы покажем красный маршрут и подберём врача-партнёра.</p>
    `;
    s.appendChild(t);

    const list = el('div', 'redflag-list');
    window.NL_REDFLAGS.forEach(rf => {
      const checked = state.redflags.includes(rf.id);
      const item = el('div', 'redflag-item' + (checked ? ' checked' : ''));
      item.innerHTML = `
        <div class="ico-rf">${rf.icon}</div>
        <div class="text">${rf.text}${rf.emergency ? ' <span class="tag red" style="margin-left:6px">112</span>' : ''}</div>
      `;
      item.onclick = () => {
        const i = state.redflags.indexOf(rf.id);
        if (i >= 0) state.redflags.splice(i, 1); else state.redflags.push(rf.id);
        render();
      };
      list.appendChild(item);
    });
    s.appendChild(list);

    const noneBtn = el('button', 'btn primary full');
    noneBtn.textContent = state.redflags.length > 0
      ? 'Перейти к маршруту (с учётом отметок)'
      : 'Ничего не совпало — продолжить';
    noneBtn.onclick = () => {
      if (state.redflags.length > 0) {
        const result = window.NL_routingEngine.evaluate({
          zoneId: state.selectedZone, redflags: state.redflags, answers: {},
        });
        state.routeResult = result;
        state.history.unshift({ date: 'Сегодня', zone: state.selectedZone, route: result.route, nrs: 0 });
        go('result');
      } else {
        go('survey', { qIndex: 0, answers: {} });
      }
    };
    s.appendChild(noneBtn);

    s.appendChild(disclaimer('routing'));
    return s;
  };

  // ----- Опросник -----
  SCREENS.survey = function () {
    const s = el('div', 'screen');
    const q = window.NL_QUESTIONS[state.qIndex];
    const total = window.NL_QUESTIONS.length;

    const head = el('div', 'screen-head');
    head.innerHTML = `<button class="back" aria-label="Назад">←</button><h2>Шаг 2 из 3 · Опрос</h2>`;
    head.querySelector('.back').onclick = () => {
      if (state.qIndex === 0) go('redflags');
      else { state.qIndex--; render(); }
    };
    s.appendChild(head);

    const progress = el('div', 'progress-row');
    for (let i = 0; i < total; i++) {
      const cls = i < state.qIndex ? 'done' : (i === state.qIndex ? 'active' : '');
      progress.appendChild(el('div', 'dot ' + cls));
    }
    s.appendChild(progress);

    const t = el('div');
    t.innerHTML = `
      <div class="muted" style="font-size:12px;margin-top:8px;letter-spacing:0.04em">ВОПРОС ${state.qIndex + 1} ИЗ ${total}</div>
      <h2 class="q-title">${q.title}</h2>
      ${q.hint ? `<div class="q-hint">${q.hint}</div>` : ''}
    `;
    s.appendChild(t);

    if (q.type === 'scale') {
      const nrs = el('div', 'nrs');
      for (let i = 0; i <= 10; i++) {
        const cls = i <= 3 ? 's' : i <= 6 ? 'm' : 'h';
        const b = el('button', cls + (state.answers[q.id]?.value === i ? ' selected' : ''), String(i));
        b.onclick = () => {
          state.answers[q.id] = { value: i, limit: 0 };
          if (state.qIndex < total - 1) state.qIndex++;
          else return finishSurvey();
          render();
        };
        nrs.appendChild(b);
      }
      s.appendChild(nrs);
      const legend = el('div', 'nrs-legend');
      legend.innerHTML = `<span>Не чувствую</span><span>Беспокоит</span><span>Сильно</span>`;
      s.appendChild(legend);
    } else {
      const list = el('div', 'choice-list');
      q.options.forEach(opt => {
        const c = el('button', 'choice' + (state.answers[q.id]?.value === opt.value ? ' selected' : ''));
        c.innerHTML = `
          <span class="em">${opt.emoji || '•'}</span>
          <span class="lbl">${opt.label}</span>
          <span class="arrow">→</span>
        `;
        c.onclick = () => {
          state.answers[q.id] = { value: opt.value, limit: opt.limit || 0, chronic: opt.chronic };
          if (state.qIndex < total - 1) state.qIndex++;
          else return finishSurvey();
          render();
        };
        list.appendChild(c);
      });
      s.appendChild(list);
    }

    return s;
  };

  function finishSurvey() {
    const result = window.NL_routingEngine.evaluate({
      zoneId: state.selectedZone,
      redflags: state.redflags,
      answers: state.answers,
    });
    state.routeResult = result;
    state.history.unshift({
      date: 'Сегодня',
      zone: state.selectedZone,
      route: result.route,
      nrs: result.nrs ?? 0,
    });
    go('result');
  }

  // ----- Результат -----
  SCREENS.result = function () {
    const s = el('div', 'screen');
    const r = state.routeResult || { route: 'green', reasons: [] };
    const meta = window.NL_ROUTES[r.route];
    const zoneMeta = window.NL_ZONES.find(z => z.id === state.selectedZone);

    const head = el('div', 'screen-head');
    head.innerHTML = `<button class="back" aria-label="Назад">←</button><h2>Шаг 3 из 3 · Результат</h2>`;
    head.querySelector('.back').onclick = () => go('home');
    s.appendChild(head);

    const card = el('div', 'route-result ' + r.route);
    const reasons = r.reasons.map(rs => `<li>${rs}</li>`).join('');
    card.innerHTML = `
      <span class="lbl">${meta.label}</span>
      <h3>${meta.title}</h3>
      <p>${meta.summary}</p>
      ${zoneMeta ? `<div style="margin-top:14px;font-size:13px;color:var(--text-muted)">Зона: <strong style="color:var(--text)">${zoneMeta.name}</strong>${r.nrs != null ? ` · NRS ${r.nrs}/10` : ''}</div>` : ''}
      <ul class="reasons">${reasons}</ul>
    `;
    s.appendChild(card);

    const cta = el('button', 'btn primary full');
    cta.textContent = meta.cta + ' →';
    cta.onclick = () => {
      if (r.route === 'red') go('partners', { activeTab: 'partners' });
      else go('rehab', { activeTab: 'rehab' });
    };
    s.appendChild(cta);

    const alt = el('div');
    alt.style.cssText = 'display:flex;gap:8px';
    const save = el('button', 'btn ghost', 'В дневник'); save.style.flex = '1';
    save.onclick = () => go('profile', { activeTab: 'profile' });
    const repeat = el('button', 'btn ghost', 'Пройти заново'); repeat.style.flex = '1';
    repeat.onclick = () => go('home');
    alt.appendChild(save); alt.appendChild(repeat);
    s.appendChild(alt);

    s.appendChild(disclaimer('start'));
    return s;
  };

  // ----- Visual RehabPath -----
  SCREENS.rehab = function () {
    const s = el('div', 'screen');
    const route = state.routeResult?.route || 'green';
    const zone = state.selectedZone;

    const head = el('div');
    head.innerHTML = `
      <div class="muted" style="font-size:13px;letter-spacing:0.04em">VISUAL REHABPATH</div>
      <h1 class="big">Программа упражнений</h1>
      <p class="muted" style="font-size:13px;margin:0">Доказательный протокол FIFA 11+. ${zone ? 'Подобрано под выбранную зону и&nbsp;' : 'Без указания зоны: показаны общие упражнения и&nbsp;'}маршрут <strong>${window.NL_ROUTES[route].label.toLowerCase()}</strong>.</p>
    `;
    s.appendChild(head);

    const filters = el('div');
    filters.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:4px';
    [
      { id: 'all',     label: 'Все' },
      { id: 'zone',    label: zone ? 'По зоне' : 'Зональные' },
      { id: 'general', label: 'Общие' },
      { id: 'easy',    label: 'Мягкие' },
    ].forEach(f => {
      const b = el('button', 'tag' + (state._filter === f.id ? ' brand' : ''), f.label);
      b.style.cursor = 'pointer';
      b.onclick = () => { state._filter = f.id; render(); };
      filters.appendChild(b);
    });
    s.appendChild(filters);

    const list = el('div', 'exercise-list');
    let items = window.NL_EXERCISES.slice();
    if (state._filter === 'zone' && zone)   items = items.filter(e => e.zone === zone);
    if (state._filter === 'general')        items = items.filter(e => e.zone === 'general');
    if (state._filter === 'easy')           items = items.filter(e => e.difficulty === 1);
    if ((!state._filter || state._filter === 'all') && zone) {
      items = items.filter(e => e.zone === zone || e.zone === 'general');
    }
    if (route === 'yellow') items = items.filter(e => e.difficulty <= 2);

    items.forEach(ex => {
      const c = el('div', 'ex-card');
      c.innerHTML = `
        <div class="anim">${miniAnim(ex.id)}</div>
        <div>
          <h4>${ex.title}</h4>
          <div class="meta">
            <span class="tag">${ex.duration}</span>
            <span class="tag ${ex.difficulty === 3 ? 'yellow' : ex.difficulty === 2 ? 'brand' : 'green'}">${['','Мягкий','Средний','Продвинутый'][ex.difficulty]}</span>
          </div>
        </div>
        ${state.completedExercises.has(ex.id) ? '<div class="checked-mark">✓</div>' : '<div></div>'}
      `;
      c.onclick = () => go('exercise', { _exId: ex.id });
      list.appendChild(c);
    });

    if (items.length === 0) {
      const empty = el('div', 'zone-label', 'По выбранному фильтру нет упражнений. Откройте «Все».');
      s.appendChild(empty);
    } else {
      s.appendChild(list);
    }

    s.appendChild(disclaimer('exercise'));
    return s;
  };

  // ----- Карточка упражнения -----
  SCREENS.exercise = function () {
    const s = el('div', 'screen ex-detail');
    const ex = window.NL_EXERCISES.find(e => e.id === state._exId);
    if (!ex) { s.innerHTML = '<p>Упражнение не найдено</p>'; return s; }

    const head = el('div', 'screen-head');
    head.innerHTML = `<button class="back">←</button><h2>${ex.title}</h2>`;
    head.querySelector('.back').onclick = () => go('rehab');
    s.appendChild(head);

    const big = el('div', 'anim-big');
    big.innerHTML = miniAnim(ex.id, true);
    s.appendChild(big);

    const desc = el('p', 'muted');
    desc.style.cssText = 'font-size:14px;line-height:1.55;margin:8px 0 0';
    desc.textContent = ex.desc;
    s.appendChild(desc);

    const grid = el('div', 'info-grid');
    grid.innerHTML = `
      <div class="cell"><div class="k">Объём</div><div class="v">${ex.duration}</div></div>
      <div class="cell"><div class="k">Уровень</div><div class="v">${['','Мягкий','Средний','Продвинутый'][ex.difficulty]}</div></div>
      <div class="cell" style="grid-column:1/-1"><div class="k">Источник доказательной базы</div><div class="v">${ex.source}</div></div>
    `;
    s.appendChild(grid);

    const ctrl = el('div', 'controls');
    const start = el('button', 'btn primary', state.completedExercises.has(ex.id) ? 'Повторить' : 'Начать выполнение');
    start.style.flex = '2';
    start.onclick = () => { state.completedExercises.add(ex.id); render(); };
    const mark = el('button', 'btn ghost', state.completedExercises.has(ex.id) ? 'Выполнено ✓' : 'Отметить');
    mark.style.flex = '1';
    mark.onclick = () => {
      if (state.completedExercises.has(ex.id)) state.completedExercises.delete(ex.id);
      else state.completedExercises.add(ex.id);
      render();
    };
    ctrl.appendChild(start); ctrl.appendChild(mark);
    s.appendChild(ctrl);

    s.appendChild(disclaimer('exercise'));
    return s;
  };

  // ----- Партнёры -----
  SCREENS.partners = function () {
    const s = el('div', 'screen');
    const head = el('div');
    head.innerHTML = `
      <div class="muted" style="font-size:13px;letter-spacing:0.04em">ВРАЧИ-ПАРТНЁРЫ</div>
      <h1 class="big">Клиники в&nbsp;вашем городе</h1>
      <p class="muted" style="font-size:13px;margin:0">Город Владимир. Запись передаётся партнёру; визит подтверждается на стороне клиники.</p>
    `;
    s.appendChild(head);

    window.NL_PARTNERS.forEach(p => {
      const c = el('div', 'partner-card');
      c.innerHTML = `
        <div class="pname">${p.name}</div>
        <div class="paddr">${p.city}, ${p.address} · ${p.distance}</div>
        <div class="pmeta">
          <span class="star">★</span> <strong>${p.rating}</strong>
          <span class="muted">· ${p.reviews} отзывов</span>
        </div>
        <div class="pservices">${p.services.map(x => `<span class="tag">${x}</span>`).join('')}</div>
        <div class="nearest"><span>Ближайшая запись</span><strong>${p.nearest}</strong></div>
      `;
      const cta = el('button', 'btn primary full', 'Записаться');
      cta.style.marginTop = '10px';
      cta.onclick = () => go('booking', { _partnerId: p.id });
      c.appendChild(cta);
      s.appendChild(c);
    });

    s.appendChild(disclaimer('start'));
    return s;
  };

  SCREENS.booking = function () {
    const s = el('div', 'screen');
    const p = window.NL_PARTNERS.find(x => x.id === state._partnerId) || window.NL_PARTNERS[0];
    const head = el('div', 'screen-head');
    head.innerHTML = `<button class="back">←</button><h2>Запись подтверждена</h2>`;
    head.querySelector('.back').onclick = () => go('partners');
    s.appendChild(head);

    const card = el('div', 'route-result green');
    card.innerHTML = `
      <span class="lbl">✓ Готово</span>
      <h3>Запись передана партнёру</h3>
      <p>${p.name}.<br>${p.address}.<br>Время приёма: <strong>${p.nearest}</strong>.</p>
      <ul class="reasons">
        <li>Партнёр свяжется с вами по телефону для подтверждения.</li>
        <li>SMS-уведомление за 24 часа до визита.</li>
        <li>Стоимость консультации — на стороне клиники, по прейскуранту партнёра.</li>
      </ul>
    `;
    s.appendChild(card);
    const cta = el('button', 'btn primary full', 'На главный экран');
    cta.onclick = () => go('home');
    s.appendChild(cta);
    return s;
  };

  // ----- Личный кабинет -----
  SCREENS.profile = function () {
    const s = el('div', 'screen');
    const head = el('div');
    head.innerHTML = `<h1 class="big">Личный кабинет</h1>`;
    s.appendChild(head);

    const profile = el('div', 'profile-head');
    profile.innerHTML = `
      <div class="avatar">ГП</div>
      <div class="who"><div class="n">Герман П.</div><div class="s">Бесплатный тариф · 1 запуск Smart Routing в неделю</div></div>
      <button class="icon-btn" aria-label="Настройки">⚙</button>
    `;
    s.appendChild(profile);

    const subHead = el('h4');
    subHead.style.cssText = 'margin:14px 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-soft);font-weight:700';
    subHead.textContent = 'Подписка';
    s.appendChild(subHead);

    const subCard = el('div');
    subCard.style.cssText = 'padding:16px;border-radius:14px;background:var(--bg-elev);border:1px solid var(--line);';
    subCard.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700">Бесплатный тариф</div>
          <div class="muted" style="font-size:12px;margin-top:2px">Расширьте до 299 ₽/мес для безлимитных запусков и 15 упражнений.</div>
        </div>
      </div>
    `;
    const subBtn = el('button', 'btn primary full', 'Оформить подписку →');
    subBtn.style.marginTop = '12px';
    subBtn.onclick = () => go('paywall');
    subCard.appendChild(subBtn);
    s.appendChild(subCard);

    const diaryHead = el('h4');
    diaryHead.style.cssText = 'margin:14px 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-soft);font-weight:700';
    diaryHead.textContent = 'Дневник самочувствия (этот месяц)';
    s.appendChild(diaryHead);

    const grid = el('div', 'diary-grid');
    const days = 28;
    const filled = [3, 6, 9, 12, 14, 16, 19, 22, 23, 25, 27];
    for (let i = 1; i <= days; i++) {
      const c = el('div', 'cell');
      const idx = filled.indexOf(i);
      if (idx >= 0) {
        const lvl = (idx % 3) + 1;
        c.classList.add('l' + lvl);
        c.textContent = i;
      } else {
        c.textContent = i;
      }
      grid.appendChild(c);
    }
    s.appendChild(grid);

    const histHead = el('h4');
    histHead.style.cssText = 'margin:18px 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-soft);font-weight:700';
    histHead.textContent = 'История маршрутизации';
    s.appendChild(histHead);

    state.history.slice(0, 4).forEach(h => {
      const z = window.NL_ZONES.find(z => z.id === h.zone);
      const c = el('div');
      c.style.cssText = 'padding:14px;border-radius:14px;background:var(--bg-elev);border:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
      c.innerHTML = `
        <div>
          <div style="font-weight:700;font-size:14px">${z ? z.name : '—'}</div>
          <div class="muted" style="font-size:12px">${h.date} · NRS ${h.nrs}/10</div>
        </div>
        <span class="tag ${h.route}">${h.route === 'green' ? 'Зелёный' : h.route === 'yellow' ? 'Жёлтый' : 'Красный'}</span>
      `;
      s.appendChild(c);
    });

    return s;
  };

  // ----- Paywall -----
  SCREENS.paywall = function () {
    const s = el('div', 'screen');
    const head = el('div', 'screen-head');
    head.innerHTML = `<button class="back">←</button><h2>Подписка «НеЛомайся»</h2>`;
    head.querySelector('.back').onclick = () => go('profile');
    s.appendChild(head);

    s.appendChild(el('p', 'muted', 'Безлимитные запуски Smart Routing, доступ ко всем 15 упражнениям, история без ограничений по сроку.'));

    const plans = [
      { id: 'month', name: 'Месяц', price: '299 ₽', desc: 'Списание ежемесячно. Отмена — в один шаг.' },
      { id: 'year',  name: 'Год',   price: '2 490 ₽', desc: 'Экономия 30%. Эквивалент 207 ₽/мес.', best: true },
    ];
    plans.forEach(p => {
      const c = el('div', 'plan-card' + (state.plan === p.id ? ' selected' : ''));
      c.innerHTML = `
        <div class="top">
          <div class="name">${p.name}${p.best ? ' <span class="tag brand" style="margin-left:8px">Выгодно</span>' : ''}</div>
          <div class="price">${p.price}</div>
        </div>
        <div class="desc">${p.desc}</div>
      `;
      c.onclick = () => { state.plan = p.id; render(); };
      s.appendChild(c);
    });

    const pay = el('button', 'btn primary full');
    pay.textContent = state.plan ? 'Оплатить через ЮKassa →' : 'Выберите тариф';
    pay.disabled = !state.plan;
    pay.style.opacity = state.plan ? '1' : '0.5';
    pay.onclick = () => state.plan && go('payment-success');
    s.appendChild(pay);

    const note = el('p', 'soft', 'Оплата на стороне ЮKassa. Возврат — в течение 14 дней. Согласие на маркетинговые рассылки — отдельным переключателем в настройках.');
    note.style.cssText = 'font-size:11px;line-height:1.5;';
    s.appendChild(note);
    return s;
  };

  SCREENS['payment-success'] = function () {
    const s = el('div', 'screen');
    s.innerHTML = `
      <div style="display:grid;place-items:center;padding:48px 0 12px">
        <div style="width:80px;height:80px;border-radius:50%;background:var(--route-green);color:#fff;display:grid;place-items:center;font-size:36px;box-shadow:0 16px 32px -8px color-mix(in srgb, var(--route-green) 50%, transparent)">✓</div>
      </div>
      <h1 class="big" style="text-align:center">Подписка активирована</h1>
      <p class="muted" style="text-align:center;font-size:14px;margin:0">Все функции доступны. Чек отправлен на электронную почту.</p>
    `;
    const cta = el('button', 'btn primary full', 'Вернуться в&nbsp;приложение');
    cta.onclick = () => go('home');
    s.appendChild(cta);
    return s;
  };

  SCREENS.history = function () {
    const s = el('div', 'screen');
    const head = el('div', 'screen-head');
    head.innerHTML = `<button class="back">←</button><h2>История маршрутизации</h2>`;
    head.querySelector('.back').onclick = () => go('home');
    s.appendChild(head);
    state.history.forEach(h => {
      const z = window.NL_ZONES.find(z => z.id === h.zone);
      const c = el('div');
      c.style.cssText = 'padding:14px;border-radius:14px;background:var(--bg-elev);border:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
      c.innerHTML = `
        <div>
          <div style="font-weight:700;font-size:14px">${z ? z.name : '—'}</div>
          <div class="muted" style="font-size:12px">${h.date} · NRS ${h.nrs}/10</div>
        </div>
        <span class="tag ${h.route}">${h.route === 'green' ? 'Зелёный' : h.route === 'yellow' ? 'Жёлтый' : 'Красный'}</span>
      `;
      s.appendChild(c);
    });
    return s;
  };

  // ====== Мини-анимации упражнений ======
  function miniAnim(id, big = false) {
    const stroke = big ? 3 : 2;
    const map = {
      ex01: `<svg viewBox="0 0 100 100"><circle class="ex-anim-mark" cx="50" cy="35" r="14" fill="var(--brand)" opacity="0.7"/><rect x="36" y="48" width="28" height="38" rx="6" fill="var(--brand)" opacity="0.4"/></svg>`,
      ex02: `<svg viewBox="0 0 100 100"><line x1="50" y1="20" x2="50" y2="80" stroke="var(--brand)" stroke-width="${stroke + 2}"/><circle class="ex-anim-rot" cx="50" cy="50" r="22" fill="none" stroke="var(--brand)" stroke-width="${stroke}" stroke-dasharray="6 4"/></svg>`,
      ex03: `<svg viewBox="0 0 100 100"><path class="ex-anim-rot" d="M20 60 Q50 20 80 60" fill="none" stroke="var(--brand)" stroke-width="${stroke + 1}" stroke-linecap="round"/><circle cx="20" cy="60" r="5" fill="var(--brand)"/><circle cx="80" cy="60" r="5" fill="var(--brand)"/></svg>`,
      ex04: `<svg viewBox="0 0 100 100"><path class="ex-anim-mark" d="M15 60 Q50 30 85 60" fill="none" stroke="var(--brand)" stroke-width="${stroke + 1}" stroke-linecap="round"/><path d="M15 70 Q50 90 85 70" fill="none" stroke="var(--brand)" stroke-width="${stroke}" opacity="0.5"/></svg>`,
      ex05: `<svg viewBox="0 0 100 100"><rect class="ex-anim-bounce" x="20" y="46" width="60" height="14" rx="6" fill="var(--brand)" opacity="0.7"/><line x1="30" y1="60" x2="30" y2="84" stroke="var(--brand)" stroke-width="${stroke + 1}"/><line x1="70" y1="60" x2="70" y2="84" stroke="var(--brand)" stroke-width="${stroke + 1}"/></svg>`,
      ex06: `<svg viewBox="0 0 100 100"><circle class="ex-anim-rot" cx="50" cy="50" r="20" fill="none" stroke="var(--brand)" stroke-width="${stroke + 1}"/><line x1="50" y1="50" x2="74" y2="36" stroke="var(--brand)" stroke-width="${stroke}"/></svg>`,
      ex07: `<svg viewBox="0 0 100 100"><ellipse class="ex-anim-mark" cx="50" cy="58" rx="30" ry="14" fill="var(--brand)" opacity="0.5"/><circle cx="32" cy="40" r="6" fill="var(--brand)"/></svg>`,
      ex08: `<svg viewBox="0 0 100 100"><line x1="20" y1="80" x2="80" y2="80" stroke="var(--brand)" stroke-width="${stroke + 2}"/><line class="ex-anim-rot" x1="40" y1="80" x2="50" y2="30" stroke="var(--brand)" stroke-width="${stroke + 2}" stroke-linecap="round"/></svg>`,
      ex09: `<svg viewBox="0 0 100 100"><rect x="22" y="22" width="56" height="56" rx="6" fill="none" stroke="var(--brand)" stroke-width="${stroke}"/><line class="ex-anim-bounce" x1="22" y1="60" x2="78" y2="60" stroke="var(--brand)" stroke-width="${stroke + 2}"/></svg>`,
      ex10: `<svg viewBox="0 0 100 100"><polyline class="ex-anim-mark" points="20,80 40,80 40,55 70,55 70,30 85,30" fill="none" stroke="var(--brand)" stroke-width="${stroke + 1}" stroke-linecap="round"/></svg>`,
      ex11: `<svg viewBox="0 0 100 100"><line x1="35" y1="80" x2="35" y2="30" stroke="var(--brand)" stroke-width="${stroke + 2}" class="ex-anim-bounce"/><line x1="65" y1="80" x2="65" y2="30" stroke="var(--brand)" stroke-width="${stroke + 2}" class="ex-anim-bounce"/></svg>`,
      ex12: `<svg viewBox="0 0 100 100"><circle class="ex-anim-rot" cx="50" cy="50" r="26" fill="none" stroke="var(--brand)" stroke-width="${stroke}" stroke-dasharray="3 6"/><circle cx="50" cy="50" r="6" fill="var(--brand)"/></svg>`,
      ex13: `<svg viewBox="0 0 100 100"><circle class="ex-anim-rot" cx="50" cy="50" r="28" fill="none" stroke="var(--brand)" stroke-width="${stroke}"/><circle cx="50" cy="50" r="3" fill="var(--brand)"/></svg>`,
      ex14: `<svg viewBox="0 0 100 100"><line class="ex-anim-mark" x1="20" y1="50" x2="80" y2="50" stroke="var(--brand)" stroke-width="${stroke + 4}" stroke-linecap="round"/></svg>`,
      ex15: `<svg viewBox="0 0 100 100"><circle class="ex-anim-mark" cx="50" cy="50" r="14" fill="var(--brand)" opacity="0.4"/><circle cx="50" cy="50" r="22" fill="none" stroke="var(--brand)" stroke-width="${stroke}" opacity="0.5"/><circle cx="50" cy="50" r="30" fill="none" stroke="var(--brand)" stroke-width="${stroke}" opacity="0.25"/></svg>`,
    };
    return map[id] || `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="var(--brand)" opacity="0.4"/></svg>`;
  }

  // ====== Tab bar ======
  function setupTabBar() {
    const tabbar = $('#tabbar');
    const tabs = [
      { id: 'map',      label: 'Карта',     icon: '⌂', go: () => go('home',     { activeTab: 'map' }) },
      { id: 'rehab',    label: 'Программа', icon: '✦', go: () => go('rehab',    { activeTab: 'rehab' }) },
      { id: 'partners', label: 'Врачи',     icon: '✚', go: () => go('partners', { activeTab: 'partners' }) },
      { id: 'profile',  label: 'Профиль',   icon: '☺', go: () => go('profile',  { activeTab: 'profile' }) },
    ];
    tabs.forEach(t => {
      const b = el('button');
      b.dataset.tab = t.id;
      b.innerHTML = `<span class="gly">${t.icon}</span><span>${t.label}</span>`;
      b.onclick = t.go;
      tabbar.appendChild(b);
    });
  }

  // ====== Mode bar (Лендинг ↔ Приложение) ======
  function setupModeBar() {
    const seg = $('.modebar .seg');
    const buttons = $$('.modebar .seg button');
    // Pill (animated indicator)
    const pill = document.createElement('div');
    pill.className = 'seg-pill';
    seg.appendChild(pill);

    function movePillTo(btn) {
      const segRect = seg.getBoundingClientRect();
      const r = btn.getBoundingClientRect();
      pill.style.left  = (r.left  - segRect.left) + 'px';
      pill.style.width = r.width + 'px';
    }

    buttons.forEach(b => {
      b.onclick = () => {
        buttons.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        movePillTo(b);
        const view = b.dataset.view;
        $('#viewLanding').style.display = view === 'landing' ? 'block' : 'none';
        $('#viewApp').style.display     = view === 'app'     ? 'grid'  : 'none';
        try { localStorage.setItem('nl_view', view); } catch (e) {}
      };
    });

    const saved = (() => { try { return localStorage.getItem('nl_view'); } catch (e) { return null; }})();
    requestAnimationFrame(() => {
      const target = $(`.modebar .seg button[data-view="${saved || 'landing'}"]`) || buttons[0];
      target.click();
    });

    $('#themeToggle').onclick = () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      const next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('nl_theme', next); } catch (e) {}
    };
    const savedTheme = (() => { try { return localStorage.getItem('nl_theme'); } catch (e) { return null; }})();
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    window.addEventListener('resize', () => {
      const active = $('.modebar .seg button.active');
      if (active) movePillTo(active);
    });
  }

  // ====== Сценарии быстрого запуска ======
  function setupScenarios() {
    function resetSession() {
      state.redflags = [];
      state.answers = {};
      state.routeResult = null;
      state.qIndex = 0;
    }

    $$('#scenarioList button').forEach(b => {
      b.onclick = () => {
        const sc = b.dataset.scenario;
        $('.modebar .seg button[data-view="app"]').click();
        resetSession();

        if (sc === 'prevent') {
          // Профилактика: пользователь хочет проверить себя «на всякий случай».
          // Никакой боли, никаких ограничений → зелёный.
          state.selectedZone = 'lumbar'; state.bodySide = 'back';
          state.answers = {
            q_nrs:      { value: 0, limit: 0 },
            q_duration: { value: 'check',    limit: 0 },
            q_trigger:  { value: 'prevent',  limit: 0 },
            q_function: { value: 'full',     limit: 0 },
            q_swelling: { value: 'none',     limit: 0 },
            q_history:  { value: 'never',    limit: 0 },
            q_load:     { value: 'stable',   limit: 0 },
          };
          finishSurvey();
        } else if (sc === 'green') {
          // Лёгкий дискомфорт после тренировки → зелёный.
          state.selectedZone = 'lumbar'; state.bodySide = 'back';
          state.answers = {
            q_nrs:      { value: 3, limit: 0 },
            q_duration: { value: 'today',      limit: 0 },
            q_trigger:  { value: 'lifting',    limit: 0 },
            q_function: { value: 'discomfort', limit: 0 },
            q_swelling: { value: 'none',       limit: 0 },
            q_history:  { value: 'sometimes',  limit: 0 },
            q_load:     { value: 'stable',     limit: 0 },
          };
          finishSurvey();
        } else if (sc === 'yellow') {
          // Умеренная боль + ограничение амплитуды → жёлтый.
          state.selectedZone = 'knee'; state.bodySide = 'front';
          state.answers = {
            q_nrs:      { value: 6, limit: 0 },
            q_duration: { value: 'week',    limit: 0 },
            q_trigger:  { value: 'cardio',  limit: 0 },
            q_function: { value: 'short',   limit: 1 },
            q_swelling: { value: 'subtle',  limit: 0 },
            q_history:  { value: 'often',   limit: 1 },
            q_load:     { value: 'spike',   limit: 1 },
          };
          finishSurvey();
        } else if (sc === 'red') {
          // Стоп-сигналы → красный сразу.
          state.selectedZone = 'shoulder'; state.bodySide = 'front';
          state.redflags = ['rf1', 'rf3'];
          const result = window.NL_routingEngine.evaluate({
            zoneId: state.selectedZone, redflags: state.redflags, answers: {},
          });
          state.routeResult = result;
          state.history.unshift({ date: 'Сегодня', zone: state.selectedZone, route: result.route, nrs: 0 });
          go('result');
        } else if (sc === 'home') {
          state.selectedZone = null;
          go('home', { activeTab: 'map' });
        } else if (sc === 'paywall') {
          go('paywall');
        }
      };
    });
  }

  // ====== Tweaks ======
  function setupTweaks() {
    const panel = $('#tweaks');
    const palette = [
      { name: 'Электрик',  val: '#4540EE', deep: '#1A14A8', soft: '#E8E5FF', alt: '#C2A9FF' },
      { name: 'Лайм',      val: '#0E0E14', deep: '#000000', soft: '#F0F4D6', alt: '#DEFF54' },
      { name: 'Закат',     val: '#FF5E57', deep: '#B33530', soft: '#FFE4D6', alt: '#FF9F43' },
      { name: 'Изумруд',   val: '#00824D', deep: '#005230', soft: '#C8F5DC', alt: '#10C4A0' },
    ];
    const swRow = $('#tweakSwatches');
    palette.forEach((p, i) => {
      const sw = el('div', 'swatch' + (i === 0 ? ' selected' : ''));
      sw.style.background = `linear-gradient(135deg, ${p.val}, ${p.alt})`;
      sw.title = p.name;
      sw.onclick = () => {
        $$('#tweakSwatches .swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        document.documentElement.style.setProperty('--brand', p.val);
        document.documentElement.style.setProperty('--brand-2', p.alt);
        document.documentElement.style.setProperty('--brand-deep', p.deep);
        document.documentElement.style.setProperty('--brand-soft', p.soft);
        try {
          window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { brand: p.val } }, '*');
        } catch (e) {}
      };
      swRow.appendChild(sw);
    });

    const radius = $('#tweakRadius');
    radius.oninput = () => {
      document.documentElement.style.setProperty('--r-md', radius.value + 'px');
      document.documentElement.style.setProperty('--r-lg', (Number(radius.value) + 6) + 'px');
      document.documentElement.style.setProperty('--r-xl', (Number(radius.value) + 14) + 'px');
    };

    const dens = $('#tweakDensity');
    dens.onchange = () => {
      const v = dens.value;
      const root = document.documentElement.style;
      if (v === 'compact')   root.setProperty('--gutter', '16px');
      if (v === 'cozy')      root.setProperty('--gutter', '24px');
      if (v === 'spacious')  root.setProperty('--gutter', '32px');
    };

    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode')   panel.classList.add('visible');
      if (e.data.type === '__deactivate_edit_mode') panel.classList.remove('visible');
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupModeBar();
    setupTabBar();
    setupScenarios();
    setupTweaks();
    render();
  });
})();
