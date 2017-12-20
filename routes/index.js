var express     = require("express");
var router      = express.Router();
var User        = require("../models/user"),
    Campground  = require("../models/campground"),
    passport    = require("passport");

//LANDING PAGE
router.get("/", function(req, res){
   res.render("landing");
});

//===============
//AUTH ROUTES
//===============

//show the sign up page
router.get("/register", function(req, res) {
    res.render("register", {page: 'register'});
});

//sign-up logic
router.post("/register", function(req, res) {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    //eval(require("locus")); //debugging tool
    if(req.body.adminCode === "secretcode"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err) {
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp, " + user.username + "!");
            res.redirect("/campgrounds");
        });
    });
});

//show the login page
router.get("/login", function(req, res) {
    res.render("login", {page: 'login'});
});

//login logic
router.post("/login", passport.authenticate("local",{ 
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome to YelpCamp!"
}), function(req, res) {
});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged out successfully!");
    res.redirect("/campgrounds");
});

//USER PROFILE
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Something went wrong!");
            res.redirect("/");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
            if(err){
                req.flash("error", "Something went wrong!");
                res.redirect("/");
            }
            res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        });
    });
});

module.exports = router;