const Listing = require("../models/listing.js");
const streamifier = require("streamifier");
const cloudinary = require("../cloudConfig");

// Helper function for Cloudinary upload
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

// ✅ Show all listings
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// ✅ Render new form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ✅ Show listing by ID
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// ✅ Create new listing
module.exports.createListing = async (req, res, next) => {
  try {
    module.exports.createListing = async (req, res, next) => {
  console.log("🟢 Create route hit!");
  console.log("Body:", req.body);
  console.log("File:", req.file);
};

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // 🌍 Geocode location
    const location = req.body.listing.location;
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    );
    const geoData = await geoResponse.json();

    if (geoData.length > 0) {
      const longitude = parseFloat(geoData[0].lon);
      const latitude = parseFloat(geoData[0].lat);
      newListing.geometry = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    } else {
      newListing.geometry = {
        type: "Point",
        coordinates: [72.8777, 19.0760], // default Mumbai
      };
    }

    // ☁️ Image upload
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      newListing.image = {
        url: result.secure_url,
        filename: result.public_id,
      };
    }

    await newListing.save();
    req.flash("success", "New listing created!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

// ✅ Render edit form
module.exports.renderEditListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// ✅ Update listing
module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // Update fields
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = req.body.listing.location;
    listing.country = req.body.listing.country;

    // 🌍 Update geolocation if location changes
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(req.body.listing.location)}&format=json&limit=1`
    );
    const geoData = await geoResponse.json();
    if (geoData.length > 0) {
      listing.geometry = {
        type: "Point",
        coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)],
      };
    }

    // ☁️ New image if uploaded
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      listing.image = {
        url: result.secure_url,
        filename: result.public_id,
      };
    }

    await listing.save();
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};

// ✅ Delete listing
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};

// ✅ Search by country
module.exports.searchListing = async (req, res) => {
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
