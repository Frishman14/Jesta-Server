const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const Category = require("../Models/favors/Category");
const Favor = require("../Models/favors/Favor");
const categoryController = require("../Controllers/categoryController");
const favorController = require("../Controllers/favorController");
const { GraphQLUpload } = require('graphql-upload');
const {ROLES} = require("../Models/Common/consts");

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
                        country: String
                        city: String
                        street: String
                        houseNumber: Int
                        location: Coordinates
                    }
                    input AddressInput {
                        country: String
                        city: String
                        street: String
                        houseNumber: Int
                        location: CoordinatesInput
                    }
                    type Favor {
                        _id: String!
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
                        dateToUnpublished: DateTime
                        dateLockedOut: DateTime
                        dateCreated: DateTime
                        dateLastModified: DateTime
                    }
                    enum PaymentType {
                        PAYPAL
                        FREE
                        CASH
                    }
                    input FavorInput {
                        ownerId: String!
                        categoryId: [String!]!
                        numOfPeopleNeeded: Int
                        sourceAddress: AddressInput!
                        destinationAddress: AddressInput
                        description: String!
                        paymentAmount: Float
                        paymentMethod: PaymentType!
                        dateToPublish: DateTime
                        dateToUnpublished: DateTime
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
                        dateToUnpublished: DateTime
                        dateLockedOut: DateTime
                    }
                    type Query {
                        getAllFavors: [Favor]
                        getFavorsInRadios(center: [Float], radius: Float): [Favor] 
                    }
                    type Mutation {
                        createFavor(favor: FavorInput): Favor
                        deleteFavor(favorId: String): String
                        updateFavor(favorId: String, updatedFavor: UpdateFavorInput): String
                    }
                    `;

exports.favorResolvers = {
    Query: {
        getAllFavors: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.find({}).exec(): new AuthenticationError("unauthorized"); },
        getFavorsInRadios: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.findByRadios(args): new AuthenticationError("unauthorized"); }, // returns by sourceAddress
    },
    Mutation: {
        createFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.createOne(args): new AuthenticationError("unauthorized"); }, //TODO: add images
        deleteFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.deleteOne(args, context): new AuthenticationError("unauthorized"); },
        updateFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.updateOne(args, context): new AuthenticationError("unauthorized"); },
    }
}