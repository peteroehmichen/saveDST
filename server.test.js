const supertest = require("supertest");
const { app, activeUser } = require("./server.js");
const cookieSession = require("cookie-session");
const db = require("./db");
const { setCurrentUserObj } = require("./auth");

jest.mock("./db");

test("Logged out User are redicrected to / on loading /petition", () => {
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/new");
        });
});

test("logged in User are redicrected to /petition on loading /", () => {
    cookieSession.mockSessionOnce({
        userID: true,
    });
    return supertest(app)
        .get("/")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

test("Logged In Users with Signature are redirected to /thanks when attempting /petition", () => {
    cookieSession.mockSessionOnce({
        userID: true,
    });

    db.getSignatureByID.mockResolvedValue({
        rowCount: 1,
    });
    db.getUserProfileByID.mockResolvedValue({
        rowCount: 1,
    });
    db.getUserByID.mockResolvedValue({
        rowCount: 1,
    });

    // setCurrentUserObj.mockResolvedValue({
    //     first: "",
    //     last: "",
    //     email: "",
    //     signature: " ",
    // });

    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});
