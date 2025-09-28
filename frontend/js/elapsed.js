let startTime = 0;
let elapsedTime = 0;
let timerInterval;

let distance = 0;

const display = document.getElementById('elapsed');

function timeToString(time) {
    const diffInHrs = time / 3600000;
    const mins = Math.floor(diffInHrs * 60);
    const secs = Math.floor((diffInHrs * 3600) % 60);
    const ms = Math.floor((time % 1000));

    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');
    const formattedMs = ms.toString().padStart(3, '0');

    return `${formattedMins}:${formattedSecs}.${formattedMs}`;
}

function start() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        display.textContent = timeToString(elapsedTime);
    }, 10);
}

function stop() {
    clearInterval(timerInterval);
}

document.getElementById('countdown').innerHTML = '3';
setTimeout(()=> {
    document.getElementById('countdown').innerHTML = '2';
    setTimeout(()=> {
        document.getElementById('countdown').innerHTML = '1';
        setTimeout(()=> {
            document.getElementById('countdown').style.display = 'none';
            document.querySelector('.countdownContainer').style.display = 'none';
            start();
        },1000)
    },1000)
},1000)


const paramsString = window.location.search;
const searchParams = new URLSearchParams(paramsString);

let origin;
let dest;

if (searchParams.get("origin")) {
    origin = searchParams.get("origin")
}

if (searchParams.get("dest")) {
    dest = searchParams.get("dest")
}

document.querySelector('iframe').src = "https://www.google.com/maps/embed/v1/directions?key={API Key}&origin="+origin+"&destination="+dest+"&avoid=tolls|highways&mode=walking"

document.getElementById('distance').innerHTML = Number(searchParams.get('distance'));
distance =  Number(searchParams.get('distance'));

document.getElementById('calories').innerHTML = Math.round(0.0625 * Number(searchParams.get('distance')) * 100) / 100;

document.getElementById('finishButton').addEventListener('click',()=>{
    window.location = 'success.html?time='+elapsedTime+'&distance='+distance;
})

document.getElementById('cancelButton').addEventListener('click',()=>{
    window.location = 'index.html';
})

