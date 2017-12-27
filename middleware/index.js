var Campground              = require("../models/campground"),
    Comment                 = require("../models/comment");

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
    if(req.isAuthenticated()) {
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err) {
                req.flash("error", "Campground not found");
                res.redirect("back");
            //check if user is equal to author    
            } else if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function (req, res, next){
    if(req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err) {
                res.redirect("back");
            //check if user is equal to author    
            } else if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                req.flash("error", "You don't have persmission to do that");
                res.redirect("back");
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function (req, res, next) {
    if(req.isAuthenticated()){
        console.log("User is logged in!");
        return next();
    }
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/login");
}

module.exports = middlewareObj;