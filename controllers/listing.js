const Listing=require("../models/listing.js")
const streamifier = require("streamifier");
const cloudinary = require("../cloudConfig");
//const { streamUpload } = require("../routes/listing"); 
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


module.exports.index=(async (req,res)=>{
   const allListings= await Listing.find({});
   res.render("listings/index.ejs",{allListings});
})

module.exports.renderNewForm=(req,res)=>{
 
   res.render("listings/new.ejs");
}

module.exports.showListing=(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    //console.log(id);
    if(!listing){
         req.flash("error","Listing you requested for does not exist!");
         return res.redirect("/listings")
    }
    //console.log(listing);
   


    res.render("listings/show.ejs",{listing});
})

module.exports.createListing=(async(req,res,next)=>{
    try {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
   
    
    // 🌍 Geocoding (Nominatim)
    const location = req.body.listing.location;
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    );
    const geoData = await geoResponse.json();

    if (geoData.length > 0) {
      const longitude = parseFloat(geoData[0].lon);
      const latitude = parseFloat(geoData[0].lat);

      // ✅ GeoJSON format
      newListing.geometry = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
      console.log(newListing.geometry )
    } else {
      newListing.geometry = {
        type: "Point",
        coordinates:  [72.8777, 19.0760] , // default fallback
      };
    }
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      newListing.image = {
        url: result.secure_url,
        filename: result.public_id,
      };
    }
     
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
   
});

module.exports.renderEditListing=(async (req,res)=>{
     let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
         req.flash("error","Listing you requested for does not exist!");
         return res.redirect("/listings")
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250")
    res.render("listings/edit.ejs",{listing,originalImageUrl});
})

module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // Update basic fields
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = req.body.listing.location;
    listing.country = req.body.listing.country;
    listing.category = req.body.listing.category; // ✅ include this if you added category

    // ✅ Optional: update geolocation if location is changed
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(req.body.listing.location)}&format=json&limit=1`
    );
    const geoData = await geoResponse.json();

    if (geoData.length > 0) {
      listing.geometry = {
        type: "Point",
        coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)]
      };
    }

    // ✅ Handle new image if uploaded
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      listing.image = {
        url: result.secure_url,
        filename: result.public_id
      };
    }

    await listing.save();

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};




module.exports.destroyListing=(async(req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
   // console.log(deletedListing);
     req.flash("success","Listing Deleted!")
    res.redirect("/listings");
})

module.exports.searchListing=(async (req, res) => {
  try {
    const { country } = req.query;

    // Case-insensitive search using regex
    const allListings = await Listing.find({
      country: { $regex: new RegExp(country, "i") },
    });

    res.render("listings/index.ejs", { allListings });
  } catch (err) {
    req.flash("error", "Something went wrong with the search");
    res.redirect("/listings");
  }
});