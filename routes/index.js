var express     = require("express");
var router      = express.Router();
var User        = require("../models/user"),
    Playground  = require("../models/playground"),
    async       = require("async"),
    nodemailer  = require("nodemailer"),
    crypto      = require("crypto"), //part of node - no need to install
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
            req.flash("success", "Welcome to Playgrounds, " + user.username + "!");
            res.redirect("/playgrounds");
        });
    });
});

//show the login page
router.get("/login", function(req, res) {
    res.render("login", {page: 'login'});
});

//login logic
router.post("/login", passport.authenticate("local",{ 
    successRedirect: "/playgrounds",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome to Playgrounds!"
}), function(req, res) {
});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged out successfully!");
    res.redirect("/playgrounds");
});

//PASSWORD RESET - FORGOT PASSWORD
router.get("/forgot", function(req, res) {
    res.render("forgot");
    //res.send(process.env.GMAILPW);
});

router.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user){
                if(!user){
                    req.flash("error", "An account does not exist with that email address");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 36000000; //1 hour
                
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },     
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "rogariasj@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            //eval(require("locus"));
            var mailOptions = {
                to: user.email,
                from: "rogariasj@gmail.com",
                subject: "Playgrounds Password Reset",
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your Playgrounds account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ],  function(err) {
            if (err) return next(err);
            res.redirect('/forgot');
    }); 
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rogariasj@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'rogariasj@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/playgrounds');
  });
});

//USER PROFILE
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Something went wrong!");
            res.redirect("/");
        }
        Playground.find().where("author.id").equals(foundUser._id).exec(function(err, playgrounds){
            if(err){
                req.flash("error", "Something went wrong!");
                res.redirect("/");
            }
            res.render("users/show", {user: foundUser, playgrounds: playgrounds});
        });
    });
});

module.exports = router;