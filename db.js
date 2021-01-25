// middle man between DB and Server
// holds all queries we'll be using to talk to our DB

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/adobo-petition"); // in String: "DB-Agent": "User" : "Password" @ "server:port/DB"

module.exports.addSignature = (userID, signature) => {
    const params = [userID, signature];
    const q = `INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id;`;
    return db.query(q, params);
};

module.exports.deleteSignature = function deleteSignature(userID) {
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [userID]);
};

module.exports.getSignatureByID = (userID) => {
    return db.query(`SELECT id, signature FROM signatures WHERE user_id = $1`, [
        userID,
    ]);
};

// could also try to count(*) or count(rows)
module.exports.getCount = () => {
    return db.query(`SELECT COUNT(id) FROM signatures;`);
};

module.exports.getList = () => {
    // return db.query(`SELECT * FROM signatures`);
    return db.query(
        `SELECT TO_CHAR(created,'DD.MM.YYYY (HH24:MI)') AS date, first, last, signature FROM signatures;`
    );
};

module.exports.getUserbyMail = (email) => {
    return db.query(`SELECT * FROM users WHERE email = $1;`, [email]);
};

module.exports.getUserbyID = (userID) => {
    return db.query(`SELECT * FROM users WHERE id = $1;`, [userID]);
};

module.exports.addUser = (first, last, city = "", email, password) => {
    const param = [first, last, city, email, password];
    const q = `INSERT INTO users (first, last, city, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING id;`;
    return db.query(q, param);
};

module.exports.changeUserData = (arr) => {
    // const params = [first, last, city, userID];
    const q = `UPDATE users SET first = $1, last = $2, city = $3 WHERE id = $4 RETURNING first, last, city;`;
    return db.query(q, arr);
};

module.exports.deleteUser = (userID) => {
    return db
        .deleteSignature(userID)
        .then(() => db.query(`DELETE FROM users WHERE id = $1`, [userID]));
};

// module.exports.deleteUser = (userID) => {
//     return db
//         .query(`DELETE FROM signatures WHERE user_id = $1`, [userID])
//         .then(() => db.query(`DELETE FROM users WHERE id = $1`, [userID]));
// };