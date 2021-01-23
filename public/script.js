var support = document.querySelector(".navRegister");
var summary = document.querySelector(".navView");
var participants = document.querySelector(".navList");

support.addEventListener("click", (e) => {
    alert("Hello");
});
summary.addEventListener("click", (e) => {
    alert("Hello");
});
participants.addEventListener("click", (e) => {
    alert("Hello");
});

var register = document.querySelector(".register");
var registerHeader = document.querySelector(".registerHeader");
var login = document.querySelector(".login");
var loginHeader = document.querySelector(".loginHeader");

if (!login.classList.contains("activeCred")) {
    login.style.display = "none";
}
if (!register.classList.contains("activeCred")) {
    register.style.display = "none";
}

loginHeader.addEventListener("click", (e) => {
    register.style.display = "none";
    login.style.display = "flex";
    loginHeader.classList.add("activeCred");
    login.classList.add("activeCred");
    register.classList.remove("activeCred");
    registerHeader.classList.remove("activeCred");
});

registerHeader.addEventListener("click", (e) => {
    register.style.display = "flex";
    login.style.display = "none";
    loginHeader.classList.remove("activeCred");
    login.classList.remove("activeCred");
    register.classList.add("activeCred");
    registerHeader.classList.add("activeCred");
});

// var canvas = document.getElementById("signature");
// var ctx = canvas.getContext("2d");
// var clear = document.querySelector(".sigClear");

// clear.addEventListener("click", () => {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// });

// canvas.addEventListener("mousedown", (e) => {
//     e.preventDefault();
//     ctx.strokeStyle = document.querySelector(".sigColor").value;
//     ctx.beginPath();
//     ctx.moveTo(e.offsetX, e.offsetY);
//     canvas.addEventListener("mouseup", (e) => {
//         e.preventDefault();
//         canvas.removeEventListener("mousemove", draw);
//         ctx.closePath();
//         document.getElementById("sigDataURL").value = canvas.toDataURL();
//     });
//     canvas.addEventListener("mousemove", draw);
// });

// function draw(e) {
//     ctx.lineTo(e.offsetX, e.offsetY);
//     ctx.stroke();
//     ctx.moveTo(e.offsetX, e.offsetY);
// }
