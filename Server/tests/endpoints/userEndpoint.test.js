const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestUser'
mongoose.connect(mongoDB)
const User = require('../../Models/User');
const {ApolloServer} = require("apollo-server-express");
const {userTypeDefs, userResolvers} = require("../../endpoints/user");
const {validUser, validUser2} = require("../testUtils");
const {deepCopy} = require("firebase-admin/lib/utils/deep-copy");
jest.mock('../../middlewares/authorize')

describe("userEndPoints test", () => {
    let typeDefs = userTypeDefs;
    let resolvers = userResolvers;
    const testServer = new ApolloServer({typeDefs,resolvers});

    beforeEach(async() => {
        await User.deleteMany({})
        await User.create(validUser);
    })

    afterAll(async() => {
        await mongoose.connection.close()
    })

    it("getAllUsers test", async () => {
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

    it("getAllUsers test", async () => {
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

    it("getAllClients test", async () => {
        const result = await testServer.executeOperation({
            query: 'query getAllClients {\n' +
                '  getAllClients {\n' +
                '    birthday\n' +
                '    description\n' +
                '  }\n' +
                '}'
        });
        expect(result.data.getAllClients).toHaveLength(1)
    })

    it("getAllAdmins test", async () => {
        const result = await testServer.executeOperation({
            query: 'query getAllAdmins {\n' +
                '  getAllAdmins {\n' +
                '    birthday\n' +
                '    description\n' +
                '  }\n' +
                '}'
        });
        expect(result.data.getAllAdmins).toHaveLength(0)
    })

    it("getThreeMostExecutors test", async () => {
        validUser.numberOfExecutedJesta = 4;
        let user3 = deepCopy(validUser);
        user3.email = "mocky@email.com";
        let user4 = deepCopy(validUser);
        user4.email = "mocky2@email.com";
        await User.create(validUser2);
        await User.create(user3);
        await User.create(user4);

        // total we have 4 user should get only 3
        const result = await testServer.executeOperation({
            query: 'query GetThreeMostExecutors { '+
              'getThreeMostExecutors {' +
                'rating' +
            '} ' +
        '}'
        });
        expect(result.data.getThreeMostExecutors).toHaveLength(3)
    })

    it("getNumOfUsers test", async () => {
        const result = await testServer.executeOperation({
            query: 'query getNumOfUsers {\n' +
                '  getNumOfUsers ' +
                '}'
        });
        expect(result.data.getNumOfUsers).toBe(1)
    })

    it("getUser test", async () => {
        let user = await User.findOne();
        const result = await testServer.executeOperation({
            query: 'query GetUser($id: String) {\n' +
                '  getUser(_id: $id) {\n' +
                '    firstName\n' +
                '  }\n' +
                '}',
            variables: {
                "id": user._id.toString()
            }
        });
        expect(result.data.getUser.firstName).toBe(user.firstName)
    })

    it("signUpUser test", async () => {
        const result = await testServer.executeOperation({
            query: 'mutation SignUpUser($userParams: UserCreateInput, $file: Upload) {\n' +
                '  signUpUser(userParams: $userParams, file: $file) {\n' +
                '    token\n' +
                '    userId\n' +
                '  }\n' +
                '}',
            variables:{
                "userParams": {
                    "firstName": "טליה",
                    "lastName": "פרישמן",
                    "email": "frishman.talya@gmail.com",
                    "hashedPassword": "aA123456"
                },
                "file": null
            }
        });
        expect(result.data.signUpUser.token).toBeDefined();
        expect(result.data.signUpUser.userId).toBeDefined();
    })

    it("deleteUser with Id test", async () => {
        let user = await User.findOne();
        const result = await testServer.executeOperation({
            query: 'mutation DeleteUser($id: String) {\n' +
                '  deleteUser(_id: $id)\n' +
                '}',
            variables:{
                id: user._id.toString()
            }
        });
        expect(result.data.deleteUser).toEqual("success");
    })

    it("deleteUser with email test", async () => {
        let user = await User.findOne();
        const result = await testServer.executeOperation({
            query: 'mutation DeleteUser($email: String) {\n' +
                '  deleteUser(email: $email)\n' +
                '}',
            variables:{
                email: user.email
            }
        });
        expect(result.data.deleteUser).toEqual("success");
    })

    it("deleteUser with email test", async () => {
        let user = await User.findOne();
        const result = await testServer.executeOperation({
            query: 'mutation DeleteUser($email: String) {\n' +
                '  deleteUser(email: $email)\n' +
                '}',
            variables:{
                email: user.email
            }
        });
        expect(result.data.deleteUser).toEqual("success");
    })

    it("updateUser test", async () => {
        const MOCK_LAST_NAME = "mockLastName"
        let user = await User.findOne();
        const result = await testServer.executeOperation({
            query: 'mutation UpdateUser($updatedUser: UserUpdateInput, $id: String) {\n' +
                '  updateUser(updatedUser: $updatedUser, _id: $id)\n' +
                '}',
            variables:{
                id : user._id.toString(),
                updatedUser: { "lastName": MOCK_LAST_NAME }
            }
        });
        let updatedUser = await User.findOne();

        expect(user.lastName).not.toEqual(MOCK_LAST_NAME);
        expect(result.data.updateUser).toEqual("success");
        expect(updatedUser.lastName).toEqual(MOCK_LAST_NAME);
    })

    it("connectUser test", async () => {
        let user = await User.findOne();
        const result = await testServer.executeOperation({
            query: 'mutation ConnectUser($email: String!, $password: String!) {\n' +
                '  connectUser(email: $email, password: $password) {\n' +
                '    token\n' +
                '    userId\n' +
                '  }\n' +
                '}',
            variables:{
                "email": "test@example.com",
                "password": "aA123456",
            }
        });
        expect(result.data.connectUser.token).toBeDefined();
        expect(result.data.connectUser.userId).toEqual(user._id.toString());
    })

    it("signUpAdmin test", async () => {
        const result = await testServer.executeOperation({
            query: 'mutation SignUpAdmin($userParams: UserCreateInput) {\n' +
                '  signUpAdmin(userParams: $userParams) {\n' +
                '    userId\n' +
                '    token\n' +
                '  }\n' +
                '}',
            variables:
                {
                    "userParams": {
                        "firstName": "adminMock",
                        "lastName": "adminMock",
                        "hashedPassword": "aA123456!",
                        "email": "mock@admin.com"
                    }
                }
        });
        expect(result.data.signUpAdmin.token).toBeDefined();
        expect(result.data.signUpAdmin.userId).toBeDefined();
    })

    it("addUserToken test", async () => {
        let user = await User.findOne();
        const result = await testServer.executeOperation({
            query: 'mutation AddUserToken($token: String) {\n' +
                '  addUserToken(token: $token)\n' +
                '}',
            variables:{
                token: "mockToken"
            }
        });
        expect(result.data.addUserToken).toEqual("success");
    })
})

