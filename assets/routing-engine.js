/* ============================================================
   Smart Routing Engine v2 — перебалансированный движок.
   Логика стала «человечнее»: не каждый, кто пришёл с лёгкой
   жалобой, попадает в красный/жёлтый. Профилактическая
   аудитория честно идёт в зелёный.
   ============================================================
   Соответствует Master Project Bible 1.1, разделы 11.1–11.3
   с допустимой калибровкой порогов.
   ============================================================ */

window.NL_routingEngine = (function () {
  /**
   * input = {
   *   zoneId: string,
   *   redflags: string[],
   *   answers: { [qid]: { value, limit, chronic? } }
   * }
   * → { route: 'green'|'yellow'|'red', nrs, limitScore, chronic, reasons[] }
   */
  function evaluate(input) {
    const reasons = [];
    const redflags = input.redflags || [];
    const answers  = input.answers  || {};

    // ===== Стоп-сигналы → красный =====
    if (redflags.length > 0) {
      reasons.push('Отмечены признаки, при которых самостоятельные упражнения не подходят — лучше показаться спортивному врачу.');
      return {
        route: 'red',
        nrs: answers.q_nrs?.value ?? null,
        limitScore: null,
        chronic: false,
        reasons,
      };
    }

    // ===== Сбор метрик =====
    const nrs = Number(answers.q_nrs?.value ?? 0);
    let limitScore = 0;
    let chronic = false;

    Object.values(answers).forEach(a => {
      if (typeof a.limit === 'number') limitScore += a.limit;
      if (a.chronic) chronic = true;
    });

    // ===== Красный — только серьёзные комбинации =====
    // NRS ≥ 8 (нестерпимая боль) ИЛИ хроника + сильные ограничения.
    if (nrs >= 8) {
      reasons.push('Очень высокая интенсивность боли по шкале — ' + nrs + ' из 10. Не лучшая ситуация для самостоятельной работы.');
      return { route: 'red', nrs, limitScore, chronic, reasons };
    }
    if (chronic && limitScore >= 2) {
      reasons.push('Боль беспокоит больше 6 недель и есть выраженные ограничения движения.');
      return { route: 'red', nrs, limitScore, chronic, reasons };
    }

    // ===== Жёлтый — заметный дискомфорт ИЛИ умеренные ограничения =====
    // NRS 5–7 ИЛИ limitScore ≥ 2 ИЛИ хроника без ограничений.
    if (nrs >= 5 || limitScore >= 2 || chronic) {
      if (nrs >= 7)      reasons.push('Боль на уровне ' + nrs + ' из 10 — выраженная, нагружать зону рано.');
      else if (nrs >= 5) reasons.push('Боль на уровне ' + nrs + ' из 10 — заметная, нужна аккуратная работа.');
      if (limitScore >= 2) reasons.push('Привычное движение в зоне даётся с ограничением.');
      if (chronic && limitScore < 2) reasons.push('Боль уже не первая неделя — стоит снизить нагрузку и понаблюдать.');
      return { route: 'yellow', nrs, limitScore, chronic, reasons };
    }

    // ===== Зелёный — профилактика и лёгкие жалобы =====
    if (nrs >= 3) {
      reasons.push('Лёгкий дискомфорт (' + nrs + ' из 10), но без признаков, которые требовали бы консультации.');
    } else if (nrs >= 1) {
      reasons.push('Минимальные ощущения — отличный момент для профилактической работы.');
    } else {
      reasons.push('Боли нет — это лучшее время заняться профилактикой и техникой.');
    }
    if (limitScore === 1) {
      reasons.push('Замечен лёгкий дискомфорт при движении — программа учитывает это.');
    }
    return { route: 'green', nrs, limitScore, chronic, reasons };
  }

  return { evaluate };
})();
