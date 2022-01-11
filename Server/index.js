const express = require("express");
const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
const { ApolloServer, gql } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core")
const http = require("http");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const User = require('./Models/User');
const {typeDefs, resolvers} = require('./Controllers/userController');

// app init
const PORT = process.env.PORT || 4111;

// app init
async function startApolloServer(typeDefs, resolvers){
    const app = express();
    const httpServer = http.createServer(app);
    mongoose.connect('mongodb://localhost/Jesta', { useNewUrlParser: true});
    var db = mongoose.connection;
    if(!db)
        console.log('db error');
    else
        console.log('db connected succesfully');
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({httpServer})]
    });
    await server.start();
    server.applyMiddleware({
        app,
        path: '/'
    });
    await new Promise(resolve => httpServer.listen({ port: PORT}, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
}

startApolloServer(typeDefs, resolvers);
// app.use(bodyParser.urlencoded({
//     extended: true
// }))
// app.use(bodyParser.json());

// swagger Init
// const swaggerOptions = {
//     swaggerDefinition: {
//         info: {
//             title: 'Jesta API',
//             description: 'Backend API Information',
//             servers: ['http://localhost:4111']
//         }
//     },
//     apis: ['./Routes/*.js']
// };

// const swaggerDocs = swaggerJsDoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// // Db init
// mongoose.connect('mongodb://localhost/Jesta', { useNewUrlParser: true});
// var db = mongoose.connection;
// if(!db)
//     console.log('db error');
// else
//     console.log('db connected succesfully');

// // Routes
// app.use('/users', require("./Routes/userRoutes.js"));

// // run app
// const server = new ApolloServer({ typeDefs, resolvers });
// server.listen().then(({url}) => {
//     console.log(`server ready at ${url}`);
// });
// //app.listen(PORT, console.log("Server start in port: " + PORT));

