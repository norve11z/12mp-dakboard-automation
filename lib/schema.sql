-- Shifts imported from ICS (one row per VEVENT)
CREATE TABLE IF NOT EXISTS shifts (
  uid            TEXT PRIMARY KEY,
  employee_name  TEXT NOT NULL,
  position       TEXT NOT NULL,
  sport          TEXT NOT NULL,
  department     TEXT NOT NULL,
  dtstart        TEXT NOT NULL,   -- ISO 8601 UTC
  dtend          TEXT NOT NULL,
  location       TEXT,
  description    TEXT,
  raw_summary    TEXT NOT NULL,
  imported_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shifts_sport_date ON shifts(sport, dtstart);
CREATE INDEX IF NOT EXISTS idx_shifts_dept ON shifts(department);

-- The 4 physical control rooms / panels
CREATE TABLE IF NOT EXISTS control_rooms (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL
);

-- A "display" = a (sport, date, display_type) combo derived from shifts
-- display_type: 'broadcast' or 'bigscreen'
CREATE TABLE IF NOT EXISTS displays (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sport         TEXT NOT NULL,
  game_date     TEXT NOT NULL,        -- YYYY-MM-DD (local)
  display_type  TEXT NOT NULL,        -- 'broadcast' | 'bigscreen'
  ics_start     TEXT NOT NULL,        -- earliest dtstart of contributing shifts
  UNIQUE(sport, game_date, display_type)
);

-- Assignment of a display to a panel (control room)
CREATE TABLE IF NOT EXISTS assignments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  display_id       INTEGER NOT NULL,
  control_room_id  INTEGER NOT NULL,
  game_date        TEXT NOT NULL,
  manual           INTEGER NOT NULL DEFAULT 0,   -- 1 if manually overridden
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(display_id)      REFERENCES displays(id) ON DELETE CASCADE,
  FOREIGN KEY(control_room_id) REFERENCES control_rooms(id),
  UNIQUE(control_room_id, game_date)
);

-- Auto-assignment rules: which (sport, display_type) prefers which panel
CREATE TABLE IF NOT EXISTS assignment_rules (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sport            TEXT NOT NULL,
  display_type     TEXT NOT NULL,
  control_room_id  INTEGER NOT NULL,
  priority         INTEGER NOT NULL DEFAULT 100,
  FOREIGN KEY(control_room_id) REFERENCES control_rooms(id)
);

-- Maps raw ICS position → short label + display order, per (sport, display_type)
CREATE TABLE IF NOT EXISTS position_map (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  sport          TEXT NOT NULL,           -- or '*' for any
  display_type   TEXT NOT NULL,           -- 'broadcast' | 'bigscreen'
  ics_position   TEXT NOT NULL,
  short_label    TEXT NOT NULL,
  display_order  INTEGER NOT NULL,
  UNIQUE(sport, display_type, ics_position)
);

-- Schedule row template per sport+display_type
-- ref = 'ics_start' | 'kickoff'
-- offset_minutes = signed offset
CREATE TABLE IF NOT EXISTS schedule_template (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sport           TEXT NOT NULL,
  display_type    TEXT NOT NULL,
  row_order       INTEGER NOT NULL,
  label           TEXT NOT NULL,
  ref             TEXT NOT NULL,
  offset_minutes  INTEGER NOT NULL
);

-- Per-game extra info (opponent, kickoff) — manual for now
CREATE TABLE IF NOT EXISTS game_info (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sport       TEXT NOT NULL,
  game_date   TEXT NOT NULL,
  opponent    TEXT,
  kickoff     TEXT,
  notes       TEXT,
  logo_url    TEXT,
  source      TEXT NOT NULL DEFAULT 'manual',
  opponent_abbr TEXT,
  UNIQUE(sport, game_date)
);

-- Import run log
CREATE TABLE IF NOT EXISTS import_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at      TEXT NOT NULL DEFAULT (datetime('now')),
  success     INTEGER NOT NULL,
  message     TEXT,
  events_seen INTEGER
);

-- Seed the 4 control rooms
INSERT OR IGNORE INTO control_rooms (id, name) VALUES
  (1, 'Panel 1'),
  (2, 'Panel 2'),
  (3, 'Panel 3'),
  (4, 'Panel 4');

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('display_date_override', NULL);

CREATE TABLE IF NOT EXISTS panel_combo_rules (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  sports_key   TEXT NOT NULL UNIQUE,
  priority     INTEGER NOT NULL DEFAULT 100,
  panel_1      TEXT,
  panel_2      TEXT,
  panel_3      TEXT,
  panel_4      TEXT
);


CREATE INDEX IF NOT EXISTS
  idx_shifts_sport_dept_dtstart
ON shifts(sport, department, dtstart);

CREATE INDEX IF NOT EXISTS
  idx_assignments_panel_date
ON assignments(control_room_id, game_date);

CREATE INDEX IF NOT EXISTS
  idx_assignments_date_manual
ON assignments(game_date, manual);

CREATE INDEX IF NOT EXISTS
  idx_game_info_sport_date
ON game_info(sport, game_date);

CREATE INDEX IF NOT EXISTS
  idx_position_map_display_sport
ON position_map(display_type, sport);

CREATE INDEX IF NOT EXISTS
  idx_schedule_template_sport_display
ON schedule_template(sport, display_type);

CREATE TABLE IF NOT EXISTS scheduled_refreshes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  game_date TEXT NOT NULL,
  switch_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  executed_at TEXT,
  UNIQUE(sport, game_date, switch_at)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_refreshes_switch_at
  ON scheduled_refreshes(switch_at);