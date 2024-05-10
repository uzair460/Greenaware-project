const express = require('express');
const router = express.Router();
const passport = require('passport');
const Greenaware = require('../models/user');
const bcrypt = require('bcrypt');
const Message = require('../models/message');
const Observation = require('../models/Observation');









// Route to render the index page
router.get("/", (req, res) => {
    res.render("index");
});


checkAuth = (req, res, next) => { // passport adds this to the request object 
    if (req.isAuthenticated()) { return next(); }

res.redirect("/login");

};

router.get("/login", (req, res) => {
    console.log(`Authenticated at /login: ${req.isAuthenticated()}`);
    res.render("login"); // Render the login page
});

// POST login form submission
router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get("/register", (req, res) => {
    console.log(`Authenticated at /register: ${req.isAuthenticated()}`);
    res.render("register"); // Render the register page
});

router.post("/register", (req, res) => {
    // Hash the password using bcrypt
    bcrypt.hash(req.body.password, 10, function(err, hashedPassword) {
        if (err) {
            console.error("Error hashing password:", err);
            return res.render("register", { error: "Error hashing password" });
        }
        
        // Create a new user with the hashed password
        Greenaware.register(
            new Greenaware({ username: req.body.username,forename: req.body.forename,surname: req.body.surname,category: req.body.category, adress: req.body.adress, password: hashedPassword }), 
            req.body.password, 
            function(err, user) {
                if (err) {
                    console.error("Error registering user:", err);
                    return res.render("register", { error: err });
                } else {
                    passport.authenticate("local")(req, res, function() {
                        console.log(`Authenticated: ${req.isAuthenticated()}`);
                        res.redirect("/dashboard");
                    });
                }
            }
        );
    });
})

// Route to render the dashboard page
router.get("/dashboard", checkAuth, (req, res) => {
    // Check the user's category
    if (req.user.category === "observer") {
        // If the user is an observer, render the observer dashboard
        res.render("dashboard/observer", { user: req.user });
    } else if (req.user.category === "support") {
        // If the user is support, render the support dashboard
        res.render("dashboard/support", { user: req.user });
    } else {
        // Handle other categories or edge cases
        res.redirect("/login");
    }
});

// Route for support to manage observer accounts
router.get("/dashboard/create_account", checkAuth, (req, res) => {
    if (req.user.category === "support") {
        // Render the support dashboard for managing accounts
        res.render("dashboard/create_account", { user: req.user });
    } else {
        // Redirect to login if not a support user
        res.redirect("/login");
    }
});

router.get("/dashboard/disable_account", checkAuth, (req, res) => {
    if (req.user.category === "support") {
        // Render the form to disable an observer account
        res.render("dashboard/disable_account", { user: req.user });
    } else {
        // Redirect to login if not a support user
        res.redirect("/login");
    }
});

router.post("/dashboard/disable_account", checkAuth, async (req, res) => {
    if (req.user.category === "support") {
        const username = req.body.username;
        try {
            // Find the observer by username and update their account status to "inactive"
            const updatedObserver = await Greenaware.findOneAndUpdate(
                { username: username },
                { accountStatus: "inactive" }
            );

            // Delete the observer account from the database
             await Greenaware.findOneAndDelete({ username: username });
            // Account disabled successfully
            res.redirect("/dashboard");
        } catch (err) {
            console.error("Error disabling observer account:", err);
            // Handle error
            res.redirect("/dashboard"); // Redirect to support dashboard or render an error page
        }
    } else {
        // Redirect to login if not a support user
        res.redirect("/login");
    }
});



// Route to create new support accounts
router.post("/dashboard/support/create_account", checkAuth, (req, res) => {
    if (req.user.category === "support") {
        // Retrieve data from request body
        const { username, forename, surname, address, category } = req.body;

        // Create a new support account
        Greenaware.register(new Greenaware({
            username: username,
            forename: forename,
            surname: surname,
            address: address,
            category: category
        }), req.body.password, (err, newSupport) => {
            if (err) {
                console.error("Error creating support account:", err);
                // Handle error
            } else {
                // Support account created successfully
                res.redirect("/dashboard");
                // Flash a success message
                req.flash('success', 'account created successfully');
            }
        });
    } else {
        // Redirect to login if not a support user
        res.redirect("/login");
    }
});

router.get("/dashboard/view_observers", checkAuth, async (req, res) => {
    if (req.user.category === "support") {
        try {
            // Find all active observer accounts
            const observers = await Greenaware.find({ category: "observer", accountStatus: "active" });

            // Render a view to display all observer accounts
            res.render("dashboard/view_observers", { observers: observers, user: req.user });
        } catch (err) {
            console.error("Error fetching observer accounts:", err);
            // Handle error
            res.redirect("/dashboard"); // Redirect to support dashboard or render an error page
        }
    } else {
        // Redirect to login if not a support user
        res.redirect("/login");
    }
});


