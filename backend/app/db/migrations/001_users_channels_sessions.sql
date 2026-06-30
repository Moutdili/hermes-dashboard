-- Migration 001 — Users, Channels, Sessions, Messages, Memory
-- Migre le schéma SQLite (db.py) vers PostgreSQL (asyncpg)

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dash_users (
    id              TEXT PRIMARY KEY,          -- Tailscale IP (100.76.54.29)
    name            TEXT NOT NULL,             -- "Mio (fhp)"
    tailscale_name  TEXT,                      -- "fedora-hp"
    device_type     TEXT DEFAULT 'unknown',    -- 'linux', 'iOS', 'mac'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_seen       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Channels ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dash_channels (
    id          TEXT PRIMARY KEY,              -- "mio-fhp", "shared", "mio-iphone"
    name        TEXT NOT NULL,                 -- "Mio (fhp)", "Shared 🌐"
    type        TEXT NOT NULL DEFAULT 'private', -- 'private' | 'shared' | 'linked_device'
    owner_id    TEXT REFERENCES dash_users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dash_channel_members (
    channel_id  TEXT REFERENCES dash_channels(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES dash_users(id) ON DELETE CASCADE,
    role        TEXT DEFAULT 'member',         -- 'owner' | 'member'
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

-- ── Sessions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dash_sessions (
    id          TEXT PRIMARY KEY,              -- UUID
    channel_id  TEXT REFERENCES dash_channels(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES dash_users(id),
    title       TEXT,
    model       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dash_sessions_channel
    ON dash_sessions(channel_id, updated_at DESC);

-- ── Messages ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dash_messages (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT REFERENCES dash_sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,                 -- 'user' | 'assistant' | 'system'
    content     TEXT NOT NULL,
    tool_calls  TEXT,                          -- JSON
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dash_messages_session
    ON dash_messages(session_id, id);

-- ── Memory (key-value per channel) ─────────────────────────
CREATE TABLE IF NOT EXISTS dash_memory (
    id          SERIAL PRIMARY KEY,
    channel_id  TEXT REFERENCES dash_channels(id) ON DELETE CASCADE,
    key         TEXT NOT NULL,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, key)
);
CREATE INDEX IF NOT EXISTS idx_dash_memory_channel
    ON dash_memory(channel_id);

-- ── Seed shared channel ────────────────────────────────────
INSERT INTO dash_channels (id, name, type)
VALUES ('shared', '🌐 Shared — Tout le monde', 'shared')
ON CONFLICT (id) DO NOTHING;