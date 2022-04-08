const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const favorTransactionController = require("../Controllers/favorTransactionController");
const favorTransaction = require("../Models/favors/FavorTransactions");
const { GraphQLUpload } = require('graphql-upload');

exports.favorTransactionTypeDefs = gql`
                    scalar DateTime
                    enum FavorTransactionStatus {
                        Approved
                        Waiting
                        Canceled
                    }
                    type FavorTransaction {
                        _id: String!
                        favorId: String!
                        favorOwnerId: String!
                        handledByUserId: String!
                        ownerComment: String
                        handlerComment: String
                        dateAccepted: DateTime
                        dateCompleted: DateTime
                        dateCreated: DateTime
                        dateLastModified: DateTime
                    }
                    type Query {
                        getAllFavorTransaction: [FavorTransaction]
                        getAllUserFavorsRequestedTransaction: [FavorTransaction]
                        getAllUserFavorsWaitingForHandleTransaction: [FavorTransaction]
                    }
                    type Mutation {
                        createFavorTransactionRequest(favorId: String!, comment: String): String
                        handleFavorTransactionRequest(favorTransactionId: String!, status: FavorTransactionStatus, comment: String): String
                        deleteFavorTransactionRequest(favorTransactionId: String!): String
                        executorNotifyDoneFavor(favorTransactionId: String!): String
                        ownerNotifyJestaHasBeenDone(favorTransactionId: String!): String
                    }
                    `;

exports.favorTransactionResolvers = {
    Upload: GraphQLUpload,
    Query: {
        getAllFavorTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({}).exec() : new AuthenticationError("unauthorized"); },
        getAllUserFavorsRequestedTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ handledByUserId : context.sub }).exec() : new AuthenticationError("unauthorized"); }, //TODO: moveToController + validate user
        getAllUserFavorsWaitingForHandleTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ ownerId : context.sub, dateAccepted : {$ne : null}}).exec(): new AuthenticationError("unauthorized"); }, //TODO: moveToController + validate user
    },
    Mutation: {
        createFavorTransactionRequest: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.createRequest(args, context): new AuthenticationError("unauthorized"); },
        handleFavorTransactionRequest: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.handleRequest(args, context): new AuthenticationError("unauthorized"); },
        deleteFavorTransactionRequest: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.handleRequest(args, context): new AuthenticationError("unauthorized"); },
        executorNotifyDoneFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.executorNotifyDoneFavor(args, context): new AuthenticationError("unauthorized"); },
        ownerNotifyJestaHasBeenDone: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.executorNotifyDoneFavor(args, context): new AuthenticationError("unauthorized"); },
    }
}
