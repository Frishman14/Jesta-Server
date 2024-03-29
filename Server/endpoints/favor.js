const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const Favor = require("../Models/favors/Favor");
const favorController = require("../Controllers/favorController");
const { GraphQLUpload } = require('graphql-upload');
const startOfDay = require("date-fns/startOfDay");
const endOfDay = require("date-fns/endOfDay");
const favorTransaction = require("../Models/favors/FavorTransactions");
const {JESTA_TRANSACTION_STATUS} = require("../Models/Common/consts");

exports.favorTypeDefs = gql`
                    scalar DateTime
                    scalar Upload
                    input CoordinatesInput {
                        coordinates: [Float]
                    }
                    type Coordinates {
                        coordinates: [Float]
                    }
                    type Address {
                        fullAddress: String
                        location: Coordinates
                    }
                    input AddressInput {
                        fullAddress: String
                        location: CoordinatesInput
                    }
                    type PopulatedFavor{
                        _id: String!
                        status: String!
                        ownerId: User
                        categoryId: [Category]
                        numOfPeopleNeeded: Int!
                        sourceAddress: Address
                        destinationAddress: Address
                        description: String
                        imagesPath: [String]
                        paymentAmount: Float
                        paymentMethod: String
                        dateToPublish: DateTime
                        dateToExecute: DateTime
                        dateToFinishExecute: DateTime
                        dateLockedOut: DateTime
                        dateCreated: DateTime
                        dateLastModified: DateTime
                    }
                    type Favor {
                        _id: String!
                        status: String!
                        ownerId: String!
                        categoryId: [String!]!
                        numOfPeopleNeeded: Int!
                        sourceAddress: Address
                        destinationAddress: Address
                        description: String
                        imagesPath: [String]
                        paymentAmount: Float
                        paymentMethod: String
                        dateToPublish: DateTime
                        dateToExecute: DateTime
                        dateToFinishExecute: DateTime
                        dateLockedOut: DateTime
                        dateCreated: DateTime
                        dateLastModified: DateTime
                        mostVolunteeredOwner: Boolean
                    }
                    enum PaymentType {
                        PAYPAL
                        FREE
                        CASH
                    }
                    enum FavorStatus{
                        Available
                        Unavailable
                    }
                    input FavorInput {
                        ownerId: String!
                        categoryId: [String!]!
                        numOfPeopleNeeded: Int
                        sourceAddress: AddressInput!
                        destinationAddress: AddressInput
                        description: String
                        paymentAmount: Float
                        paymentMethod: PaymentType!
                        dateToPublish: DateTime
                        dateToExecute: DateTime
                        dateToFinishExecute: DateTime
                        dateLockedOut: DateTime
                    }
                    input UpdateFavorInput {
                        categoryId: [String!]
                        numOfPeopleNeeded: Int
                        sourceAddress: AddressInput
                        destinationAddress: AddressInput
                        description: String
                        paymentAmount: Float
                        paymentMethod: PaymentType
                        dateToPublish: DateTime
                        dateToExecute: DateTime
                        dateToFinishExecute: DateTime
                        dateLockedOut: DateTime
                    }
                    type Query {
                        getFavor(favorId: String): PopulatedFavor
                        getFavorsByDate(startingDate: DateTime, limitDate: DateTime): [Favor]
                        getAllFavors: [Favor]
                        getFavorsInRadios(center: [Float], radius: Float): [Favor]
                        getByRadiosAndDateAndOnlyAvailable(center: [Float], radius: Float, startingDate: DateTime, limitDate: DateTime, notIncludeMe: Boolean): [Favor]
                        gatAllFavorsByStatus(status: FavorStatus): [Favor]
                        getAllUserFavors: [Favor]
                        getNumberOfRequestedJesta: Int
                    }
                    type Mutation {
                        createFavor(favor: FavorInput, images: [Upload]): Favor
                        deleteFavor(favorId: String): String
                        updateFavor(favorId: String, updatedFavor: UpdateFavorInput, newImages: [Upload]): String
                    }
                    `;

exports.favorResolvers = {
    Upload: GraphQLUpload,
    Query: {
        getFavor: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.findById(args.favorId).populate("ownerId categoryId").exec(): new AuthenticationError("unauthorized"); },
        getFavorsByDate: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.find({dateToPublish: {$gte: startOfDay(new Date(args["startingDate"]) - 24*60*60*1000)}, dateToExecute: {$lte: endOfDay(new Date(args["limitDate"]))}}).exec(): new AuthenticationError("unauthorized"); },
        getAllFavors: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.find({}).exec(): new AuthenticationError("unauthorized"); },
        getAllUserFavors: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.find({ownerId: context.sub}).exec(): new AuthenticationError("unauthorized"); },
        gatAllFavorsByStatus: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.find({_id:args.favorId,status:args.status}).exec(): new AuthenticationError("unauthorized"); },
        getFavorsInRadios: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.findByRadios(args): new AuthenticationError("unauthorized"); }, // returns by sourceAddress
        getByRadiosAndDateAndOnlyAvailable: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.findByRadiosAndDateAndOnlyAvailable(args, context): new AuthenticationError("unauthorized"); }, // returns by sourceAddress
        getNumberOfRequestedJesta: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.find({ status : "Available" }).count().exec(): new AuthenticationError("unauthorized"); },
    },
    Mutation: {
        createFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.createOne(args): new AuthenticationError("unauthorized"); },
        deleteFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.deleteOne(args, context): new AuthenticationError("unauthorized"); },
        updateFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.updateOne(args, context): new AuthenticationError("unauthorized"); },
    }
}
