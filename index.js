const hb = require("express-handlebars");
const express = require("express");
const app = express();
const { addSignatory, getList, getCount } = require("./db");
const cookieParser = require("cookie-parser");

app.engine("handlebars", hb());
app.set("view engine", "handlebars"); // ???

app.use(cookieParser());
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    if (req.cookies.signed) {
        res.redirect("/thanks");
    } else {
        res.render("form", {
            layout: "main",
        });
    }
});

app.post("/", (req, res) => {
    const { firstName, lastName, sigDataURL } = req.body;
    // write DB with new signatory and handle the case of an error with a message to the screen
    addSignatory(firstName, lastName, sigDataURL)
        .then(() => {
            res.cookie("signed", `${firstName} ${lastName}`);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("there was an Error:", err);
            res.send("There was an Error while writing to the table!!!");
        });
});

app.get("/thanks", (req, res) => {
    if (req.cookies.signed) {
        res.render("thanks", {
            layout: "main",
            name: req.cookies.signed,
        });
    } else {
        console.log("no cookie while accessing /thanks");
        res.redirect("/");
    }
});

app.get("/participants", (req, res) => {
    let part, count;
    if (req.cookies.signed) {
        getList()
            .then((result) => {
                part = result.rows;
                return;
            })
            .then(() => {
                getCount().then((result) => {
                    count = result.rows[0].count;
                    res.render("participants", {
                        layout: "main",
                        part,
                        count,
                    });
                });
            })
            .catch((err) => {});
    } else {
        console.log("no cookie while accessing /participants");
        res.redirect("/");
    }
});

app.get("/new", (req, res) => {
    res.clearCookie("signed");
    res.redirect("/");
});

app.listen(8080, () => console.log("Petition-Server is listening..."));
