require('dotenv').config();
const express = require('express');
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const ejs = require('ejs');
const bcrypt = require("bcrypt");
const salt_rounds = 10;
const app = express();

app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({extended : true}));
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

user_schema = new mongoose.Schema ({
  email: String,
  password: String
});


const User = new mongoose.model("User", user_schema);

app.get('/', function(req, res)
{
  res.render("home");
});

app.route("/login")
.get(function(req, res)
{
  res.render("login");
})
.post(function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({email: username}, function(err, found_user){
      if (err){
        console.log(err);
      } else {
        if (found_user){
          bcrypt.compare(password, found_user.password, function(err, result){
            if (result === true){
              res.render("secrets");
            } else {
              res.send("No user found. Please, check your username and password and try again.");
            }
          });
        } else {
          res.send("No user found. Please, check your username and password and try again.");
        }
      }
    }
    );
});

app.route("/register")
.get(function(req, res)
{
  res.render("register");
})
.post(function(req, res){
  bcrypt.hash(req.body.password, salt_rounds, function(err, hash){
    const new_user = new User ({
      email: req.body.username,
      password: hash
    });
    new_user.save(function(err){
      if (err){
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });
});

app.listen(3000, function()
{
  console.log('Server is running on port 3000.');
});
