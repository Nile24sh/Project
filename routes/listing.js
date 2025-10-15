const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const Listing=require("../models/listing.js")
const {isLoggedIn,isOwner,validateListing}=require("../middleware.js")
const listingController=require("../controllers/listing.js")
const multer=require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../cloudConfig");

// store uploaded file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // only accept images and PDFs
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, JPEG, PDF files are allowed"));
    }
  },
});


// Search listings by country
router.get("/search",wrapAsync(listingController.searchListing));

//INDEX ROUTE
router.get("/",wrapAsync(listingController.index));

//NEW ROUTE
router.get("/",isLoggedIn,(listingController.renderNewForm))



//CREATE POST
router.post("/new",isLoggedIn,upload.single("listing[image][url]"),validateListing,wrapAsync(listingController.createListing))


router.route("/:id")
.get(
    
    wrapAsync(listingController.showListing)
)
.put(
    isLoggedIn,isOwner,upload.single("listing[image][url]"),validateListing,
    wrapAsync(listingController.updateListing))
.delete(
    
    isLoggedIn,isOwner,
    wrapAsync(listingController.destroyListing));

//EDIT ROUTE
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditListing));



module.exports=router;