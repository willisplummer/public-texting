CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  phone_number VARCHAR(256) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX idx_uq_active_users_phone_number ON users(phone_number) WHERE users.active = TRUE;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE conversations (
  ID SERIAL PRIMARY KEY,
  first_user_id INTEGER REFERENCES users(id),
  second_user_id INTEGER REFERENCES users(id),
  twilio_phone_number VARCHAR(256) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX conversations_first_user_id_idx ON conversations(first_user_id);
CREATE INDEX conversations_second_user_id_idx ON conversations(second_user_id);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE messages (
  ID SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_id INTEGER REFERENCES users(id),
  body VARCHAR(256) NOT NULL,
  media_url VARCHAR(256),
  media_type VARCHAR(256),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX messages_conversation_id ON messages(conversation_id);
CREATE INDEX messages_sender_id ON messages(sender_id);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
