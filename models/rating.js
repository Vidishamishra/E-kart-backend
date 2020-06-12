const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
    _userId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'User' 
        },
    rating: { 
        type: Number, 
        required: true 
    },
    _productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product' 
       }
});

module.exports = mongoose.model("Rating", ratingSchema);