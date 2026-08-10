(function () {
  'use strict';

  const form = document.getElementById('handSizeForm');
  const deck = document.getElementById('handSizeDeck');
  const paintBrush = document.getElementById('paintBrush');
  const palette = document.getElementById('palette');
  const turtleBean = document.getElementById('turtleBeanBonus');
  const ectoplasm = document.getElementById('ectoplasmUses');
  const valueOutput = document.getElementById('maxHandSizeValue');
  const equationOutput = document.getElementById('handSizeEquation');
  const breakdownOutput = document.getElementById('handSizeBreakdown');
  const floorNote = document.getElementById('handSizeFloorNote');
  const trackFill = document.getElementById('capacityTrackFill');
  const resetButton = document.getElementById('resetHandSize');

  if (!form || !deck || !valueOutput) return;

  const counterLabels = {
    jugglerCopies: 'Juggler',
    troubadourCopies: 'Troubadour',
    merryAndyCopies: 'Merry Andy',
    stuntmanCopies: 'Stuntman',
    ouijaUses: 'Ouija'
  };

  function wholeNumber(input) {
    const minimum = Number(input.min || 0);
    const maximum = Number(input.max || Number.MAX_SAFE_INTEGER);
    const parsed = Number.parseInt(input.value, 10);
    const normalized = Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : minimum;
    input.value = String(normalized);
    return normalized;
  }

  function signed(number) {
    if (number > 0) return `+${number}`;
    if (number < 0) return `−${Math.abs(number)}`;
    return '0';
  }

  function addBreakdown(list, label, modifier) {
    if (modifier === 0) return;
    list.push({ label, modifier });
  }

  function calculateHandSize() {
    const base = Number(deck.value) || 8;
    const breakdown = [{ label: base === 10 ? 'Painted Deck base' : 'Normal deck base', modifier: base }];
    const equationParts = [String(base)];
    let rawTotal = base;

    for (const checkbox of form.querySelectorAll('input[type="checkbox"][data-flat-modifier]')) {
      if (!checkbox.checked) continue;
      const modifier = Number(checkbox.dataset.flatModifier) || 0;
      const label = checkbox.closest('label')?.querySelector('b')?.textContent || checkbox.id;
      rawTotal += modifier;
      equationParts.push(signed(modifier));
      addBreakdown(breakdown, label, modifier);
    }

    for (const input of form.querySelectorAll('input[type="number"][data-per-copy]')) {
      const count = wholeNumber(input);
      const modifier = count * (Number(input.dataset.perCopy) || 0);
      rawTotal += modifier;
      if (modifier !== 0) equationParts.push(signed(modifier));
      addBreakdown(breakdown, `${counterLabels[input.id] || input.id} × ${count}`, modifier);
    }

    const turtleBonus = Number(turtleBean.value) || 0;
    rawTotal += turtleBonus;
    if (turtleBonus) equationParts.push(signed(turtleBonus));
    addBreakdown(breakdown, 'Turtle Bean current bonus', turtleBonus);

    const ectoplasmUses = wholeNumber(ectoplasm);
    const ectoplasmPenalty = -(ectoplasmUses * (ectoplasmUses + 1) / 2);
    rawTotal += ectoplasmPenalty;
    if (ectoplasmPenalty) equationParts.push(signed(ectoplasmPenalty));
    addBreakdown(breakdown, `Ectoplasm × ${ectoplasmUses}`, ectoplasmPenalty);

    const effectiveTotal = Math.max(0, rawTotal);
    valueOutput.textContent = String(effectiveTotal);
    equationOutput.textContent = `${equationParts.join(' ')} = ${rawTotal}${rawTotal < 0 ? ` → ${effectiveTotal} floor` : ''}`;
    floorNote.hidden = rawTotal >= 0;
    trackFill.style.width = `${Math.min(100, Math.max(0, effectiveTotal / 20 * 100))}%`;
    valueOutput.parentElement.dataset.sizeState = effectiveTotal < 8 ? 'low' : effectiveTotal > 10 ? 'high' : 'normal';

    breakdownOutput.innerHTML = breakdown.map((item) => {
      const display = item === breakdown[0] ? String(item.modifier) : signed(item.modifier);
      return `<li>${item.label}<b>${display}</b></li>`;
    }).join('');
  }

  palette.addEventListener('change', () => {
    if (palette.checked) paintBrush.checked = true;
    calculateHandSize();
  });

  paintBrush.addEventListener('change', () => {
    if (!paintBrush.checked) palette.checked = false;
    calculateHandSize();
  });

  form.addEventListener('input', calculateHandSize);
  form.addEventListener('change', calculateHandSize);
  form.addEventListener('submit', (event) => event.preventDefault());

  resetButton.addEventListener('click', () => {
    form.reset();
    calculateHandSize();
  });

  const methodRows = Array.from(document.querySelectorAll('[data-method-row]'));
  const methodFilters = Array.from(document.querySelectorAll('[data-method-filter]'));
  const methodResultCount = document.getElementById('methodResultCount');

  function filterMethods(filter) {
    let visibleCount = 0;
    for (const row of methodRows) {
      const visible = filter === 'all' || row.dataset.methodType === filter;
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    }

    for (const button of methodFilters) {
      const active = button.dataset.methodFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }

    const label = filter === 'all' ? 'hand-size methods' : `${filter} methods`;
    methodResultCount.textContent = `Showing ${visibleCount} ${label}.`;
  }

  for (const button of methodFilters) {
    button.addEventListener('click', () => filterMethods(button.dataset.methodFilter || 'all'));
  }

  calculateHandSize();
})();
