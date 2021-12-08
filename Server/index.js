const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express"), swaggerDocument = require("./swagger.json")


// app init
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());

// Db init
mongoose.connect('mongodb://localhost/Jesta', { useNewUrlParser: true});
var db = mongoose.connection;
if(!db)
    console.log('db error');
else
    console.log('db connected succesfully');

// Routes
app.use('/users', require("./Routes/userRoutes.js"));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// run app
const PORT = process.env.PORT || 4111;
app.listen(PORT, console.log("Server start in port: " + PORT));

