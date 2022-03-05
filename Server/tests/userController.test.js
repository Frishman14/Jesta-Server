const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestJesta'
mongoose.connect(mongoDB)
const User = require('../Models/User')
const { createOne, connect, deleteOne, updateOne} = require('../Controllers/userController');
const {ROLES} = require("../Models/Common/consts");

const mockUserDetails = {
    userParams: {
        firstName: "mock",
        lastName: "mocky",
        birthday: "Fri Feb 25 1995 16:22:50 GMT+0200 (Israel Standard Time)",
        email: "test@example.com",
        hashedPassword: "aA123456",
        country: "Israel",
        city: "Givatayim",
        street: "Ben-Zvi",
    },
    validUser: {
        firstName: "mock",
        lastName: "mocky",
        birthday: "Fri Feb 25 1995 16:22:50 GMT+0200 (Israel Standard Time)",
        email: "test@example.com",
        hashedPassword: "aA123456",
        address: {
            country: "Israel",
            city: "Givatayim",
            street: "Ben-Zvi",
        }
    }

}
describe("User model test", () => {
    beforeAll(async() => {
        await User.deleteMany({})
    })

    afterEach(async() => {
        await User.deleteMany({})
    })

    afterAll(async() => {
        await mongoose.connection.close()
    })

    it("has a module", () => {
        expect(User).toBeDefined();
    })

    test("createOne return token", async () => {
        const mockUser = JSON.parse(JSON.stringify(mockUserDetails))
        let createOneFunction = await createOne(mockUser)
        expect(createOneFunction.token).toBeDefined()
    })

    test("createOne Admin return token", async () => {
        const mockUser = JSON.parse(JSON.stringify(mockUserDetails))
        let createOneFunction = await createOne(mockUser, true)
        expect(createOneFunction.token).toBeDefined()
        User.findOne({email : mockUserDetails.validUser.email}, function(err, user){
            expect(user.role).toBe(ROLES.ADMIN)
        })
    })

    test("createOne return alreadyExist error", async () => {
        const mockUser = JSON.parse(JSON.stringify(mockUserDetails))
        const secondMockUser = JSON.parse(JSON.stringify(mockUserDetails))
        await createOne(mockUser) // create the first user
        let createTheSameOneFunction = await createOne(secondMockUser) // create the dup user
        expect(createTheSameOneFunction).toBeInstanceOf(Error)
    })

    test("deleteOne return error user is not exist", async () => {
        const mockUser = JSON.parse(JSON.stringify(mockUserDetails.validUser))
        expect(await deleteOne(mockUserDetails.userParams)).toBeInstanceOf(Error)
    })

    test("deleteOne return success message", async () => {
        await new User(mockUserDetails.validUser).save()
        const actualResult = await deleteOne({email : mockUserDetails.userParams.email});
        expect(actualResult).toBe("success")
    })

    test("deleteOne return error message need id or email", async () => {
        await new User(mockUserDetails.validUser).save()
        const actualResult = await deleteOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("updateOne return success", async () => {
        await new User(mockUserDetails.validUser).save()
        const updatedUser = JSON.parse(JSON.stringify(mockUserDetails.validUser));
        updatedUser.firstName = "newName"
        const actualResult = await updateOne({email: mockUserDetails.validUser.email, updatedUser : updatedUser});
        await User.findOne({email: mockUserDetails.validUser.email}, function(err, user){
            expect(user.firstName).toBe("newName")
        }).clone().catch(function(err){ console.log(err)})
        expect(actualResult).toBe("success")
    })

    test("updateOne return error message need id or email", async () => {
        const actualResult = await updateOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("updateOne return error user is not exist", async () => {
        const actualResult = await updateOne({email: "notexist@gmail.com"});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("updateOne return error duplicate mail", async () => {
        const mockUser = JSON.parse(JSON.stringify(mockUserDetails.validUser));
        const secondMockUser = JSON.parse(JSON.stringify(mockUserDetails.validUser));
        secondMockUser.email = "t@t.com"
        await new User(mockUser).save()
        await new User(secondMockUser).save()
        const actualResult = await updateOne({email: secondMockUser.email, updatedUser : {email : mockUser.email}});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("connect return error missing args", async () => {
        const actualResult = await connect({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("connect return error user is not exist", async () => {
        const actualResult = await connect({email: "a@a.com", password: "123456"});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("connect return token success", async () => {
        await new User(mockUserDetails.validUser).save()
        const actualResult = await connect({email: mockUserDetails.validUser.email, password: mockUserDetails.validUser.hashedPassword});
        expect(actualResult.token).toBeDefined()
    })

    test("connect return parameter is wrong error", async () => {
        await new User(mockUserDetails.validUser).save()
        const actualResult = await connect({email: mockUserDetails.validUser.email, password: "123456"});
        expect(actualResult).toBeInstanceOf(Error)
    })

})