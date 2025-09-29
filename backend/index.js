require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors({
  origin: "https://bigbackrun.tinagrit.com",
}));

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

    // Step 1: Find restaurants within the radius
    const placesResp = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${startLat},${startLng}`,
          radius: range,
          type: "restaurant",
          key: GOOGLE_API_KEY,
        },
      }
    );

    // Step 2: Keep only valid restaurants/cafes/food
    let onlyRestaurants = placesResp.data.results.filter(place => {
      const isRestaurant = place.types?.some(t =>
        ["restaurant", "cafe", "food"].includes(t)
      );
      return isRestaurant;
    });

    // Step 3: For each restaurant, get walking distance
    const withDistance = [];
    for (const r of onlyRestaurants) {
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

      let distancevalue;
      if (directionsResp.data.status !== "OK" || !directionsResp.data.routes?.length) {
        distancevalue = range;
      } else {
        let route = directionsResp.data.routes[0];
        if (!route) continue;

        let leg = route.legs[0];
        distancevalue = leg.distance.value;
      }
  
      withDistance.push({
        name: r.name,
        distance_meters: distancevalue,
        coord: `${r.geometry.location.lat}, ${r.geometry.location.lng}`
      });
    }

    // Step 4: Sort so closest-to-range come first (prefer edge of circle)
    withDistance.sort((a, b) => {
      const da = Math.abs(a.distance_meters - range);
      const db = Math.abs(b.distance_meters - range);
      return da - db;
    });

    // Step 5: Pick top 8
    const finalList = withDistance.slice(0, 8);

    lastRestaurants = onlyRestaurants; // store full objects for /select-restaurant
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
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
module.exports = app;
module.exports.handler = serverless(app);