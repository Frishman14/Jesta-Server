const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/Jesta', { useNewUrlParser: true});
var db = mongoose.connection;
if(!db)
    console.log('db error');
else
    console.log('db connected succesfully');

app.use('/users', require("./Routes/userRoutes.js"));
const PORT = process.env.PORT || 4111;
app.listen(PORT, console.log("Server start in port: " + PORT));

