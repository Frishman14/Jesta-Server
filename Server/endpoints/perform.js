const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const Perform = require("../Models/favors/perform");
const performController = require("../Controllers/performController");
const { GraphQLUpload } = require('graphql-upload');

exports.performTypeDefs = gql`
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
                    type ActivityDays {
                        sunday: Boolean
                        monday: Boolean
                        tuesday: Boolean
                        wednesday: Boolean
                        thursday: Boolean
                        friday: Boolean
                        saturday: Boolean
                    }
                    input InputActivityDays {
                        sunday: Boolean
                        monday: Boolean
                        tuesday: Boolean
                        wednesday: Boolean
                        thursday: Boolean
                        friday: Boolean
                        saturday: Boolean
                    }
                    type Perform {
                        _id: String!
                        performerId: String!
                        categoryId: [String!]!
                        addressPreference: Address
                        minimumPaymentAmount: Float
                        activityDays: ActivityDays
                        activityHoursStart: DateTime
                        address: Address
                        dateCreated: DateTime
                        dateLastModified: DateTime
                        preferredPaymentMethod: PaymentType
                    }
                    enum PaymentType {
                        PAYPAL
                        FREE
                        CASH
                    }
                    input PerformInput {
                        performerId: String!
                        categoryId: [String!]!
                        addressPreference: AddressInput
                        minimumPaymentAmount: Float
                        activityDays: InputActivityDays
                        activityHoursStart: DateTime
                        address: AddressInput
                        dateCreated: DateTime
                        dateLastModified: DateTime
                        preferredPaymentMethod: PaymentType
                    }
                    input UpdatePerformInput {
                        categoryId: [String]
                        addressPreference: AddressInput
                        minimumPaymentAmount: Float
                        activityDays: InputActivityDays
                        activityHoursStart: DateTime
                        address: AddressInput
                        preferredPaymentMethod: PaymentType
                    }
                    type Query {
                        getAllPerforms: [Perform]
                        getPerformsInRadios(center: [Float], radius: Float): [Perform] 
                    }
                    type Mutation {
                        createPerform(perform: PerformInput): Perform
                        deletePerform(performId: String): String
                        updatePerform(performId: String, updatedPerform: UpdatePerformInput): String
                    }
                    `;

exports.performResolvers = {
    Query: {
        getAllPerforms: async (parent, args, context) => { return isAuthenticated(context) ? await Perform.find({}).exec(): new AuthenticationError("unauthorized"); },
        getPerformsInRadios: async (parent, args, context) => { return isAuthenticated(context) ? await performController.findByRadios(args): new AuthenticationError("unauthorized"); }, // returns by sourceAddress
    },
    Mutation: {
        createPerform: async (parent, args, context) => { return isAuthenticated(context) ? await performController.createOne(args): new AuthenticationError("unauthorized"); }, //TODO: add images
        deletePerform: async (parent, args, context) => { return isAuthenticated(context) ? await performController.deleteOne(args, context): new AuthenticationError("unauthorized"); },
        updatePerform: async (parent, args, context) => { return isAuthenticated(context) ? await performController.updateOne(args, context): new AuthenticationError("unauthorized"); },
    }
}