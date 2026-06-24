import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../../')

const dbPath = process.env.DB_PATH || path.join(projectRoot, 'data/app.db')
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const uploadDir = process.env.UPLOAD_DIR || path.join(projectRoot, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(path.join(uploadDir, 'audio'), { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 建表
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL CHECK(subject IN ('english','chinese')),
  grade TEXT DEFAULT '',
  semester TEXT DEFAULT '',
  textbook TEXT DEFAULT '',
  order_num INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_units_creator ON units(created_by);
CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  pinyin TEXT DEFAULT '',
  phonetic TEXT DEFAULT '',
  part_of_speech TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  lesson INTEGER DEFAULT 1,
  difficulty INTEGER DEFAULT 3,
  examples TEXT DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_words_unit ON words(unit_id);
CREATE INDEX IF NOT EXISTS idx_words_unit_word ON words(unit_id, word);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL CHECK(subject IN ('english','chinese')),
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  members TEXT NOT NULL DEFAULT '[]',
  shared_unit_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_creator ON classes(created_by);

CREATE TABLE IF NOT EXISTS dictation_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  mode TEXT NOT NULL,
  unit_ids TEXT NOT NULL DEFAULT '[]',
  unit_names TEXT NOT NULL DEFAULT '[]',
  word_count_range TEXT NOT NULL DEFAULT '{}',
  lesson_range TEXT DEFAULT '{}',
  total_words INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  questions TEXT NOT NULL DEFAULT '[]',
  wrong_words TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_logs_user ON dictation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON dictation_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS preset_textbooks (
  id TEXT PRIMARY KEY,
  grade_level TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL CHECK(subject IN ('english','chinese')),
  version TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_preset_tb_subject ON preset_textbooks(subject);
CREATE INDEX IF NOT EXISTS idx_preset_tb_grade ON preset_textbooks(grade_level);

CREATE TABLE IF NOT EXISTS preset_units (
  id TEXT PRIMARY KEY,
  textbook_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'word',
  order_num INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  FOREIGN KEY (textbook_id) REFERENCES preset_textbooks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_preset_unit_tb ON preset_units(textbook_id);

CREATE TABLE IF NOT EXISTS preset_words (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL DEFAULT '',
  pinyin TEXT DEFAULT '',
  phonetic TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  lesson INTEGER DEFAULT 1,
  FOREIGN KEY (unit_id) REFERENCES preset_units(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_preset_word_unit ON preset_words(unit_id);
`)

export default db
export { dbPath, uploadDir }
