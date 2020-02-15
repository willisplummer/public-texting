INSERT INTO users (name, phone_number)
VALUES  ('Luiza', '+13475451506');

INSERT INTO users (name, phone_number)
VALUES  ('Willis', '+15412618972');

INSERT INTO conversations (first_user_id, second_user_id, twilio_phone_number)
VALUES  (1, 2, '+18163987214');

INSERT INTO messages (conversation_id, sender_id, body)
VALUES (1, 1, 'this is a message');

INSERT INTO messages (conversation_id, sender_id, body)
VALUES (1, 1, 'this is another message');

INSERT INTO messages (conversation_id, sender_id, body)
VALUES (1, 2, 'this is a response');

INSERT INTO messages (conversation_id, sender_id, body)
VALUES (1, 2, 'this is another response');

INSERT INTO messages (conversation_id, sender_id, body)
VALUES (1, 1, 'this is original sender again!');
