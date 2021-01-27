var current = 0;
var comm;

$.ajax({
    url: "/comments.json",
    method: "GET",
    success: fillAndRunCarousel,
    error: function () {
        console.log("JAAAASON!!!! 😠");
    },
});

function fillAndRunCarousel(comments) {
    var carousel = $(".carousel");
    comments.forEach((element) => {
        element = element.replaceAll("<", "");
        element = element.replaceAll(">", "");
        element = element.replaceAll("$", "");
        element = element.replaceAll("'", "");
        element = element.replaceAll('"', "");
        carousel.append(`<div><p>${element}</p></div>`);
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
    if (arguments[0] || arguments[0] === 0) {
        current = arguments[0];
    } else {
        current++;
        if (current >= comm.length) {
            current = 0;
        }
    }
    comm[current].classList.add("onscreen");
    setTimeout(moveComms, 5000);
}
