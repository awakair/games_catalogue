// Конфигурация
const API_KEY = 'AIzaSyAPlP2ikyQApSEycb6TjXMm6KFSU1xDLac';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/11LNEc0vjQKZMKjk1oTmP9Iib86TB8Cv2xTOalWNdNTA/';
const PAGE_SIZE = 9;
const STORAGE_KEY = 'gameCatalogState'

// Класс Game (как у вас в примере)
class Game {
  constructor(id, rowData) {
    this.id = id;
    this.title = rowData[1] || '';
    this.series = rowData[2] || '';
    this.distribution = rowData[3] || '';
    this.developmentYears = rowData[4] || '';
    this.releaseYear = rowData[5] || '';
    this.developer = rowData[6] || '';
    this.developers = rowData[7] || '';
    this.publisher = rowData[8] || '';
    this.platforms = rowData[9] || '';
    this.systemRequirements = rowData[10] || '';
    this.media = rowData[11] || '';
    this.gameMode = rowData[12] || '';
    this.genre = rowData[13] || '';
    this.languages = rowData[14] || '';
    this.description = rowData[15] || '';
    this.recordAuthor = rowData[16] || '';
    this.images = rowData[17] ? rowData[17].split('\n').filter(url => url.trim()) : [];
    this.analysisLink = rowData[18] || '';
  }
}

// Функции для работы с API (как у вас в примере)
function extractSheetIdFromUrl(url) {
  const match = url.match(/\/d\/(.*?)(\/|$)/);
  return match ? match[1] : null;
}

async function getGameFromSheet(sheetUrl, id) {
  const sheetId = extractSheetIdFromUrl(sheetUrl);

  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL');
  }

  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A${id}:R${id}?key=${API_KEY}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.values || data.values.length === 0) {
    throw new Error(`Data for row ${id} not found`);
  }

  return new Game(id, data.values[0]);
}

async function getGamesFromSheetPaginated(sheetUrl, pageNumber = 0, pageSize = 10) {
  const sheetId = extractSheetIdFromUrl(sheetUrl);

  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL');
  }

  const startRow = (pageNumber * pageSize) + 2;
  const endRow = startRow + pageSize - 1;

  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A${startRow}:R${endRow}?key=${API_KEY}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.values || data.values.length === 0) {
    return [];
  }

  const games = [];

  for (let i = 0; i < data.values.length; i++) {
    const row = data.values[i];

    if (!row[1] && !row[15]) {
      continue;
    }

    const actualRowNumber = startRow + i;
    games.push(new Game(actualRowNumber, row));
  }

  return games;
}

function saveStateToStorage(page, gameId) {
  const state = {
    page: page,
    gameId: gameId,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getStateFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const state = JSON.parse(saved);
    return state.page || null;
  } catch (e) {
    console.error('Ошибка чтения из localStorage:', e);
    return null;
  }
}

function clearStorageState() {
  localStorage.removeItem(STORAGE_KEY);
}

// Функции для работы с DOM
function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}
let currentPage = 0;

function getCurrentPageFromURL() {
  const params = new URLSearchParams(window.location.search);
  const page = parseInt(params.get('page')) || 0;
  return Math.max(1, page) - 1;
}
// Функции для страницы каталога
async function loadCatalogPage(page = currentPage) {
  try {
    currentPage = page;
    updateUrlState({ page: currentPage });

    const gamesContainer = document.getElementById('games-container');
    gamesContainer.innerHTML = '<p>Загрузка данных...</p>';

    const games = await getGamesFromSheetPaginated(SHEET_URL, page, PAGE_SIZE);

    if (games.length === 0) {
      gamesContainer.innerHTML = '<p>Игры не найдены.</p>';
      return;
    }

    displayGames(games);
    await updatePagination();
  } catch (error) {
    console.error('Ошибка при загрузке игр:', error);
    document.getElementById('games-container').innerHTML = '<p>Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.</p>';
  }
}

