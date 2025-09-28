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

// --- Suggest Route Endpoint ---
app.post("/suggest-route", async (req, res) => {
  try {
    let { lat, lng, range } = req.body;
    if (!range) range = 2000; // default 2km

    const startLat = lat || DEFAULT_START.lat;
    const startLng = lng || DEFAULT_START.lng;

    lastStart = { lat: startLat, lng: startLng }; // save start location

    // Step 1: Find restaurants nearby
    const placesResp = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${startLat},${startLng}`,
          radius: range,
          type: "restaurant",
          keyword: "restaurant",
          key: GOOGLE_API_KEY,
        },
      }
    );

    // Step 2: Filter to only actual restaurants
    const onlyRestaurants = placesResp.data.results.filter(place =>
      place.types?.includes("restaurant")
    );

    const selectedRestaurants = onlyRestaurants.slice(0, 8);

    // Step 3: For each restaurant, get walking distance
    const finalList = [];
    for (const r of selectedRestaurants) {
      const directionsResp = await axios.get(
        "https://maps.googleapis.com/maps/api/directions/json",
        {
          params: {
            origin: `${startLat},${startLng}`,
            destination: `${r.geometry.location.lat},${r.geometry.location.lng}`,
            mode: "walking",
            key: GOOGLE_API_KEY,
          },
        }
      );

      const route = directionsResp.data.routes[0];
      if (!route) continue;

      const leg = route.legs[0];
      finalList.push({
        name: r.name,
        distance_meters: leg.distance.value,
        coord: `${r.geometry.location.lat}, ${r.geometry.location.lng}`
      });
    }

    lastRestaurants = selectedRestaurants; // save full objects for /select-restaurant
    res.json({ restaurants: finalList });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "something went wrong" });
  }
});

// // --- Select Restaurant Endpoint ---
// app.post("/select-restaurant", async (req, res) => {
//   try {
//     // Safety check for empty body
//     if (!req.body || typeof req.body !== "object") {
//       return res.status(400).json({ error: "Request body must be JSON with an 'index' field" });
//     }

//     const { index } = req.body;

//     if (index === undefined || index < 0 || index >= lastRestaurants.length) {
//       return res.status(400).json({ error: "Invalid index" });
//     }

//     const chosen = lastRestaurants[index];

//     // Fetch directions to selected restaurant
//     const directionsResp = await axios.get(
//       "https://maps.googleapis.com/maps/api/directions/json",
//       {
//         params: {
//           origin: `${lastStart.lat},${lastStart.lng}`,
//           destination: `${chosen.geometry.location.lat},${chosen.geometry.location.lng}`,
//           mode: "walking",
//           key: GOOGLE_API_KEY,
//         },
//       }
//     );

//     const route = directionsResp.data.routes[0];
//     if (!route) return res.status(500).json({ error: "No route found" });

//     const leg = route.legs[0];
//     const distanceMeters = leg.distance.value;
//     const durationMin = Math.round(leg.duration.value / 60);
//     const calories = Math.round(distanceMeters / 1609.34 * 100); // ~100 kcal per mile

//     res.json({
//       restaurant: {
//         name: chosen.name,
//         foodtype: chosen.types || [],
//         coordinates: chosen.geometry.location,
//       },
//       route: {
//         distance_meters: distanceMeters,
//         estimated_time_min: durationMin,
//         estimated_calories: calories,
//         maps_url: `https://www.google.com/maps/dir/?api=1&origin=${lastStart.lat},${lastStart.lng}&destination=${chosen.geometry.location.lat},${chosen.geometry.location.lng}&travelmode=walking`
//       }
//     });

//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ error: "something went wrong" });
//   }
// });

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
