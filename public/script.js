var comments = $(".comments");
var scrollSpeed = 1;
var allComms;
var lengthOfNext;
var left = $(".ticker").outerWidth();

$.ajax({
    url: "/comments.json",
    method: "GET",
    success: function (data) {
        for (var i = 0; i < data.length; i++) {
            comments.append("<span>" + data[i].comment + "</span>");
        }
        allComms = $(".comments > ");
        lengthOfNext = allComms.outerWidth();
        move();
    },
    error: function () {
        console.log("JAAAASON!!!! 😠");
    },
});

function move() {
    left -= scrollSpeed;
    if (left < lengthOfNext * -1) {
        comments.append(allComms.eq(0).remove());
        allComms = $(".comments > span");

        left += lengthOfNext;
        lengthOfNext = allComms.outerWidth();
    }
    comments.css({
        left: left + "px",
    });
    requestAnimationFrame(move);
}
