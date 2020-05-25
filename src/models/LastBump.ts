import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../../saves/last_bump.db'));

const createLastBump = `CREATE TABLE IF NOT EXISTS last_bump (
  bumpedAt DATETIME
)`;
db.exec(createLastBump);

function getLastBump() {
  const getLastBump = 'SELECT * FROM last_bump';
  return db.prepare(getLastBump).get();
}

export function updateLastBump() {
  const lastBump = getLastBump();
  const bumpDate = new Date();
  if (lastBump) {
    const lastBumpDate = new Date(lastBump.bumpedAt);
    // To prevent multi bumps from creating few time differences
    if (getTimeDifferenceWithLastBump() > 3000) {
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
    // We initialize our first last bump
    const newLastBump = 'INSERT INTO last_bump (bumpedAt) VALUES (@bumpedAt)';
    db.prepare(newLastBump).run({ bumpedAt: bumpDate.toISOString() });
    return bumpDate;
  }
}

// Return the time difference from now to the last bump in milliseconds
export function getTimeDifferenceWithLastBump(): number {
  const lastBump = getLastBump();
  if (lastBump) {
    const lastBumpDate = new Date(getLastBump().bumpedAt);
    const now = new Date();
    return now.getTime() - lastBumpDate.getTime();
  } else {
    return 0;
  }
}
