// middle man between DB and Server
// holds all queries we'll be using to talk to our DB

// const { decodeBase64 } = require("bcryptjs");
const spicedPg = require("spiced-pg");
const { hash } = require("./auth");
const sql = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/adobo-petition"
);
// const sql = spicedPg(
//     "postgres:postgres:postgres@localhost:5432/adobo-petition"
// ); // in String: "DB-Agent": "User" : "Password" @ "server:port/DB"
/* 
for heroku if i use a specific user:

*/

// Requests for signatures table
module.exports.addSignature = (userID, signature, comment) => {
    const params = [userID, signature];
    const q = `INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id;`;
    // return sql.query(q, params);
    const promises = [sql.query(q, params)];

    const params2 = [comment, userID];
    const q2 = `INSERT INTO user_profiles (comment, user_id) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET comment = $1;`;

    promises.push(sql.query(q2, params2));

    return Promise.all(promises);
};

module.exports.deleteSignature = (userID) => {
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

module.exports.changeUserData = (user, password, userID) => {
    // console.log("starting");
    const promises = [
        module.exports.setProfileData(user.age, user.city, user.url, userID),
    ];
    if (password == "") {
        promises.push(
            sql.query(
                `UPDATE users SET first = $1, last = $2, email = $3 WHERE id = $4;`,
                [user.first, user.last, user.email, userID]
            )
        );
    } else {
        promises.push(
            hash(password).then((hashedPW) =>
                sql.query(
                    `UPDATE users SET first = $1, last = $2, email = $3, password = $4 WHERE id = $5;`,
                    [user.first, user.last, user.email, hashedPW, userID]
                )
            )
        );
    }
    return Promise.all(promises);
};

module.exports.deleteUser = (userID) => {
    return module.exports
        .deleteSignature(userID)
        .then(() => module.exports.deleteProfileData(userID))
        .then(() => sql.query(`DELETE FROM users WHERE id = $1;`, [userID]));
};

// Requests for user_profiles table
module.exports.getUserProfileByID = (userID) => {
    return sql.query(`SELECT * FROM user_profiles WHERE user_id = $1;`, [
        userID,
    ]);
};

module.exports.getComments = () => {
    return sql.query(
        `SELECT comment FROM user_profiles WHERE length(comment) > 1;`
    );
};

module.exports.setProfileData = (age, city, url, userID) => {
    let params, q;
    if (age == "") {
        params = [city, url, userID];
        q = `INSERT INTO user_profiles (city, url, user_id) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET city = $1, url = $2;`;
        // q = `INSERT INTO user_profiles (city, url, user_id) VALUES ($1, $2, $3);`;
    } else {
        params = [age, city, url, userID];
        q = `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET age = $1, city = $2, url = $3;`;
        // q = `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4);`;
    }
    return sql.query(q, params);
};

module.exports.changeProfileData = (age, city, url, userID) => {
    const params = [age, city, url, userID];
    const q = `UPDATE user_profiles SET age = $1, city = $2, url = $3 WHERE user_id = $4;`;
    return sql.query(q, params);
};

module.exports.deleteProfileData = (userID) => {
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
