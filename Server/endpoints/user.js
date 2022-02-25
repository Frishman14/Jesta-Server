const User = require("../Models/User");
const { isAuthenticated } = require("../middlewares/authorize")
const { gql, AuthenticationError } = require("apollo-server-express");
const { ROLES } = require('../Models/Common/consts');
const { createOne, deleteOne, updateOne, connect } = require("../Controllers/userController");

exports.typeDefs = gql`
                    scalar DateTime
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
                        imagePath: String
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
                        imagePath: String
                    }
                    type JWT {
                        token: String
                    }
                    type Query {
                        getUsers: [User]
                        getUser(_id: String, firstName: String, lastName: String, email: String): User
                    }
                    type Mutation {
                        signUp(userParams: UserCreateInput): JWT
                        deleteUser(_id: String, email: String): String
                        updateUser(_id: String, email: String, updatedUser: UserUpdateInput): String
                        connect(email: String, password: String): JWT
                    }
                    `;

exports.resolvers = {
    Query: {
        getUsers: async (parent, args, context, info) => { return isAuthenticated(context, ROLES.ADMIN) === true ? await User.find({}).exec(): new AuthenticationError("unauthorized"); },
        getUser: async (parent, args, context, info) =>  await User.findOne(args).exec(),
    },
    Mutation: {
        signUp: (parent, args, context, info) => createOne(args),
        deleteUser: (parent, args, context, info) => isAuthenticated(context, ROLES.CLIENT) === true ? deleteOne(args) : new AuthenticationError("unauthorized"),
        updateUser: (parent, args, context, info) => isAuthenticated(context, ROLES.CLIENT) === true ? updateOne(args) : new AuthenticationError("unauthorized"),
        connect: (parent, args, context, info) => connect(args),
        // TODO: read about subscription - today *
        // TODO: add hash to password
        // TODO: add tests - tomorrow
        // TODO: add watson logger - tomorrow
        // TODO: think how to DRY auth
    }
}