let startTime = 0;
let elapsedTime = 0;
let timerInterval;

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

