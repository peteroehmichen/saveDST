const hb = require("express-handlebars");
const express = require("express");
const app = express();
const { addSignatory, getList, getCount, getParticipant } = require("./db");
const cookieSession = require("cookie-session");
const { secretOfSession } = require("./secrets.json");
const csurf = require("csurf");

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
    if (req.session.participantId) {
        res.redirect("/thanks");
    } else {
        res.render("form", {
            layout: "main",
        });
    }
});

app.post("/", (req, res) => {
    const { firstName, lastName, sigDataURL } = req.body;
    if (firstName == "" || lastName == "" || sigDataURL == "") {
        res.render("form", {
            layout: "main",
            dataError: true,
        });
    } else {
        addSignatory(firstName, lastName, sigDataURL)
            .then((result) => {
                req.session.participantId = result.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("DB-Error while adding new participants:", err);
                res.render("form", {
                    layout: "main",
                    dbError: true,
                });
            });
    }
});

app.get("/thanks", (req, res) => {
    if (req.session.participantId) {
        Promise.all([getParticipant(req.session.participantId), getCount()])
            .then((results) => {
                res.render("thanks", {
                    layout: "main",
                    participant: results[0].rows[0],
                    count: results[1].rows[0].count,
                });
            })
            .catch((err) => {
                console.log("Error during db-request for /thanks:", err);
            });
    } else {
        console.log("no cookie while accessing /thanks");
        res.render("form", {
            layout: "main",
            cookieError: true,
        });
    }
});

app.get("/participants", (req, res) => {
    if (req.session.participantId) {
        getList()
            .then((result) => {
                res.render("participants", {
                    layout: "main",
                    part: result.rows,
                    count: result.rowCount,
                });
            })
            .catch((err) => {
                console.log("Error while getting Participants-List", err);
            });
    } else {
        console.log("no cookie while accessing /participants");
        res.render("form", {
            layout: "main",
            cookieError: true,
        });
    }
});

app.get("/new", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.listen(8080, () => console.log("Petition-Server is listening..."));

/*
prevent double signing...
invalid csrf token when deleting the cookie at load page.
*/
