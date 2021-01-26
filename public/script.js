(function () {
    // initialization of variables in uppermost scope
    var headlines = $(".headlines");
    var scrollSpeed = 2;
    var allNews;
    var lengthOfNext;
    var animation;
    var left = $(".ticker").outerWidth();

    // getting the news via JSON and feeding them to the headlines-DIV
    $(".feedSelect > img").on("click", () => {
        console.log("clicked: ", $("select").val());
        reloadFeed($("select").val());
    });
    $("select").on("keydown", (e) => {
        if (e.keyCode === 13 && $("select").val().length > 0) {
            reloadFeed($("input").val());
        } else if (e.keyCode === 27) {
            $("input").empty();
        }
    });

    // $("input").val("Der_Postillon");
    reloadFeed();
    function reloadFeed(feed = "Der_Postillon") {
        allNews = undefined;
        headlines.empty();
        scrollSpeed = 2;
        cancelAnimationFrame(animation);
        left = $(".ticker").outerWidth();
        $.ajax({
            url: `/${feed}/news.json`,
            method: "GET",
            success: function (data) {
                for (var i = 0; i < data.length; i++) {
                    headlines.append(
                        `<a href="${data[i].link}" target="_blank">${
                            data[i].text
                        } <span> ${
                            data[i].source ? data[i].source : ""
                        }</span></a>`
                    );
                }
                setUp();
                move();
            },
            error: function () {
                console.log("JAAAASON!!!! 😠");
            },
        });
    }

    // setting all other variables and events
    function setUp() {
        allNews = $(".headlines > a");
        lengthOfNext = allNews.outerWidth();
        for (var i = 0; i < allNews.length; i++) {
            allNews.eq(i).on("mouseenter", function (event) {
                event.target.style.color = "red";
                cancelAnimationFrame(animation);
            });
            allNews.eq(i).on("mouseleave", function (event) {
                event.target.style.color = "black";
                move();
            });
        }
    }

    // movement of the ticker
    function move() {
        left -= scrollSpeed;
        if (left < lengthOfNext * -1) {
            headlines.append(allNews.eq(0).remove());
            allNews = $(".headlines > a");

            left += lengthOfNext;
            lengthOfNext = allNews.outerWidth();
        }
        headlines.css({
            left: left + "px",
        });
        animation = requestAnimationFrame(move);
    }
})();





// var support = document.querySelector(".navRegister");
// var summary = document.querySelector(".navView");
// var participants = document.querySelector(".navList");

// support.addEventListener("click", (e) => {
//     alert("Hello");
// });
// summary.addEventListener("click", (e) => {
//     alert("Hello");
// });
// participants.addEventListener("click", (e) => {
//     alert("Hello");
// });



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
