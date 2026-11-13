CREATE TABLE IF NOT EXISTS checkpoint_answer_snapshots (
  attempt_id INTEGER NOT NULL REFERENCES checkpoint_attempts(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  snapshot_kind TEXT NOT NULL CHECK(snapshot_kind IN ('captured','legacy_unverified')),
  PRIMARY KEY(attempt_id, exercise_id)
);

INSERT OR IGNORE INTO checkpoint_answer_snapshots(
  attempt_id, exercise_id, prompt, options_json, answer_index, explanation, snapshot_kind
)
SELECT ca.attempt_id, ca.exercise_id, e.prompt, e.options_json, e.answer_index, e.explanation, 'legacy_unverified'
FROM checkpoint_answers ca
JOIN exercises e ON e.id = ca.exercise_id;

CREATE TRIGGER IF NOT EXISTS checkpoint_answer_snapshots_no_update
BEFORE UPDATE ON checkpoint_answer_snapshots
BEGIN
  SELECT RAISE(ABORT, 'checkpoint answer snapshots are immutable');
END;

CREATE TRIGGER IF NOT EXISTS checkpoint_answer_snapshots_no_delete
BEFORE DELETE ON checkpoint_answer_snapshots
BEGIN
  SELECT RAISE(ABORT, 'checkpoint answer snapshots are immutable');
END;
