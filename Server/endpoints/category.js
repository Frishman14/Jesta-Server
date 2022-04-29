const { isAuthenticated } = require("../middlewares/authorize");
const { gql, AuthenticationError } = require("apollo-server-express");
const Category = require("../Models/favors/Category");
const categoryController = require("../Controllers/categoryController");
const {ROLES} = require("../Models/Common/consts");

exports.categoryTypeDefs = gql`
                    type Category {
                        _id: String!
                        parentCategory: Category
                        name: String
                        dateLastModified: DateTime
                    }
                    type Query {
                        getCategory(name: String, id: String): Category
                        getAllCategories: [Category]
                        getAllParentCategories: [Category]
                    }
                    type Mutation {
                        createCategory(name: String, parentCategory: String): Category
                        updateCategory(nameToChange: String, newParentCategoryId: String, changedName: String): String
                        deleteCategory(name: String): String
                    }
                    `;

exports.categoryResolvers = {
    Query: {
        // categories
        getCategory:  async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.getOne(args): new AuthenticationError("unauthorized"); },
        getAllCategories: async (parent, args, context) => { return isAuthenticated(context) ? await Category.find({}).populate("parentCategory").exec(): new AuthenticationError("unauthorized"); },
        getAllParentCategories: async (parent, args, context) => { return isAuthenticated(context) ? await Category.find({parentCategory: { $ne: null }}).populate("parentCategory").exec(): new AuthenticationError("unauthorized"); },
    },
    Mutation: {
        // categories
        createCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.createOne(args): new AuthenticationError("unauthorized"); },
        updateCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.updateOne(args): new AuthenticationError("unauthorized"); },
        deleteCategory: async (parent, args, context) => { return isAuthenticated(context, ROLES.ADMIN) ? await categoryController.deleteOne(args): new AuthenticationError("unauthorized"); },
    }
}