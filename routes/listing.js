const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// ---------------- ROUTES -------------------

// Search listings by country (specific route first)
router.get("/search", wrapAsync(listingController.searchListing));

// Render new listing form (specific route before :id)
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Create a new listing
router.post(
  "/new",
  isLoggedIn,
  upload.single("listing[image][url]"),
  validateListing,
  wrapAsync(listingController.createListing)
);

// Index - show all listings
router.get("/", wrapAsync(listingController.index));

// Edit listing form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditListing));

// Show, update, delete listing by ID
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image][url]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

module.exports = router;
