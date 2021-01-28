var current = 0;
var comm;
var xhr = new XMLHttpRequest();
xhr.open("GET", "/comments.json");
xhr.send();
xhr.addEventListener("readystatechange", function () {
    if (xhr.readyState != XMLHttpRequest.DONE) {
        return;
    }
    var status;
    try {
        status = xhr.status;
    } catch (err) {
        console.log("couldn't read XML-Response");
        return;
    }
    if (status != 200) {
        console.log("XML was rejected with code", status);
        return;
    }
    var data = xhr.responseText;
    try {
        data = JSON.parse(data);
    } catch (err) {
        console.log("JSON could not be converted");
        return;
    }
    fillAndRunCarousel(data);
});

function fillAndRunCarousel(comments) {
    var carousel = document.querySelector(".carousel");
    comments.forEach((element) => {
        carousel.insertAdjacentHTML(
            "beforeend",
            `<div><p>${element}</p></div>`
        );
    });
    comm = document.querySelectorAll(".carousel div");
    setTimeout(moveComms, 5000);
}

document.addEventListener("transitionend", function (evt) {
    if (evt.target.className === "exit") {
        evt.target.classList.remove("exit");
    }
});

function moveComms() {
    comm[current].classList.remove("onscreen");
    comm[current].classList.add("exit");
    current++;
    if (current >= comm.length) {
        current = 0;
    }
    comm[current].classList.add("onscreen");
    setTimeout(moveComms, 5000);
}
