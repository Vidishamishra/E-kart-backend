const mongoose = require("mongoose");


var commentSchema = new mongoose.Schema({
    _userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
       },
       _productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product' 
       },
    Content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    Username: {
        type: String,
        required: true,
        trim: true,
        maxlength: 32
    }
    
    });

    module.exports = mongoose.model('Comments', commentSchema);