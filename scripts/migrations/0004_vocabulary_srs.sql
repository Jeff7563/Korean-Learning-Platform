CREATE TABLE IF NOT EXISTS vocabulary_review_state (
  vocabulary_id INTEGER PRIMARY KEY REFERENCES vocabulary(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL,
  interval_days INTEGER NOT NULL CHECK(interval_days >= 0),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK(review_count >= 0),
  lapse_count INTEGER NOT NULL DEFAULT 0 CHECK(lapse_count >= 0),
  last_reviewed_date TEXT NOT NULL,
  last_rating TEXT NOT NULL CHECK(last_rating IN ('again','hard','good')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vocabulary_review_due ON vocabulary_review_state(due_date, lapse_count DESC);
CREATE TABLE IF NOT EXISTS vocabulary_review_events (
  id INTEGER PRIMARY KEY,
  vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  rating TEXT NOT NULL CHECK(rating IN ('again','hard','good')),
  reviewed_date TEXT NOT NULL,
  previous_interval_days INTEGER NOT NULL CHECK(previous_interval_days >= 0),
  next_interval_days INTEGER NOT NULL CHECK(next_interval_days >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vocabulary_review_history ON vocabulary_review_events(reviewed_date DESC, id DESC);
