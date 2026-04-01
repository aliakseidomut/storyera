const sqlite3 = require('sqlite3').verbose();
// Keep in sync with server default: process.cwd()/db_data/storyera.db
const path = require('path');
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'db_data', 'storyera.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM user_story_progress", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Progress records in DB:", rows);
});
