// middle man between DB and Server
// holds all queries we'll be using to talk to our DB

const { decodeBase64 } = require("bcryptjs");
const spicedPg = require("spiced-pg");
const sql = spicedPg(
    "postgres:postgres:postgres@localhost:5432/adobo-petition"
); // in String: "DB-Agent": "User" : "Password" @ "server:port/DB"

// Requests for signatures table
module.exports.addSignature = (userID, signature) => {
    const params = [userID, signature];
    const q = `INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id;`;
    return sql.query(q, params);
};

module.exports.deleteSignature = function deleteSignature(userID) {
    return sql.query(`DELETE FROM signatures WHERE user_id = $1;`, [userID]);
};

module.exports.getSignatureByID = (userID) => {
    return sql.query(`SELECT * FROM signatures WHERE user_id = $1;`, [userID]);
};

// could also try to count(*) or count(rows)
module.exports.getCount = () => {
    return sql.query(`SELECT COUNT(id) FROM signatures;`);
};

// Requests for users table
module.exports.getUserCredentialsByMail = (email) => {
    return sql.query(`SELECT id, password FROM users WHERE email = $1;`, [
        email,
    ]);
};

module.exports.getUserByID = (userID) => {
    return sql.query(`SELECT * FROM users WHERE id = $1;`, [userID]);
};

module.exports.addUser = (first, last, email, password) => {
    const param = [first, last, email, password];
    const q = `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id;`;
    return sql.query(q, param);
};

module.exports.changeUserData = (first, last, userID) => {
    const params = [first, last, userID];
    const q = `UPDATE users SET first = $1, last = $2 WHERE id = $3;`;
    return sql.query(q, params);
};

module.exports.deleteUser = (userID) => {
    return deleteSignature(userID)
        .then(() => deleteProfileData(userID))
        .then(() => sql.query(`DELETE FROM users WHERE id = $1;`, [userID]));
};

// Requests for user_profiles table
module.exports.getUserProfileByID = (userID) => {
    return sql.query(`SELECT * FROM user_profiles WHERE user_id = $1;`, [
        userID,
    ]);
};

module.exports.addProfileData = (age, city, url, userID) => {
    let params, q;
    if (age == "") {
        params = [city, url, userID];
        q = `INSERT INTO user_profiles (city, url, user_id) VALUES ($1, $2, $3);`;
    } else {
        params = [age, city, url, userID];
        q = `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4);`;
    }
    return sql.query(q, params);
};

module.exports.changeProfileData = (age, city, url, userID) => {
    const params = [age, city, url, userID];
    const q = `UPDATE user_profiles SET age = $1, city = $2, url = $3 WHERE user_id = $4;`;
    return sql.query(q, params);
};

module.exports.deleteProfileData = function deleteProfileData(userID) {
    return sql.query(`DELETE FROM user_profiles WHERE user_id = $1`, [userID]);
};

// JOINED Requests

module.exports.getList = (city = "") => {
    if (city == "") {
        return sql.query(
            `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url FROM users JOIN signatures ON users.id = signatures.user_id JOIN user_profiles ON users.id = user_profiles.user_id;`
        );
    } else {
        return sql.query(
            `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url FROM users JOIN signatures ON users.id = signatures.user_id JOIN user_profiles ON users.id = user_profiles.user_id WHERE LOWER(user_profiles.city) = LOWER($1);`,
            [city]
        );
    }
};
// } else {
//     return sql.query(
//         `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url FROM users JOIN signatures ON users.id = signatures.user_id JOIN user_profiles ON users.id = user_profiles.user_id WHERE LOWER(user_profiles.city) = LOWER('$1')`,
//         [city]
//     );
// }
// return db.query(`SELECT * FROM signatures`);
// return sql.query(
//     `SELECT TO_CHAR(created,'DD.MM.YYYY (HH24:MI)') AS date, first, last, signature FROM signatures;`
// );
