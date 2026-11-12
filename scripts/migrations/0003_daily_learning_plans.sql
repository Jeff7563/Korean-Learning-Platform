CREATE TABLE IF NOT EXISTS daily_plans (
  plan_date TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('standard','light','rest')),
  lesson_id INTEGER REFERENCES lessons(id),
  recommendation TEXT NOT NULL,
  recommendation_href TEXT NOT NULL,
  planned_minutes INTEGER NOT NULL CHECK (planned_minutes >= 0),
  actual_minutes INTEGER NOT NULL DEFAULT 0 CHECK (actual_minutes >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_plan_tasks (
  id INTEGER PRIMARY KEY,
  plan_date TEXT NOT NULL REFERENCES daily_plans(plan_date) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  planned_minutes INTEGER NOT NULL CHECK (planned_minutes >= 0),
  href TEXT NOT NULL,
  optional INTEGER NOT NULL DEFAULT 0 CHECK (optional IN (0,1)),
  completed_at TEXT,
  UNIQUE (plan_date, task_key)
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_tasks_date ON daily_plan_tasks(plan_date, id);
