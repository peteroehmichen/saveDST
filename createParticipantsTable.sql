DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
     id SERIAL PRIMARY KEY,
     created TIMESTAMP NOT NULL,
     first VARCHAR NOT NULL CHECK (first != ''),
     last VARCHAR NOT NULL CHECK (last != ''),
     signature TEXT NOT NULL CHECK (signature != '')
);