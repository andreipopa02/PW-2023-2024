DROP TABLE IF EXISTS produse;

CREATE TABLE produse (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT UNIQUE,
    pret REAL,
    gramaj REAL,
    imagine TEXT
);