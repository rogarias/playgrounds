var express         = require("express");
var router          = express.Router();
var Playground      = require("../models/playground"),
    middleware      = require("../middleware"), //no need to specify filename index.js - special name
    Comment         = require("../models/comment"),
    FuzzySearch     = require('fuzzy-search'),
    geocoder        = require("geocoder");
var multer          = require('multer');

//Setting up Multer & Cloudinary
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'rogarias', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
    
//INDEX
router.get("/", function(req, res){
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Playground.find({name: regex}, function(err, allPlaygrounds){
            if(err){
                res.redirect("back");
            } else {
                if(allPlaygrounds.length < 1) {
                    noMatch = "No playgrounds match that query, please try again.";
                } 
                res.render("playgrounds/index", {playgrounds: allPlaygrounds, noMatch: noMatch});
            }
        });
    } else {
        // get all playgrounds from DB
        Playground.find({}, function(err, allPlaygrounds){
            if(err){
                console.log(err);
            } else {
                res.render("playgrounds/index", {playgrounds: allPlaygrounds, noMatch: noMatch});
            } 
        });
    }
});

//CREATE

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the playground object under image property
      req.body.playground.image = result.secure_url;
      // add author to playground
      req.body.playground.author = {
        id: req.user._id,
        username: req.user.username
      };
        geocoder.geocode(req.body.playground.location, function (err, data) {
            if (err || data.status === 'ZERO_RESULTS') {
                req.flash('error', 'Invalid address');
                return res.redirect('back');
            }
            req.body.playground.lat = data.results[0].geometry.location.lat;
            req.body.playground.lng = data.results[0].geometry.location.lng;
            req.body.playground.location = data.results[0].formatted_address;
            Playground.create(req.body.playground, function(err, playground){
                if(err){
                    console.log(err);
                } else {
                    //redirect back to the playgrounds page
                    req.flash("success", "Your playground was created successfully!");
                    res.redirect("/playgrounds/" + playground.id);
                }
            });
        });
    });
});

//NEW
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("playgrounds/new");
});

//SHOW
router.get("/:id",function(req, res) {
    //find the playground by ID
    Playground.findById(req.params.id).populate("comments").exec(function(err, foundPlayground){
        if(err){
            console.log(err);
        } else {
            console.log(foundPlayground);
            //render the show template for ID
            res.render("playgrounds/show", {playground:foundPlayground});
        }
    });
});

//EDIT
router.get("/:id/edit", middleware.checkPlaygroundOwnership, function(req, res) {
        Playground.findById(req.params.id, function(err, foundPlayground){
            res.render("playgrounds/edit", {playground:foundPlayground});
        });
});

//UPDATE
router.put("/:id", middleware.checkPlaygroundOwnership, function(req, res) {
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || data.status === 'ZERO_RESULTS') {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newData = {
            name: req.body.name, 
            image: req.body.image, 
            description: req.body.description, 
            price: req.body.price,
            priceNotes: req.body.priceNotes,
            type: req.body.type,
            sport: req.body.sport,
            lights: req.body.lights,
            location: location, 
            lat: lat,
            lng: lng
        };
        console.log(newData);
        Playground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedPlayground) {
            if(err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                res.redirect("/playgrounds/" + req.params.id);
            }
        });
    });
});

//DESTROY/DELETE
router.delete("/:id", middleware.checkPlaygroundOwnership, function(req, res) {
    Playground.findByIdAndRemove(req.params.id, function(err){
        if(err) {
            res.redirect("/playgrounds");
        } else {
            res.redirect("/playgrounds");
            req.flash("success", "Playground deleted successfully!");
        }
    });
});

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;