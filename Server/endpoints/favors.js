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
                    type Address {
                        country: String
                        city: String
                        street: String
                    }
                    input AddressInput {
                        country: String
                        city: String
                        street: String
                    }
                    type User {
                        _id: String
                        firstName: String!
                        lastName: String!
                        birthday: DateTime
                        email: String!
                        dateEmailVerified: String
                        hashedPassword: String!
                        datePasswordModified: DateTime
                        phone: String
                        address: Address
                        role: String
                        imagePath: String
                        created_date: String
                    }
                    type Favor {
                        _id: String!
                        ownerId: String!
                        categoryId: String!
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
                    type Category {
                        _id: String!
                        name: String
                        dateLastModified: DateTime
                    }
                    type Query {
                        getAllCategories: [Category]
                        getAllFavors: [Favor]
                    }
                    type Mutation {
                        createCategory(name: String): Category
                        updateCategory(nameToChange: String, changedName: String): String
                        deleteCategory(name: String): String
                        createFavor(favor: FavorInput): Favor
                    }
                    `;

exports.favorResolvers = {
    Query: {
        // categories
        getAllCategories: async (parent, args, context) => { return isAuthenticated(context) ? await Category.find({}).exec(): new AuthenticationError("unauthorized"); },

        // favors
        getAllFavors: async (parent, args, context) => { return isAuthenticated(context) ? await Favor.find({}).exec(): new AuthenticationError("unauthorized"); },
    },
    Mutation: {
        // categories
        createCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.createOne(args): new AuthenticationError("unauthorized"); },
        updateCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.updateOne(args): new AuthenticationError("unauthorized"); },
        deleteCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.deleteOne(args): new AuthenticationError("unauthorized"); },

        // favors
        createFavor: async (parent, args, context) => { return isAuthenticated(context) ? await favorController.createOne(args): new AuthenticationError("unauthorized"); }, //TODO: add images

    }
}