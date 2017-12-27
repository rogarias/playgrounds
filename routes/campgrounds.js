var express         = require("express");
var router          = express.Router();
var Campground      = require("../models/campground"),
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
var upload = multer({ storage: storage, fileFilter: imageFilter})

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
        Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                res.redirect("back");
            } else {
                if(allCampgrounds.length < 1) {
                    noMatch = "No campgrounds match that query, please try again.";
                } 
                res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch});
            }
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch});
            } 
        });
    }
});

//CREATE

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      };
    //   Campground.create(req.body.campground, function(err, campground) {
    //     if (err) {
    //       req.flash('error', err.message);
    //       return res.redirect('back');
    //     }
    //     res.redirect('/campgrounds/' + campground.id);
    //   });
        geocoder.geocode(req.body.campground.location, function (err, data) {
            if (err || data.status === 'ZERO_RESULTS') {
                req.flash('error', 'Invalid address');
                return res.redirect('back');
            }
            req.body.campground.lat = data.results[0].geometry.location.lat;
            req.body.campground.lng = data.results[0].geometry.location.lng;
            req.body.campground.location = data.results[0].formatted_address;
            //var newCampground = {name: name, price: price, image:image, description:desc, author:author, location: location, lat: lat, lng: lng};
            //CREATE NEW CAMPGROUND AND SAVE TO DB
            Campground.create(req.body.campground, function(err, campground){
                if(err){
                    console.log(err);
                } else {
                    //redirect back to the campgrounds page
                    req.flash("success", "Your campground was created successfully!");
                    res.redirect("/campgrounds/" + campground.id);
                }
            });
        });
    });
});

// router.post("/", middleware.isLoggedIn, function(req, res){
//     //get data from new campgrounds form
//     //post it to the campgrounds page (object array)
//     var name = req.body.name;
//     var price = req.body.price;
//     var image = req.body.image;
//     var desc = req.body.description;
//     var author = {
//         id: req.user._id,
//         username: req.user.username
//     };
//     geocoder.geocode(req.body.location, function (err, data) {
//         if (err || data.status === 'ZERO_RESULTS') {
//             req.flash('error', 'Invalid address');
//             return res.redirect('back');
//         }
//         var lat = data.results[0].geometry.location.lat;
//         var lng = data.results[0].geometry.location.lng;
//         var location = data.results[0].formatted_address;
//         var newCampground = {name: name, price: price, image:image, description:desc, author:author, location: location, lat: lat, lng: lng};
//         //CREATE NEW CAMPGROUND AND SAVE TO DB
//         Campground.create(newCampground, function(err, newlyCreated){
//             if(err){
//                 console.log(err);
//             } else {
//                 //redirect back to the campgrounds page
//                 req.flash("success", "Your campground was created successfully!");
//                 res.redirect("/campgrounds");
//             }
//         });
//     });
// });

//NEW
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new");
});

//SHOW
router.get("/:id",function(req, res) {
    //find the campground by ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground);
            //render the show template for ID
            res.render("campgrounds/show", {campground:foundCampground});
        }
    });
});

//EDIT
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
        Campground.findById(req.params.id, function(err, foundCampground){
            res.render("campgrounds/edit", {campground:foundCampground});
        });
});

//UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || data.status === 'ZERO_RESULTS') {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newData = {name: req.body.name, image: req.body.image, description: req.body.description, price: req.body.price, location: location, lat: lat, lng: lng};
        Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedCampground) {
            if(err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    });
});

//DESTROY/DELETE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
            req.flash("success", "Campground deleted successfully!");
        }
    });
});

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;