const Listing = require("../models/listing.js");
const streamifier = require("streamifier");
const cloudinary = require("../cloudConfig");
const fetch = require("node-fetch"); // Make sure installed

// Helper function to upload to Cloudinary
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

// Create a new listing
module.exports.createListing = async (req, res, next) => {
  try {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // Geocode location
    const location = req.body.listing.location;
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    );
    const geoData = await geoResponse.json();

    if (geoData.length > 0) {
      const longitude = parseFloat(geoData[0].lon);
      const latitude = parseFloat(geoData[0].lat);
      newListing.geometry = { type: "Point", coordinates: [longitude, latitude] };
    } else {
      newListing.geometry = { type: "Point", coordinates: [72.8777, 19.0760] }; // default Mumbai
    }

    // Upload image if provided
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      newListing.image = { url: result.secure_url, filename: result.public_id };
    }

    await newListing.save();
    req.flash("success", "New listing created!");
    res.redirect("/listings");
  } catch (err) {
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
    if (originalImageUrl) originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
  } catch (err) {
    next(err);
  }
};

// Update a listing
module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // Update fields
    const { title, description, price, location, country } = req.body.listing;
    listing.title = title;
    listing.description = description;
    listing.price = price;
    listing.location = location;
    listing.country = country;

    // Update geolocation
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    );
    const geoData = await geoResponse.json();
    if (geoData.length > 0) {
      listing.geometry = { type: "Point", coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)] };
    }

    // Upload new image if provided
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      listing.image = { url: result.secure_url, filename: result.public_id };
    }

    await listing.save();
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};

// Delete a listing
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
    const allListings = await Listing.find({ country: { $regex: new RegExp(country, "i") } });
    res.render("listings/index.ejs", { allListings });
  } catch (err) {
    req.flash("error", "Search failed!");
    res.redirect("/listings");
  }
};
