const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const Category = require("../Models/favors/Category");
const categoryController = require("../Controllers/categoryController");
const {ROLES} = require("../Models/Common/consts");

exports.categoryTypeDefs = gql`
                    type Category {
                        _id: String!
                        name: String
                        dateLastModified: DateTime
                    }
                    type Query {
                        getAllCategories: [Category]
                    }
                    type Mutation {
                        createCategory(name: String): Category
                        updateCategory(nameToChange: String, changedName: String): String
                        deleteCategory(name: String): String
                    }
                    `;

exports.categoryResolvers = {
    Query: {
        // categories
        getAllCategories: async (parent, args, context) => { return isAuthenticated(context) ? await Category.find({}).exec(): new AuthenticationError("unauthorized"); },
    },
    Mutation: {
        // categories
        createCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.createOne(args): new AuthenticationError("unauthorized"); },
        updateCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.updateOne(args): new AuthenticationError("unauthorized"); },
        deleteCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.deleteOne(args): new AuthenticationError("unauthorized"); },
    }
}