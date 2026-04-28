/* ============================================================
   НеЛомайся — каноническое содержательное наполнение MVP v2
   (соответствует Master Project Bible 1.1, разделы 9.1, 11, 12)
   Лексика — спортивная, без катастроф. Опросник учитывает
   профилактическую аудиторию: не каждый кейс ведёт в жёлтый.
   ============================================================ */

// 10 анатомических зон.
window.NL_ZONES = [
  { id: 'neck',      name: 'Шея и верхний отдел позвоночника', side: 'back',  short: 'Шея' },
  { id: 'shoulder',  name: 'Плечевой сустав',                  side: 'both',  short: 'Плечо' },
  { id: 'thoracic',  name: 'Грудной отдел позвоночника',       side: 'back',  short: 'Грудной отдел' },
  { id: 'lumbar',    name: 'Поясничный отдел позвоночника',    side: 'back',  short: 'Поясница' },
  { id: 'wrist',     name: 'Запястья',                          side: 'front', short: 'Запястье' },
  { id: 'hip',       name: 'Тазобедренные суставы',             side: 'both',  short: 'Тазобедренный сустав' },
  { id: 'hamstring', name: 'Мышцы задней поверхности бедра',    side: 'back',  short: 'Задняя поверхность бедра' },
  { id: 'knee',      name: 'Коленные суставы',                  side: 'front', short: 'Колено' },
  { id: 'shin',      name: 'Голени (передняя и задняя поверхности)', side: 'both', short: 'Голень' },
  { id: 'ankle',     name: 'Голеностопный сустав',              side: 'front', short: 'Голеностоп' },
];

// «Стоп-сигналы» — серьёзные признаки, при которых самостоятельные
// упражнения не подходят. Сформулированы спортивно, без «фатальных» оборотов.
window.NL_REDFLAGS = [
  { id: 'rf1', text: 'В момент травмы услышал(-а) щелчок или хруст в суставе', emergency: false, icon: '⚡' },
  { id: 'rf2', text: 'Заметная припухлость или асимметрия с травмированной стороны', emergency: false, icon: '◐' },
  { id: 'rf3', text: 'Не получается опереться на ногу или поднять руку — движение блокируется', emergency: false, icon: '⊘' },
  { id: 'rf4', text: 'Чувствую онемение или «прострелы» по конечности дольше суток', emergency: false, icon: '〰' },
  { id: 'rf5', text: 'Боль будит ночью или не уходит в покое больше двух недель', emergency: false, icon: '☾' },
  { id: 'rf6', text: 'Зона горячая на ощупь, покраснела и нарастает отёк', emergency: false, icon: '◉' },
  { id: 'rf7', text: 'После травмы появилось головокружение, тошнота или «туман» в голове', emergency: true,  icon: '✦' },
  { id: 'rf8', text: 'Был сильный удар по спине или шее с потерей ориентации',                emergency: true,  icon: '✦' },
];

