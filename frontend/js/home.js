const TILEMAP_API = "http://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
const TILEMAP_API_ATTRIB = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

const MAP_CENTER = [49.2400, -123.0800];
const ALLOWED_BOUNDS = L.latLngBounds(L.latLng(49.4500, -123.5200),L.latLng(48.9500, -122.3600));

const INITIAL_ZOOM = 14;
const MIN_ZOOM = 11;
const MAX_ZOOM = 17;

let coord;


const ZOOM_THRESHOLD = 13;

let map = L.map('map', {
    center: MAP_CENTER,
    zoom: INITIAL_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    zoomControl: false
});

map.createPane('labels');
// map.getPane('labels').style.pointerEvents = 'none';

map.setMaxBounds(ALLOWED_BOUNDS);

L.tileLayer(TILEMAP_API, {
    attribution: TILEMAP_API_ATTRIB,
    bounds: ALLOWED_BOUNDS,
    errorTileUrl: './styles/errtile.png'
}).addTo(map);

// var circle = L.circle([49.2400, -123.0800], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 1000
// }).addTo(map);

const scrollbar = document.getElementById('radiusSelector');
const cssRadius = Math.floor(document.getElementById('mainCircle').offsetWidth/2);

function getCircleMeters(radiusPx) {
  const centerPt = map.getSize().divideBy(2);
  const edgePt = L.point(centerPt.x + radiusPx, centerPt.y);
  const centerLatLng = map.containerPointToLatLng(centerPt);
  const edgeLatLng = map.containerPointToLatLng(edgePt);
  return centerLatLng.distanceTo(edgeLatLng);
}

let meters = 800;

scrollbar.addEventListener('input', function() {
  map.setZoom(Number(scrollbar.value));
  // Compute after zoom finishes
  map.once('zoomend', function() {
    meters = getCircleMeters(cssRadius);
    document.getElementById('meterSelect').innerHTML = Math.floor(meters/100)*100;
  });
});


map.on('zoomend', function() {
    meters = getCircleMeters(cssRadius);
  document.getElementById('meterSelect').innerHTML = Math.floor(meters/100)*100;
  console.log("CSS circle radius in meters:", meters);
  scrollbar.value = map.getZoom();
});

let center = map.getCenter();

map.on('move', function() {
    center = map.getCenter();
    console.log(center);
});



let restaurants;
let fromRest;

document.getElementById('firstNext').addEventListener('click',()=> {
    document.getElementById('topbar').style.opacity = 0;
    document.getElementById('middlebar').style.opacity = 0;
    document.getElementById('bottombar').style.opacity = 0;
    document.getElementById('mainCircle').style.opacity = 0.1;

    document.getElementById('topmenu').style.top = 0;
    document.getElementById('bottommenu').style.bottom = 0;
    document.getElementById('map').style.pointerEvents = 'none';


    let data = {
        "lat": center.lat,
        "lng": center.lng,
        "range": meters
    };

    document.getElementById('potential').innerHTML = Math.round((0.0625 * meters) * 100) / 100;


    fetch("https://fall-hacks-2025-alpha.vercel.app/suggest-route", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(data)
    }).then(res => {
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json(); // parse response as JSON
})
.then(json => {
    console.log("Response JSON:", json);
    restaurants = json.restaurants


    restaurants.forEach(rest => {
        
        // parent div
        const div = document.createElement("div");
        div.className = "item";
        console.log(rest['distance_meters']);
        div.setAttribute("onclick", `chooseThisRes(this,null,${rest['distance_meters']})`);

        coord = rest['coord'];

        // title
        const pTitle = document.createElement("p");
        pTitle.className = "title";
        pTitle.textContent = rest['name'];

        // stats
        const pStats = document.createElement("p");
        pStats.className = "stats";
        pStats.innerHTML = `<span class="distance">${rest['distance_meters']}</span> m`;

        // put them together
        div.appendChild(pTitle);
        div.appendChild(pStats);

        document.getElementById('scroller').appendChild(div);

    });


})


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

let restcoord = "0,0";

function chooseThisRes(element, thiscoord, howfar) {
    element.classList.add('active');
    document.getElementById('startButton').classList.add('active');
    dest = coord.replace(" ","");
    fromRest = howfar;
}






document.getElementById('startButton').addEventListener('click',()=> {
    origin = center.lat+","+center.lng;
    window.location = 'elapse.html?origin='+origin+'&dest='+dest+'&distance='+fromRest;
})