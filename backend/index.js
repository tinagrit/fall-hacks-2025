require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Default location (for demo fallback)
const DEFAULT_START = { lat: 49.2827, lng: -123.1207 }; // Vancouver

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.send(`
    <h1>Welcome to the Route Suggestion API!</h1>
    <p>Default starting location:</p>
    <ul>
      <li>Latitude: ${DEFAULT_START.lat}</li>
      <li>Longitude: ${DEFAULT_START.lng}</li>
    </ul>
    <p>Use <code>POST /suggest-route</code> with JSON {lat, lng, range} to try it out.</p>
  `);
});


// --- Suggest Route Endpoint ---
app.post("/suggest-route", async (req, res) => {
  try {
    let { lat, lng, range } = req.body;
    if (!range) range = 2000; // default 2km

    // Fallback if no coords sent
    const startLat = lat || DEFAULT_START.lat;
    const startLng = lng || DEFAULT_START.lng;

    // Step 1: Find restaurants nearby
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const placesResp = await axios.get(placesUrl, {
      params: {
        location: `${startLat},${startLng}`,
        radius: range,
        type: "restaurant",
        key: GOOGLE_API_KEY,
      },
    });

    const restaurants = placesResp.data.results.slice(0, 5); // limit to 5

    // Step 2: For each restaurant, get route
    const results = [];
    for (const r of restaurants) {
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json`;
      const directionsResp = await axios.get(directionsUrl, {
        params: {
          origin: `${startLat},${startLng}`,
          destination: `${r.geometry.location.lat},${r.geometry.location.lng}`,
          mode: "walking",
          key: GOOGLE_API_KEY,
        },
      });

      const route = directionsResp.data.routes[0];
      if (!route) continue;

      const leg = route.legs[0];
      const distanceMeters = leg.distance.value;

      results.push({
        name: r.name,
        foodtype: r.types || [],
        coordinates: {
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        },
        distance_meters: distanceMeters,
      });
    }

    res.json({ restaurants: results });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "something went wrong" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});