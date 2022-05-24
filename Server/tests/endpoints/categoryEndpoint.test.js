const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestCategoryEndpoint'
mongoose.connect(mongoDB)
const Category = require('../../Models/favors/Category');
const {ApolloServer} = require("apollo-server-express");
const {categoryTypeDefs, categoryResolvers} = require("../../endpoints/category");
const {userTypeDefs, userResolvers} = require("../../endpoints/user");
jest.mock('../../middlewares/authorize')

describe("categoryEndPoints test", () => {
    let typeDefs = [categoryTypeDefs, userTypeDefs];
    let resolvers = [categoryResolvers, userResolvers];
    const testServer = new ApolloServer({typeDefs,resolvers});

    beforeEach(async() => {
        await Category.deleteMany({})
        let parent = await Category.create({name: "parent"});
        await Category.create({name: "son", parentCategory: parent._id.toString()})
    })

    afterAll(async() => {
        await mongoose.connection.close()
    })

    test("getAllCategories test", async () => {
        const result = await testServer.executeOperation({
            query: 'query GetAllCategories {\n' +
                '  getAllCategories {\n' +
                '    _id\n' +
                '    name\n' +
                '    parentCategory {\n' +
                '      name\n' +
                '      dateLastModified\n' +
                '    }\n' +
                '  }\n' +
                '}'
        });
        expect(result.data.getAllCategories).toHaveLength(2)
    })

    test("getCategory test", async () => {
        const result = await testServer.executeOperation({
            query: 'query GetCategory($name: String) {\n' +
                '  getCategory(name: $name) {\n' +
                '    name\n' +
                '    parentCategory {\n' +
                '      name\n' +
                '    }\n' +
                '  }\n' +
                '}',
            variables: {
                name: "son"
            }
        });
        expect(result.data.getCategory.parentCategory.name).toEqual("parent");
    })

    test("getAllParentCategories test", async () => {
        const result = await testServer.executeOperation({
            query: 'query GetAllParentCategories {\n' +
                '  getAllParentCategories {\n' +
                '    name\n' +
                '  }\n' +
                '}',
        });
        expect(result.data.getAllParentCategories).toHaveLength(1);
    })

    test("getAllSubCategoriesByParentCategory test", async () => {
        let category = await Category.findOne({"name": "parent"});
        const result = await testServer.executeOperation({
            query: 'query GetAllSubCategoriesByParentCategory($parentCategoryId: String) {\n' +
                '  getAllSubCategoriesByParentCategory(parentCategoryId: $parentCategoryId) {\n' +
                '    name\n' +
                '  }\n' +
                '}',
            variables: {
                "parentCategoryId": category._id.toString()
            }
        });
        expect(result.data.getAllSubCategoriesByParentCategory).toHaveLength(1);
        expect(result.data.getAllSubCategoriesByParentCategory[0].name).toEqual("son");
    })

    test("createCategory test", async () => {
        const result = await testServer.executeOperation({
            query: 'mutation CreateCategory($name: String) {\n' +
                '  createCategory(name: $name) {\n' +
                '    name\n' +
                '  }\n' +
                '}',
            variables: {
                "name": "mockCategory"
            }
        });
        expect(result.data.createCategory.name).toEqual("mockCategory");
    })

    test("updateCategory test", async () => {
        const result = await testServer.executeOperation({
            query: 'mutation UpdateCategory($changedName: String, $nameToChange: String) {\n' +
                '  updateCategory(changedName: $changedName, nameToChange: $nameToChange)\n' +
                '}',
            variables: {
                "changedName": "son2",
                "nameToChange": "son"
            }
        });
        expect(result.data.updateCategory).toEqual("success");
    })

    test("deleteCategory test", async () => {
        const result = await testServer.executeOperation({
            query: 'mutation DeleteCategory($name: String) {\n' +
                '  deleteCategory(name: $name)\n' +
                '}',
            variables: {
                "name": "son"
            }
        });
        expect(result.data.deleteCategory).toEqual("success");
    })
})

