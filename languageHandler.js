(() => {
  const SUPPORTED = new Set([
    'cn', // zh-Hans
    'tw', // zh-Hant
    'ja',
    'ko',
    'fr',
    'de',
    'es',
    'it',
    'pt-br',
    'pt-pt',
    'ru',
    'uk',
    'pl',
    'nl',
    'sv',
    'no',
    'da',
    'fi',
    'tr',
    'ar',
    'he',
    'hi',
    'id',
    'vi',
    'th',
    'ms',
    'tl',
    'ro',
    'hu',
    'cs',
    'el',
  ]);

  function getCurrentPath() {
    return window.location.pathname || '/';
  }

  function parseLanguagePath(pathname) {
    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const parts = normalized.split('/').filter(Boolean);

    const hasLangPrefix = parts.length > 0 && SUPPORTED.has(parts[0]);
    const restParts = hasLangPrefix ? parts.slice(1) : parts;

    let restPath = restParts.length ? `/${restParts.join('/')}` : '/';
    if (normalized.endsWith('/') && restPath !== '/' && !restPath.endsWith('/')) {
      restPath += '/';
    }

    return {
      currentLang: hasLangPrefix ? parts[0] : 'en',
      restPath,
    };
  }

  function switchToLanguage(lang) {
    const { restPath } = parseLanguagePath(getCurrentPath());
    const rootOnlyPages = new Set([
      '/support.html',
      '/apk.html',
      '/debug.html',
      '/balatro-save-editor.html',
    ]);
    const effectiveRestPath = (lang !== 'en' && rootOnlyPages.has(restPath)) ? '/' : restPath;
    const prefix = lang === 'en' ? '' : `/${lang}`;
    const target = `${prefix}${effectiveRestPath}` || '/';
    window.location.href = `${target}${window.location.search || ''}${window.location.hash || ''}`;
  }

  window.switchLanguage = function () {
    const select = document.getElementById('langSelect');
    if (!select) return;
    switchToLanguage(select.value);
  };

  (function initSelect() {
    const select = document.getElementById('langSelect');
    if (!select) return;
    const { currentLang } = parseLanguagePath(getCurrentPath());
    select.value = currentLang;
  })();
})();