// Опросник Smart Routing.
// Рассчитан на разную аудиторию: и тех, кто пришёл из любопытства/профилактики,
// и тех, у кого реально что-то болит. limit добавляется только за реальные
// признаки ограничений.
window.NL_QUESTIONS = [
  {
    id: 'q_nrs',
    type: 'scale',
    title: 'Насколько ощутима боль прямо сейчас?',
    hint: '0 — не чувствую, 10 — невозможно думать ни о чём другом',
    min: 0, max: 10,
    weight: 'nrs',
  },
  {
    id: 'q_duration',
    type: 'choice',
    title: 'Когда впервые заметили эти ощущения?',
    options: [
      { value: 'check',     label: 'Ничего не беспокоит — просто проверяюсь',  limit: 0, emoji: '✦' },
      { value: 'today',     label: 'Сегодня или вчера',                         limit: 0, emoji: '🕐' },
      { value: 'week',      label: 'На этой или прошлой неделе',                limit: 0, emoji: '📅' },
      { value: 'month',     label: 'В течение последнего месяца',               limit: 0, emoji: '📆' },
      { value: 'longer',    label: 'Тянется дольше 6 недель',                   limit: 0, chronic: true, emoji: '⏳' },
    ],
  },
  {
    id: 'q_trigger',
    type: 'choice',
    title: 'С чем связали бы эти ощущения?',
    options: [
      { value: 'prevent',   label: 'Хочу заняться профилактикой и техникой',       limit: 0, emoji: '★' },
      { value: 'lifting',   label: 'Тянул(-а) тяжёлый вес или делал(-а) рывок',    limit: 0, emoji: '🏋' },
      { value: 'cardio',    label: 'Бег, прыжки или плиометрика',                  limit: 0, emoji: '🏃' },
      { value: 'awkward',   label: 'Подвернул(-а) или сделал(-а) неловкое движение', limit: 1, emoji: '↯' },
      { value: 'gradual',   label: 'Появилось постепенно, без конкретного момента', limit: 0, emoji: '∿' },
      { value: 'morning',   label: 'Заметил(-а) утром после сна',                  limit: 0, emoji: '☀' },
    ],
  },
  {
    id: 'q_function',
    type: 'choice',
    title: 'Привычное тренировочное движение в этой зоне — как ощущается?',
    hint: 'Например: присед, отжимание, замах рукой',
    options: [
      { value: 'full',       label: 'Свободно, как обычно',                       limit: 0, emoji: '✓' },
      { value: 'discomfort', label: 'Делаю, но с лёгким дискомфортом',            limit: 0, emoji: '~' },
      { value: 'short',      label: 'Только на укороченной амплитуде',            limit: 1, emoji: '◐' },
      { value: 'painful',    label: 'Могу, но через выраженную боль',             limit: 2, emoji: '⚠' },
    ],
  },
  {
    id: 'q_swelling',
    type: 'choice',
    title: 'Видите или чувствуете отёк в этой зоне?',
    options: [
      { value: 'none',       label: 'Нет, выглядит как обычно',                   limit: 0, emoji: '○' },
      { value: 'subtle',     label: 'Совсем слегка, почти незаметно',             limit: 0, emoji: '◔' },
      { value: 'visible',    label: 'Заметная припухлость или покраснение',       limit: 1, emoji: '◉' },
    ],
  },
  {
    id: 'q_history',
    type: 'choice',
    title: 'Эта зона уже беспокоила раньше?',
    options: [
      { value: 'never',      label: 'Нет, ничего подобного не было',              limit: 0, emoji: '✦' },
      { value: 'first',      label: 'Впервые',                                    limit: 0, emoji: '◌' },
      { value: 'sometimes',  label: 'Бывает изредка после нагрузки',              limit: 0, emoji: '◌' },
      { value: 'often',      label: 'Регулярно возвращается',                     limit: 1, emoji: '↻' },
    ],
  },
  {
    id: 'q_load',
    type: 'choice',
    title: 'Как менялась нагрузка в последние 4 недели?',
    options: [
      { value: 'light',      label: 'Минимальная — почти не тренировался(-ась)',  limit: 0, emoji: '◌' },
      { value: 'stable',     label: 'Тренируюсь в обычном объёме',                limit: 0, emoji: '═' },
      { value: 'rest',       label: 'Возвращаюсь после паузы или болезни',        limit: 0, emoji: '↟' },
      { value: 'spike',      label: 'Резко добавил(-а) объём или новое упражнение', limit: 1, emoji: '⤴' },
      { value: 'overload',   label: '5+ тренировок в неделю без выходных',         limit: 1, emoji: '⚡' },
    ],
  },
];

