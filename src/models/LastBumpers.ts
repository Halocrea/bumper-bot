import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../../saves/last_bumpers.db'));

const createLastBump = `CREATE TABLE IF NOT EXISTS last_bumpers (
  bumpedAt DATETIME,
  bumperId VARCHAR(30)
)`;
db.exec(createLastBump);

export interface LastBumper {
  bumpedAt: Date;
  bumperId: string;
}

export function addLastBumper(lastBumper: LastBumper) {
  const newLastBumper =
    'INSERT INTO last_bumpers (bumpedAt, bumperId) VALUES (@bumpedAt, @bumperId)';
  return db.prepare(newLastBumper).run({
    ...lastBumper,
    bumpedAt: lastBumper.bumpedAt.toISOString(),
  });
}

export function getLastBumpers(bumpDate: Date): LastBumper[] {
  const getLastBumpers = 'SELECT * FROM last_bumpers WHERE bumpedAt = ?';
  return db.prepare(getLastBumpers).all(bumpDate.toISOString());
}

export function getPreviousBumpers(bumpDate: Date): LastBumper[] {
  const getPreviousBumpers = 'SELECT * FROM last_bumpers WHERE bumpedAt != ?';
  return db.prepare(getPreviousBumpers).all(bumpDate.toISOString());
}

export function deletePreviousBumpers(bumpDate: Date) {
  const deletePreviousBumpers = 'DELETE FROM last_bumpers WHERE bumpedAt != ?';
  return db.prepare(deletePreviousBumpers).run(bumpDate.toISOString());
}
