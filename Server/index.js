const express = require("express");
const mongoose = require("mongoose");
const { createOne } = require("./Controllers/userController");
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core")
const http = require("http");
const logger = require("./logger");
const { userTypeDefs, userResolvers } = require('./endpoints/user');
const { favorResolvers, favorTypeDefs} = require('./endpoints/favors');
const { decodeToken } = require('./middlewares/authorize');
const { graphqlUploadExpress } = require('graphql-upload');
const User = require("./Models/User");

const PORT = process.env.PORT || 4111;

// app init
async function startApolloServer(typeDefs, resolvers){
    const app = express();
    app.use(express.static(__dirname + '/data/'))
    app.use(graphqlUploadExpress());
    const httpServer = http.createServer(app);

    mongoose.connect('mongodb://127.0.0.1/Jesta', { useNewUrlParser: true});
    if(!mongoose.connection){
        logger.error('db error');
        new Error("db problem")
    }
    else
        logger.info('db connected successfully');

    User.find({email: "admin@jesta.com"}, function(error, user){
        if(user.length === 0){
            createOne({
                userParams: {
                    firstName: "admin",
                    lastName: "admin",
                    birthday: "1995-08-29T03:00:00",
                    email: "admin@jesta.com",
                    hashedPassword: "aA123456",
                    country: "Israel",
                    city: "Tel-Aviv",
                    street: "ben-zvi"
                }
            }, true)
        }
    });

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

startApolloServer([userTypeDefs, favorTypeDefs], [userResolvers, favorResolvers]).catch(error => logger.error(error));
