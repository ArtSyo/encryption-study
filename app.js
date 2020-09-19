//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// const encryption = require("mongoose-encryption");  // simple encryption

// const md5 = require("md5"); // hasging md5

// const bcrypt = require("bcrypt"); // hashing bcrypt
// const saltRounds = 10; // rounds for bcrypt hashing

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "Try to solve this",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/UserDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encryption, {secret: process.env.SECRET, encryptedFields: ["password"]});  // encryption with secret key

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

////////////////////////////////////////////////////REGISTRATION and LOGIN using HASHING//////////////////////////////////////////////////

// app.post("/register", (req, res) => {
//   const email = req.body.username;
//   // const password = md5(req.body.password); // md5 hashing
//   const password = req.body.password;
//
//   bcrypt.hash(password, saltRounds, function (err, hash) {
//     const newUser = new User({
//       email: email,
//       password: hash,
//     });
//
//     newUser.save((err) => {
//       err ? res.send(err) : res.render("secrets");
//     });
//   });
// });

// app.post("/login", (req, res) => {
//   const email = req.body.username;
//   // const password = md5(req.body.password); // md5 hashing
//   const password = req.body.password;
//
//   User.findOne({ email: email }, (err, foundUser) => {
//     if (err) {
//       res.send(err);
//     } else if (foundUser) {
//       bcrypt.compare(password, foundUser.password, function (err, result) {
//         if (result === true) {
//           res.render("secrets");
//         } else {
//           console.log("Wrong password");
//         }
//       });
//     }
//   });
// });

////////////////////////////////////////////////////REGISTRATION and LOGIN using COOKIES and SESSION//////////////////////////////////////////////////

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/");
  }
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  User.findOne({ username: req.body.username }, function (err, foundUser) {
    //if username is found in the database, create an object called "user" that will store the username and password
    //that was used to login
    if (foundUser) {
      const user = new User({
        username: req.body.username,
        password: req.body.password,
      });
      //use the "user" object that was just created to check against the username and password in the database
      //in this case below, "user" will either return a "false" boolean value if it doesn't match, or it will
      //return the user found in the database
      passport.authenticate("local", function (err, user) {
        if (err) {
          console.log(err);
        } else {
          //this is the "user" returned from the passport.authenticate callback, which will be either
          //a false boolean value if no it didn't match the username and password or
          //a the user that was found, which would make it a truthy statement
          if (user) {
            //if true, then log the user in, else redirect to login page
            req.login(user, function (err) {
              res.redirect("/secrets");
            });
          } else {
            res.redirect("/login");
          }
        }
      })(req, res);
      //if no username is found at all, redirect to login page.
    } else {
      //user does not exists
      res.redirect("/login");
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

////////////////////////WORKING BUT WITHOUT REDIRECT IF ERR ///////////////////

// app.post("/login", passport.authenticate("local"), function(req, res) {
//   res.redirect("/secrets");
// });

//////////////////////NOT WORKING PROPERLY///////////////////////

// app.post("/login", passport.authenticate("local"), function(req, res){
//     res.redirect("/secrets");
// });

// app.post("/login", (req, res) => {
//   const user = new User({
//     username: req.body.username,
//     password: req.body.password,
//   });
//
//
//   req.login(user, function (err) {
//     if (err) {
//       console.log(err);
//       res.redirect("/");
//     } else {
//       passport.authenticate('local', { successRedirect: "/secrets",failureRedirect: "/"});
//
//       //////////////////////////
//       // passport.authenticate("local")(req, res, (err) => {
//       //   if (err) {
//       //     console.log(err);
//       //   } else {
//       //
//       //     res.redirect("/secrets");
//       //   }
//       // });
//     }
//   });
// });

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
