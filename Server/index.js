const express = require("express");
const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
const { ApolloServer, gql } = require('apollo-server');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const User = require('./Models/User');
const {typeDefs, resolvers} = require('./Controllers/userController');

// app init
const PORT = process.env.PORT || 4111;

// app init
const app = express();
// app.use(bodyParser.urlencoded({
//     extended: true
// }))
// app.use(bodyParser.json());

// swagger Init
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Jesta API',
            description: 'Backend API Information',
            servers: ['http://localhost:4111']
        }
    },
    apis: ['./Routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Db init
mongoose.connect('mongodb://localhost/Jesta', { useNewUrlParser: true});
var db = mongoose.connection;
if(!db)
    console.log('db error');
else
    console.log('db connected succesfully');

// Routes
app.use('/users', require("./Routes/userRoutes.js"));

// run app
const server = new ApolloServer({ typeDefs, resolvers });
server.listen().then(({url}) => {
    console.log(`server ready at ${url}`);
});
//app.listen(PORT, console.log("Server start in port: " + PORT));

