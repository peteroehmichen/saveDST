// middle man between DB and Server
// holds all queries we'll be using to talk to our DB

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/adobo-petition"); // in String: "DB-Agent": "User" : "Password" @ "server:port/DB"

module.exports.addSignatory = (first, last, signature) => {
    const params = [first, last, signature];
    const q = `INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3)`;
    return db.query(q, params);
};

module.exports.getList = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.getCount = () => {
    return db.query(`SELECT COUNT(id) FROM signatures`);
};
