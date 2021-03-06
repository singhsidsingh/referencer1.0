/******************************************/
/* Requiring all the necessary frameworks */
/******************************************/

// Node version being used: 14.16.1
// Procfile added in root directory for telling Heroku how to run this app

// The following is required for using environment variables
require('dotenv').config();

// Express JS is a web application framework for node.js
const express = require("express");
// Body Parser is a body parsing framework for node.js
const bodyParser = require("body-parser");
// EJS allows for embedded JavaScript templating
const ejs = require("ejs");
// Mongoose.js makes interacting with MongoDB less of a chore
const mongoose = require("mongoose");
// Moment.js takes the pain out of working with dates and time
const moment = require("moment");

// Specifying the path for our remote MongoDB
const path = process.env.MONGODB_PATH1 + process.env.MONGODB_PASSWORD + process.env.MONGODB_PATH2;

/* Initializing Moment.js */
const momentDate = moment();
const currentDateValue = momentDate.format("DDMMYY");

/* Creating Express application */
// 'app' is traditionally the name given to the object created by calling the express() function
const app = express();

// The following will set up EJS view engine
// We will utilize EJS in templating to reduce our work
app.set('view engine', 'ejs');

// Initiating Body Parser
// We require this to seamlessly obtain values from the DOM
app.use(bodyParser.urlencoded({
  extended: true
}));

// Will allow us to serve static assets (images, CSS files, JS files etc.) in a directory named "public"
app.use(express.static("public"));

/* Connecting to our MongoDB databse with Mongoose */
mongoose.connect(path, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const referenceSchema = {
  referenceNumber: String,
  counter: Number,
  date: String
}

const Reference = mongoose.model("Reference", referenceSchema);

/*******************/
/* Defining routes */
/*******************/

// Route to generate reference number
app.get("/generate", function(req, res) {
  /* Writing our logic for generating a unique reference number */
  // Will update this. For now, let's keep it simple.

  /* I have already inserted a dummy initial document in the collection,
  with the following values: {referenceNumber: "INIT", counter: 0} */

  // The following code extracts the latest inserted counter value and increments it
  // It then generates a new reference number based on the updated counter value

  let promise = Reference.exists({
    date: currentDateValue
  });

  promise.then(function(doc) {
    if (!doc) {
      // Date not found in DB
      res.render("generateRefNo", {
        generatedRefNo: "RCC/BRL/" + currentDateValue + "/" + "1",
        generatedCounter: 1,
      });
    } else {
      // Date found in DB
      Reference.find({}).sort({
        _id: -1
      }).limit(1).then(function(queryResult) {
        // Update counter value and generate new reference number
        var updatedCounter = queryResult[0].counter + 1;
        var newReferenceNo = "RCC/BRL/" + currentDateValue + "/" + updatedCounter;

        // Send the value back to generateRefNo.ejs
        res.render("generateRefNo", {
          generatedRefNo: newReferenceNo,
          generatedCounter: updatedCounter
        });
      });
    }
  })
});

// Route to save newly generated reference number to // DB
app.post("/save", function(req, res) {
  // Obtain values from DOM
  var obtainedReferenceNumber = req.body.userConsent;
  var obtainedCounter = req.body.counterValue;

  // Push new document to MongoDB db and redirect to postSave.ejs
  const newReference = new Reference({
    referenceNumber: obtainedReferenceNumber,
    counter: obtainedCounter,
    date: currentDateValue
  });

  newReference.save().then(function() {
    res.render("postSave", {
      savedReferenceNumber: obtainedReferenceNumber
    });
  });
});

// Default route
app.get("/", function(req, res) {
  res.render("home");
});

// Handling undefined routes
app.all('*', function(req, res) {
  res.status(404).render("error", {
    errorCode: 404,
    errorMessage: "Page not found."
  });
});

/* Starting server */
// We use process.env.PORT so that app may be deployed on Heroku
// We also use port 3000 for testing on local system
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.")
});
