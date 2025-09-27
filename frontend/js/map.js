const TILEMAP_API = "http://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
const TILEMAP_API_ATTRIB = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

const MAP_CENTER = [49.2400, -123.0800];
const ALLOWED_BOUNDS = L.latLngBounds(L.latLng(49.4500, -123.5200),L.latLng(48.9500, -122.3600));

const INITIAL_ZOOM = 14;
const MIN_ZOOM = 11;
const MAX_ZOOM = 17;


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

// Scrollbar adjusts map zoom and logs radius
scrollbar.addEventListener('input', function() {
  map.setZoom(Number(scrollbar.value));
  // Compute after zoom finishes
  map.once('zoomend', function() {
    const meters = getCircleMeters(cssRadius);
    document.getElementById('meterSelect').innerHTML = Math.floor(meters/100)*100;
  });
});

// Optionally: log on any zoom event too
map.on('zoomend', function() {
  const meters = getCircleMeters(cssRadius);
  document.getElementById('meterSelect').innerHTML = Math.floor(meters/100)*100;
  console.log("CSS circle radius in meters:", meters);
  scrollbar.value = map.getZoom();
});