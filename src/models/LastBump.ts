import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../../saves/last_bump.db'));

const createLastBump = `CREATE TABLE IF NOT EXISTS last_bump (
  bumpedAt DATETIME
)`;
db.exec(createLastBump);

export function getLastBump() {
  const getLastBump = 'SELECT * FROM last_bump';
  return db.prepare(getLastBump).get();
}

export function updateLastBump() {
  const lastBump = getLastBump();
  const bumpDate = new Date();
  if (lastBump) {
    const lastBumpDate = new Date(lastBump.bumpedAt);
    // To prevent multi bumps from creating few time differences
    if (bumpDate.getTime() - lastBumpDate.getTime() > 3000) {
      const updateLastBump =
        'UPDATE last_bump SET bumpedAt = ? WHERE bumpedAt = ?';
      db.prepare(updateLastBump).run([
        bumpDate.toISOString(),
        lastBumpDate.toISOString(),
      ]);
      return bumpDate;
    } else {
      return lastBumpDate;
    }
  } else {
    const newLastBump = 'INSERT INTO last_bump (bumpedAt) VALUES(@bumpedAt)';
    db.prepare(newLastBump).run({ bumpedAt: bumpDate.toISOString() });
    return bumpDate;
  }
}