// Библиотека из 15 упражнений.
window.NL_EXERCISES = [
  { id: 'ex01', zone: 'neck',     title: 'Изометрическое удержание шеи',           duration: '3×10 сек',  difficulty: 1, source: 'FIFA 11+, адаптация',     minRoute: 'green', desc: 'Ладонь упирается в висок, шея удерживается без движения.' },
  { id: 'ex02', zone: 'shoulder', title: 'Внешняя ротация с лентой',               duration: '2×12',      difficulty: 2, source: 'NASM, протокол FIFA 11+', minRoute: 'green', desc: 'Локоть прижат к корпусу, медленная ротация наружу.' },
  { id: 'ex03', zone: 'thoracic', title: 'Раскрытие грудного отдела',              duration: '2×8',       difficulty: 1, source: 'ACSM',                    minRoute: 'green', desc: 'Из положения на четвереньках поворот корпуса вверх.' },
  { id: 'ex04', zone: 'lumbar',   title: 'Кошка-корова',                           duration: '2×10',      difficulty: 1, source: 'McGill Big 3',            minRoute: 'green', desc: 'Плавное чередование прогиба и округления спины.' },
  { id: 'ex05', zone: 'lumbar',   title: 'Ягодичный мост',                         duration: '3×12',      difficulty: 2, source: 'FIFA 11+',                minRoute: 'green', desc: 'Поднятие таза с опорой на стопы и плечи.' },
  { id: 'ex06', zone: 'wrist',    title: 'Растяжка сгибателей запястья',           duration: '3×20 сек',  difficulty: 1, source: 'AAOS',                    minRoute: 'green', desc: 'Плавное растяжение ладонью к себе и от себя.' },
  { id: 'ex07', zone: 'hip',      title: 'Раскрытие таза «ракушка»',               duration: '2×15',      difficulty: 2, source: 'FIFA 11+',                minRoute: 'green', desc: 'Лёжа на боку, колени согнуты, отведение бедра.' },
  { id: 'ex08', zone: 'hamstring',title: 'Нордические сгибания (мягкая версия)',   duration: '2×6',       difficulty: 3, source: 'FIFA 11+',                minRoute: 'green', desc: 'Контролируемое опускание корпуса с фиксацией стоп.' },
  { id: 'ex09', zone: 'knee',     title: 'Неглубокий присед у стены',              duration: '3×30 сек',  difficulty: 1, source: 'ACSM',                    minRoute: 'green', desc: 'Опора спиной о стену, угол в коленях не более 60°.' },
  { id: 'ex10', zone: 'knee',     title: 'Степ-ап на низкую опору',                duration: '2×10/нога', difficulty: 2, source: 'FIFA 11+',                minRoute: 'green', desc: 'Шаг на платформу с контролем колена над стопой.' },
  { id: 'ex11', zone: 'shin',     title: 'Подъёмы на носки',                       duration: '3×15',      difficulty: 1, source: 'AAOS',                    minRoute: 'green', desc: 'Медленный подъём и опускание с ровной осанкой.' },
  { id: 'ex12', zone: 'ankle',    title: 'Балансировка на одной ноге',             duration: '3×30 сек',  difficulty: 2, source: 'FIFA 11+',                minRoute: 'green', desc: 'Удержание равновесия с лёгкой амортизацией стопы.' },
  { id: 'ex13', zone: 'general',  title: 'Разминка: суставная гимнастика',         duration: '5 минут',   difficulty: 1, source: 'ACSM',                    minRoute: 'green', desc: 'Последовательное прохождение всех суставов сверху вниз.' },
  { id: 'ex14', zone: 'general',  title: 'Активация мышц-стабилизаторов корпуса',  duration: '3×30 сек',  difficulty: 2, source: 'McGill Big 3',            minRoute: 'green', desc: 'Боковая планка с контролем нейтрального положения таза.' },
  { id: 'ex15', zone: 'general',  title: 'Дыхательное упражнение',                 duration: '4 минуты',  difficulty: 1, source: 'WHO Active',              minRoute: 'green', desc: 'Диафрагмальное дыхание 4-7-8 для снижения напряжения.' },
];

window.NL_PARTNERS = [
  {
    id: 'p1',
    name: 'Клиника спортивной медицины «Орто-Профи»',
    city: 'Владимир',
    address: 'ул. Большая Московская, 18',
    rating: 4.8, reviews: 312,
    nearest: 'Сегодня, 17:40',
    services: ['Спортивный врач', 'УЗИ опорно-двигательного аппарата'],
    distance: '1.2 км',
  },
  {
    id: 'p2',
    name: 'Центр восстановительной медицины «Активита»',
    city: 'Владимир',
    address: 'пр-т Ленина, 44',
    rating: 4.7, reviews: 187,
    nearest: 'Завтра, 09:15',
    services: ['Травматолог-ортопед', 'Кинезиологическое тестирование'],
    distance: '2.6 км',
  },
];

window.NL_DISCLAIMERS = {
  start:    'Сервис «НеЛомайся» — информационно-справочный. Он не ставит диагноз и не заменяет консультацию врача. При острой травме обращайтесь в службу 112.',
  routing:  'Ответы используются для подбора рекомендаций и маршрутизации. Это не заключение медицинского работника.',
  exercise: 'Выполняйте упражнение в безболевой амплитуде. При появлении боли — остановитесь и свяжитесь с врачом-партнёром.',
};

window.NL_ROUTES = {
  green: {
    code: 'green', label: 'Зелёный маршрут',
    title: 'Безопасная программа упражнений',
    summary: 'Ничего тревожного не нашли. Можно идти на тренировку — мы подобрали короткую программу под зону и уровень.',
    cta: 'Открыть программу',
  },
  yellow: {
    code: 'yellow', label: 'Жёлтый маршрут',
    title: 'Мягкая программа и наблюдение',
    summary: 'Заметили дискомфорт. Дадим адаптированный набор упражнений и предложим понаблюдать 7 дней. Не станет легче — переключим на врача-партнёра.',
    cta: 'Открыть мягкую программу',
  },
  red: {
    code: 'red', label: 'Красный маршрут',
    title: 'Лучше показаться спортивному врачу',
    summary: 'Самостоятельные упражнения сейчас не подходят. Подобрали клиники-партнёры в вашем городе.',
    cta: 'Подобрать врача',
  },
};
