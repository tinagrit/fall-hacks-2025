document.getElementById('firstNext').addEventListener('click',()=> {
    document.getElementById('topbar').style.opacity = 0;
    document.getElementById('middlebar').style.opacity = 0;
    document.getElementById('bottombar').style.opacity = 0;
    document.getElementById('mainCircle').style.opacity = 0.1;

    document.getElementById('topmenu').style.top = 0;
    document.getElementById('bottommenu').style.bottom = 0;
    document.getElementById('map').style.pointerEvents = 'none';
})

document.getElementById('listViewToggle').addEventListener('click',()=> {
    document.getElementById('lister').style.display = 'block';
})

document.getElementById('mapViewToggle').addEventListener('click',()=> {
    document.getElementById('lister').style.display = 'none';
})

document.getElementById('secondLeft').addEventListener('click',()=> {
    document.getElementById('topbar').style.opacity = 1;
    document.getElementById('middlebar').style.opacity = 1;
    document.getElementById('bottombar').style.opacity = 1;
    document.getElementById('mainCircle').style.opacity = 0.2;

    document.getElementById('lister').style.display = 'none';

    document.getElementById('topmenu').style.top = '-110px';
    document.getElementById('bottommenu').style.bottom = '-100px';
    document.getElementById('map').style.pointerEvents = 'unset';
})

function chooseThisRes(element, res) {
    element.classList.add('active');

    document.getElementById('startButton').classList.add('active');
}

document.getElementById('startButton').addEventListener('click',()=> {
    window.location = 'elapse.html';
})