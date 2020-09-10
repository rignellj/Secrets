const express = require('express');
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const ejs = require('ejs');
const app = express();

app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({extended : true}));
app.use(express.static('public'));

app.get('/', function(req, res)
{
  res.send('Hello');
});

app.listen(3000, function()
{
  console.log('Server is running on port 3000.');
});
