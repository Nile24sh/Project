require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require('node-fetch'); // npm i node-fetch@2
const Listing = require('./models/listing');

const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wanderlust';

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

async function updateLocations() {
  const listings = await Listing.find({});

  for (let listing of listings) {
    console.log(`Processing: ${listing.title} -> ${listing.location}`);

    // Skip if location is missing
    if (!listing.location) continue;

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(listing.location)}&format=json&limit=1`);
      const geoData = await geoRes.json();

      if (geoData.length > 0) {
        const longitude = parseFloat(geoData[0].lon);
        const latitude = parseFloat(geoData[0].lat);

        // Update geometry
        listing.geometry = {
          type: "Point",
          coordinates: [longitude, latitude] // [lng, lat]
        };

        await listing.save();
        console.log(`Updated: ${listing.title} -> [${longitude}, ${latitude}]`);
      } else {
        console.log(`No coordinates found for: ${listing.title}`);
      }
    } catch (err) {
      console.log(`Error updating ${listing.title}:`, err);
    }
  }

  console.log("All listings updated.");
  mongoose.connection.close();
}

updateLocations();
