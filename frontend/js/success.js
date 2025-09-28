document.getElementById('newJourneyButton').addEventListener('click',()=>{
    window.location = 'index.html'
})

const paramsString = window.location.search;
const searchParams = new URLSearchParams(paramsString);

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

document.getElementById('elapsed').innerHTML = timeToString(Number(searchParams.get('time')));

distance = Number(searchParams.get('distance'));
if (distance == 0) distance = 1000;
document.getElementById('pace').innerHTML = timeToString(Number(searchParams.get('time')) / (distance / 1000));

document.getElementById('calories').innerHTML = Math.round((0.0625 * searchParams.get('distance')) * 100) / 100;