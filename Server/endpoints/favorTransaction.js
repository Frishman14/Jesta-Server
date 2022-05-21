const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const favorTransactionController = require("../Controllers/favorTransactionController");
const {JESTA_TRANSACTION_STATUS} = require("../Models/Common/consts");
const favorTransaction = require("../Models/favors/FavorTransactions");
const { GraphQLUpload } = require('graphql-upload');
const {getFavorTransactionByStatusAndHandlerOrExecutorAndDate} = require("../Controllers/favorTransactionController");

exports.favorTransactionTypeDefs = gql`
                    scalar DateTime
                    enum FavorTransactionStatus {
                        PENDING_FOR_OWNER
                        WAITING_FOR_JESTA_EXECUTION_TIME
                        EXECUTOR_FINISH_JESTA
                        JESTA_DONE
                        CANCELED
                        CLOSED
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
                        rating: Float
                    }
                    type PopulatedFavorTransaction {
                        _id: String!
                        status: String!
                        favorId: Favor
                        favorOwnerId: User!
                        handledByUserId: User!
                        ownerComment: String
                        handlerComment: String
                        dateAccepted: DateTime
                        dateCompleted: DateTime
                        dateCreated: DateTime
                        dateLastModified: DateTime
                        rating: Float
                    }
                    type Query {
                        getAllFavorTransactionByFavorIdWhenOwner(favorId: String!): [PopulatedFavorTransaction]
                        getAllUserFavorTransactionByFavorId(favorId: String!): FavorTransaction
                        getAllFavorTransaction: [FavorTransaction]
                        getAllUserFavorsRequestedTransaction: [PopulatedFavorTransaction]
                        getAllUserFavorsWaitingForHandleTransaction: [FavorTransaction]
                        getAllOwnerFavorTransactionByStatus(status: FavorTransactionStatus, fromDate: DateTime): [PopulatedFavorTransaction]
                        getAllExecutorFavorTransactionByStatus(status: FavorTransactionStatus, fromDate: DateTime): [PopulatedFavorTransaction]
                        getNumberOfOnProgressJesta: Int
                        getNumberOfExecutedJesta: Int
                        getTransactionById(id: String): PopulatedFavorTransaction
                        getAllUserHandledFavorTransactionByStatus(status: FavorTransactionStatus, handledByUserId: String): [FavorTransaction]
                    }
                    type Mutation {
                        createFavorTransactionRequest(favorId: String!, comment: String): String
                        handleFavorTransactionRequest(favorTransactionId: String!, comment: String): String
                        cancelFavorTransaction(favorTransactionId: String!): String
                        executorNotifyDoneFavor(favorTransactionId: String!): String
                        ownerNotifyJestaHasBeenDone(favorTransactionId: String!, rate: Int, handlerComment: String): String
                        userChangeJestaTransactionToClosed(favorTransactionId: String!): String
                        rateTransactionWithOptionalComment(favorTransactionId: String!, rate: Int, handlerComment: String): String
                    }
                    `;

exports.favorTransactionResolvers = {
    Upload: GraphQLUpload,
    Query: {
        getAllFavorTransactionByFavorIdWhenOwner: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({"favorId": args.favorId, "favorOwnerId": context.sub}).populate("handledByUserId favorId favorOwnerId").exec() : new AuthenticationError("unauthorized"); },
        getAllUserFavorTransactionByFavorId: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.findOne({"favorId": args.favorId, "handledByUserId": context.sub}).exec() : new AuthenticationError("unauthorized"); },
        getAllUserHandledFavorTransactionByStatus: async (parent, args, context) => { return isAuthenticated(context) ?await favorTransaction.find({ handledByUserId : args.handledByUserId , status : args.status }).populate("handledByUserId").exec(): new AuthenticationError("unauthorized"); },
        getAllFavorTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({}).exec() : new AuthenticationError("unauthorized"); },
        getAllOwnerFavorTransactionByStatus: async (parent, args, context) => { return isAuthenticated(context) ? await getFavorTransactionByStatusAndHandlerOrExecutorAndDate(true,args,context) : new AuthenticationError("unauthorized"); },
        getAllExecutorFavorTransactionByStatus: async (parent, args, context) => { return isAuthenticated(context) ? await getFavorTransactionByStatusAndHandlerOrExecutorAndDate(false,args,context) : new AuthenticationError("unauthorized"); },
        getAllUserFavorsRequestedTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ handledByUserId : context.sub }).populate("handledByUserId favorId favorOwnerId").exec() : new AuthenticationError("unauthorized"); },
        getAllUserFavorsWaitingForHandleTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ ownerId : context.sub, status : JESTA_TRANSACTION_STATUS.WAITING }).exec(): new AuthenticationError("unauthorized"); },
        getNumberOfOnProgressJesta: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ status : JESTA_TRANSACTION_STATUS.WAITING_FOR_JESTA_EXECUTION_TIME }).count().exec(): new AuthenticationError("unauthorized"); },
        getNumberOfExecutedJesta: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransaction.find({ status : JESTA_TRANSACTION_STATUS.JESTA_DONE }).count().exec(): new AuthenticationError("unauthorized"); },
        getTransactionById: async (parent, args, context) => {return isAuthenticated(context) ? await favorTransaction.findById(args["id"]).populate("handledByUserId favorId favorOwnerId").exec(): new AuthenticationError("unauthorized");}
    },
    Mutation: {
        createFavorTransactionRequest: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.createRequest(args, context): new AuthenticationError("unauthorized"); },
        handleFavorTransactionRequest: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.handleRequestApproved(args, context): new AuthenticationError("unauthorized"); },
        cancelFavorTransaction: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.handleRequestCanceled(args, context): new AuthenticationError("unauthorized"); },
        executorNotifyDoneFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.executorNotifyDoneFavor(args, context): new AuthenticationError("unauthorized"); },
        ownerNotifyJestaHasBeenDone: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.ownerNotifyJestaHasBeenDone(args, context): new AuthenticationError("unauthorized"); },
        userChangeJestaTransactionToClosed: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.userChangeJestaTransactionToClosed(args, context): new AuthenticationError("unauthorized"); },
        rateTransactionWithOptionalComment: async (parent, args, context) => { return isAuthenticated(context) ? await favorTransactionController.ownerRateJestaAndComment(args, context): new AuthenticationError("unauthorized"); }
    }
}
