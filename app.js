require('dotenv').config();
const express = require('express');
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passport_local_mongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({extended : true}));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

user_schema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

user_schema.plugin(passport_local_mongoose);
user_schema.plugin(findOrCreate);

const User = new mongoose.model("User", user_schema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, done) {
  // console.log(profile);
  User.findOrCreate({ facebookId: profile.id}, function(err, user) {
    if (err) { return done(err); }
    done(null, user);
  });
}
));

app.get("/", function(req, res)
{
  res.render("home");
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get("/auth/google", passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/facebook/secrets",
  passport.authenticate('facebook', {failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.route("/login")
.get(function(req, res)
{
  res.render("login");
})
.post(function(req, res){
  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err){
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.route("/register")
.get(function(req, res)
{
  res.render("register");
})
.post(function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function()
{
  console.log('Server is running on port 3000.');
});
