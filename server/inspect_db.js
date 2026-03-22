const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('storyera.db');
db.all('SELECT email, is_premium FROM users', (err, rows) => {
    if (err) console.error(err);
    console.log(rows);
    process.exit();
});
