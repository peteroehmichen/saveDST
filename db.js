// middle man between DB and Server
// holds all queries we'll be using to talk to our DB

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/adobo-petition"); // in String: "DB-Agent": "User" : "Password" @ "server:port/DB"

module.exports.addSignatory = (first, last, signature) => {
    const params = [first, last, signature];
    const q = `INSERT INTO signatures (created, first, last, signature) VALUES (current_timestamp, $1, $2, $3) RETURNING id`;
    return db.query(q, params);
};
module.exports.getParticipant = (id) => {
    return db.query(`SELECT * FROM signatures WHERE id = $1`, [id]);
};

module.exports.getList = () => {
    // return db.query(`SELECT * FROM signatures`);
    return db.query(
        `SELECT TO_CHAR(created,'DD.MM.YYYY (HH24:MI)') AS date, first, last, signature FROM signatures;`
    );
};
// to_char(created, "DD.MM.YYYY, HH24:MI");

module.exports.getCount = () => {
    return db.query(`SELECT COUNT(id) FROM signatures`);
};
