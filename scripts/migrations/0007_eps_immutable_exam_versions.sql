ALTER TABLE eps_exam_sets ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1));

-- V0.7 forms remain readable by historical attempts and available in guided practice,
-- but new exam attempts use the balanced V0.7.1 Korean-language forms.
UPDATE eps_exam_sets SET is_active=0 WHERE id IN ('legacy-style','current-style');

CREATE INDEX IF NOT EXISTS idx_eps_exam_sets_active ON eps_exam_sets(is_active,id);

CREATE TRIGGER IF NOT EXISTS eps_questions_immutable_update
BEFORE UPDATE ON eps_questions
BEGIN
  SELECT RAISE(ABORT, 'Published EPS questions are immutable; publish a new exam form version.');
END;

CREATE TRIGGER IF NOT EXISTS eps_questions_immutable_delete
BEFORE DELETE ON eps_questions
BEGIN
  SELECT RAISE(ABORT, 'Published EPS questions cannot be deleted; retire their exam form instead.');
END;

CREATE TRIGGER IF NOT EXISTS eps_exam_set_content_immutable
BEFORE UPDATE ON eps_exam_sets
WHEN OLD.title IS NOT NEW.title
  OR OLD.style IS NOT NEW.style
  OR OLD.source_type IS NOT NEW.source_type
  OR OLD.description IS NOT NEW.description
  OR OLD.time_minutes IS NOT NEW.time_minutes
  OR OLD.max_score IS NOT NEW.max_score
BEGIN
  SELECT RAISE(ABORT, 'Published EPS exam forms are immutable; publish a new exam form version.');
END;
