ALTER TABLE eps_attempts ADD COLUMN active_section TEXT NOT NULL DEFAULT 'reading' CHECK(active_section IN ('reading','listening'));
ALTER TABLE eps_attempts ADD COLUMN section_started_at TEXT;
UPDATE eps_attempts SET section_started_at=started_at WHERE kind='exam' AND section_started_at IS NULL;
