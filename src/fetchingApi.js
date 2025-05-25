// Константы
const API_KEY = process.env.GOOGLE_SHIT_API; // вставьте сюда ваш API ключ
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${process.env.TABLE_ID}/`; // вставьте сюда URL вашей таблицы

/* Вспомогательная функция для извлечения ID таблицы из URL
 */
function extractSheetIdFromUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/* Получение данных о конкретной игре по ID (номер строки)
 */
export async function getGameFromSheet(id) {
  const sheetId = extractSheetIdFromUrl(SHEET_URL);
  if (!sheetId) throw new Error('Некорректный URL таблицы');
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A${id}:R${id}?key=${API_KEY}`;
  const response = await fetch(url);
  
  if (!response.ok) throw new Error("Ошибка при получении данных: ${response.statusText}");
  
  const data = await response.json();
  if (!data.values || data.values.length === 0) throw new Error('Данные не найдены');
  
  return new Game(id, data.values[0]);
}

/**
 * Класс данных игры
 */
export class Game {
  constructor(id, rowData) {
    this.id = id;
    this.title = rowData[1];
    this.series = rowData[2];
    this.distribution = rowData[3];
    this.developmentYears = rowData[4];
    this.releaseYear = rowData[5];
    this.developer = rowData[6];
    this.developers = rowData[7];
    this.publisher = rowData[8];
    this.platforms = rowData[9];
    this.systemRequirements = rowData[10];
    this.media = rowData[11];
    this.gameMode = rowData[12];
    this.genre = rowData[13];
    this.languages = rowData[14];
    this.description = rowData[15];
    this.images = rowData[17] ? rowData[17].split('\n').filter(u => u.trim()) : [];
  }
}

/**
 * Заполняем страницу данными о игре
 */
function fillGameData(game) {
  // Фото
  const photoDiv = document.getElementById('photo-block');
  if (game.images.length > 0) {
    photoDiv.innerHTML = '<img src="${game.images[0]}" alt="${game.title}">';
  } else {
    photoDiv.innerHTML = 'Изображение не найдено';
  }
  
  // Информация (наименование, издатель, жанр)
  const infoDiv = document.getElementById('info-block');
  infoDiv.innerHTML = `
    <h2>Наименование: ${game.title}</h2>
    <p><strong>Серия:</strong> ${game.series}</p>
    <p><strong>Распространение:</strong> ${game.distribution}</p>
    <p><strong>Годы разработки:</strong> ${game.developmentYears}</p>
    <p><strong>Год релиза:</strong> ${game.releaseYear}</p>
    <p><strong>Издатель:</strong> ${game.publisher}</p>
    <p><strong>Платформы:</strong> ${game.platforms}</p>
    <p><strong>Носитель:</strong> ${game.media}</p>
    <p><strong>Жанр:</strong> ${game.genre}</p>
  `;
  
  // Детали (разработчик, системные требования и т.д.)
  const detailsDiv = document.getElementById('details-block');
  detailsDiv.innerHTML = `
    <p><strong>Разработчик (студия):</strong> ${game.developer}</p>
    <p><strong>Разработчики (команда):</strong> ${game.developers}</p>
    <p><strong>Системные требования:</strong></p>
    <div style="white-space: pre-line; margin-left: 10px;">${game.systemRequirements}</div>
    <p><strong>Режим игры:</strong> ${game.gameMode}</p>
    <p><strong>Язык:</strong> ${game.languages}</p>
  `;
  
  // Описание
  const descDiv = document.getElementById('description-block');
  descDiv.innerHTML = `
    <h3>Описание:</h3>
    <div style="white-space: pre-line;">${game.description}</div>
  `;
}

/*
// Пример вызова - загрузить игру по ID
// Можно заменить на динамическую загрузку по URL или по событию
const gameId = 2; // например, получить из URL
getGameFromSheet(gameId)
  .then(fillGameData)
  .catch(console.error);*/

