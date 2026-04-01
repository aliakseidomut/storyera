import { Injectable, OnModuleInit } from '@nestjs/common';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db!: sqlite3.Database;

  onModuleInit() {
    const defaultDbDir = path.resolve(process.cwd(), 'db_data');
    const dbPath =
      process.env.DB_PATH?.trim() ||
      path.join(defaultDbDir, 'storyera.db');

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    console.log(`[DB] Using SQLite file at: ${dbPath}`);

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) console.error('[DB] Failed to open SQLite database:', err);
    });

    this.db.serialize(() => {
      /* ─── Core user tables ─── */
      this.db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, is_verified INTEGER DEFAULT 0, created_at TEXT NOT NULL)`);
      this.db.run(`CREATE TABLE IF NOT EXISTS pending_users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)`);
      this.db.run(`CREATE TABLE IF NOT EXISTS user_verifications (email TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at TEXT NOT NULL)`);
      this.db.run(`CREATE TABLE IF NOT EXISTS user_bookmarks (user_id INTEGER NOT NULL, story_id INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(user_id, story_id))`);

      /* ─── Progress table migration: add language to PK ─── */
      this.db.run(`DROP TABLE IF EXISTS _sp_migration`);
      this.db.run(`CREATE TABLE _sp_migration (
        user_id INTEGER NOT NULL,
        story_id INTEGER NOT NULL,
        language TEXT NOT NULL DEFAULT 'ru',
        chat_history TEXT,
        story_state TEXT,
        choices_count INTEGER DEFAULT 0,
        last_scene_summary TEXT,
        last_user_choice TEXT,
        updated_at TEXT,
        PRIMARY KEY(user_id, story_id, language)
      )`);
      // Copy from old table if it exists (error ignored on fresh install)
      this.db.run(`INSERT OR IGNORE INTO _sp_migration (user_id, story_id, language, chat_history, story_state, choices_count, last_scene_summary, last_user_choice, updated_at)
        SELECT user_id, story_id, COALESCE(language, 'ru'), chat_history, story_state, choices_count, last_scene_summary, last_user_choice, updated_at
        FROM user_story_progress`, () => { /* ignore errors on fresh install */ });
      this.db.run(`DROP TABLE IF EXISTS user_story_progress`);
      this.db.run(`ALTER TABLE _sp_migration RENAME TO user_story_progress`);

      /* ─── Completed stories ─── */
      this.db.run(`CREATE TABLE IF NOT EXISTS completed_stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        story_id INTEGER NOT NULL,
        language TEXT NOT NULL DEFAULT 'ru',
        version INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        chat_history TEXT,
        completed_at TEXT NOT NULL
      )`);

      /* ─── Stories (re-seeded every startup) ─── */
      this.db.run(`DROP TABLE IF EXISTS stories`);
      this.db.run(`CREATE TABLE stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        tags_json TEXT NOT NULL,
        image TEXT NOT NULL,
        rating REAL NOT NULL,
        plays INTEGER NOT NULL,
        mature INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        protagonist_json TEXT NOT NULL,
        characters_json TEXT NOT NULL,
        plot_json TEXT NOT NULL,
        translations_json TEXT
      )`);
      
      this.seedStories();
    });
  }

  getDatabase(): sqlite3.Database {
    return this.db;
  }

  /* ================================================================
     SEED STORIES — Russian (default) + English translations
     ================================================================ */
  private seedStories() {
    const now = new Date().toISOString();

    const seedStories = [
      /* ───────────── 1. Пламя Дракона ───────────── */
      {
        title: 'Пламя Дракона',
        description: 'Ты — последний драконорожденный. Когда ты просыпаешься в огненном гнезде, она уже ждёт тебя — древняя драконша, пережившая гибель своего рода. В её мире сила определяется связью, а притяжение невозможно игнорировать. Она видит в тебе не просто союзника, а ключ к возрождению гнезда. Но чем глубже ты погружаешься в её власть, тем сложнее понять — где заканчивается твоя воля и начинается её. И когда между вами вспыхивает нечто большее, чем просто магия, тебе предстоит сделать выбор, который изменит не только тебя… но и саму природу мира.',
        category: 'Тёмное фэнтези / monster romance',
        tags: ['dark fantasy','monster romance','knotting','breeding','ritual BDSM','primal heat','size difference'],
        image: '/dragon_flame_cover.jpg',
        protagonist: { 
          name: 'Драконорожденный', gender: 'Male', age: '27', archetype: 'Warrior',
          description: 'Ты — 27-летний воин, выросший на границе цивилизованных земель и древних руин, где магия Эйры ощущается особенно остро. С раннего возраста ты знал, что в тебе течёт кровь, отличающая тебя от обычных людей — кровь, которую одновременно боятся и ищут те, кто понимает её истинную цену.\n\nТы прошёл через войны, стычки и выживание в мире, где сила решает всё. Твой характер сформирован опытом: ты смелый до безрассудства, привык действовать первым и задавать вопросы позже. Но за этой импульсивностью скрывается твёрдый внутренний кодекс — ты не убиваешь без необходимости, не предаёшь доверие и всегда доводишь выбор до конца, даже если он разрушает тебя самого.'
        }, 
        characters: [
          { name: 'Лирия Веларис', role: 'Древняя драконица, доминантная, саркастичная, ищет равного партнера' },
          { name: 'Селена Вайр', role: 'Эльфийка, провокатор' },
          { name: 'Аэлир', role: 'Древняя сущность, хранитель' },
          { name: 'Каэл Дорн', role: 'Инквизитор, антагонист' },
          { name: 'Мирелла Вайр', role: 'Эльфийский стратег, манипулятор' },
          { name: 'Рагн Тар\'Вел', role: 'Свободный драконорожденный, символ полной автономии' }
        ],
        plot: {
          opening: [
            'Ты приходишь в себя не сразу.',
            'Сначала — жар. Он обволакивает, проникает под кожу, словно ты лежишь не на холодном камне, а в самом сердце пламени. Затем приходит звук — глухое потрескивание, тяжёлое дыхание где-то совсем рядом, эхом отдающееся в висках.',
            'Ты открываешь глаза.',
            'Потолок пещеры теряется во тьме, но вокруг достаточно света, чтобы понять — это не обычное место. Камень переливается красными и золотыми отблесками, будто сама скала дышит огнём. Воздух густой, тяжёлый, наполненный чем-то… живым.',
            'Ты пытаешься пошевелиться — и замечаешь цепи на своих запястьях. Вернее, то, что от них осталось. Металл расколот, словно не выдержал давления изнутри.',
            'И именно в этот момент ты чувствуешь это.',
            'Жар внутри себя.',
            'Он не снаружи. Он в тебе.',
            'Тёплая, пульсирующая сила, отзывающаяся на каждый вдох, на каждую мысль. Она тянется, требует, будто только что проснулась вместе с тобой.',
            '— Наконец-то…',
            'Голос раздаётся тихо, но заполняет всё пространство.',
            'Ты поднимаешь взгляд.',
            'Она стоит прямо перед тобой.',
            'Женщина… если её вообще можно назвать человеком. Высокая, уверенная, с кожей, на которой в отблесках пламени можно заметить едва уловимый рисунок, напоминающий чешую. За её спиной медленно расправляются чёрные крылья, отбрасывая тени на стены пещеры.',
            'Но больше всего приковывают глаза.',
            'Золотые. Глубокие. Слишком древние, чтобы принадлежать смертному существу.',
            'Она смотрит на тебя так, будто уже знает всё — кто ты, кем станешь… и что ты ей принадлежишь.',
            'На её губах появляется едва заметная улыбка.',
            '— Наконец-то ты проснулся… мой король… моя королева.',
            'Она делает шаг ближе, и вместе с этим движением жар внутри тебя вспыхивает сильнее, словно откликаясь на её присутствие.',
            '— Гнездо ждёт своего продолжения.',
            'И в этот момент ты понимаешь — это только начало.'
          ],
          starter_choices: [
            '«Кто ты такая? Что тебе от меня нужно?»',
            '«Я чувствую это… огонь. Это ты со мной сделала?»',
            'Молча сделать шаг вперёд и коснуться её'
          ],
          chapters: ['Пробуждение в огне','Зов крови','Ритуал пробуждения','Тень в гнезде','Испытание границ','Дорога к храму','Пламя испытаний','Разрыв контроля','Ритуал гнезда','Война внутри гнезда','Испытание власти','Возрождение или разрушение'],
          summary: 'Мир Эйра — это тёмное фэнтези-пространство, где магия рождается из эмоций, желания и стремления к власти. Когда-то драконы сформировали саму основу реальности, и их природа до сих пор влияет на мир: притяжение между существами здесь имеет физическую силу, а близость способна создавать магические связи, меняющие как личности, так и окружающую среду.'
        },
        translations: {
          en: {
            title: "Dragon's Flame",
            description: "You are the last dragonborn. When you awaken in a fiery nest, she is already waiting — an ancient dragoness who has outlived the extinction of her kind. In her world, power is defined by bonds, and attraction cannot be ignored. She sees in you not merely an ally, but the key to reviving the nest. But the deeper you fall under her sway, the harder it becomes to tell where your will ends and hers begins. And when something far greater than magic ignites between you, you must make a choice that will change not just you… but the very nature of the world.",
            category: 'Dark Fantasy / Monster Romance',
            protagonist: {
              name: 'Dragonborn', gender: 'Male', age: '27', archetype: 'Warrior',
              description: "You are a 27-year-old warrior, raised on the border between civilized lands and ancient ruins where the magic of Eyra runs strongest. From an early age you knew that blood runs in your veins unlike any ordinary human's — blood that is simultaneously feared and sought by those who understand its true worth.\n\nYou have survived wars, skirmishes, and the harsh reality of a world where strength decides everything. Your character has been forged by experience: bold to the point of recklessness, accustomed to acting first and asking questions later. But behind that impulsiveness lies a firm inner code — you never kill without necessity, never betray trust, and always see a choice through to the end, even if it destroys you."
            },
            characters: [
              { name: 'Lyria Velaris', role: 'Ancient dragoness, dominant, sarcastic, seeking an equal partner' },
              { name: 'Selena Vair', role: 'Elf, provocateur' },
              { name: 'Aelir', role: 'Ancient entity, guardian' },
              { name: 'Kael Dorn', role: 'Inquisitor, antagonist' },
              { name: 'Mirella Vair', role: 'Elven strategist, manipulator' },
              { name: "Ragn Tar'Vel", role: 'Free dragonborn, symbol of total autonomy' }
        ], 
        plot: { 
              opening: [
                "You don't come to all at once.",
                "First — the heat. It envelops you, seeps beneath your skin, as though you're lying not on cold stone but at the very heart of a flame. Then comes the sound — a muffled crackling, heavy breathing somewhere very close, echoing in your temples.",
                'You open your eyes.',
                "The cavern ceiling is lost in darkness, but there is enough light to understand — this is no ordinary place. The stone shimmers with red and gold reflections, as if the rock itself breathes fire. The air is thick, heavy, filled with something… alive.",
                "You try to move — and notice chains on your wrists. Or rather, what remains of them. The metal is cracked, as though it couldn't withstand the pressure from within.",
                'And it is in this moment that you feel it.',
                'Heat. Inside you.',
                "It's not from the outside. It's in you.",
                'A warm, pulsing force that responds to every breath, every thought. It reaches out, demands, as though it has only just awakened along with you.',
                '— At last…',
                'The voice comes softly, yet fills the entire space.',
                'You raise your gaze.',
                'She stands right before you.',
                "A woman… if she can even be called human. Tall, confident, with skin on which, in the flickering firelight, you can make out a faint pattern resembling scales. Behind her, dark wings slowly unfurl, casting shadows on the cavern walls.",
                'But it is her eyes that hold you most.',
                'Golden. Deep. Far too ancient to belong to a mortal being.',
                "She looks at you as though she already knows everything — who you are, who you will become… and that you belong to her.",
                'A barely perceptible smile appears on her lips.',
                "— At last you've awakened… my king… my queen.",
                'She takes a step closer, and with that movement the heat inside you flares stronger, as if answering her presence.',
                '— The nest awaits its continuation.',
                'And in that moment you understand — this is only the beginning.'
              ],
              starter_choices: [
                '"Who are you? What do you want from me?"',
                '"I can feel it… the fire. Did you do this to me?"',
                'Silently step forward and touch her'
              ],
              chapters: ['Awakening in Fire','Call of Blood','Ritual of Awakening','Shadow in the Nest','Testing Boundaries','Road to the Temple','Flame of Trials','Loss of Control','Nest Ritual','War Within the Nest','Trial of Power','Rebirth or Destruction'],
              summary: "The world of Eyra is a dark-fantasy realm where magic is born from emotion, desire, and the pursuit of power. Dragons once shaped the very foundation of reality, and their nature still influences the world: attraction between beings carries physical force, and intimacy can forge magical bonds that alter both personalities and surroundings."
            }
          }
        }
      },

      /* ───────────── 2. Кровавый Контракт ───────────── */
      {
        title: 'Кровавый Контракт',
        description: 'Случайный контракт сделал тебя собственностью древней вампирши.',
        category: 'Romance',
        tags: ['dark romance','vampire','yandere'],
        image: '/vampire_contract_cover.jpg',
        protagonist: { name: 'Служащий', gender: 'Male', age: '30', archetype: 'Cynical',
          description: 'Тебе тридцать. Ты — офисный клерк в крупной юридической фирме, потерявший веру в справедливость после того, как увидел, как система раз за разом защищает тех, кто платит больше. Ты циничен, язвителен и предпочитаешь держать людей на расстоянии. Единственное, что ты по-настоящему ценишь — это контроль над собственной жизнью. Именно поэтому случайный контракт, подписанный по ошибке в пыльном архиве, становится для тебя худшим кошмаром: ты больше не принадлежишь себе.'
        },
        characters: [{ name: 'Валерия', role: 'Вампирша' }],
        plot: {
          opening: ['Ты очнулся в спальне.','На запястье метка.'],
          starter_choices: ['«Зачем?»','Молча выдержать взгляд','Сорвать метку'],
          chapters: ['Пробуждение','Кормёжка','Голос','Погоня','Ритуал','Одержимость','Конфликт','Ритуал','Выбор','Война','Перелом','Вечность'],
          summary: 'Вампирский контракт.'
        },
        translations: {
          en: {
            title: 'Blood Contract',
            description: 'A chance contract has made you the property of an ancient vampiress.',
            category: 'Romance',
            protagonist: { name: 'Clerk', gender: 'Male', age: '30', archetype: 'Cynical',
              description: "You're thirty. A corporate clerk at a major law firm who lost faith in justice after watching the system protect those who pay the most, time after time. You're cynical, sharp-tongued, and prefer to keep people at arm's length. The only thing you truly value is control over your own life. Which is exactly why a contract accidentally signed in a dusty archive becomes your worst nightmare: you no longer belong to yourself."
            },
            characters: [{ name: 'Valeria', role: 'Vampiress' }],
            plot: {
              opening: ['You woke up in a bedroom.','There is a mark on your wrist.'],
              starter_choices: ['"Why?"','Hold her gaze in silence','Tear off the mark'],
              chapters: ['Awakening','Feeding','The Voice','The Chase','The Ritual','Obsession','Conflict','Ritual','Choice','War','Breaking Point','Eternity'],
              summary: 'A vampire contract.'
            }
          }
        }
      },

      /* ───────────── 3. Неоновый Ошейник ───────────── */
      {
        title: 'Неоновый Ошейник',
        description: 'Киберпанк-мир, удовольствие — оружие.',
        category: 'Sci-Fi',
        tags: ['cyberpunk','bdsm','yandere'],
        image: '/neon_collar_cover.jpg',
        protagonist: { name: 'Хакер', gender: 'Female', age: '24', archetype: 'Hacker',
          description: 'Тебе двадцать четыре, и ты — одна из лучших нелегальных хакеров Нижнего Яруса. Ты взламываешь корпоративные сети ради заработка и адреналина, скрываясь за десятком цифровых личностей. Твоё тело модифицировано минимально — только нейроинтерфейс и усиленные рефлексы, — потому что ты не доверяешь технологиям, которые не можешь контролировать сама. Ты привыкла работать в одиночку, но когда Эрос Инк выходит на связь, ты понимаешь, что на этот раз одиночка — идеальная мишень.'
        },
        characters: [{ name: 'Кира', role: 'Агент' }],
        plot: {
          opening: ['Твой нейроинтерфейс мигает.','Голос: «Присоединяйся к Эрос Инк…»'],
          starter_choices: ['«Отключаюсь!»','«Кто ты?»','Взлом'],
          chapters: ['Взлом','Контакт','Захват','Сессия','Погоня','Зависимость','Игра','Тест','Лояльность','Импланты','Ритуал','Новый порядок'],
          summary: 'Киберпанк-контроль.'
        },
        translations: {
          en: {
            title: 'Neon Collar',
            description: 'A cyberpunk world where pleasure is a weapon.',
            category: 'Sci-Fi',
            protagonist: { name: 'Hacker', gender: 'Female', age: '24', archetype: 'Hacker',
              description: "You're twenty-four, and one of the best illegal hackers on the Lower Tier. You crack corporate networks for money and adrenaline, hiding behind a dozen digital identities. Your body is minimally modified — just a neuro-interface and enhanced reflexes — because you don't trust technology you can't control yourself. You're used to working alone, but when Eros Inc reaches out, you realize that this time a loner is the perfect target."
            },
            characters: [{ name: 'Kira', role: 'Agent' }],
            plot: {
              opening: ['Your neuro-interface flickers.','A voice: "Join Eros Inc…"'],
              starter_choices: ['"Disconnecting!"','"Who are you?"','Hack in'],
              chapters: ['Hack','Contact','Capture','Session','Chase','Addiction','The Game','Test','Loyalty','Implants','Ritual','New Order'],
              summary: 'Cyberpunk control.'
            }
          }
        }
      },

      /* ───────────── 4. Клуб «Красный Шёлк» ───────────── */
      {
        title: 'Клуб «Красный Шёлк»',
        description: 'Элитный BDSM-клуб.',
        category: 'Romance',
        tags: ['BDSM','erotic'],
        image: '/red_silk_club_cover.jpg',
        protagonist: { name: 'Гость', gender: 'Male', age: '35', archetype: 'Control seeker',
          description: 'Тебе тридцать пять. Ты — успешный бизнесмен, привыкший к тотальному контролю: над подчинёнными, сделками и собственными эмоциями. Снаружи ты безупречен — дорогие костюмы, идеальная осанка, взгляд, от которого люди отводят глаза. Но внутри нарастает пустота, которую не заполнить ни деньгами, ни властью. Ты пришёл в «Красный Шёлк» не за развлечением — ты пришёл, чтобы впервые в жизни отпустить контроль. И ты даже не представляешь, чем это обернётся.'
        },
        characters: [{ name: 'Виктория', role: 'Хозяйка' }],
        plot: {
          opening: ['Двери закрываются.','На балконе женщина в алом латексе.'],
          starter_choices: ['Нежность','Боль','К Хозяйке'],
          chapters: ['Вход','Встреча','Комната','Правила','Погружение','Ревность','Испытание','Демонстрация','Кризис','Послеcare','Контракт','Роль'],
          summary: 'Клуб власти.'
        },
        translations: {
          en: {
            title: 'Red Silk Club',
            description: 'An elite BDSM club.',
            category: 'Romance',
            protagonist: { name: 'Guest', gender: 'Male', age: '35', archetype: 'Control seeker',
              description: "You're thirty-five. A successful businessman accustomed to total control: over subordinates, deals, and your own emotions. On the outside you're flawless — expensive suits, perfect posture, a gaze that makes people look away. But inside, an emptiness is growing that neither money nor power can fill. You didn't come to Red Silk for entertainment — you came to let go of control for the first time in your life. And you have no idea what that will cost."
            },
            characters: [{ name: 'Victoria', role: 'Mistress' }],
            plot: {
              opening: ['The doors close behind you.','On the balcony — a woman in crimson latex.'],
              starter_choices: ['Tenderness','Pain','Approach the Mistress'],
              chapters: ['Entrance','Meeting','The Room','Rules','Immersion','Jealousy','Trial','Demonstration','Crisis','Aftercare','Contract','Role'],
              summary: 'A club of power.'
            }
          }
        }
      },

      /* ───────────── 5. Императрица и Гладиатор ───────────── */
      {
        title: 'Императрица и Гладиатор',
        description: 'Древний Рим, власть и страсть.',
        category: 'Fantasy',
        tags: ['historical','bdsm'],
        image: '/gladiator_cover.jpg',
        protagonist: { name: 'Гладиатор', gender: 'Male', age: '28', archetype: 'Warrior',
          description: 'Тебе двадцать восемь. Ты был свободным фракийцем, пока римский легион не сжёг твою деревню. Проданный в рабство, ты прошёл через лудус — школу гладиаторов — и выжил там, где погибли десятки. Твоё тело покрыто шрамами, каждый из которых — история выживания. Ты молчалив, расчётлив и никогда не показываешь слабость. Толпа обожает тебя. Императрица — хочет владеть тобой. Но внутри тебя горит одно — жажда свободы, которую не способна дать ни арена, ни спальня дворца.'
        },
        characters: [{ name: 'Ливия', role: 'Императрица' }],
        plot: {
          opening: ['Толпа ревёт.','Ливия: «Сегодня ты сражаешься за Рим… а ночью — принадлежишь мне».'],
          starter_choices: ['Жест победы','Склонить голову','Посвятить победу'],
          chapters: ['Арена','Вызов','Ночь','Интриги','Ритуал','Ревность','Битва','Власть','Лояльность','Заговор','Финал','Императрица'],
          summary: 'Римская драма.'
        },
        translations: {
          en: {
            title: 'The Empress and the Gladiator',
            description: 'Ancient Rome — power and passion.',
            category: 'Fantasy',
            protagonist: { name: 'Gladiator', gender: 'Male', age: '28', archetype: 'Warrior',
              description: "You're twenty-eight. You were a free Thracian until a Roman legion burned your village. Sold into slavery, you survived the ludus — gladiator school — where dozens perished. Your body is covered in scars, each one a story of survival. You are silent, calculating, and never show weakness. The crowd adores you. The Empress wants to own you. But inside you burns one thing — a thirst for freedom that neither the arena nor the palace bedroom can give."
            },
            characters: [{ name: 'Livia', role: 'Empress' }],
            plot: {
              opening: ['The crowd roars.','Livia: "Today you fight for Rome… and tonight — you belong to me."'],
              starter_choices: ['A victory gesture','Bow your head','Dedicate the victory'],
              chapters: ['Arena','Challenge','Night','Intrigues','Ritual','Jealousy','Battle','Power','Loyalty','Conspiracy','Finale','The Empress'],
              summary: 'Roman drama.'
            }
          }
        }
      },

      /* ───────────── 6. Пустошь Валькирий ───────────── */
      {
        title: 'Пустошь Валькирий',
        description: 'Постапокалипсис, банда Валькирий.',
        category: 'Thriller',
        tags: ['survival','breeding'],
        image: '/wasteland_cover.jpg',
        protagonist: { name: 'Выживший', gender: 'Male', age: '32', archetype: 'Raider',
          description: 'Тебе тридцать два. Ты родился уже после Краха — мира до катастрофы ты не знаешь и знать не хочешь. Ты — рейдер-одиночка, промышляющий на руинах старых городов: оружие, консервы, топливо — всё, что можно обменять на ещё один день жизни. Ты не доверяешь никому — последний раз, когда ты доверился, это стоило жизни единственному человеку, которого ты любил. Теперь ты живёшь по простому принципу: двигайся быстрее, стреляй точнее, не привязывайся.'
        },
        characters: [{ name: 'Рейвен', role: 'Лидер' }],
        plot: {
          opening: ['Ты в клетке.','Рейвен: «Будешь нашим… или умрёшь».'],
          starter_choices: ['Бежать','Сделку','Спровоцировать'],
          chapters: ['Захват','День','Послушание','Набег','Зов','Доля','Власть','Побег','Предательство','Возвращение','Осада','Финал'],
          summary: 'Выживание.'
        },
        translations: {
          en: {
            title: 'Wasteland of the Valkyries',
            description: 'Post-apocalypse — the Valkyrie gang.',
            category: 'Thriller',
            protagonist: { name: 'Survivor', gender: 'Male', age: '32', archetype: 'Raider',
              description: "You're thirty-two. Born after the Collapse, you've never known the world before the catastrophe — and you don't want to. You're a lone raider, scavenging the ruins of old cities: weapons, canned food, fuel — anything you can trade for one more day alive. You don't trust anyone — the last time you did, it cost the life of the only person you loved. Now you live by a simple rule: move faster, shoot straighter, never get attached."
            },
            characters: [{ name: 'Raven', role: 'Leader' }],
            plot: {
              opening: ["You're in a cage.",'Raven: "You\'ll be ours… or you\'ll die."'],
              starter_choices: ['Run','Make a deal','Provoke'],
              chapters: ['Capture','The Day','Obedience','Raid','The Call','The Share','Power','Escape','Betrayal','Return','Siege','Finale'],
              summary: 'Survival.'
            }
          }
        }
      },

      /* ───────────── 7. Зов Бездны ───────────── */
      {
        title: 'Зов Бездны',
        description: 'Космический хоррор.',
        category: 'Sci-Fi',
        tags: ['cosmic horror'],
        image: '/call_of_abyss_cover.jpg',
        protagonist: { name: 'Капитан', gender: 'Female', age: '38', archetype: 'Astronaut',
          description: 'Тебе тридцать восемь. Ты — капитан исследовательского корабля «Одиссей-7», ветеран трёх дальних экспедиций. Ты рациональна до холодности, привыкла принимать решения, от которых зависят жизни экипажа, и никогда не позволяешь эмоциям влиять на выбор. Команда уважает тебя, но побаивается — за глаза тебя называют «Ледяная». Но сейчас, глядя на аномалию в иллюминаторе, ты впервые чувствуешь то, чего не испытывала годами — чистый, первобытный страх, смешанный с необъяснимым влечением к тому, что скрывается за границей известного.'
        },
        characters: [{ name: "Н'Зара", role: 'Сущность' }],
        plot: {
          opening: ['В иллюминаторе аномалия.','Н\'Зара: «Вечное удовольствие».'],
          starter_choices: ['Самоуничтожение','Переговоры','Прикоснуться'],
          chapters: ['Контакт','Голоса','Изменение','Слияние','Разум','Сон','Ритуал','Тень','Зов','Сингулярность','Выбор','Вечность'],
          summary: 'Космическое слияние.'
        },
        translations: {
          en: {
            title: 'Call of the Abyss',
            description: 'Cosmic horror.',
            category: 'Sci-Fi',
            protagonist: { name: 'Captain', gender: 'Female', age: '38', archetype: 'Astronaut',
              description: "You're thirty-eight. Captain of the research vessel Odyssey-7, a veteran of three deep-space expeditions. You're rational to the point of coldness, accustomed to making decisions that determine your crew's lives, and you never let emotions influence your choices. The crew respects you but fears you — behind your back they call you 'The Ice.' But now, staring at the anomaly through the viewport, you feel something you haven't felt in years — pure, primal fear mixed with an inexplicable pull toward whatever lies beyond the edge of the known."
            },
            characters: [{ name: "N'Zara", role: 'Entity' }],
            plot: {
              opening: ['An anomaly in the viewport.','N\'Zara: "Eternal pleasure."'],
              starter_choices: ['Self-destruct','Negotiate','Reach out'],
              chapters: ['Contact','Voices','Transformation','Merging','Mind','Dream','Ritual','Shadow','The Call','Singularity','Choice','Eternity'],
              summary: 'Cosmic merging.'
            }
          }
        }
      },

      /* ───────────── 8. Наследие Богов ───────────── */
      {
        title: 'Наследие Богов',
        description: 'Богини среди людей.',
        category: 'Fantasy',
        tags: ['mythology','harem'],
        image: '/gods_legacy_cover.jpg',
        protagonist: { name: 'Избранный', gender: 'Male', age: '21', archetype: 'Student',
          description: 'Тебе двадцать один. Ты — студент последнего курса исторического факультета, одержимый древнегреческой мифологией. Ты тихий, наблюдательный и предпочитаешь книги людям. Твоя жизнь была абсолютно обычной, пока однажды утром на твоей руке не появилась метка — золотой символ, который пульсирует при прикосновении. А потом появились они. Богини. Настоящие. И каждая утверждает, что ты принадлежишь именно ей.'
        },
        characters: [{ name: 'Афродита', role: 'Богиня' }],
        plot: {
          opening: ['Метка горит.','Афродита: «Мы пришли забрать своё».'],
          starter_choices: ['«Розыгрыш?»','«Кто первая?»','Убежать'],
          chapters: ['Пробуждение','Метка','Дар','Ревность','Ритуал','Соперничество','Испытание','Сила','Слияние','Тень титанов','Последний выбор','Наследие'],
          summary: 'Богини.'
        },
        translations: {
          en: {
            title: 'Legacy of the Gods',
            description: 'Goddesses among mortals.',
            category: 'Fantasy',
            protagonist: { name: 'The Chosen', gender: 'Male', age: '21', archetype: 'Student',
              description: "You're twenty-one. A final-year history student obsessed with ancient Greek mythology. You're quiet, observant, and prefer books to people. Your life was perfectly ordinary until one morning a mark appeared on your hand — a golden symbol that pulses when touched. And then they came. Goddesses. Real ones. And each of them claims you belong to her."
            },
            characters: [{ name: 'Aphrodite', role: 'Goddess' }],
            plot: {
              opening: ['The mark burns.','Aphrodite: "We have come to claim what is ours."'],
              starter_choices: ['"A prank?"','"Who\'s first?"','Run away'],
              chapters: ['Awakening','The Mark','The Gift','Jealousy','Ritual','Rivalry','Trial','Power','Merging','Shadow of Titans','Final Choice','Legacy'],
              summary: 'Goddesses.'
            }
          }
        }
      },

      /* ───────────── 9. Академия Запретных Желаний ───────────── */
      {
        title: 'Академия Запретных Желаний',
        description: 'Магическая академия, соблазнение как предмет.',
        category: 'Fantasy',
        tags: ['dark academia','harem'],
        image: '/forbidden_academy_cover.jpg',
        protagonist: { name: 'Новичок', gender: 'Female', age: '19', archetype: 'Student',
          description: 'Тебе девятнадцать. Ты — дочь деревенского травника, получившая стипендию в Академию Арканума по чистой случайности: магический кристалл на вступительных испытаниях взорвался в твоих руках, и это напугало даже экзаменаторов. Ты не знаешь придворных манер, не умеешь плести интриги и понятия не имеешь, почему три самые опасные ученицы академии решили, что именно ты станешь их «проектом». Единственное, что у тебя есть — интуиция, которая ещё ни разу не подводила, и упрямство, способное сдвинуть горы.'
        },
        characters: [
          { name: 'Элира', role: 'Доминантка' },
          { name: 'Скарлетт', role: 'Огненная' },
          { name: 'Лираэль', role: 'Книжница' }
        ],
        plot: {
          opening: ['Ночь в академии.','Девушки: «Мы пришли на урок соблазнения.»'],
          starter_choices: ['Выгнать','Выбрать одну','Общий урок'],
          chapters: ['Прибытие','Первая ночь','Ритуал','Уроки','Ревность','Групповая динамика','Тайный проход','Испытание','Риск','Предательство','Турнир','Финал'],
          summary: 'Магическая академия.'
        },
        translations: {
          en: {
            title: 'Academy of Forbidden Desires',
            description: 'A magical academy where seduction is a subject.',
            category: 'Fantasy',
            protagonist: { name: 'Newcomer', gender: 'Female', age: '19', archetype: 'Student',
              description: "You're nineteen. The daughter of a village herbalist who received a scholarship to the Arcanum Academy by pure chance: the magic crystal during entrance trials exploded in your hands, and even the examiners were frightened. You don't know courtly manners, you can't weave intrigues, and you have no idea why the three most dangerous students at the academy have decided that you will be their 'project.' The only things you have are an intuition that has never let you down and a stubbornness that could move mountains."
            },
            characters: [
              { name: 'Elira', role: 'Dominatrix' },
              { name: 'Scarlett', role: 'Fiery one' },
              { name: 'Lirael', role: 'Bookworm' }
            ],
            plot: {
              opening: ['Night at the academy.','The girls: "We\'ve come for the seduction lesson."'],
              starter_choices: ['Throw them out','Choose one','A group lesson'],
              chapters: ['Arrival','First Night','Ritual','Lessons','Jealousy','Group Dynamics','Secret Passage','Trial','Risk','Betrayal','Tournament','Finale'],
              summary: 'Magical academy.'
            }
          }
        }
      }
    ];

    const stmt = this.db.prepare(
      `INSERT INTO stories (title, description, category, tags_json, image, rating, plays, mature, created_at, protagonist_json, characters_json, plot_json, translations_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const s of seedStories) {
      stmt.run(
        s.title,
        s.description,
        s.category,
        JSON.stringify(s.tags),
        s.image,
        5.0,
        0,
        1,
        now,
        JSON.stringify(s.protagonist),
        JSON.stringify(s.characters),
        JSON.stringify(s.plot),
        JSON.stringify(s.translations || {})
      );
    }
    stmt.finalize();
  }
}
