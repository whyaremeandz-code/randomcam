const STORAGE_KEY = 'moment-ai-settings';
const defaults = {
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'openai/gpt-4o-mini',
  apiKey: '',
  googleKey: '',
  searchEngineId: '',
};
const settings = { ...defaults, ...readSettings() };
const conversation = [];

const elements = {
  prompt: document.querySelector('#prompt'),
  send: document.querySelector('#send'),
  appMode: document.querySelector('#app-mode'),
  messages: document.querySelector('#messages'),
  welcome: document.querySelector('#welcome'),
  search: document.querySelector('#web-search'),
  dialog: document.querySelector('#settings-dialog'),
  form: document.querySelector('#settings-form'),
  previewDialog: document.querySelector('#preview-dialog'),
  previewFrame: document.querySelector('#app-preview'),
};

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function fillSettingsForm() {
  for (const [name, value] of Object.entries(settings)) {
    const field = elements.form.elements.namedItem(name);
    if (field) field.value = value;
  }
}

function showToast(message) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderInline(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
  safe = safe.replace(/\[(\d+)\]/g, '<sup>[$1]</sup>');
  safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return safe;
}

function openAppPreview(source) {
  const policy = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">';
  const html = /<head(?:\s[^>]*)?>/i.test(source)
    ? source.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}${policy}`)
    : `${policy}${source}`;
  elements.previewFrame.srcdoc = html;
  elements.previewDialog.showModal();
}

function renderMarkdown(text, container) {
  container.replaceChildren();
  const blocks = text.split(/```([^\n]*)\n([\s\S]*?)```/g);
  for (let index = 0; index < blocks.length; index += 1) {
    if (index % 3 === 1) {
      const code = document.createElement('pre');
      const language = blocks[index].trim();
      const source = blocks[index + 1];
      const codeElement = document.createElement('code');
      codeElement.textContent = source;
      if (language) codeElement.dataset.language = language;
      code.append(codeElement);
      const actions = document.createElement('div');
      actions.className = 'code-actions';
      const copy = document.createElement('button');
      copy.className = 'code-copy';
      copy.type = 'button';
      copy.textContent = 'Копировать';
      copy.addEventListener('click', async () => {
        await navigator.clipboard.writeText(source);
        copy.textContent = 'Готово';
        window.setTimeout(() => { copy.textContent = 'Копировать'; }, 1500);
      });
      actions.append(copy);
      if (/^(html|html5|htm|xhtml)$/i.test(language)) {
        const preview = document.createElement('button');
        preview.className = 'code-preview';
        preview.type = 'button';
        preview.textContent = 'Открыть';
        preview.addEventListener('click', () => openAppPreview(source));
        actions.append(preview);
      }
      code.append(actions);
      container.append(code);
    } else if (index % 3 === 0) {
      const lines = blocks[index].split('\n');
      let list = null;
      let listType = '';
      for (const line of lines) {
        const item = line.match(/^\s*[-*]\s+(.+)|^\s*\d+\.\s+(.+)/);
        if (item) {
          const type = item[2] ? 'ol' : 'ul';
          if (type !== listType) {
            list = document.createElement(type);
            container.append(list);
            listType = type;
          }
          const li = document.createElement('li');
          li.innerHTML = renderInline(item[1] || item[2]);
          list.append(li);
        } else {
          list = null;
          listType = '';
          if (line.trim()) {
            const paragraph = document.createElement('p');
            paragraph.innerHTML = renderInline(line);
            container.append(paragraph);
          }
        }
      }
    }
  }
}

function appendMessage(role, content = '') {
  const message = document.createElement('article');
  message.className = `message ${role}`;
  if (role === 'assistant') {
    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = 'MOMENT AI';
    message.append(label);
    const body = document.createElement('div');
    body.className = 'message-content';
    message.append(body);
    if (content) renderMarkdown(content, body);
  } else {
    message.textContent = content;
  }
  elements.messages.append(message);
  elements.welcome.hidden = true;
  message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return message;
}

function appendSources(message, sources) {
  if (!sources.length) return;
  const list = document.createElement('div');
  list.className = 'sources';
  const title = document.createElement('div');
  title.className = 'sources-title';
  title.textContent = 'ИСТОЧНИКИ';
  list.append(title);
  sources.forEach((source, index) => {
    const link = document.createElement('a');
    link.className = 'source-link';
    link.href = source.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const number = document.createElement('span');
    number.className = 'source-number';
    number.textContent = `[${index + 1}]`;
    const label = document.createElement('span');
    label.textContent = source.title;
    link.append(number, label);
    list.append(link);
  });
  message.append(list);
}

async function searchGoogle(query) {
  if (!settings.googleKey || !settings.searchEngineId) return [];
  const params = new URLSearchParams({
    key: settings.googleKey,
    cx: settings.searchEngineId,
    q: query,
    num: '5',
  });
  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error?.message || `Google Search: HTTP ${response.status}`);
  }
  const data = await response.json();
  return (data.items || []).map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet || '',
  }));
}

function assistantPrompt(sources) {
  const base = 'Ты полезный AI-помощник. Отвечай на языке пользователя, ясно и по существу. Умей писать и объяснять код, приводи рабочие примеры. Не выдумывай факты и признавай неопределённость. Для важных утверждений используй нумерованные ссылки на источники в формате [1].';
  if (!sources.length) return base;
  const context = sources.map((source, index) => `[${index + 1}] ${source.title}\n${source.snippet}\nURL: ${source.link}`).join('\n\n');
  return `${base}\n\nИспользуй найденные материалы, если они относятся к вопросу. Указывай номера источников рядом с подтверждаемыми утверждениями. Если источники не отвечают на вопрос, скажи об этом.\n\nРезультаты Google Search:\n${context}`;
}

function appBuilderPrompt() {
  return 'Ты создаёшь небольшие приложения, которые должны сразу запускаться внутри мобильного предпросмотра. В ответе кратко опиши результат, затем выдай ровно один полный самодостаточный HTML-документ в блоке ```html. Весь CSS и JavaScript помести внутрь этого HTML. Интерфейс делай mobile-first, удобным для касаний и адаптивным. Не используй внешние библиотеки, загрузки, изображения, API, сеть, localStorage или установку пакетов: предпросмотр работает в изолированном sandbox iframe без доступа к сети и хранилищу. Не выдавай вместо приложения только план или фрагменты кода. Если задача требует нативных функций iOS (SwiftUI, камера, уведомления, системные API), честно укажи, что в предпросмотре доступна только веб-версия.';
}

