import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';

const STORAGE_KEY = 'gamedock-favorites-v1';
const form = document.querySelector('#add-form');
const gamesList = document.querySelector('#games-list');
const emptyState = document.querySelector('#empty-state');
const gameCount = document.querySelector('#game-count');
const toast = document.querySelector('#toast');
let games = loadGames();
let toastTimer;

function loadGames() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((game) => game && typeof game.id === 'string' && typeof game.title === 'string' && typeof game.url === 'string') : [];
  } catch {
    return [];
  }
}

function saveGames() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
}

function normalizeRobloxUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Проверь ссылку на игру.');
  }
  const isRobloxHost = url.hostname === 'roblox.com' || url.hostname.endsWith('.roblox.com');
  const isGameLink = /^\/games\/\d+(?:\/|$)/.test(url.pathname) || url.pathname === '/share' || url.searchParams.has('placeId');
  if (url.protocol !== 'https:' || !isRobloxHost || !isGameLink) {
    throw new Error('Нужна HTTPS-ссылка на игру с roblox.com.');
  }
  return url.toString();
}

function createGameCard(game, index) {
  const card = document.createElement('article');
  card.className = 'game-card';
  card.style.setProperty('--card-index', String(index));

  const tile = document.createElement('div');
  tile.className = 'game-tile';
  tile.setAttribute('aria-hidden', 'true');
  tile.textContent = game.title.trim().slice(0, 1).toLocaleUpperCase('ru');

  const info = document.createElement('div');
  info.className = 'game-info';
  const title = document.createElement('h3');
  title.textContent = game.title;
  const host = document.createElement('span');
  host.textContent = 'ROBLOX EXPERIENCE';
  info.append(title, host);

  const actions = document.createElement('div');
  actions.className = 'game-actions';
  const open = document.createElement('button');
  open.className = 'play-button';
  open.type = 'button';
  open.setAttribute('aria-label', `Открыть ${game.title} в Roblox`);
  open.innerHTML = '<span>Играть</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>';
  open.addEventListener('click', () => launchGame(game.url));

  const remove = document.createElement('button');
  remove.className = 'remove-button';
  remove.type = 'button';
  remove.setAttribute('aria-label', `Удалить ${game.title}`);
  remove.title = 'Убрать из списка';
  remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>';
  remove.addEventListener('click', () => {
    games = games.filter((item) => item.id !== game.id);
    saveGames();
    renderGames();
    showToast('Игра удалена с полки.');
  });

  actions.append(open, remove);
  card.append(tile, info, actions);
  return card;
}

function renderGames() {
  gamesList.replaceChildren(...games.map(createGameCard));
  emptyState.hidden = games.length > 0;
  gameCount.textContent = `${games.length} ${pluralize(games.length)}`;
}

function pluralize(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ИГРА';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'ИГРЫ';
  return 'ИГР';
}

async function launchGame(value) {
  const url = normalizeRobloxUrl(value);
  if (Capacitor.isNativePlatform()) {
    await AppLauncher.openUrl({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const title = String(data.get('title') || '').trim();
  let url;
  try {
    url = normalizeRobloxUrl(String(data.get('url') || ''));
  } catch (error) {
    showToast(error.message);
    return;
  }
  if (games.some((game) => game.url === url)) {
    showToast('Эта игра уже есть на полке.');
    return;
  }

  games.unshift({ id: crypto.randomUUID(), title, url });
  saveGames();
  renderGames();
  form.reset();
  document.querySelector('#game-title').focus();
  showToast('Игра добавлена.');
});

renderGames();