import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../../saves/last_bumpers.db'));

const createLastBump = `CREATE TABLE IF NOT EXISTS last_bumpers (
  bumpedAt DATETIME
  bumperId VARCHAR(30)
)`;
db.exec(createLastBump);
