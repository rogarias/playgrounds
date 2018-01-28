var mongoose    = require("mongoose");

var playgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    priceNotes: String,
    sport: String,
    lights: Boolean,
    type: String,
    image: String,
    description: String,
    createdAt: { 
        type: Date, 
        default: Date.now
    },
    location: "String",
    lat: "Number",
    lng: "Number",
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"
        }
    ]
});

module.exports = mongoose.model("Playground", playgroundSchema);