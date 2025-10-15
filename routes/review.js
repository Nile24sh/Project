const express=require("express");
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js");
//onst ExpressError=require("./utils/ExpressError.js");
const Review=require("../models/review.js")
const Listing=require("../models/listing.js");
const {isLoggedIn,validateReview,isReviewAuthor}=require("../middleware.js")
const reviewController=require("../controllers/review.js")

//REVIEWS POST
router.post("/",isLoggedIn,validateReview,wrapAsync(reviewController.createReview))

//DELETE REVIEW ROUTE
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.destroyReview))

module.exports=router;