// Route to handle the submission of observation data
router.post('/dashboard', async (req, res) => {
    try {
        // Extract observation data from the request body
        const { date, time, timeZoneOffset, coordinates, temperatureLand, temperatureSea, humidity, windSpeed, windDirection, precipitation, haze, notes } = req.body;

        // Create a new observation instance
        const newObservation = new Observation({
            date: date,
            time: time,
            timeZoneOffset: timeZoneOffset,
            coordinates: coordinates,
            temperatureLand: temperatureLand,
            temperatureSea: temperatureSea,
            humidity: humidity,
            windSpeed: windSpeed,
            windDirection: windDirection,
            precipitation: precipitation,
            haze: haze,
            notes: notes
        }); 


            // Save the observation to the database
            await newObservation.save();

            // Render the dashboard view
            console.log("observasion saved")
            res.redirect("/dashboard")
    } catch (error) {
        console.error('Error saving observation:', error);
        res.status(500).json({ error: 'Failed to save observation' });
    }
});
// Route to render the form to add credit card details
router.get('/dashboard/add_credit_card', checkAuth, (req, res) => {
    if (req.user.category === "observer") {
        // Render the form to add credit card details
        res.render("dashboard/add_credit_card");
    } else {
        res.status(403).send("Forbidden");
    }
});

// Route to handle the submission of credit card details
router.post('/dashboard/add_credit_card', checkAuth, async (req, res) => {
    try {
        const { cardNumber, cardHolderName, cardType, cardCVV } = req.body;
        const userId = req.user._id; // Get the ID of the logged-in user

        // Update the user's account with the credit card details
        const updatedUser = await Greenaware.findByIdAndUpdate(userId, {
            cardNumber: cardNumber,
            cardHolderName: cardHolderName,
            cardType: cardType,
            cardCVV: cardCVV
        }, { new: true });

        console.log('Credit card details added successfully',updatedUser);
        res.render("/dashboard/observer")
    } catch (error) {
        console.error('Error adding credit card details:', error);
        res.status(500).json({ error: 'Failed to add credit card details' });
    }
});

// GET route to render the view_amend page
router.get('/dashboard/view_amend', checkAuth, async (req, res) => {
    try {
        // Fetch the current user's details from the database
        const user = await Greenaware.findOne({ username: req.user.username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Render the view_amend page and pass the user's details to the template
        res.render('dashboard/view_amend', { user: user }); // Pass the user object to the template
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});


// POST route to handle form submission for amending account details
router.post('/dashboard/view_amend', checkAuth, async (req, res) => {
    try {
        // Extract updated account details from the request body
        const { forename, surname, address, notificationPreference } = req.body;

        // Find the current user's document in the database
        const user = await Greenaware.findOne({ username: req.user.username });

        // Update the user's details with the new values
        user.forename = forename;
        user.surname = surname;
        user.address = address;
        user.notificationPreference = notificationPreference;

        // Save the updated user document back to the database
        await user.save();

        // Respond with a success message
        console.log('Account details updated successfully of',{username});
        res.render("/dashboard")
    } catch (error) {
        console.error('Error updating account details:', error);
        res.status(500).json({ error: 'Failed to update account details' });
    }
});

// Route to render the observer message form
router.get('/dashboard/observer_conversations', checkAuth, (req, res) => {
    res.render('dashboard/observer_conversations');
});

router.post('/dashboard/observer_conversations', checkAuth, async (req, res) => {
    try {
        const { email, full_name, message } = req.body; // Extracting email, full_name, and message from req.body
        
        
        const newMessage = new Message({
            email: email,
            content: message,
            full_name: full_name 
        });

        // Save the new message
        await newMessage.save();

        res.redirect('/dashboard'); // Redirect to the form page
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

router.get('/dashboard/support_conversations', checkAuth, async (req, res) => {
    if (req.user.category === "support") {
        try {
        // Fetch all messages from the database
        const messages = await Message.find();

        // Render the view and pass messages to it
        res.render('dashboard/support_conversations', { messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}});

router.post('/dashboard/support_conversations/:id', checkAuth, async (req, res) => {
    if (req.user.category === "support") {
        try {
        const messageId = req.params.id;
        
        // Delete the message from the database
        await Message.findByIdAndDelete(messageId);

        res.redirect('/dashboard/support_conversations');
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
}});



module.exports = router;
