const form = document.querySelector('#feedback-form');
const button = form.querySelector('button[type="submit"]');
const status = document.querySelector('#feedback-status');
const email = form.elements.email;
const message = form.elements.message;
const back = document.querySelector('.feedback-back');

const english = {
  preparing: 'Loading spam protection…',
  sending: 'Sending…',
  success: 'Feedback sent. Thanks for helping improve BalatroCalc!',
  invalid: 'Enter a valid email and up to 2,000 characters of feedback.',
  verification: 'Spam verification failed. Please try again once verification is ready.',
  unavailable: 'The feedback form is unavailable. You can email support below.',
  delivery: 'We couldn’t send your feedback. Try again or email support below.'
};
const chinese = {
  back: '← 返回计算器',
  title: '提交反馈',
  intro: '遇到了什么问题？也欢迎告诉我们你希望 BalatroCalc 增加哪些功能。',
  message: '反馈内容',
  email: '邮箱',
  privacy: '我们会用这个邮箱跟进你的反馈。',
  submit: '发送反馈',
  policy: '隐私政策',
  support: '邮件联系',
  preparing: '正在加载防垃圾验证…',
  sending: '正在发送…',
  success: '反馈已发送，感谢你帮助改进 BalatroCalc！',
  invalid: '请输入有效邮箱，反馈内容最多 2,000 字符。',
  verification: '防垃圾验证失败，请等验证就绪后重试。',
  unavailable: '反馈表单暂不可用，可以通过下方邮箱联系我们。',
  delivery: '反馈发送失败。请重试，或通过下方邮箱联系我们。'
};

const referrer = document.referrer ? new URL(document.referrer) : null;
const fromSite = referrer?.origin === location.origin;
const locale = fromSite ? referrer.pathname.split('/')[1] : '';
const fromChinesePage = locale === 'cn' || locale === 'tw';
const useChinese = fromChinesePage || (!fromSite && /^zh(?:-|$)/i.test(navigator.language));
const copy = useChinese ? chinese : english;

if (useChinese) {
  document.documentElement.lang = 'zh-Hans';
  document.title = '提交反馈 | BalatroCalc';
  for (const node of document.querySelectorAll('[data-copy]')) {
    node.textContent = copy[node.dataset.copy];
  }
}
if (fromChinesePage) back.href = `/${locale}/`;

let token = '';
let widgetId;
let sending = false;

function setStatus(state) {
  status.dataset.state = state;
  status.textContent = copy[state] || '';
}

function updateButton() {
  button.disabled = sending || !token;
}

function resetToken() {
  token = '';
  updateButton();
}

async function loadVerification() {
  setStatus('preparing');
  try {
    const response = await fetch(form.action, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Feedback unavailable');
    const { siteKey } = await response.json();
    if (!siteKey) throw new Error('Missing site key');

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(reject, 12000);
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = () => { clearTimeout(timeout); reject(); };
      document.head.append(script);
    });

    widgetId = window.turnstile.render('#feedback-verification', {
      sitekey: siteKey,
      action: 'feedback',
      theme: 'dark',
      size: 'flexible',
      appearance: 'interaction-only',
      'response-field': false,
      callback(value) {
        token = value;
        if (status.dataset.state === 'preparing' || status.dataset.state === 'verification') setStatus('');
        updateButton();
      },
      'expired-callback': resetToken,
      'error-callback'() {
        resetToken();
        if (!sending) setStatus('verification');
      }
    });
  } catch {
    setStatus('unavailable');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sending || !token) return;

  const body = { email: email.value.trim(), message: message.value.trim(), token };
  if (!body.message) {
    setStatus('invalid');
    message.focus();
    return;
  }

  sending = true;
  updateButton();
  email.readOnly = message.readOnly = true;
  setStatus('sending');
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    const result = await response.json();
    if (response.ok && result.ok === true) {
      form.reset();
      setStatus('success');
    } else {
      const error = ['invalid', 'verification', 'unavailable'].includes(result.error) ? result.error : 'delivery';
      setStatus(error);
    }
  } catch {
    setStatus('delivery');
  } finally {
    sending = false;
    email.readOnly = message.readOnly = false;
    resetToken();
    window.turnstile.reset(widgetId);
  }
});

loadVerification();
