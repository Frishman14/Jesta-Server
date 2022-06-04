const express = require("express");
const mongoose = require("mongoose");
const {ApolloServer} = require('apollo-server-express');
const {ApolloServerPluginDrainHttpServer} = require("apollo-server-core")
const http = require("http");
const {userTypeDefs, userResolvers} = require('./endpoints/user');
const {categoryTypeDefs, categoryResolvers} = require('./endpoints/category');
const {favorResolvers, favorTypeDefs} = require('./endpoints/favor');
const {favorTransactionResolvers, favorTransactionTypeDefs} = require('./endpoints/favorTransaction');
const {decodeToken} = require('./middlewares/authorize');
const {graphqlUploadExpress} = require('graphql-upload');
const admin = require("firebase-admin");
const serviceManager = require("./Services/servicesManager");
const mostVolunteeredService = require("./Services/Gimification/getTheMostVolunteers");
const notifyOwnerJestaExecutionSoon = require("./Services/notifications/notifyOwnerJestaExecutionSoon");
const notifyExecutorJestaExecutionSoon = require("./Services/notifications/notifyExecutorJestaExecutionSoon");
const makeJestaUnavailableIfTimePass = require("./Services/makeJestaUnavailableIfTimePass");
require('dotenv').config({path: "/home/cs122/IdeaProjects/Jesta-Server/.env"});

const logger = require("./logger");
const {initAdminUser, initCategories} = require("./utilities/initDb");
const {dashboardResolvers, dashboardTypeDefs} = require("./endpoints/dashboard");

// region consts
process.env.TZ = "Asia/Jerusalem"
const PORT = process.env.PORT || 4111;
const MONGO_ADDRESS = process.env.MONGO_ADDRESS || 'mongodb://127.0.0.1/Jesta';
const ADDRESS = MONGO_ADDRESS === 'mongodb://127.0.0.1/Jesta' ? "127.0.0.1" : "193.106.55.114";
const resolvers = [userResolvers, favorResolvers, categoryResolvers, favorTransactionResolvers, dashboardResolvers]
const typeDefs = [userTypeDefs, favorTypeDefs, categoryTypeDefs, favorTransactionTypeDefs, dashboardTypeDefs]
// endregion

// region app init
async function startApolloServer(typeDefs, resolvers) {
    // region init express
    const app = express();
    app.use(express.static(__dirname + '/data/'))
    app.use(graphqlUploadExpress());
    const httpServer = http.createServer(app);
    // endregion

    // region mongo connection
    await mongoose.connect(MONGO_ADDRESS, {useNewUrlParser: true});
    if (!mongoose.connection) {
        logger.error('db error');
        new Error("db problem")
    } else
        logger.info('db connected successfully');
    // region init db data
    initAdminUser();
    initCategories()
    // endregion
    // endregion

    // region init app services
    const every15minServices = [notifyOwnerJestaExecutionSoon,notifyExecutorJestaExecutionSoon, makeJestaUnavailableIfTimePass]
    const everyDayServices = [mostVolunteeredService]
    serviceManager.start(everyDayServices, every15minServices)
    // endregion

    // region init firebase
    const serviceAccount = require("./jesta-b3688-firebase-adminsdk-zwo1c-4ebe639790.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    // endregion

    // region init apollo server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({httpServer})],
        context: ({req}) => {
            return decodeToken(req);
        }
    });
    await server.start();
    server.applyMiddleware({
        app,
        path: '/graphql/'
    });

    await new Promise(resolve => httpServer.listen({port: PORT}, resolve));
    logger.info(`Server ready at http://${ADDRESS}:${PORT}${server.graphqlPath}`);
    // endregion
}

startApolloServer(typeDefs, resolvers).catch(error => {
    logger.error(error);
});
// endregion

// region handle crash
process.on('uncaughtException', err => {
    logger.error(err && err.stack)
});
// endregion
