const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestCategory'
mongoose.connect(mongoDB)
const User = require('../Models/User');
const {ApolloServer} = require("apollo-server-express");
const {userTypeDefs, userResolvers} = require("../endpoints/user");
const {validUser} = require("./testUtils");
const r = require('../middlewares/authorize')
r.isAuthenticated = () => true;

describe("categoryController test", () => {
    beforeAll(async() => {
        await User.deleteMany({})
        await User.create(validUser);
        const r = require('../middlewares/authorize')
        r.isAuthenticated = () => true;
    })

    beforeEach( async() => {
    })

    afterAll(async() => {
        await mongoose.connection.close()
    })

    it("has a module", () => {
    })

    test("getAllUsers test", async () => {
        const r = require('../middlewares/authorize')
        r.isAuthenticated = jest.fn().mockReturnValue(true);
        let typeDefs = userTypeDefs;
        let resolvers = userResolvers;
        const testServer = new ApolloServer({typeDefs,resolvers});
        const result = await testServer.executeOperation({
            query: 'query GetAllUsers {\n' +
                '  getAllUsers {\n' +
                '    birthday\n' +
                '    description\n' +
                '  }\n' +
                '}'
        });
        console.log(result.errors)
    })
})

