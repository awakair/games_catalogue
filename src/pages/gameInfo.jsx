import React, { useEffect, useState } from "react";
import { Game, getGameFromSheet } from "../fetchingApi";
import { useParams } from "react-router-dom";


const data = [[
    "",
    "Космические рейнджеры",                  // Наименование
    "Космические рейнджеры",                  // Серия
    "Платно",                                 // Распространение
    "1999-2002",                              // Годы разработки
    "2002",                                   // Год релиза
    "Elemental Games",                        // Разработчик (студия)
    "Дмитрий Гусаров (руководитель, геймдизайнер, программист), Юрий Нестеренко (сценарист), Алексей Дубовой (программист), Александр Язынин (художник), Виктор Краснокутский (композитор), Павел Стебаков (композитор), Григорий Семенов (композитор)", // Разработчики (команда)
    "1С",                                     // Издатель
    "PC",                                     // Платформы
    "Операционная система: Windows 98/Me/NT/2000/XP\nПроцессор: Pentium-233 MHz\nПамять: 64 Mb\nВидеокарта: 800*600, High Color (16 bit)\nЖесткий диск: 300 Mb\nCD-ROM: 4-x\nУправление: Мышь + Клавиатура", // Системные требования
    "CD",                                     // Носители
    "Одиночный",                              // Режим игры
    "Пошаговая стратегия, стратегия в реальном времени, космический симулятор, RPG, квест", // Жанр
    "Русский",                                // Языки
    "Я бы еще выпил...."
],
[
    "",
    "Магия крови (Dawn of Magic)", // Наименование
    "Магия крови (Dawn of Magic)", // Серия
    "Платно", // Распространение
    "2002-2005", // Годы разработки
    "2005 (Россия), 2007 (Европа и США)", // Год релиза
    "SkyFallen Entertainment", // Разработчик (студия)
    `Алексей Власов (креативный директор),
  Андрей Аксенов (технический директор),
  Алексей Баскаков, Евгений Бондаренко, Александр Володин (разработка)
  Максим Беляев, Александр Волошко, Владимир Воронов, Роман Заволожин, Сергей Крыжановский и др. (дизайн)`, // Разработчики (команда)
    "1C", // Издатель
    "PC", // Платформы
    `Процессор: CPU Pentium 4 1.5 ГГц (реком. 2.4 ГГц)
  ОЗУ: 512 МБ (реком. 1 ГБ);
  Видеокарта: nVidia GeForce 4 Ti4200 или ATI Radeon 9700 с 128 МБ (реком. GeForce FX 6800/ATI Radeon 9800);
  Жесткий диск: 2 ГБ
  Операционная система: Windows 2000/XP`, // Системные требования
    "DVD-ROM, CD-ROM", // Носители
    "Одиночный, многопользовательский (LAN, Internet)", // Режим игры
    "Action RPG", // Жанр
    "Русский, английский, немецкий, французский, итальянский", // Языки
    "Магия крови (Dawn of Magic) - коммерческая Action/RPG игра... [полное описание]", // Описание,
    "",
    "https://a6a.fr/wp-content/uploads/2022/12/y-of-an-Architect-.-1987-Peter-Greenaway-.-The-Belly-of-an-Architect-.-1987.jpg\n  "
]
];

function GameInfo() {
  const [game, setGame] = useState(null);
  const params = useParams();

  useEffect(() => {
    function mockFetch(){
      //const thisGame = await getGameFromSheet(2); - to be used in a prod
      let gameId = Number(params.id)
      const thisGame = new Game(gameId, data[gameId]??["You suck"]);
      setGame(thisGame);
    }
    mockFetch();
  }, [])

  return (
    <div className="app">
      <div className="container">
        <div className="top-section">
          <div className="left-column">
            <div id="photo-block">
              {game ? (<img src={game.images[0]} alt={game.title}></img>):
                (<span>Изображение не найдено. Идите нахуй...</span>)}</div>
            <div id="info-block">
              {game == null ? 
                (<span>Загрузка информации...</span>) :
                (<>
                  <h2>Наименование: {game.title}</h2>
                  <p><strong>Серия:</strong> {game.series}</p>
                  <p><strong>Распространение:</strong> {game.distribution}</p>
                  <p><strong>Годы разработки:</strong> {game.developmentYears}</p>
                  <p><strong>Год релиза:</strong> {game.releaseYear}</p>
                  <p><strong>Издатель:</strong> {game.publisher}</p>
                  <p><strong>Платформы:</strong> {game.platforms}</p>
                  <p><strong>Носитель:</strong> {game.media}</p>
                  <p><strong>Жанр:</strong> {game.genre}</p></>)
                }
            </div>
          </div>
          <div className="right-column">
            <div id="details-block">
            {game == null ? 
                (<span>Загрузка деталек... виталек...</span>) :
                (<>
                  <p><strong>Разработчик (студия):</strong> {game.developer}</p>
                  <p><strong>Разработчики (команда):</strong> {game.developers}</p>
                  <p><strong>Системные требования:</strong></p>
                  <div style={{whiteSpace: "pre-line", marginLeft: "10px"}}>{game.systemRequirements}</div>
                  <p><strong>Режим игры:</strong> {game.gameMode}</p>
                  <p><strong>Язык:</strong> {game.languages}</p>
                </>)
              }
            </div>
          </div>
        </div>
        <div id="description-block">
          {game == null ? (<span>Я бы еще выпил</span>) :
            (<>
              <h3>Описание:</h3>
              <div style={{whiteSpace: "pre-line"}}>{game.description}</div>
            </>)
          }
        </div>
      </div>
    </div>
  );
}

export default GameInfo;