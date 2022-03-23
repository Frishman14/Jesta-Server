const express = require("express");
const mongoose = require("mongoose");
const { createOne } = require("./Controllers/userController");
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core")
const http = require("http");
const logger = require("./logger");
const { userTypeDefs, userResolvers } = require('./endpoints/user');
const { performTypeDefs, performResolvers } = require('./endpoints/perform');
const { categoryTypeDefs, categoryResolvers } = require('./endpoints/category');
const { favorResolvers, favorTypeDefs} = require('./endpoints/favor');
const { decodeToken } = require('./middlewares/authorize');
const { graphqlUploadExpress } = require('graphql-upload');
const { Client } = require("@googlemaps/google-maps-services-js");
const User = require("./Models/User");

const PORT = process.env.PORT || 4111;
const resolvers = [userResolvers, favorResolvers, categoryResolvers, performResolvers]
const typeDefs = [userTypeDefs, favorTypeDefs, categoryTypeDefs, performTypeDefs]

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
                    fullAddress: "givatyim ben-tzvi 23",
                    longitude: 32.12345,
                    altitude: 32.12345
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
startApolloServer(typeDefs,resolvers ).catch(error => logger.error(error));
