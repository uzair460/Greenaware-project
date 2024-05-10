const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user");
const routes = require("./routes/routes");
const flash = require('express-flash');


// Static assets
app.use(express.static("public"));

// Enables transfer of post data from HTML forms
app.use(express.urlencoded({ extended: true }));

// Views engine middleware
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// MongoDB ORM middleware
const mongoose = require("./config/dbconfig");

// Express session middleware
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Mount routes
app.use("/", routes);



// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



