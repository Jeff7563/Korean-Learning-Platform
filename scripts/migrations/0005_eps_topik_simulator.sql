CREATE TABLE IF NOT EXISTS eps_sources (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  edition TEXT NOT NULL,
  url TEXT NOT NULL,
  format TEXT NOT NULL,
  access_status TEXT NOT NULL,
  answer_audio_status TEXT NOT NULL,
  copyright_notes TEXT NOT NULL,
  verification_notes TEXT NOT NULL,
  verified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eps_exam_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  style TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('OFFICIAL_SAMPLE','HISTORICAL_SOURCE','ORIGINAL_MOCK')),
  description TEXT NOT NULL,
  time_minutes INTEGER NOT NULL DEFAULT 50,
  max_score INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eps_questions (
  id INTEGER PRIMARY KEY,
  exam_set_id TEXT NOT NULL REFERENCES eps_exam_sets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  section TEXT NOT NULL CHECK(section IN ('reading','listening')),
  skill TEXT NOT NULL CHECK(skill IN ('vocabulary','grammar','everyday','workplace','safety')),
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  answer_index INTEGER NOT NULL CHECK(answer_index BETWEEN 0 AND 3),
  explanation_th TEXT NOT NULL,
  listening_script TEXT,
  source_type TEXT NOT NULL CHECK(source_type='ORIGINAL_MOCK'),
  UNIQUE(exam_set_id,position)
);
CREATE INDEX IF NOT EXISTS idx_eps_questions_set_section ON eps_questions(exam_set_id,section,position);
CREATE INDEX IF NOT EXISTS idx_eps_questions_skill_section ON eps_questions(skill,section);

CREATE TABLE IF NOT EXISTS eps_attempts (
  id INTEGER PRIMARY KEY,
  exam_set_id TEXT REFERENCES eps_exam_sets(id),
  kind TEXT NOT NULL CHECK(kind IN ('exam','practice')),
  practice_mode TEXT,
  status TEXT NOT NULL CHECK(status IN ('in_progress','submitted')),
  question_ids_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TEXT,
  submitted_at TEXT,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK(elapsed_seconds >= 0),
  score_percent INTEGER CHECK(score_percent BETWEEN 0 AND 100),
  section_scores_json TEXT,
  missed_skills_json TEXT,
  CHECK((kind='exam' AND exam_set_id IS NOT NULL AND expires_at IS NOT NULL) OR (kind='practice' AND practice_mode IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_eps_attempt_status ON eps_attempts(status,kind,exam_set_id,id DESC);

CREATE TABLE IF NOT EXISTS eps_attempt_answers (
  attempt_id INTEGER NOT NULL REFERENCES eps_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES eps_questions(id),
  selected_index INTEGER NOT NULL CHECK(selected_index BETWEEN 0 AND 3),
  selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(attempt_id,question_id)
);
CREATE INDEX IF NOT EXISTS idx_eps_answers_question ON eps_attempt_answers(question_id,selected_index);