function displayGames(games) {
  const container = document.getElementById('games-container');
  let html = '';

  games.forEach(game => {
    // Проверяем, есть ли изображения у игры
    const hasImage = game.images && game.images.length > 0;
    const firstImage = hasImage ? game.images[0] : '';

    html += `
      <div class="game-card">
        ${hasImage ? `
          <div class="game-image-container">
            <img src="${firstImage}" alt="${game.title}" class="game-image" />
            <div class="game-year-badge">${game.releaseYear || ''}</div>          
          </div>
        ` : ''}
        
        <div class="game-info">
          <h3 class="game-title">${game.title}</h3>
          <div class="game-meta">
            ${game.releaseYear && !hasImage ? `<span>${game.releaseYear}</span>` : ''}
            ${game.genre ? `<span>${game.genre}</span>` : ''}
            ${game.developer ? `<span>${game.developer}</span>` : ''}
          </div>
          ${game.description ? `
            <p class="game-description">${game.description}</p>
          ` : ''}
          <a href="#" class="read-more" data-id="${game.id}">Подробнее</a>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Добавляем обработчики событий для кнопок "Подробнее"
  document.querySelectorAll('.read-more').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const gameId = this.getAttribute('data-id');
      showGameDetails(gameId);
    });
  });
}

async function showGameDetails(gameId) {
  try {
    updateUrlState({ page: currentPage, gameId });
    const modal = document.getElementById('game-modal');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Загрузка...</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p>Загрузка данных об игре...</p>
      </div>
    `;

    modal.style.display = 'block';

    const game = await getGameFromSheet(SHEET_URL, gameId);
    displayGameDetails(game);

    // Обработчик закрытия модального окна
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  } catch (error) {
    console.error('Ошибка при загрузке деталей игры:', error);
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = '<p>Произошла ошибка при загрузке деталей игры.</p>';
    updateUrlState({ page: currentPage });
  }
}

function displayGameDetails(game) {
  const modal = document.getElementById('game-modal');
  const hasImage = game.images && game.images.length > 0;
  const firstImage = hasImage ? game.images[0] : '';

  const modalContent = `
    <div class="modal-header">
      <h3 class="modal-title">${game.title}</h3>
      <button class="close-modal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="game-details-grid">
        ${hasImage ? `
          <div class="game-details-image" style="background-image: url('${firstImage}')"></div>
        ` : ''}
        <div class="game-details-info">
          <p><span class="meta-label">Наименование:</span> ${game.title}</p>
          <p><span class="meta-label">Серия:</span> ${game.series}</p>
          <p><span class="meta-label">Распространение:</span> ${game.distribution}</p>
          <p><span class="meta-label">Год релиза:</span> ${game.releaseYear}</p>
          <p><span class="meta-label">Издатель:</span> ${game.publisher}</p>
          <p><span class="meta-label">Платформы:</span> ${game.platforms}</p>
          <p><span class="meta-label">Носители:</span> ${game.media}</p>
          <p><span class="meta-label"> Жанр:</span> ${game.genre}</p>
        </div>
        <div class="game-details-right_info">
          <p><span class="meta-label">Разработчик (студия):</span> ${game.developer}</p>
          <p><span class="meta-label">Разработчики (команда):</span> ${game.developers}</p>
          <p><span class="meta-label">Системные требования:</span> ${game.systemRequirements}</p>
          <p><span class="meta-label">Режим игры:</span> ${game.gameMode}</p>
          <p><span class="meta-label">Языки:</span> ${game.languages}</p>
        </div>
      </div>
      ${game.description ? `
        <div class="game-description-full">
          <h4>Описание</h4>
          <p>${game.description}</p>
        </div>
      ` : ''}
    </div>
  `;

  modal.querySelector('.modal-content').innerHTML = modalContent;

  // Обработчик закрытия модального окна
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
    updateURL(getPageFromURL(), null);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      updateURL(getPageFromURL(), null);
    }
  });
}

