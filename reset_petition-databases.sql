DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      first VARCHAR(255) NOT NULL,
      last VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
     id SERIAL PRIMARY KEY,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     user_id INT NOT NULL UNIQUE REFERENCES users(id),
     signature TEXT NOT NULL CHECK (signature != '')
);

CREATE TABLE user_profiles (
      id SERIAL PRIMARY KEY,
      age INT, 
      city VARCHAR(100),
      url VARCHAR(300),
      comment TEXT,
      user_id INT REFERENCES users(id) NOT NULL UNIQUE
);