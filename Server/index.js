const express = require("express");
const mongoose = require("mongoose");
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core")
const http = require("http");
const expressJwt = require("express-jwt");
const { typeDefs, resolvers } = require('./endpoints/user');
const { decodeToken } = require('./middlewares/authorize');

// TODO: add configuration file for environments
// TODO: add winston logger
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
        plugins: [ApolloServerPluginDrainHttpServer({httpServer})],
        context: ({ req }) => {
            return decodeToken(req);
        }
    });
    await server.start();
    server.applyMiddleware({
        app,
        path: '/'
    });
    await new Promise(resolve => httpServer.listen({ port: PORT}, resolve));
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
}

startApolloServer(typeDefs, resolvers).catch(error => console.log(error));
