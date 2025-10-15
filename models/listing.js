const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Review=require("./review.js")

const listingSchema=new Schema({
    title:
    {
        type:String,
        required:true
    },
    description:String,
    image:
    {
        filename:String,
        url:{
            type:String,
       default:"https://plus.unsplash.com/premium_photo-1754269259187-08f6379e4d8f?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        set:(v)=>v===""
        ?"https://plus.unsplash.com/premium_photo-1754269259187-08f6379e4d8f?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :v,
        }
    },
    price:Number,
    location:String,
    country:String,
    
    // ✅ GeoJSON field for storing coordinates
    geometry: {
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [lng, lat]
        default: [72.8777, 19.0760] // fallback Mumbai
    },
    
  },

  
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
    
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    } ,
})

// ✅ Enable geospatial index
listingSchema.index({ geometry: "2dsphere" });

//MIDDLEWARE
listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing) {
        await Review.deleteMany({_id: { $in:listing.reviews }})
    }
});


const Listing=mongoose.model("Listing",listingSchema);

module.exports=Listing;