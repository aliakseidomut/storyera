const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/root/.openclaw/workspace/db_data/storyera.db');

db.all("SELECT * FROM user_story_progress", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Progress records in DB:", rows);
});
