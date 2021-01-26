const hb = require("express-handlebars");
const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
// const { secretOfSession } = require("./secrets.json").secretOfSession;
const csurf = require("csurf");
const { hash, compare, setCurrentUserObj } = require("./auth.js");
let activeUser = {};
let errors = {
    register: null,
    signature: null,
    edit: null,
    login: null,
};
let cookie_secret;
if (process.env.cookie_secret) {
    cookie_secret = process.env.cookie_secret;
} else {
    cookie_secret = require("./secrets.json").secretOfSession;
}

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(
    cookieSession({
        secret: cookie_secret,
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
    if (req.session.userID) {
        return res.redirect("/petition");
    } else {
        let errorMsg = errors.register;
        errors.register = null;
        let activeLogField;
        if (errors.login) {
            activeLogField = "activeCred";
            errors.login = null;
        }
        return res.render("register", {
            layout: "main",
            logged: req.session.userID,
            registerError: errorMsg,
            logField: activeLogField,
        });
    }
});

app.post("/", (req, res) => {
    if (req.body.register) {
        const { firstName, lastName, email, plainPW } = req.body;
        if (plainPW == "" || firstName == "" || lastName == "" || email == "") {
            errors.register = "please fill out all required fields ...";
            return res.redirect("/");
        } else {
            hash(plainPW)
                .then((hashedPW) =>
                    db.addUser(firstName, lastName, email, hashedPW)
                )
                .then((result) => {
                    req.session.userID = result.rows[0].id;
                    return res.redirect("/profile");
                })
                .catch((err) => {
                    if (err.code == "23505") {
                        errors.register = "email already exists...";
                    } else {
                        errors.register =
                            "unknown DB error while registering user";
                    }
                    return res.redirect("/");
                });
        }
    } else if (req.body.login) {
        const { email, plainPW } = req.body;
        if (email == "" || plainPW == "") {
            errors.register = "please fill out both LogIn-Fields";
            errors.login = "activeCred";
            return res.redirect("/");
        } else {
            db.getUserCredentialsByMail(email)
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
                        errors.register = "user and password do not match";
                        errors.login = "activeCred";
                        return res.redirect("/");
                    }
                })
                .catch((err) => {
                    errors.register = "user and password do not match";
                    errors.login = "activeCred";
                    return res.redirect("/");
                });
        }
    } else {
        errors.register = "error during filling of form";
        return res.redirect("/");
    }
});

app.get("/new", (req, res) => {
    req.session = null;
    activeUser = {};
    return res.redirect("/");
});

// From here on it is only for users!
app.use((req, res, next) => {
    if (req.session.userID) {
        Promise.all([
            db.getUserByID(req.session.userID),
            db.getUserProfileByID(req.session.userID),
            db.getSignatureByID(req.session.userID),
        ])
            .then((results) => {
                activeUser = setCurrentUserObj(results[0].rows[0]);
                if (!results[1].rowCount && req.url == "/profile") {
                    next();
                } else {
                    if (results[1].rowCount) {
                        activeUser.age = results[1].rows[0].age;
                        activeUser.city = results[1].rows[0].city;
                        activeUser.url = results[1].rows[0].url;
                    }
                    if (results[2].rowCount) {
                        activeUser.signatureID = results[2].rows[0].id;
                        activeUser.signature = results[2].rows[0].signature;
                        if (
                            req.url == "/thanks" ||
                            req.url.startsWith("/participants")
                        ) {
                            next();
                        } else {
                            return res.redirect("/thanks");
                        }
                    } else {
                        if (req.url == "/petition") {
                            next();
                        } else {
                            return res.redirect("/petition");
                        }
                    }
                }
            })
            .catch((err) => {
                errors.register = "DB Error while loading active user";
                return res.redirect("/new");
            });
    } else {
        errors.register = "you are not logged in or registered!";
        return res.redirect("/new");
    }
});

app.get("/profile", (req, res) => {
    let errorMsg = errors.profile;
    errors.profile = null;
    return res.render("profile", {
        layout: "main",
        logged: req.session.userID, // I may not need this anymore
        activeUser,
        profileError: errorMsg,
        reg: true,
    });
});

app.post("/profile", (req, res) => {
    if (req.body.url != "" && !req.body.url.startsWith("http")) {
        errors.profile = "Website has wrong format";
        return res.redirect("/profile");
    } else {
        db.setProfileData(
            req.body.age,
            req.body.city,
            req.body.url,
            req.session.userID
        )
            .then(() => {
                activeUser.age = req.body.age;
                activeUser.city = req.body.city;
                activeUser.url = req.body.url;
                return res.redirect("/petition");
            })
            .catch((err) => {
                console.log(err);
                errors.register = "DB Error while writing profile";
                return res.redirect("/");
            });
    }
});

