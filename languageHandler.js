(() => {
  const SUPPORTED = new Set(['cn', 'ja', 'ko', 'fr', 'de', 'es', 'ru']);

  function getCurrentPath() {
    return window.location.pathname || '/';
  }

  function isSeeds(pathname) {
    return pathname.includes('balatro-seeds.html');
  }

  function switchToLanguage(lang) {
    const pathname = getCurrentPath();
    const targetIsSeeds = isSeeds(pathname);

    if (lang === 'en') {
      window.location.href = targetIsSeeds ? '/balatro-seeds.html' : '/';
      return;
    }

    window.location.href = targetIsSeeds ? `/${lang}/balatro-seeds.html` : `/${lang}/`;
  }

  window.switchLanguage = function () {
    const select = document.getElementById('langSelect');
    if (!select) return;
    switchToLanguage(select.value);
  };

  (function initSelect() {
    const select = document.getElementById('langSelect');
    if (!select) return;
    const parts = getCurrentPath().split('/').filter(Boolean);
    const first = parts[0];
    select.value = SUPPORTED.has(first) ? first : 'en';
  })();
})();

