// Конфигурация
const API_KEY = 'AIzaSyAPlP2ikyQApSEycb6TjXMm6KFSU1xDLac';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/11LNEc0vjQKZMKjk1oTmP9Iib86TB8Cv2xTOalWNdNTA/';
const PAGE_SIZE = 9;

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

// Функции для страницы каталога
async function loadCatalogPage(page = 0) {
  try {
    const gamesContainer = document.getElementById('games-container');
    gamesContainer.innerHTML = '<p>Загрузка данных...</p>';
    
    const games = await getGamesFromSheetPaginated(SHEET_URL, page, PAGE_SIZE);
    
    if (games.length === 0) {
      gamesContainer.innerHTML = '<p>Игры не найдены.</p>';
      return;
    }
    
    displayGames(games);
    updatePagination(page);
  } catch (error) {
    console.error('Ошибка при загрузке игр:', error);
    document.getElementById('games-container').innerHTML = '<p>Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.</p>';
  }
}

function displayGames(games) {
  const container = document.getElementById('games-container');
  let html = '';
  
  games.forEach(game => {
    const firstImage = game.images.length > 0 ? game.images[0] : 'https://via.placeholder.com/300x200?text=No+Image';
    
    html += `
      <div class="game-card">
        <div class="game-image" style="background-image: url('${firstImage}')"></div>
        <div class="game-info">
          <h3 class="game-title">${game.title}</h3>
          <div class="game-meta">
            <span>${game.releaseYear}</span> · 
            <span>${game.genre}</span> · 
            <span>${game.developer}</span>
          </div>
          <p class="game-description">${game.description || 'Описание отсутствует'}</p>
          <a href="#" class="read-more" data-id="${game.id}">Подробнее</a>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Добавляем обработчики событий для кнопок "Подробнее"
  document.querySelectorAll('.read-more').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const gameId = this.getAttribute('data-id');
      showGameDetails(gameId);
    });
  });
}

async function showGameDetails(gameId) {
  try {
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
  }
}

function displayGameDetails(game) {
  const modal = document.getElementById('game-modal');
  const firstImage = game.images.length > 0 ? game.images[0] : 'https://via.placeholder.com/600x400?text=No+Image';
  
  const modalContent = `
    <div class="modal-header">
      <h3 class="modal-title">${game.title}</h3>
      <button class="close-modal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="game-details-grid">
        <div class="game-details-image" style="background-image: url('${firstImage}')"></div>
        <div class="game-details-info">
          <p><span class="meta-label">Год выпуска:</span> ${game.releaseYear}</p>
          <p><span class="meta-label">Жанр:</span> ${game.genre}</p>
          <p><span class="meta-label">Разработчик:</span> ${game.developer}</p>
          <p><span class="meta-label">Издатель:</span> ${game.publisher}</p>
          <p><span class="meta-label">Платформы:</span> ${game.platforms}</p>
          <p><span class="meta-label">Режим игры:</span> ${game.gameMode}</p>
        </div>
      </div>
      <div class="game-description-full" style="margin-top: 1.5rem;">
        <h4>Описание</h4>
        <p>${game.description || 'Описание отсутствует'}</p>
      </div>
    </div>
  `;
  
  modal.querySelector('.modal-content').innerHTML = modalContent;
  
  // Обработчик закрытия модального окна
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
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
async function updatePagination(currentPage) {
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
  document.querySelector('.prev')?.addEventListener('click', () => {
    if (currentPage > 0) {
      loadCatalogPage(currentPage - 1);
    }
  });
  
  document.querySelector('.next')?.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
      loadCatalogPage(currentPage + 1);
    }
  });
  
  // Обработчики для номеров страниц
  document.querySelectorAll('.pagination button:not(.prev):not(.next)').forEach(button => {
    const pageNum = parseInt(button.textContent) - 1;
    button.addEventListener('click', () => {
      if (pageNum !== currentPage) {
        loadCatalogPage(pageNum);
      }
    });
  });
}

// Функции для модального окна с деталями игры

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  
  // Инициализация страницы каталога
  if (document.getElementById('games-container')) {
    loadCatalogPage(0);
    
    // Обработчик для поиска
    document.querySelector('.search-box input')?.addEventListener('input', function() {
      // В реальном приложении здесь должна быть логика фильтрации
      console.log('Поиск:', this.value);
    });
    
    // Обработчики для фильтров
    document.getElementById('genre-filter')?.addEventListener('change', function() {
      console.log('Выбран жанр:', this.value);
    });
    
    document.getElementById('year-filter')?.addEventListener('change', function() {
      console.log('Выбран год:', this.value);
    });
  }
  
  // Инициализация модального окна (если есть на странице)
  const modal = document.getElementById('game-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
});