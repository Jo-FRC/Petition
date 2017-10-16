DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL primary key,
    first_name VARCHAR(255) not null,
    last_name VARCHAR(255) not null,
    email VARCHAR(255) unique,
    password VARCHAR(255) not null
);
