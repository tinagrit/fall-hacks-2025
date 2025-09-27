require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Default location (for demo fallback)
const DEFAULT_START = { lat: 49.2827, lng: -123.1207 }; // Vancouver

// Store last search results
let lastRestaurants = [];
let lastStart = { ...DEFAULT_START };

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

    const startLat = lat || DEFAULT_START.lat;
    const startLng = lng || DEFAULT_START.lng;

    lastStart = { lat: startLat, lng: startLng }; // save start location

    // Step 1: Find restaurants nearby
    const placesResp = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", {
      params: {
        location: `${startLat},${startLng}`,
        radius: range,
        type: "restaurant",
        key: GOOGLE_API_KEY,
      },
    });

    const restaurants = placesResp.data.results.slice(0, 8);

    lastRestaurants = restaurants; // save the list

    res.json({ restaurants });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "something went wrong" });
  }
});

// --- Select Restaurant Endpoint ---
app.post("/select-restaurant", async (req, res) => {
  try {
    const { index } = req.body;

    if (index === undefined || index < 0 || index >= lastRestaurants.length) {
      return res.status(400).json({ error: "Invalid index" });
    }

    const chosen = lastRestaurants[index];

    // Fetch directions to selected restaurant
    const directionsResp = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
      params: {
        origin: `${lastStart.lat},${lastStart.lng}`,
        destination: `${chosen.geometry.location.lat},${chosen.geometry.location.lng}`,
        mode: "walking",
        key: GOOGLE_API_KEY,
      },
    });

    const route = directionsResp.data.routes[0];
    if (!route) return res.status(500).json({ error: "No route found" });

    const leg = route.legs[0];
    const distanceMeters = leg.distance.value;
    const durationMin = Math.round(leg.duration.value / 60);
    const calories = Math.round(distanceMeters / 1609.34 * 100); // ~100 kcal per mile

    res.json({
      restaurant: {
        name: chosen.name,
        foodtype: chosen.types || [],
        coordinates: chosen.geometry.location,
      },
      route: {
        distance_meters: distanceMeters,
        estimated_time_min: durationMin,
        estimated_calories: calories,
        maps_url: `https://www.google.com/maps/dir/?api=1&origin=${lastStart.lat},${lastStart.lng}&destination=${chosen.geometry.location.lat},${chosen.geometry.location.lng}&travelmode=walking`
      }
    });

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
