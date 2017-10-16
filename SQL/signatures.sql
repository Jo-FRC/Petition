DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS profiles;
CREATE TABLE signatures (
    id SERIAL primary key,
    signature TEXT not null,
    signature_ts TIMESTAMP DEFAULT current_timestamp,
    user_id INTEGER not null
);


CREATE TABLE users (
    id SERIAL primary key,
    first_name VARCHAR(255) not null,
    last_name VARCHAR(255) not null,
    email VARCHAR(255) unique,
    password VARCHAR(255) not null
);

CREATE TABLE profiles (
    id SERIAL primary key,
    user_id INTEGER unique not null,
    age INTEGER,
    city VARCHAR(255),
    url TEXT
);
