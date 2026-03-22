import { Injectable, OnModuleInit } from '@nestjs/common';
import sqlite3 from 'sqlite3';
import path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db!: sqlite3.Database;

  onModuleInit() {
    const dbPath = path.join(process.cwd(), 'storyera.db');
    this.db = new sqlite3.Database(dbPath);

    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_premium INTEGER DEFAULT 0,
          is_verified INTEGER DEFAULT 0,
          created_at TEXT NOT NULL
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_verifications (
          email TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          expires_at TEXT NOT NULL
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS stories (
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
          plot_json TEXT NOT NULL
        )
      `);

      this.seedStoriesIfEmpty();
    });
  }

  getDatabase(): sqlite3.Database {
    return this.db;
  }

  private seedStoriesIfEmpty() {
    const seedStories = [
      {
        id: 1,
        title: 'Midnight Encounter',
        description: 'A mysterious message appears at 2:13 AM. Who is sending it?',
        category: 'Mystery',
        tags: ['thriller', 'urban', 'suspense'],
        image: 'https://images.unsplash.com/photo-1515191107209-c28698631303?auto=format&fit=crop&w=800&q=80',
        rating: 4.8,
        plays: 15420,
        mature: true,
        createdAt: '2024-01-15',
        protagonist: {
          name: 'You',
          gender: 'Female',
          age: '18-25',
          archetype: 'Everyday Hero',
          traits: ['curious', 'cautious', 'empathetic'],
          flirtLevel: 40,
          boundariesLevel: 60,
        },
        characters: [
          { name: 'Alex', role: 'The mysterious texter' },
          { name: 'Emma', role: 'Your best friend' },
        ],
        plot: {
          opening: [
            'You receive a message from a number you don\'t recognize.',
            'Alex: You finally replied. I wasn\'t sure you would.',
            'Alex: So… do you remember me?',
          ],
          scenarioBrief:
            'Modern urban mystery with late-night texts, blurred memories, and unclear intentions.',
        },
      },
      {
        id: 2,
        title: 'Forks Twilight',
        description:
          "You move to a small rainy town where the air smells of pine, wet asphalt and someone else’s secrets. In the school corridors you feel one particular gaze: cold, attentive, as if measuring how close you can get before it becomes lethal. The more you are drawn to him, the more the town itself starts to feel like a set built around your obsession.",
        category: 'Romance',
        tags: ['twilight-inspired', 'school', 'supernatural', 'slow-burn'],
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
        rating: 4.7,
        plays: 9800,
        mature: true,
        createdAt: '2024-02-10',
        protagonist: {
          name: 'Riley',
          gender: 'Female',
          age: '18-25',
          archetype: 'Newcomer',
          traits: ['introverted', 'observant', 'stubborn'],
          flirtLevel: 30,
          boundariesLevel: 55,
        },
        characters: [
          {
            name: 'Riley',
            role: 'You, the new student who hates attention but can’t stop noticing one pair of eyes that never quite looks away.',
          },
          {
            name: 'Evan',
            role: 'A distant classmate who moves with inhuman precision, appears exactly where you don’t expect him, and reacts to your presence like you are both temptation and threat.',
          },
          {
            name: 'Mia',
            role: 'A local girl with too many “coincidental” warnings, who jokes about monsters in the forest but always checks your reaction a second too long.',
          },
        ],
        plot: {
          opening: [
            'The parking lot smells like wet asphalt and pine trees. Mist hangs low over the rows of cars.',
            'As you slam your car door, you feel it — that prickling sense that someone is watching you.',
            'Across the lot, a guy in a dark jacket stands too still, his eyes on you for a second too long before he abruptly looks away.',
          ],
          scenarioBrief:
            'TWILIGHT-INSPIRED: Small gloomy town with forests and fog, a distant observant love interest hiding something dangerous, strong forbidden attraction and mysterious identity.',
        },
      },
      {
        id: 3,
        title: 'Blood Pact',
        description:
          "You make a living solving problems for people who can afford to stay invisible. One night you take a contract that drags you into the private politics of ancient vampire clans, where every favor costs blood or loyalty. Refusing is dangerous, but accepting means letting a predator decide how much of your life still belongs to you.",
        category: 'Fantasy',
        tags: ['vampires', 'urban-night', 'power-games', 'dark-romance'],
        image: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=800&q=80',
        rating: 4.6,
        plays: 7420,
        mature: true,
        createdAt: '2024-03-05',
        protagonist: {
          name: 'Noah',
          gender: 'Male',
          age: '26-35',
          archetype: 'Reluctant Negotiator',
          traits: ['sarcastic', 'calculating', 'loyal'],
          flirtLevel: 45,
          boundariesLevel: 70,
        },
        characters: [
          {
            name: 'Noah',
            role: 'You, a human fixer who survives on sharp deals and sharper instincts, used to owning the room until you walk into one where nobody breathes.',
          },
          {
            name: 'Lucien',
            role: 'An old vampire lord who treats people like investments, never hears the word “no”, and studies you like you’re an unexpectedly interesting asset.',
          },
          {
            name: 'Rhea',
            role: 'A vampire enforcer with a predator’s patience, assigned to “watch your back” in a way that feels uncomfortably like both protection and surveillance.',
          },
        ],
        plot: {
          opening: [
            'Midnight wraps the city in neon and rain as you walk into the club that technically doesn’t exist.',
            'Every conversation dies for a heartbeat when you step inside — then resumes, lower, sharper, as if the room swallowed your name.',
            "At the back table, he waits: eyes too pale, too still, like he hasn’t breathed in a century. When you sit, he smiles like he already owns you.",
          ],
          scenarioBrief:
            'VAMPIRE WORLD: Modern city ruled from the shadows by ancient clans, political games, blood pacts, and dangerous attraction between predator and human.',
        },
      },
      {
        id: 4,
        title: 'Path of the White Wolf',
        description:
          'You are a monster hunter for hire, used to contracts that end with a corpse, a coin purse and silence. This village, though, smells not only of fear and old blood, but of a sorceress who has turned more of your jobs into personal history than you will ever admit. Every new monster here feels like just another excuse for the two of you to test how much you can endure from each other.',
        category: 'Fantasy',
        tags: ['witcher-inspired', 'dark-fantasy', 'contracts', 'morality'],
        image: 'https://images.unsplash.com/photo-1528110040200-47c5fa768c1c?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        plays: 12030,
        mature: true,
        createdAt: '2024-03-20',
        protagonist: {
          name: 'Geralt-like',
          gender: 'Male',
          age: '36-50',
          archetype: 'Monster Hunter',
          traits: ['stoic', 'dry-witted', 'protective'],
          flirtLevel: 35,
          boundariesLevel: 80,
        },
        characters: [
          {
            name: 'You',
            role: 'A mutated monster hunter whose body is built for surviving claws and curses, but who is much worse at surviving complicated feelings and long‑standing debts.',
          },
          {
            name: 'Yennefer-like',
            role: 'A powerful sorceress whose magic is as precise as her cruelty can be, always turning each contract into a new round of an old, unfinished argument between you.',
          },
          {
            name: 'Villagers',
            role: 'Desperate people who hire you for “a simple monster problem” while hiding the kind of human ugliness no bestiary ever warns about.',
          },
        ],
        plot: {
          opening: [
            'The village smells of wet straw, old fear, and something metallic under the wind.',
            'Children stare from doorways as you pass, tracing the scars along your jaw like a story they were warned not to read.',
            'At the edge of the square she waits — black hair, white hands, violet eyes that say this contract is about anything but the monster.',
          ],
          scenarioBrief:
            'WITCHER-INSPIRED: Gritty medieval world with monsters, moral ambiguity, political tension and a deep, complicated bond between a monster hunter and a sorceress.',
        },
      },
    ];

    this.db.get('SELECT COUNT(*) as cnt FROM stories', (err, row: any) => {
      if (err) {
        console.error('Failed to count stories:', err);
        return;
      }
      if (row && row.cnt > 0) {
        return;
      }

      const insertStmt = this.db.prepare(
        `INSERT INTO stories 
          (id, title, description, category, tags_json, image, rating, plays, mature, created_at, protagonist_json, characters_json, plot_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );

      this.db.serialize(() => {
        for (const s of seedStories) {
          insertStmt.run(
            s.id,
            s.title,
            s.description,
            s.category,
            JSON.stringify(s.tags),
            s.image,
            s.rating,
            s.plays,
            s.mature ? 1 : 0,
            s.createdAt,
            JSON.stringify(s.protagonist),
            JSON.stringify(s.characters),
            JSON.stringify(s.plot),
          );
        }
        insertStmt.finalize();
      });
    });
  }
}

