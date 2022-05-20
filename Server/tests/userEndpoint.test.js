const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestCategory'
mongoose.connect(mongoDB)
const User = require('../Models/User');
const {ApolloServer} = require("apollo-server-express");
const {userTypeDefs, userResolvers} = require("../endpoints/user");
const {validUser} = require("./testUtils");
jest.mock('../middlewares/authorize')

describe("categoryController test", () => {
    let typeDefs = userTypeDefs;
    let resolvers = userResolvers;
    const testServer = new ApolloServer({typeDefs,resolvers});

    beforeAll(async() => {
        await User.deleteMany({})
        await User.create(validUser);

    })

    beforeEach( async() => {
    })

    afterAll(async() => {
        await mongoose.connection.close()
    })

    it("has a module", () => {
    })

    test("getAllUsers test", async () => {
        const result = await testServer.executeOperation({
            query: 'query GetAllUsers {\n' +
                '  getAllUsers {\n' +
                '    birthday\n' +
                '    description\n' +
                '  }\n' +
                '}'
        });
        expect(result.data.getAllUsers).toHaveLength(1)
    })
})

