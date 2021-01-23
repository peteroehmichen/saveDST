const bcrypt = require("bcryptjs");
let { genSalt, hash, compare } = bcrypt;
const { promisify } = require("util");

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare;

module.exports.hash = (plainPW) => {
    return genSalt()
        .then((salt) => hash(plainPW, salt))
        .catch((err) => {
            console.log("Error during hashing PW:", err);
        });
};

module.exports.fillCurrentUserObj = (obj) => {
    // console.log("writing to userOBJ:", obj);
    const activeUser = {
        id: obj.id,
        first: obj.first,
        last: obj.last,
        city: obj.city,
        initials: `${obj.first[0].toUpperCase()}${obj.last[0].toUpperCase()}`,
    };
    return activeUser;
};
