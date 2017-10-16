var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var submit = document.getElementById("submit");
var drawed = false;

canvas.addEventListener("mousedown", pointerDown, false);
canvas.addEventListener("mouseup", pointerUp, false);


function pointerDown(evt) {
    ctx.beginPath();
    ctx.moveTo(evt.layerX, evt.layerY);
    canvas.addEventListener("mousemove", paint, false);
    drawed = true;
    showSubmit();
}


function pointerUp(evt) {
    canvas.removeEventListener("mousemove", paint);
    paint(evt);
}

function paint(evt) {
    ctx.lineTo(evt.layerX, evt.layerY);
    ctx.stroke();
}

submit.addEventListener('click', function(){
    document.getElementById('hidden-input').value = canvas.toDataURL();
    console.log(canvas.toDataURL());
});

document.getElementById('clear').addEventListener('click', function(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function showSubmit(){
    if (drawed == true){
        submit.style.display = 'block';
    }
}
