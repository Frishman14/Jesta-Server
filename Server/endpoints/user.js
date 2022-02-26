const User = require("../Models/User");
const { isAuthenticated } = require("../middlewares/authorize")
const { gql, AuthenticationError } = require("apollo-server-express");
const { ROLES } = require('../Models/Common/consts');
const { createOne, deleteOne, updateOne, connect } = require("../Controllers/userController");
const { GraphQLUpload } = require('graphql-upload');

exports.typeDefs = gql`
                    scalar DateTime
                    scalar Upload
                    type Address {
                        country: String
                        city: String
                        street: String
                    }
                    type User {
                        _id: String
                        firstName: String!
                        lastName: String!
                        birthday: DateTime!
                        email: String!
                        dateEmailVerified: String
                        hashedPassword: String!
                        datePasswordModified: DateTime
                        phone: String
                        address: Address!
                        role: String
                        imagePath: String
                        created_date: String
                    }
                    input UserCreateInput {
                        firstName: String!
                        lastName: String!
                        birthday: String!
                        email: String!
                        hashedPassword: String!
                        phone: String
                        country: String!
                        city: String!
                        street: String!
                        imagePath: Upload
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
                    }
                    type JWT {
                        token: String
                    }
                    type Query {
                        getAllUsers: [User]
                        getUser(_id: String, firstName: String, lastName: String, email: String): User
                    }
                    type Mutation {
                        signUpUser(userParams: UserCreateInput, file: Upload): JWT
                        deleteUser(_id: String, email: String): String
                        updateUser(_id: String, email: String, updatedUser: UserUpdateInput): String
                        connectUser(email: String, password: String): JWT
                    }
                    `;

exports.resolvers = {
    Upload: GraphQLUpload,
    Query: {
        getAllUsers: async (parent, args, context) => { return isAuthenticated(context, ROLES.CLIENT) === true ? await User.find({}).exec(): new AuthenticationError("unauthorized"); },
        getUser: async (parent, filterArgs, context) =>  { return isAuthenticated(context, ROLES.CLIENT) === true ? await User.findOne(filterArgs).exec(): new AuthenticationError("unauthorized"); },
    },
    Mutation: {
        signUpUser: (parent, args) => createOne(args),
        deleteUser: (parent, args, context) => isAuthenticated(context, ROLES.CLIENT) === true ? deleteOne(args) : new AuthenticationError("unauthorized"),
        updateUser: (parent, args, context) => isAuthenticated(context, ROLES.CLIENT) === true ? updateOne(args) : new AuthenticationError("unauthorized"),
        connectUser: (parent, args) => connect(args),
        // TODO: read about subscription - today *
        // TODO: think how to DRY auth
        // TODO: add get num of users
    }
}