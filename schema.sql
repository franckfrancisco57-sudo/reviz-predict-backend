-- ============================================================
-- SCHEMA REVIZPREDICT - Football reel + E-sport reel
-- Principe : historiques strictement separes par module/jeu/competition
-- ============================================================

-- ---------- FOOTBALL REEL ----------

CREATE TABLE IF NOT EXISTS football_matches (
  match_id        TEXT PRIMARY KEY,
  competition     TEXT NOT NULL,
  country         TEXT,
  season          TEXT,
  round           TEXT,
  home_team       TEXT NOT NULL,
  away_team       TEXT NOT NULL,
  match_date      TEXT NOT NULL,
  kickoff_time    TEXT,
  status          TEXT NOT NULL CHECK (status IN ('scheduled','live','finished','postponed')),
  score_home      INTEGER,
  score_away      INTEGER,
  score_home_ht   INTEGER,
  score_away_ht   INTEGER,
  venue           TEXT,
  referee         TEXT,
  source          TEXT NOT NULL,
  last_updated    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_football_competition ON football_matches(competition);
CREATE INDEX IF NOT EXISTS idx_football_date ON football_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_football_status ON football_matches(status);

CREATE TABLE IF NOT EXISTS football_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id    TEXT NOT NULL REFERENCES football_matches(match_id),
  minute      INTEGER NOT NULL,
  event_type  TEXT NOT NULL, -- but, carton_jaune, carton_rouge, corner, tir, tir_cadre, remplacement
  team        TEXT NOT NULL,
  detail      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_football_events_match ON football_events(match_id);

-- ---------- E-SPORT REEL ----------
-- Chaque jeu garde un historique totalement isole (jamais mixe entre jeux)

CREATE TABLE IF NOT EXISTS esport_matches (
  match_id        TEXT PRIMARY KEY,
  game            TEXT NOT NULL,          -- dota2 | cs2 | lol | ...
  competition     TEXT NOT NULL,
  tier            TEXT,
  format          TEXT,                    -- Bo1 | Bo3 | Bo5
  team_a          TEXT NOT NULL,
  team_b          TEXT NOT NULL,
  match_date      TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('scheduled','live','finished')),
  score_a         INTEGER,
  score_b         INTEGER,
  source          TEXT NOT NULL,
  last_updated    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_esport_game ON esport_matches(game);
CREATE INDEX IF NOT EXISTS idx_esport_competition ON esport_matches(competition);
CREATE INDEX IF NOT EXISTS idx_esport_date ON esport_matches(match_date);

CREATE TABLE IF NOT EXISTS esport_game_results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id    TEXT NOT NULL REFERENCES esport_matches(match_id),
  game_number INTEGER NOT NULL,   -- map/manche 1, 2, 3...
  map_name    TEXT,
  winner      TEXT,
  side_a      TEXT,               -- ex: CT/T, Radiant/Dire, Blue/Red
  side_b      TEXT,
  duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_esport_results_match ON esport_game_results(match_id);

-- ---------- PREDICTIONS (communes, mais toujours rattachees a un seul module) ----------

CREATE TABLE IF NOT EXISTS predictions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  module              TEXT NOT NULL CHECK (module IN ('football','esport')),
  match_id            TEXT NOT NULL,
  model_name          TEXT NOT NULL,   -- statistical | form | ensemble ...
  market              TEXT NOT NULL,   -- 1x2 | over_under_2_5 | btts | winner | ...
  prediction_payload  TEXT NOT NULL,   -- JSON: probabilites par issue
  data_quality_score  INTEGER NOT NULL,
  sample_size         INTEGER NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(module, match_id, model_name, market)
);

CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(module, match_id);

-- ---------- SUIVI DE PERFORMANCE (apprentissage / backtesting) ----------

CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  prediction_id   INTEGER NOT NULL REFERENCES predictions(id),
  actual_result   TEXT NOT NULL,       -- JSON du resultat reel
  was_correct     INTEGER,             -- 0/1, null si marche non binaire
  error_metric    REAL,                -- ex: brier score
  evaluated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outcomes_prediction ON prediction_outcomes(prediction_id);

-- ---------- QUALITE DES DONNEES (log, pour audit) ----------

CREATE TABLE IF NOT EXISTS data_quality_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  module          TEXT NOT NULL,
  entity_key      TEXT NOT NULL,   -- ex: "football:Ligue1" ou "esport:cs2:ESL Pro League"
  score           INTEGER NOT NULL,
  sample_size     INTEGER NOT NULL,
  reason          TEXT,
  checked_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
