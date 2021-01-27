const supertest = require("supertest");
const { app, activeUser } = require("./server.js");
const cookieSession = require("cookie-session");

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

// test("Logged In Users with Signature are redirected to /thanks when attempting /petition", () => {
//     cookieSession.mockSessionOnce({
//         userID: true,
//     });
//     let results = [1, 2, { rowCount: true }];
//     return supertest(app)
//         .get("/petition")
//         .then((res) => {
//             if (results[2].rowCount) {
//                 console.log("Variable found");
//             }
//             expect(res.statusCode).toBe(302);
//             expect(res.headers.location).toBe("/thanks");
//         });
// });

test("Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to the signers page", () => {
    cookieSession.mockSessionOnce({
        userID: true,
    });
    return supertest(app)
        .get("/participants")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

test("Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to the thank you page", () => {
    cookieSession.mockSessionOnce({
        userID: true,
    });
    return supertest(app)
        .get("/thanks")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

/*


Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to either the thank you page or the signers page

*/
