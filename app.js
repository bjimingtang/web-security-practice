//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const saltRounds = 11;



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("home");
  }
});

app.post("/", function(req, res){

});

app.get("/login", function(req, res){
  res.render("login");
});

app.post("/login", function(req, res){
  const username = req.body.username;
  const pw = req.body.password;
  const user = new User({
    username: username,
    password: pw
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport. authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
  // User.findOne({email: user}, function(err, user){
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if (user) {
  //       bcrypt.compare(pw, user.password, function(err, result) {
  //         if (result === true) {
  //           res.render("secrets");
  //         } else {
  //           res.redirect("/");
  //         }
  //       });
  //     } else {
  //       res.redirect("/");
  //     }
  //   }
  // });
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     const newUser = new User ({
  //       email: req.body.username,
  //       password: hash
  //     });
  //     newUser.save(function (err) {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         res.render("secrets");
  //       }
  //     });
  //   }
  // });
});

app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, users) {
    if (err) {
      console.log(err);
    } else {
      if (users) {
        res.render("secrets", {users: users});
      }
    }
  });
});

app.post("/secrets", function(req, res){

});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/logout", function(req, res){

});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  const userId = req.user.id;
  User.findById(userId, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        });
      } else {
        res.redirect("/secrets");
      }
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