app.get("/petition", (req, res) => {
    let errorMsg = errors.signature;
    errors.signature = null;
    return res.render("form", {
        layout: "main",
        logged: req.session.userID, // I may not need this anymore
        activeUser,
        reg: true,
        signatureError: errorMsg,
    });
});

app.post("/petition", (req, res) => {
    if (req.body.sigDataURL == "") {
        errors.signature = "signature cannot be empty";
        return res.redirect("/petition");
    } else {
        db.addSignature(req.session.userID, req.body.sigDataURL)
            .then((result) => {
                if (result.rows[0].rowCount) {
                    activeUser.signature = req.body.sigDataURL;
                    return res.redirect("/thanks");
                } else {
                    errors.signature =
                        "Database error - please try again later";
                    return res.redirect("/petition");
                }
            })
            .catch((err) => {
                errors.signature = "Database error - please try again later";
                return res.redirect("/petition");
            });
    }
});

app.get("/thanks", (req, res) => {
    db.getCount()
        .then((result) => {
            let errorMsg = errors.edit;
            errors.edit = null;
            return res.render("thanks", {
                layout: "main",
                logged: req.session.userID,
                count: result.rows[0].count,
                activeUser,
                reg: true,
                sig: true,
                editError: errorMsg,
            });
        })
        .catch((err) => {
            console.log("error from DBcount", err);
        });
});

app.post("/thanks", (req, res) => {
    if (req.body.confirm) {
        console.log("confirm pressed");
        console.log("age=", req.body.new[2], activeUser.age);
        activeUser.age = req.body.new[2];
        activeUser.city = req.body.new[3];
        activeUser.url = req.body.new[4];
        if (req.body.new[0] != "") {
            activeUser.first = req.body.new[0];
        }
        if (req.body.new[1] != "") {
            activeUser.last = req.body.new[1];
        }
        if (req.body.new[5] != "") {
            activeUser.email = req.body.new[5];
        }

        if (activeUser.url != "" && !activeUser.url.startsWith("http")) {
            errors.edit = "Website must include 'http...'";
            console.log("error for Website-text");
            return res.redirect("/thanks");
        } else if (activeUser.age != "" && typeof activeUser.age != "number") {
            errors.edit = "Age must be empty or a number";
            console.log("error for Age-text");
            return res.redirect("/thanks");
        } else {
            // continue here...

            console.log("starting DB request.");
            db.changeUserData(activeUser, req.body.new[6], req.session.userID)
                .then((result) => {
                    console.log(result);
                    return res.redirect("/thanks");
                })
                .catch(() => {
                    errors.register = "Database Error - try again";
                    errors.login = "activeCred";
                    return res.redirect("/");
                });
        }
    } else if (req.body.deleteUser) {
        db.deleteUser(req.session.userID)
            .then(() => res.redirect("/new"))
            .catch((err) => {
                activeUser = {};
                req.session.userID = null;
                errors.register = "Database Error - try again";
                errors.login = "activeCred";
                return res.redirect("/");
            });
    } else if (req.body.sigDel) {
        activeUser.signature = null;
        db.deleteSignature(req.session.userID)
            .then(() => res.redirect("/petition"))
            .catch((err) => {
                req.session.userID = null;
                errors.register = "Database Error - try again";
                errors.login = "activeCred";
                return res.redirect("/");
            });
    } else {
        errors.register = "Database Error - try again";
        errors.login = "activeCred";
        return res.redirect("/");
    }
});

app.get("/participants", (req, res) => {
    db.getList()
        .then((result) => {
            return res.render("participants", {
                layout: "main",
                logged: req.session.userID,
                activeUser,
                reg: true,
                sig: true,
                count: result.rows.length,
                list: result.rows,
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/participants/:city", (req, res) => {
    const city = req.params.city;
    db.getList(city)
        .then((result) => {
            return res.render("participants", {
                layout: "main",
                logged: req.session.userID,
                activeUser,
                reg: true,
                sig: true,
                count: result.rows.length,
                list: result.rows,
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/participants", (req, res) => res.redirect(307, "/thanks"));
app.post("/participants/:city", (req, res) => res.redirect(307, "/thanks"));

app.listen(process.env.PORT || 8080, () =>
    console.log("Petition-Server is listening...")
);

/*
invalid csrf token when deleting the cookie at load page.

list of participants based on signatures - signatures are not obligatory and after login.
check of permissing is twofold - pw and signature...

cookie after successful login is the id

how does the user get to delete or view his account without signing?

*/
