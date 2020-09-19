//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encryption = require("mongoose-encryption");  // simple encryption
const md5 = require("md5"); // hasging

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/UserDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// userSchema.plugin(encryption, {secret: process.env.SECRET, encryptedFields: ["password"]});  // encryption with secret key

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const email = req.body.username;
  const password = md5(req.body.password);

  const newUser = new User({
    email: email,
    password: password,
  });

  newUser.save((err) => {
    err ? res.send(err) : res.render("secrets");
  });
});

app.post("/login", (req, res) => {
  const email = req.body.username;
  const password = md5(req.body.password);

  User.findOne({ email: email }, (err, foundUser) => {
    if (err) {
      res.send(err);
    } else if (foundUser) {
      if (foundUser.password === password) {
        res.render("secrets");
      } else {
        console.log("Wrong password");
      }
    }
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
