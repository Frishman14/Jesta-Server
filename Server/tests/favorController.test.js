const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestFavorController'
mongoose.connect(mongoDB)
const Favor = require('../Models/favors/Favor')
const User = require('../Models/User');
const Category = require('../Models/favors/Category');
const { createOne, findByRadios, deleteOne, updateOne} = require('../Controllers/favorController');
const { ROLES } = require("../Models/Common/consts");
const { validUser, validCategory, validAddress } = require("./testUtils")

const mockFavorDetails = {
    favor: {
        sourceAddress: validAddress,
        description: "mockFavor"
    },
    mockAdminToken: {
        role: "admin"
    }
}
describe("favorController test", () => {
    beforeAll(async() => {
        await Favor.deleteMany({})
        await new User(validUser).save();
        await new Category(validCategory).save();
    })

    afterEach(async() => {
        await Favor.deleteMany({})
    })

    afterAll(async() => {
        await User.deleteMany({})
        await Category.deleteMany({})
        await mongoose.connection.close()
    })

    it("has a module", () => {
        expect(Favor).toBeDefined();
    })

    test("createOne return favor", async () => {
        const mockFavor = JSON.parse(JSON.stringify(mockFavorDetails))
        mockFavor.favor.ownerId = await returnUserId();
        let createOneFunction = await createOne(mockFavor)
        for (let [key, value] of Object.entries(mockFavor.favor)){
            if(key === "sourceAddress"){
                expect(createOneFunction[key]).toBeDefined()
            } else {
                expect(createOneFunction[key]).toEqual(value)
            }
        }
    })

    test("deleteOne return error favor is not exist", async () => {
        const mockFavor = JSON.parse(JSON.stringify(mockFavorDetails.favor))
        expect(await deleteOne(mockFavor)).toBeInstanceOf(Error)
    })

    test("deleteOne favor return success message", async () => {
        let favorId = await createFavor();
        const actualResult = await deleteOne({favorId : favorId.toString()}, mockFavorDetails.mockAdminToken);
        expect(actualResult).toBe("success")
    })

    test("deleteOne return error message need favorId", async () => {
        const actualResult = await deleteOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("updateOne return success", async () => {
        const updatedFavor = JSON.parse(JSON.stringify(mockFavorDetails.favor));
        updatedFavor.description = "favor2"
        let dbFavorId = await createFavor();
        const actualResult = await updateOne({favorId: dbFavorId, updatedFavor : updatedFavor}, mockFavorDetails.mockAdminToken);
        await Favor.findOne({_id: dbFavorId}, function(err, favor){
            expect(favor.description).toBe("favor2")
        }).clone().catch(function(err){ console.log(err)})
        expect(actualResult).toBe("success")
    })

    test("updateOne return error message need id", async () => {
        const actualResult = await updateOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("find by radios success", async () => {
        await createFavor();
        let params = {
            center: validAddress.location.coordinates, radius : 1
        }
        let actualResult = findByRadios(params)
        expect((await actualResult).length).toEqual(1)
    })

    test("find by radios didn't find", async () => {
        await createFavor();
        let params = {
            center:[55,55], radius : 1
        }
        let actualResult = findByRadios(params)
        expect((await actualResult).length).toEqual(0)
    })

    async function returnUserId() {
        let user = await User.findOne().exec();
        return user._id;
    }

    async function createFavor() {
        const mockFavor = JSON.parse(JSON.stringify(mockFavorDetails))
        mockFavor.favor.ownerId = await returnUserId();
        let favor = await createOne(mockFavor)
        return favor._id
    }
})

