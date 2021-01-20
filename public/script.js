var canvas = document.getElementById("signature");
var ctx = canvas.getContext("2d");

canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    canvas.addEventListener("mouseup", (e) => {
        e.preventDefault();
        canvas.removeEventListener("mousemove", draw);
        ctx.closePath();
        document.getElementById("sigDataURL").value = canvas.toDataURL();
    });
    canvas.addEventListener("mousemove", draw);
});

function draw(e) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.moveTo(e.offsetX, e.offsetY);
}
