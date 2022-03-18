const User = require("../Models/User");
const { isAuthenticated } = require("../middlewares/authorize")
const { gql, AuthenticationError } = require("apollo-server-express");
const { ROLES } = require('../Models/Common/consts');
const { createOne, deleteOne, updateOne, connect } = require("../Controllers/userController");
const { GraphQLUpload } = require('graphql-upload');

exports.userTypeDefs = gql`
                    scalar DateTime
                    scalar Upload
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
                    input UserCreateInput {
                        firstName: String!
                        lastName: String!
                        birthday: String
                        email: String!
                        hashedPassword: String!
                        phone: String
                        country: String
                        city: String
                        street: String
                        imagePath: Upload
                        houseNumber: Int
                        longitude: Float
                        altitude: Float
                    }
                    input UserUpdateInput {
                        firstName: String
                        lastName: String
                        birthday: String
                        email: String
                        hashedPassword: String
                        phone: String
                        country: String
                        city: String
                        street: String
                        houseNumber: Int
                        longitude: Float
                        altitude: Float
                    }
                    type JWT {
                        token: String,
                        userId: String,
                    }
                    type Query {
                        getAllUsers: [User]
                        getUser(_id: String, firstName: String, lastName: String, email: String): User
                    }
                    type Mutation {
                        signUpUser(userParams: UserCreateInput, file: Upload): JWT
                        signUpAdmin(userParams: UserCreateInput, file: Upload): JWT
                        deleteUser(_id: String, email: String): String
                        updateUser(_id: String, email: String, updatedUser: UserUpdateInput): String
                        connectUser(email: String!, password: String!): JWT
                    }
                    `;

exports.userResolvers = {
    Upload: GraphQLUpload,
    Query: {
        getAllUsers: async (parent, args, context) => { return isAuthenticated(context) ? await User.find({}).exec(): new AuthenticationError("unauthorized"); },
        getUser: async (parent, filterArgs, context) =>  { return isAuthenticated(context) ? await User.findOne(filterArgs).exec(): new AuthenticationError("unauthorized"); },
    },
    Mutation: {
        signUpUser: (parent, args) => createOne(args),
        deleteUser: (parent, args, context) => isAuthenticated(context) ? deleteOne(args) : new AuthenticationError("unauthorized"),
        updateUser: (parent, args, context) => isAuthenticated(context) ? updateOne(args) : new AuthenticationError("unauthorized"),
        connectUser: async (parent, args) => { console.log(await connect(args)); return await connect(args) },
        signUpAdmin: (parent, args, context) => isAuthenticated(context, ROLES.ADMIN) ? createOne(args, true) : new AuthenticationError("unauthorized"),
        // TODO: add get num of users
    }
}