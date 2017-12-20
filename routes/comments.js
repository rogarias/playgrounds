var express = require("express");
var router = express.Router({mergeParams: true});
var Campground      = require("../models/campground"),
    middleware      = require("../middleware"), //no need to specify filename index.js - special name
    Comment         = require("../models/comment");

//comment new
router.get("/new", middleware.isLoggedIn, function(req, res) {
    //find the campground by ID
    Campground.findById(req.params.id, function(err, campground) {
        if(err) {
            console.log(err);
        } else {
            res.render("comments/new", {campground: campground});
        }
    });
});

//comments create
router.post("/", middleware.isLoggedIn, function(req, res) {
    //find the campground by ID
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err) {
                    req.flash("error", "Ooops, something went wrong")
                    console.log(err);
                } else {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success", "Your comment was added successfully!");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

//EDIT COMMENTS
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment) {
        if(err) {
            res.redirect("back");
        } else {
            res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
        }
    });
});

//UPDATE COMMENTS
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err) {
            res.redirect("back");
        } else {
           req.flash("success", "The comment was updated successfully!");
           res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DESTROY/DELETE ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

module.exports = router;