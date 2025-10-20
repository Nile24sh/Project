const Listing = require("../models/listing.js");
const streamifier = require("streamifier");
const cloudinary = require("../cloudConfig");
const fetch = require("node-fetch"); // ensure installed with: npm install node-fetch

// Cloudinary upload helper
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "wanderlust-listings" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// ✅ Safe geocoding helper with fallback
async function getCoordinates(location) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      location
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "wanderlust-app (anoj@example.com)", // replace with your email
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      console.warn(`🌐 Nominatim error: ${response.status} ${response.statusText}`);
      return [72.8777, 19.0760]; // Mumbai default
    }

    let data = [];
    try {
      data = await response.json();
    } catch (err) {
      console.warn("⚠️ Invalid JSON from Nominatim:", err.message);
      return [72.8777, 19.0760];
    }

    if (Array.isArray(data) && data.length > 0) {
      const { lon, lat } = data[0];
      return [parseFloat(lon), parseFloat(lat)];
    } else {
      console.warn("📍 No location data found, using fallback");
      return [72.8777, 19.0760];
    }
  } catch (err) {
    console.error("❌ Geocoding failed:", err.message);
    return [72.8777, 19.0760];
  }
}

// ---------------------- CONTROLLERS ----------------------

// Show all listings
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// Render new listing form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// Show a specific listing
module.exports.showListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  } catch (err) {
    next(err);
  }
};

// Create new listing
module.exports.createListing = async (req, res, next) => {
  try {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // 🌍 Geocode safely
    const coords = await getCoordinates(req.body.listing.location);
    newListing.geometry = { type: "Point", coordinates: coords };

    // ☁️ Upload image if provided
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      newListing.image = { url: result.secure_url, filename: result.public_id };
    }

    await newListing.save();
    req.flash("success", "New listing created!");
    res.redirect("/listings");
  } catch (err) {
    console.error("❌ Create listing error:", err.message);
    next(err);
  }
};

// Render edit listing form
module.exports.renderEditListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    let originalImageUrl = listing.image?.url || "";
    if (originalImageUrl)
      originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
  } catch (err) {
    next(err);
  }
};

// Update listing
module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    Object.assign(listing, req.body.listing);

    // 🌍 Update coordinates
    const coords = await getCoordinates(req.body.listing.location);
    listing.geometry = { type: "Point", coordinates: coords };

    // ☁️ Upload new image if provided
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      listing.image = { url: result.secure_url, filename: result.public_id };
    }

    await listing.save();
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error("❌ Update listing error:", err.message);
    next(err);
  }
};

// Delete listing
module.exports.destroyListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

// Search listings by country
module.exports.searchListing = async (req, res, next) => {
  try {
    const { country } = req.query;
    const allListings = await Listing.find({
      country: { $regex: new RegExp(country, "i") },
    });
    res.render("listings/index.ejs", { allListings });
  } catch (err) {
    req.flash("error", "Search failed!");
    res.redirect("/listings");
  }
};
