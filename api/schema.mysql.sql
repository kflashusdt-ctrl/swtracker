-- MySQL / MariaDB schema (SQLite creates its tables automatically).
CREATE TABLE IF NOT EXISTS payment_status_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uetr CHAR(36) NOT NULL,
  status_code CHAR(4) NOT NULL,          -- ACSP | ACCC | RJCT
  reason_code CHAR(4) NULL,              -- G000..G004 (only with ACSP)
  agent_bic VARCHAR(11) NULL,            -- bank that reported / holds the payment
  occurred_at VARCHAR(25) NOT NULL,      -- when it happened (UTC, ISO 8601)
  received_at VARCHAR(25) NOT NULL,      -- when the partner told us (UTC)
  source VARCHAR(64) NOT NULL,           -- partner id from WEBHOOK_SECRETS
  event_hash CHAR(64) NOT NULL UNIQUE,
  INDEX idx_pse_uetr (uetr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket VARCHAR(80) PRIMARY KEY,
  hits INT NOT NULL,
  window_start INT NOT NULL
) ENGINE=InnoDB;
