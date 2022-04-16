const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const favorTransactionController = require("../Controllers/favorTransactionController");
const {JESTA_TRANSACTION_STATUS} = require("../Models/Common/consts");
const favorTransaction = require("../Models/favors/FavorTransactions");
const { GraphQLUpload } = require('graphql-upload');

exports.favorTransactionTypeDefs = gql`
                    scalar DateTime
                    enum FavorTransactionStatus {
                        PENDING_FOR_OWNER
                        WAITING_FOR_JESTA_EXECUTION_TIME
                        EXECUTOR_FINISH_JESTA
                        JESTA_DONE
                        CANCELED
                    }
                    type FavorTransaction {
                        _id: String!
                        status: String!
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
                    type PopulatedFavorTransaction {
                        _id: String!
                        status: String!
                        favorId: Favor!
                        favorOwnerId: User!
                        handledByUserId: User!
                        ownerComment: String
                        handlerComment: String
                        dateAccepted: DateTime
                        dateCompleted: DateTime
                        dateCreated: DateTime
                        dateLastModified: DateTime
                    }
                    type Query {
                        getAllUserFavorTransactionByFavorId(favorId: String!): FavorTransaction
                        getAllFavorTransaction: [FavorTransaction]
                        getAllUserFavorsRequestedTransaction: [PopulatedFavorTransaction]
                        getAllUserFavorsWaitingForHandleTransaction: [FavorTransaction]
                        getAllOwnerFavorTransactionByStatus(status: FavorTransactionStatus): [FavorTransaction]
                        getAllExecutorFavorTransactionByStatus(status: FavorTransactionStatus): [FavorTransaction]
                    }
                    type Mutation {
                        createFavorTransactionRequest(favorId: String!, comment: String): String
                        handleFavorTransactionRequest(favorTransactionId: String!, comment: String): String
                        cancelFavorTransaction(favorTransactionId: String!): String
                        executorNotifyDoneFavor(favorTransactionId: String!): String
                        ownerNotifyJestaHasBeenDone(favorTransactionId: String!, rate: Int): String
                    }
                    `;

exports.favorTransactionResolvers = {
    Upload: GraphQLUpload,
    Query: {
        getAllUserFavorTransactionByFavorId: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.findOne({"favorId": args.favorId, "handledByUserId": context.sub.toString()}).exec() : new AuthenticationError("unauthorized"); },
        getAllFavorTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({}).exec() : new AuthenticationError("unauthorized"); },
        getAllOwnerFavorTransactionByStatus: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({status: JESTA_TRANSACTION_STATUS[args.status], ownerId: context.sub}).exec() : new AuthenticationError("unauthorized"); },
        getAllExecutorFavorTransactionByStatus: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({status: JESTA_TRANSACTION_STATUS[args.status], handledByUserId: context.sub}).exec() : new AuthenticationError("unauthorized"); },
        getAllUserFavorsRequestedTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ handledByUserId : context.sub }).populate("handledByUserId favorId favorOwnerId").exec() : new AuthenticationError("unauthorized"); },
        getAllUserFavorsWaitingForHandleTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ ownerId : context.sub, status : JESTA_TRANSACTION_STATUS.WAITING}).exec(): new AuthenticationError("unauthorized"); },
    },
    Mutation: {
        createFavorTransactionRequest: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.createRequest(args, context): new AuthenticationError("unauthorized"); },
        handleFavorTransactionRequest: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.handleRequestApproved(args, context): new AuthenticationError("unauthorized"); },
        cancelFavorTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.handleRequestCanceled(args, context): new AuthenticationError("unauthorized"); },
        executorNotifyDoneFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.executorNotifyDoneFavor(args, context): new AuthenticationError("unauthorized"); },
        ownerNotifyJestaHasBeenDone: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.ownerNotifyJestaHasBeenDone(args, context): new AuthenticationError("unauthorized"); }, //TODO: handle rate
    }
}