async function getTotalGamesCount() {
  try {
    const sheetId = extractSheetIdFromUrl(SHEET_URL);
    if (!sheetId) throw new Error('Invalid Google Sheet URL');

    // Получаем только первый столбец, чтобы определить количество строк
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:A?key=${API_KEY}`;

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);

    const data = await response.json();
    if (!data.values) return 0;

    // Первая строка - заголовки, поэтому общее количество игр = количество строк - 1
    return data.values.length - 1;
  } catch (error) {
    console.error('Ошибка при получении общего количества игр:', error);
    return 0;
  }
}

/**
 * Обновляет пагинацию с учетом общего количества страниц
 * @param {number} currentPage - Текущая страница (0-based)
 */
async function updatePagination() {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  // Получаем общее количество игр
  const totalGames = await getTotalGamesCount();
  const totalPages = Math.ceil(totalGames / PAGE_SIZE);

  // Если нет данных или всего одна страница - скрываем пагинацию
  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';

  let html = `
    <button class="prev" ${currentPage === 0 ? 'disabled' : ''}>&lt;</button>
  `;

  // Всегда показываем первую страницу
  html += `
    <button class="${currentPage === 0 ? 'active' : ''}">1</button>
  `;

  // Определяем диапазон страниц для отображения
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages - 1, currentPage + 2);

  // Если текущая страница в начале - показываем больше страниц справа
  if (currentPage < 3) {
    endPage = Math.min(totalPages - 1, 4);
  }
  // Если текущая страница в конце - показываем больше страниц слева
  else if (currentPage > totalPages - 4) {
    startPage = Math.max(1, totalPages - 5);
  }

  // Добавляем многоточие после первой страницы, если нужно
  if (startPage > 1) {
    html += `<span class="ellipsis">...</span>`;
  }

  // Добавляем средние страницы
  for (let i = startPage; i < endPage; i++) {
    html += `
      <button class="${i === currentPage ? 'active' : ''}">${i + 1}</button>
    `;
  }

  // Добавляем многоточие перед последней страницей, если нужно
  if (endPage < totalPages - 1) {
    html += `<span class="ellipsis">...</span>`;
  }

  // Добавляем последнюю страницу, если она не первая
  if (totalPages > 1) {
    html += `
      <button class="${currentPage === totalPages - 1 ? 'active' : ''}">${totalPages}</button>
    `;
  }

  html += `
    <button class="next" ${currentPage === totalPages - 1 ? 'disabled' : ''}>&gt;</button>
  `;

  pagination.innerHTML = html;

  // Обработчики для кнопок пагинации
  document.querySelector('.prev')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 0) {
      loadCatalogPage(currentPage - 1);
    }
  });

  document.querySelector('.next')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      loadCatalogPage(currentPage + 1);
    }
  });

  document.querySelectorAll('.pagination button:not(.prev):not(.next)').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const pageNum = parseInt(button.textContent) - 1;
      if (pageNum !== currentPage) {
        loadCatalogPage(pageNum);
      }
    });
  });
}

window.addEventListener('popstate', (event) => {
  if (event.state) {
    const { page, gameId } = event.state;
    currentPage = page !== undefined ? page : getCurrentPageFromURL();

    if (gameId) {
      showGameDetails(gameId);
    } else {
      loadCatalogPage(currentPage);
    }
  } else {
    currentPage = getCurrentPageFromURL();
    loadCatalogPage(currentPage);
  }

  // Всегда сохраняем текущее состояние
  saveStateToStorage(currentPage, getGameIdFromURL());
});

// Функции для модального окна с деталями игры

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();

  // Проверяем, на какой странице находимся
  const currentPath = window.location.pathname.split('/').pop();
  
  if (currentPath === 'analysis.html') {
    // Инициализация страницы анализа
    initAnalysisPage();
  } else if (currentPath === 'catalog.html') {
    // Инициализация страницы каталога
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = getCurrentPageFromURL();

    if (!urlParams.has('page')) {
      const savedPage = getStateFromStorage();
      if (savedPage !== null) {
        currentPage = savedPage;
      }
    }

    loadCatalogPage(currentPage);

    const gameId = urlParams.get('game');
    if (gameId) {
      setTimeout(() => showGameDetails(gameId), 100);
    }

    const modal = document.getElementById('game-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }
  }
});

function updateURL(page = null, gameId = null) {
  const params = new URLSearchParams(window.location.search);

  if (page !== null) {
    params.set('page', page);
  }

  if (gameId !== null) {
    params.set('game', gameId);
  } else {
    params.delete('game');
  }

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
}

// Обновляем URL с сохранением текущей страницы
function updateUrlState({ page, gameId }) {
  const params = new URLSearchParams(window.location.search);

  if (page !== undefined) {
    params.set('page', page + 1);
    currentPage = page;
    saveStateToStorage(page);
  }

  if (gameId !== undefined) {
    params.set('game', gameId);
  } else {
    params.delete('game');
  }

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({ page }, '', newUrl);
}

function getGameIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('game');
}


function closeModal() {
  const modal = document.getElementById('game-modal');
  modal.style.display = 'none';
  // Обновляем URL, удаляя параметр game
  updateUrlState({ page: currentPage });
}

async function getGamesWithAnalysis(sheetUrl) {
  const sheetId = extractSheetIdFromUrl(sheetUrl);
  if (!sheetId) throw new Error('Invalid Google Sheet URL');

  // Загружаем данные включая колонку S (анализ)
  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A2:S?key=${API_KEY}`;

  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);

  const data = await response.json();
  if (!data.values || data.values.length === 0) return [];

  const games = [];
  for (let i = 0; i < data.values.length; i++) {
    const row = data.values[i];
    // Проверяем, есть ли ссылка на анализ (колонка S)
    if (row[18] && row[18].trim() !== '') {
      const actualRowNumber = i + 2; // +2 потому что A2 и нумерация с 1
      games.push(new Game(actualRowNumber, row));
    }
  }

  return games;
}

function displayAnalysisCards(games) {
  const container = document.getElementById('analysis-container');
  container.innerHTML = ''; // Очищаем контейнер

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'analysis-card';
    
    card.innerHTML = `
      <h3 class="analysis-title">${game.title}</h3>
      ${game.releaseYear ? `<p class="analysis-year">${game.releaseYear}</p>` : ''}
      ${game.genre ? `<p class="analysis-genre">${game.genre}</p>` : ''}
      ${game.description ? `<p class="analysis-description">${game.description}</p>` : ''}
      <a href="${game.analysisLink}" class="download-btn" download>Скачать анализ</a>
    `;
    
    container.appendChild(card);
  });
}

async function initAnalysisPage() {
  try {
    const games = await getGamesWithAnalysis(SHEET_URL);
    if (games.length === 0) {
      document.getElementById('analysis-container').innerHTML = '<p>Аналитические материалы не найдены.</p>';
      return;
    }
    displayAnalysisCards(games);
  } catch (error) {
    console.error('Ошибка при загрузке аналитических материалов:', error);
    document.getElementById('analysis-container').innerHTML = '<p>Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.</p>';
  }
}