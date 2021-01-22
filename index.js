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
const { hash, compare } = require("./auth.js");

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
    console.log(
        "active user on (/):",
        req.session.userID,
        req.session.signatureID
    );
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
    console.log(
        "active user on (POST /):",
        req.session.userID,
        req.session.signatureID
    );
    if (req.body.register) {
        if (req.body.plainPW != "") {
            const { firstName, lastName, city, email, plainPW } = req.body;
            hash(plainPW)
                .then((hashedPW) =>
                    addUser(firstName, lastName, city, email, hashedPW)
                )
                .then((result) => {
                    console.log("user added to DB with ID", result.rows[0].id);
                    req.session.userID = result.rows[0].id;
                    return res.redirect("/petition");
                })
                .catch((err) => {
                    if (err.code == "23505") {
                        console.log("email already exists...");
                    } else {
                        console.log(
                            "unknown DB error while registering user:",
                            err
                        );
                    }
                    return res.redirect("/");
                    // work more on that...
                });
        } else {
            console.log("password cant be empty...");
            res.redirect("/");
        }
    } else if (req.body.login) {
        const { email, plainPW } = req.body;
        getUserbyMail(email)
            .then((user) =>
                Promise.all([
                    compare(plainPW, user.rows[0].password),
                    user.rows[0].id,
                ])
            )
            .then((authorized) => {
                if (authorized[0]) {
                    req.session.userID = authorized[1];
                    return res.redirect("/petition");
                } else {
                    console.log("user and password do not match");
                    return res.redirect("/");
                    // more detail: password to existing person wrong!
                    // work more on that...
                }
            })
            .catch((err) => {
                console.log("user and password do not match");
                return res.redirect("/");
                // most likely user not found
            });
    } else {
        // not sure what to do here...
    }

    // if (firstName == "" || lastName == "" || sigDataURL == "") {
    //     res.render("form", {
    //         layout: "main",
    //         dataError: true,
    //     });
    // } else {
    //     // Check if DB gets written with correct value
    //     // This is a temporary placeholder
    //     const userID = 1;
    //     addSignature(userID, sigDataURL)
    //         .then((result) => {
    //             // req.session.userID = result.rows[0].id;
    //             res.redirect("/thanks");
    //         })
    //         .catch((err) => {
    //             console.log("DB-Error while adding new participants:", err);
    //         });
    // }
});

// From here on it is only for users!

app.get("/petition", (req, res) => {
    console.log(
        "active user on (/petition):",
        req.session.userID,
        req.session.signatureID
    );
    if (req.session.userID && req.session.signatureID) {
        console.log("user and signature found - redirect to /thanks");
        return res.redirect("/thanks");
    } else if (req.session.userID) {
        Promise.all([
            getUserbyID(req.session.userID),
            getSignatureByID(req.session.userID),
        ]).then((result) => {
            if (result[1].rowCount) {
                req.session.signatureID = result[1].rows[0].id;
                return res.redirect("/petition");
            } else {
                return res.render("form", {
                    layout: "main",
                    logged: req.session.userID,
                    first: result[0].rows[0].first,
                    last: result[0].rows[0].last,
                    city: result[0].rows[0].city,
                });
            }
        });
    } else {
        console.log("logIn required");
        return res.redirect("/");
    }
});

app.post("/petition", (req, res) => {
    console.log(
        "active user on (POST /petition):",
        req.session.userID,
        req.session.signatureID
    );
    if (req.session.userID) {
        addSignature(req.session.userID, req.body.sigDataURL)
            .then((result) => {
                req.session.signatureID = result.rows[0].id;
                return res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("Error during writing to DB:", err);
                return;
            });
    } else {
        console.log("logIn required");
        return res.redirect("/");
    }
});

app.get("/thanks", (req, res) => {
    console.log(
        "active user on (/thanks):",
        req.session.userID,
        req.session.signatureID
    );
    if (req.session.userID && req.session.signatureID) {
        Promise.all([getSignatureByID(req.session.userID), getCount()])
            .then((results) => {
                return res.render("thanks", {
                    layout: "main",
                    logged: req.session.userID,
                    signature: results[0].rows[0].signature,
                    count: results[1].rows[0].count,
                });
            })
            .catch((err) => {
                console.log("Error during db-request for /thanks:", err);
            });
    } else {
        console.log("logIn required");
        return res.redirect("/");

        // console.log("no cookie while accessing /thanks");
        // res.render("register", {
        //     layout: "main",
        //     cookieError: true,
        // });
    }
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

app.get("/new", (req, res) => {
    console.log("active user:", req.session.userID);
    req.session = null;
    res.redirect("/");
});

app.listen(8080, () => console.log("Petition-Server is listening..."));

/*
prevent double signing...
invalid csrf token when deleting the cookie at load page.

list of participants based on signatures - signatures are not obligatory and after login.
check of permissing is twofold - pw and signature...

cookie after successful login is the id

double user while adding?
*/
