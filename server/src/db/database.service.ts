import { Injectable, OnModuleInit } from '@nestjs/common';
import sqlite3 from 'sqlite3';
import path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db!: sqlite3.Database;

  onModuleInit() {
    const dbPath = path.join('/root/.openclaw/workspace/db_data', 'storyera.db');
    this.db = new sqlite3.Database(dbPath);

    this.db.serialize(() => {
      this.db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, is_premium INTEGER DEFAULT 0, is_verified INTEGER DEFAULT 0, created_at TEXT NOT NULL)`);
      this.db.run(`CREATE TABLE IF NOT EXISTS pending_users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)`);
      this.db.run(`CREATE TABLE IF NOT EXISTS user_story_progress (user_id INTEGER NOT NULL, story_id INTEGER NOT NULL, chat_history TEXT, story_state TEXT, choices_count INTEGER DEFAULT 0, last_scene_summary TEXT, last_user_choice TEXT, updated_at TEXT, language TEXT, PRIMARY KEY(user_id, story_id))`);
      this.db.run(`CREATE TABLE IF NOT EXISTS user_bookmarks (user_id INTEGER NOT NULL, story_id INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(user_id, story_id))`);
      this.db.run(`DROP TABLE IF EXISTS stories`);
      this.db.run(`CREATE TABLE stories (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, tags_json TEXT NOT NULL, image TEXT NOT NULL, rating REAL NOT NULL, plays INTEGER NOT NULL, mature INTEGER NOT NULL, created_at TEXT NOT NULL, protagonist_json TEXT NOT NULL, characters_json TEXT NOT NULL, plot_json TEXT NOT NULL)`);
      
      this.seedStories();
    });
  }

  getDatabase(): sqlite3.Database {
    return this.db;
  }

  private seedStories() {
    const seedStories = [
      { 
        title: "Пламя Дракона", 
        description: "Ты — последний драконорожденный. Когда ты просыпаешься в огненном гнезде, она уже ждёт тебя — древняя драконша, пережившая гибель своего рода. В её мире сила определяется связью, а притяжение невозможно игнорировать. Она видит в тебе не просто союзника, а ключ к возрождению гнезда. Но чем глубже ты погружаешься в её власть, тем сложнее понять — где заканчивается твоя воля и начинается её. И когда между вами вспыхивает нечто большее, чем просто магия, тебе предстоит сделать выбор, который изменит не только тебя… но и саму природу мира.", 
        category: "Тёмное фэнтези / monster romance", 
        tags: ["dark fantasy", "monster romance", "knotting", "breeding", "ritual BDSM", "primal heat", "size difference"], 
        image: "/dragon_flame_cover.jpg", 
        protagonist: { 
            name: "Драконорожденный", 
            gender: "Male", 
            age: "27",
            archetype: "Warrior",
            description: "Смелый до безрассудства, с твёрдым внутренним кодексом. Древняя кровь делает его особенно восприимчивым к магическим связям."
        }, 
        characters: [
            { name: "Лирия Веларис", role: "Древняя драконица, доминантная, саркастичная, ищет равного партнера" }, 
            { name: "Селена Вайр", role: "Эльфийка, провокатор" }, 
            { name: "Аэлир", role: "Древняя сущность, хранитель" }, 
            { name: "Каэл Дорн", role: "Инквизитор, антагонист" },
            { name: "Мирелла Вайр", role: "Эльфийский стратег, манипулятор" },
            { name: "Рагн Тар’Вел", role: "Свободный драконорожденный, символ полной автономии" }
        ], 
        plot: { 
            opening: ["Древние руины гудят.", "Ты в центре огненного гнезда, освобождённый от цепей. Перед тобой — Лирия."], 
            starter_choices: ["«Кто ты?»", "«Это ты?»", "Коснуться её"], 
            chapters: [
                "Пробуждение в огне", "Зов крови", "Ритуал пробуждения", "Тень в гнезде", 
                "Испытание границ", "Дорога к храму", "Пламя испытаний", "Разрыв контроля", 
                "Ритуал гнезда", "Война внутри гнезда", "Испытание власти", "Возрождение или разрушение"
            ], 
            summary: "Мир Эйра — это тёмное фэнтези-пространство, где магия рождается из эмоций, желания и стремления к власти. Когда-то драконы сформировали саму основу реальности, и их природа до сих пор влияет на мир: притяжение между существами здесь имеет физическую силу, а близость способна создавать магические связи, меняющие как личности, так и окружающую среду. Драконья кровь усиливает эмоции и делает носителей особенно восприимчивыми к таким связям, которые могут строиться на доминировании, равновесии или подчинении. Центральное значение имеют гнёзда — живые территории, отражающие отношения между теми, кто в них находится, и усиливающие их внутренние состояния." 
        } 
      },
      { title: "Кровавый Контракт", description: "Случайный контракт сделал тебя собственностью древней вампирши.", category: "Romance", tags: ["dark romance", "vampire", "yandere"], image: "/vampire_contract_cover.jpg", protagonist: { name: "Служащий", gender: "Unknown", archetype: "Cynical" }, characters: [{ name: "Валерия", role: "Вампирша" }], plot: { opening: ["Ты очнулся в спальне.", "На запястье метка."], starter_choices: ["«Зачем?»", "Молча выдержать взгляд", "Сорвать метку"], chapters: ["Пробуждение", "Кормёжка", "Голос", "Погоня", "Ритуал", "Одержимость", "Конфликт", "Ритуал", "Выбор", "Война", "Перелом", "Вечность"], summary: "Вампирский контракт." } },
      { title: "Неоновый Ошейник", description: "Киберпанк-мир, удовольствие — оружие.", category: "Sci-Fi", tags: ["cyberpunk", "bdsm", "yandere"], image: "/neon_collar_cover.jpg", protagonist: { name: "Хакер", gender: "Unknown", archetype: "Hacker" }, characters: [{ name: "Кира", role: "Агент" }], plot: { opening: ["Твой нейроинтерфейс мигает.", "Голос: «Присоединяйся к Эрос Инк…»"], starter_choices: ["«Отключаюсь!»", "«Кто ты?»", "Взлом"], chapters: ["Взлом", "Контакт", "Захват", "Сессия", "Погоня", "Зависимость", "Игра", "Тест", "Лояльность", "Импланты", "Ритуал", "Новый порядок"], summary: "Киберпанк-контроль." } },
      { title: "Клуб «Красный Шёлк»", description: "Элитный BDSM-клуб.", category: "Romance", tags: ["BDSM", "erotic"], image: "/red_silk_club_cover.jpg", protagonist: { name: "Гость", gender: "Unknown", archetype: "Control seeker" }, characters: [{ name: "Виктория", role: "Хозяйка" }], plot: { opening: ["Двери закрываются.", "На балконе женщина в алом латексе."], starter_choices: ["Нежность", "Боль", "К Хозяйке"], chapters: ["Вход", "Встреча", "Комната", "Правила", "Погружение", "Ревность", "Испытание", "Демонстрация", "Кризис", "Послеcare", "Контракт", "Роль"], summary: "Клуб власти." } },
      { title: "Императрица и Гладиатор", description: "Древний Рим, власть и страсть.", category: "Fantasy", tags: ["historical", "bdsm"], image: "/gladiator_cover.jpg", protagonist: { name: "Гладиатор", gender: "Male", archetype: "Warrior" }, characters: [{ name: "Ливия", role: "Императрица" }], plot: { opening: ["Толпа ревёт.", "Ливия: «Сегодня ты сражаешься за Рим… а ночью — принадлежишь мне»."], starter_choices: ["Жест победы", "Склонить голову", "Посвятить победу"], chapters: ["Арена", "Вызов", "Ночь", "Интриги", "Ритуал", "Ревность", "Битва", "Власть", "Лояльность", "Заговор", "Финал", "Императрица"], summary: "Римская драма." } },
      { title: "Пустошь Валькирий", description: "Постапокалипсис, банда Валькирий.", category: "Thriller", tags: ["survival", "breeding"], image: "/wasteland_cover.jpg", protagonist: { name: "Выживший", gender: "Unknown", archetype: "Raider" }, characters: [{ name: "Рейвен", role: "Лидер" }], plot: { opening: ["Ты в клетке.", "Рейвен: «Будешь нашим… или умрёшь»."], starter_choices: ["Бежать", "Сделку", "Спровоцировать"], chapters: ["Захват", "День", "Послушание", "Набег", "Зов", "Доля", "Власть", "Побег", "Предательство", "Возвращение", "Осада", "Финал"], summary: "Выживание." } },
      { title: "Зов Бездны", description: "Космический хоррор.", category: "Sci-Fi", tags: ["cosmic horror"], image: "/call_of_abyss_cover.jpg", protagonist: { name: "Капитан", gender: "Unknown", archetype: "Astronaut" }, characters: [{ name: "Н’Зара", role: "Сущность" }], plot: { opening: ["В иллюминаторе аномалия.", "Н’Зара: «Вечное удовольствие»."], starter_choices: ["Самоуничтожение", "Переговоры", "Прикоснуться"], chapters: ["Контакт", "Голоса", "Изменение", "Слияние", "Разум", "Сон", "Ритуал", "Тень", "Зов", "Сингулярность", "Выбор", "Вечность"], summary: "Космическое слияние." } },
      { title: "Наследие Богов", description: "Богини среди людей.", category: "Fantasy", tags: ["mythology", "harem"], image: "/gods_legacy_cover.jpg", protagonist: { name: "Избранный", gender: "Unknown", archetype: "Student" }, characters: [{ name: "Афродита", role: "Богиня" }], plot: { opening: ["Метка горит.", "Афродита: «Мы пришли забрать своё»."], starter_choices: ["«Розыгрыш?»", "«Кто первая?»", "Убежать"], chapters: ["Пробуждение", "Метка", "Дар", "Ревность", "Ритуал", "Соперничество", "Испытание", "Сила", "Слияние", "Тень титанов", "Последний выбор", "Наследие"], summary: "Богини." } },
      { title: "Академия Запретных Желаний", description: "Магическая академия, соблазнение как предмет.", category: "Fantasy", tags: ["dark academia", "harem"], image: "/forbidden_academy_cover.jpg", protagonist: { name: "Новичок", gender: "Unknown", archetype: "Student" }, characters: [{ name: "Элира", role: "Доминантка" }, { name: "Скарлетт", role: "Огненная" }, { name: "Лираэль", role: "Книжница" }], plot: { opening: ["Ночь в академии.", "Девушки: «Мы пришли на урок соблазнения.»"], starter_choices: ["Выгнать", "Выбрать одну", "Общий урок"], chapters: ["Прибытие", "Первая ночь", "Ритуал", "Уроки", "Ревность", "Групповая динамика", "Тайный проход", "Испытание", "Риск", "Предательство", "Турнир", "Финал"], summary: "Магическая академия." } }
    ];

    const stmt = this.db.prepare("INSERT INTO stories (title, description, category, tags_json, image, rating, plays, mature, created_at, protagonist_json, characters_json, plot_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    seedStories.forEach(s => {
        stmt.run(s.title, s.description, s.category, JSON.stringify(s.tags), s.image, 5.0, 0, 1, new Date().toISOString(), JSON.stringify(s.protagonist), JSON.stringify(s.characters), JSON.stringify(s.plot));
    });
    stmt.finalize();
  }
}
