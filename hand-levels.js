(function () {
  'use strict';

  const handRows = Array.from(document.querySelectorAll('[data-hand-row]'));
  const tableBody = document.getElementById('handLevelRows');
  const levelInput = document.getElementById('handLevelInput');
  const levelDown = document.getElementById('handLevelDown');
  const levelUp = document.getElementById('handLevelUp');
  const presetButtons = Array.from(document.querySelectorAll('[data-level-preset]'));
  const filterButtons = Array.from(document.querySelectorAll('[data-hand-filter]'));
  const sortSelect = document.getElementById('handLevelSort');
  const resultCount = document.getElementById('handLevelResultCount');
  const currentLevelLabel = document.getElementById('currentLevelLabel');
  const leaderName = document.getElementById('leaderName');
  const leaderScore = document.getElementById('leaderScore');
  const copyLinkButton = document.getElementById('copyHandLevelLink');

  if (!tableBody || !levelInput || handRows.length === 0) return;

  const formatter = new Intl.NumberFormat('en-US');
  const state = {
    level: 1,
    filter: 'all',
    sort: 'game'
  };

  function sanitizeLevel(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  }

  function readQueryState() {
    const params = new URLSearchParams(window.location.search);
    state.level = sanitizeLevel(params.get('level') || 1);

    const filter = params.get('filter');
    if (filter === 'regular' || filter === 'secret') state.filter = filter;

    const sort = params.get('sort');
    if (['game', 'score', 'base', 'chips', 'mult'].includes(sort)) state.sort = sort;
  }

  function rowData(row) {
    const baseChips = Number(row.dataset.baseChips);
    const baseMult = Number(row.dataset.baseMult);
    const chipsGrowth = Number(row.dataset.chipsGrowth);
    const multGrowth = Number(row.dataset.multGrowth);
    const chips = baseChips + (state.level - 1) * chipsGrowth;
    const mult = baseMult + (state.level - 1) * multGrowth;

    return {
      row,
      name: row.dataset.handName,
      order: Number(row.dataset.order),
      secret: row.dataset.secret === 'true',
      baseScore: baseChips * baseMult,
      chipsGrowth,
      multGrowth,
      chips,
      mult,
      score: chips * mult
    };
  }

  function compareRows(a, b) {
    if (state.sort === 'score') return b.score - a.score || a.order - b.order;
    if (state.sort === 'base') return b.baseScore - a.baseScore || a.order - b.order;
    if (state.sort === 'chips') return b.chipsGrowth - a.chipsGrowth || b.multGrowth - a.multGrowth || a.order - b.order;
    if (state.sort === 'mult') return b.multGrowth - a.multGrowth || b.chipsGrowth - a.chipsGrowth || a.order - b.order;
    return a.order - b.order;
  }

  function isVisible(data) {
    if (state.filter === 'secret') return data.secret;
    if (state.filter === 'regular') return !data.secret;
    return true;
  }

  function syncQueryState() {
    const url = new URL(window.location.href);

    if (state.level === 1) url.searchParams.delete('level');
    else url.searchParams.set('level', String(state.level));

    if (state.filter === 'all') url.searchParams.delete('filter');
    else url.searchParams.set('filter', state.filter);

    if (state.sort === 'game') url.searchParams.delete('sort');
    else url.searchParams.set('sort', state.sort);

    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function render() {
    const data = handRows.map(rowData).sort(compareRows);
    const visible = data.filter(isVisible);

    data.forEach((item) => {
      item.row.hidden = !isVisible(item);
      item.row.querySelector('[data-current-chips]').textContent = formatter.format(item.chips);
      item.row.querySelector('[data-current-mult]').textContent = formatter.format(item.mult);
      item.row.querySelector('[data-current-score]').textContent = formatter.format(item.score);
      tableBody.appendChild(item.row);
    });

    levelInput.value = String(state.level);
    currentLevelLabel.textContent = `Level ${formatter.format(state.level)}`;
    resultCount.textContent = `Showing ${visible.length} ${visible.length === 1 ? 'hand' : 'hands'} at Level ${formatter.format(state.level)}.`;

    const leader = visible.slice().sort((a, b) => b.score - a.score)[0];
    if (leader) {
      leaderName.textContent = leader.name;
      leaderScore.textContent = `${formatter.format(leader.chips)} Chips × ${formatter.format(leader.mult)} Mult`;
    }

    presetButtons.forEach((button) => {
      const active = Number(button.dataset.levelPreset) === state.level;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    filterButtons.forEach((button) => {
      const active = button.dataset.handFilter === state.filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    sortSelect.value = state.sort;
    syncQueryState();
  }

  function setLevel(value) {
    state.level = sanitizeLevel(value);
    render();
  }

  levelInput.addEventListener('change', () => setLevel(levelInput.value));
  levelInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setLevel(levelInput.value);
      levelInput.blur();
    }
  });
  levelDown.addEventListener('click', () => setLevel(Math.max(1, state.level - 1)));
  levelUp.addEventListener('click', () => setLevel(state.level + 1));

  presetButtons.forEach((button) => {
    button.addEventListener('click', () => setLevel(button.dataset.levelPreset));
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.handFilter;
      render();
    });
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    render();
  });

  copyLinkButton.addEventListener('click', async () => {
    const originalLabel = copyLinkButton.textContent;
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyLinkButton.textContent = 'Link copied';
    } catch (error) {
      const helper = document.createElement('textarea');
      helper.value = window.location.href;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
      copyLinkButton.textContent = 'Link copied';
    }
    window.setTimeout(() => {
      copyLinkButton.textContent = originalLabel;
    }, 1600);
  });

  readQueryState();
  render();
})();
