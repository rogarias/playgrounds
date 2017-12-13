var express         = require("express");
var router          = express.Router();
var Campground      = require("../models/campground"),
    middleware      = require("../middleware"), //no need to specify filename index.js - special name
    Comment         = require("../models/comment"),
    geocoder        = require("geocoder");
    
//INDEX
router.get("/", function(req, res){
    //GET ALL CAMPGROUNDS FROM THE DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/index",{campgrounds:allCampgrounds, page: 'campgrounds'});
        }
    });
});

//CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
    //get data from new campgrounds form
    //post it to the campgrounds page (object array)
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function (err, data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newCampground = {name: name, price: price, image:image, description:desc, author:author, location: location, lat: lat, lng: lng};
        //CREATE NEW CAMPGROUND AND SAVE TO DB
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
            } else {
                //redirect back to the campgrounds page
                req.flash("success", "Your campground was created successfully!");
                res.redirect("/campgrounds");
            }
        });
    });
});

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
        }
    });
});

module.exports = router;