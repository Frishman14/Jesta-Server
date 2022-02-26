const express = require("express");
const mongoose = require("mongoose");
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core")
const http = require("http");
const logger = require("./logger");
const { typeDefs, resolvers } = require('./endpoints/user');
const { decodeToken } = require('./middlewares/authorize');
const { graphqlUploadExpress } = require('graphql-upload');

const PORT = process.env.PORT || 4111;

// app init
async function startApolloServer(typeDefs, resolvers){
    const app = express();
    app.use(express.static(__dirname + '/data/'))
    app.use(graphqlUploadExpress());
    const httpServer = http.createServer(app);
    mongoose.connect('mongodb://localhost/Jesta', { useNewUrlParser: true});
    if(!mongoose.connection)
        logger.error('db error');
    else
        logger.info('db connected successfully');
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
        path: '/graphql/'
    });
    await new Promise(resolve => httpServer.listen({ port: PORT}, resolve));
    logger.info(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
}

startApolloServer(typeDefs, resolvers).catch(error => console.log(error));