async function streamAnswer(messages, onChunk, signal) {
  const baseUrl = settings.baseUrl.replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({ model: settings.model, messages, stream: true }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error?.message || `API модели: HTTP ${response.status}`);
  }
  if (!response.body) throw new Error('Провайдер не поддерживает потоковую передачу.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let answer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const events = pending.split('\n');
    pending = events.pop() || '';
    for (const event of events) {
      if (!event.startsWith('data:')) continue;
      const data = event.slice(5).trim();
      if (data === '[DONE]') return answer;
      try {
        const chunk = JSON.parse(data).choices?.[0]?.delta?.content;
        if (typeof chunk === 'string') {
          answer += chunk;
          onChunk(answer);
        } else if (Array.isArray(chunk)) {
          for (const part of chunk) {
            if (part.type === 'text' && typeof part.text === 'string') {
              answer += part.text;
              onChunk(answer);
            }
          }
        }
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  }
  return answer;
}

async function sendMessage(text) {
  const question = text.trim();
  if (!question || elements.send.disabled) return;
  const appMode = elements.appMode.getAttribute('aria-pressed') === 'true';
  if (!settings.apiKey) {
    elements.dialog.showModal();
    showToast('Сначала укажите API-ключ модели в настройках.');
    return;
  }

  elements.prompt.value = '';
  elements.prompt.style.height = 'auto';
  elements.send.disabled = true;
  elements.appMode.disabled = true;
  elements.search.disabled = true;
  conversation.push({ role: 'user', content: question });
  appendMessage('user', question);
  const answerMessage = appendMessage('assistant');
  const answerBody = answerMessage.querySelector('.message-content');
  const typing = document.createElement('span');
  typing.className = 'typing';
  typing.innerHTML = '<i></i><i></i><i></i>';
  answerBody.append(typing);
  const controller = new AbortController();

  try {
    let sources = [];
    if (!appMode && elements.search.checked && settings.googleKey && settings.searchEngineId) {
      sources = await searchGoogle(question);
    } else if (!appMode && elements.search.checked) {
      showToast('Добавьте Google API key и CX в настройках, чтобы включить поиск.');
    }
    const requestMessages = [
      { role: 'system', content: appMode ? appBuilderPrompt() : assistantPrompt(sources) },
      ...conversation,
    ];
    let answer = '';
    answer = await streamAnswer(requestMessages, (content) => {
      typing.remove();
      renderMarkdown(content, answerBody);
    }, controller.signal);
    if (!answer) answer = 'Модель вернула пустой ответ. Попробуйте ещё раз.';
    conversation.push({ role: 'assistant', content: answer });
    appendSources(answerMessage, sources);
  } catch (error) {
    typing.remove();
    const message = error.name === 'AbortError' ? 'Запрос отменён.' : error.message;
    renderMarkdown(`Не удалось получить ответ: ${message}`, answerBody);
    conversation.pop();
  } finally {
    elements.send.disabled = false;
    elements.appMode.disabled = false;
    elements.search.disabled = elements.appMode.getAttribute('aria-pressed') === 'true';
    elements.prompt.focus();
  }
}

document.querySelector('#open-settings').addEventListener('click', () => {
  fillSettingsForm();
  elements.dialog.showModal();
});

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(elements.form));
  Object.assign(settings, values);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  elements.dialog.close();
  showToast('Настройки сохранены на устройстве.');
});

elements.send.addEventListener('click', () => sendMessage(elements.prompt.value));
elements.appMode.addEventListener('click', () => {
  const enabled = elements.appMode.getAttribute('aria-pressed') !== 'true';
  elements.appMode.setAttribute('aria-pressed', String(enabled));
  elements.search.disabled = enabled;
  elements.prompt.placeholder = enabled ? 'Опиши приложение, которое хочешь запустить...' : 'Спросите о чём угодно...';
});
elements.prompt.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage(elements.prompt.value);
  }
});
elements.prompt.addEventListener('input', () => {
  elements.prompt.style.height = 'auto';
  elements.prompt.style.height = `${Math.min(elements.prompt.scrollHeight, 150)}px`;
});
document.querySelectorAll('.suggestion').forEach((button) => {
  button.addEventListener('click', () => sendMessage(button.dataset.prompt));
});
document.querySelector('#new-chat').addEventListener('click', () => {
  conversation.length = 0;
  elements.messages.replaceChildren();
  elements.welcome.hidden = false;
  elements.prompt.focus();
});
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

fillSettingsForm();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}