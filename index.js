const hb = require("express-handlebars");
const express = require("express");
const app = express();
const {
    addSignature,
    deleteSignature,
    getSignatureByID,
    getUserbyID,
    getUserbyMail,
    addUser,
    deleteUser,
    getList,
    getCount,
} = require("./db");
const cookieSession = require("cookie-session");
const { secretOfSession } = require("./secrets.json");
const csurf = require("csurf");
const { hash, compare, fillCurrentUserObj } = require("./auth.js");
let activeUser = {};

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: secretOfSession,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(express.urlencoded({ extended: false }));

app.use(csurf());

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(express.static("./public"));

app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.get("/", (req, res) => {
    // console.log(
    //     "active user on (/):",
    //     req.session.userID,
    //     req.session.signatureID
    // );
    if (req.session.userID) {
        return res.redirect("/petition");
    } else {
        return res.render("register", {
            layout: "main",
            logged: req.session.userID,
        });
    }
});

app.post("/", (req, res) => {
    // console.log(
    //     "active user on (POST /):",
    //     req.session.userID,
    //     req.session.signatureID
    // );
    if (req.body.register) {
        const { firstName, lastName, city, email, plainPW } = req.body;
        if (plainPW == "" || firstName == "" || lastName == "" || email == "") {
            // console.log("please fill out all required fields ...");
            return res.render("register", {
                layout: "main",
                registerError: "please fill out all required fields ...",
            });
        } else {
            hash(plainPW)
                .then((hashedPW) =>
                    addUser(firstName, lastName, city, email, hashedPW)
                )
                .then((result) => {
                    // console.log("user added to DB with ID", result.rows[0].id);
                    activeUser = {
                        id: result.rows[0].id,
                        first: firstName,
                        last: lastName,
                        city: city,
                        initials: `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`,
                    };
                    req.session.userID = result.rows[0].id;
                    return res.redirect("/petition");
                })
                .catch((err) => {
                    let msg = "";
                    if (err.code == "23505") {
                        // console.log("email already exists...");
                        msg = "email already exists...";
                    } else {
                        // console.log(
                        //     "unknown DB error while registering user:",
                        //     err
                        // );
                        msg = "unknown DB error while registering user";
                    }
                    return res.render("register", {
                        layout: "main",
                        registerError: msg,
                    });
                });
        }
    } else if (req.body.login) {
        const { email, plainPW } = req.body;
        if (email == "" || plainPW == "") {
            // console.log("please fill out both LogIn-Fields");
            return res.render("register", {
                layout: "main",
                registerError: "please fill out both LogIn-Fields",
                logField: "activeCred",
            });
        } else {
            getUserbyMail(email)
                .then((user) =>
                    Promise.all([
                        compare(plainPW, user.rows[0].password),
                        user.rows[0],
                    ])
                )
                .then((authorized) => {
                    if (authorized[0]) {
                        activeUser = fillCurrentUserObj(authorized[1]);
                        req.session.userID = authorized[1].id;
                        return res.redirect("/petition");
                    } else {
                        // console.log("user and password do not match");
                        return res.render("register", {
                            layout: "main",
                            registerError: "user and password do not match",
                            logField: "activeCred"
                        });
                        // more detail: password to existing person wrong!
                        // work more on that...
                    }
                })
                .catch((err) => {
                    // console.log("user and password do not match");
                    return res.render("register", {
                        layout: "main",
                        registerError: "user and password do not match",
                        logField: "activeCred"
                    });
                    // most likely user not found
                });
        }
    } else {
        // console.log("unkown error during filling out of form");
        return res.render("register", {
            layout: "main",
            registerError: "unkown error during filling out the form",
        });
    }
});

app.get("/new", (req, res) => {
    // console.log("full refresh");
    req.session = null;
    activeUser = {};
    return res.redirect("/");
});

// From here on it is only for users!
app.use((req, res, next) => {
    // console.log("you are entering protected space...");
    if (req.session.userID) {
        next();
    } else {
        // console.log("you are not logged in or registered!");
        return res.render("register", {
            layout: "main",
            registerError: "you are not logged in or registered!",
        });
    }
});

app.get("/petition", (req, res) => {
    // console.log(
    //     "active user on (/petition):",
    //     req.session.userID,
    //     req.session.signatureID
    // );
    if (req.session.signatureID) {
        // console.log("user and signature found - redirect to /thanks");
        return res.redirect("/thanks");
    } else {
        Promise.all([
            getUserbyID(req.session.userID),
            getSignatureByID(req.session.userID),
        ]).then((result) => {
            req.session.initials = `${result[0].rows[0].first[0].toUpperCase()}${result[0].rows[0].last[0].toUpperCase()}`;
            if (result[1].rowCount) {
                req.session.signatureID = result[1].rows[0].id;
                return res.redirect("/petition");
            } else {
                return res.render("form", {
                    layout: "main",
                    logged: req.session.userID,
                    activeUser,
                    reg: true,
                });
            }
        });
    }
});

app.post("/petition", (req, res) => {
    // console.log(
    //     "active user on (POST /petition):",
    //     req.session.userID,
    //     req.session.signatureID
    // );
    addSignature(req.session.userID, req.body.sigDataURL)
        .then((result) => {
            req.session.signatureID = result.rows[0].id;
            return res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("Error during writing to DB:", err);
            return;
        });
});

app.use((req, res, next) => {
    // console.log("you are entering protected space...");
    if (req.session.signatureID) {
        next();
    } else {
        // console.log("no signature found");
        return res.render("form", {
            layout: "main",
            logged: req.session.userID,
            signatureError: "no signature found",
            activeUser,
            test: "HP2",
        });
    }
});

app.get("/thanks", (req, res) => {
    // console.log(
    //     "active user on (/thanks):",
    //     req.session.userID,
    //     req.session.signatureID
    // );
    Promise.all([getSignatureByID(req.session.userID), getCount()])
        .then((results) => {
            return res.render("thanks", {
                layout: "main",
                logged: req.session.userID,
                signature: results[0].rows[0].signature,
                count: results[1].rows[0].count,
                activeUser,
                reg: true,
                sig: true,
            });
        })
        .catch((err) => {
            console.log("Error during db-request for /thanks:", err);
        });
});

// not yet there...

app.get("/participants", (req, res) => {
    res.send("<h1>Site under constuction 💪</h1>");
    // console.log("active user on (/participants):", req.session.userID);
    // if (req.session.userID) {
    //     getList()
    //         .then((result) => {
    //             res.render("participants", {
    //                 layout: "main",
    //                 part: result.rows,
    //                 count: result.rowCount,
    //             });
    //         })
    //         .catch((err) => {
    //             console.log("Error while getting Participants-List", err);
    //         });
    // } else {
    //     console.log("logIn required");
    //     res.redirect("/");
    //     // res.render("form", {
    //     //     layout: "main",
    //     //     cookieError: true,
    //     // });
    // }
});

app.listen(8080, () => console.log("Petition-Server is listening..."));

/*
invalid csrf token when deleting the cookie at load page.

list of participants based on signatures - signatures are not obligatory and after login.
check of permissing is twofold - pw and signature...

cookie after successful login is the id

how does the user get to delete or view his account without signing?

*/
