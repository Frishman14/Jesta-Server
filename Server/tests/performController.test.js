const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestPerform'
mongoose.connect(mongoDB)
const Perform = require('../Models/favors/perform')
const User = require('../Models/User');
const Category = require('../Models/favors/Category');
const { createOne, findByRadios, deleteOne, updateOne} = require('../Controllers/performController');
const { validUser, validCategory, validAddress } = require("./testUtils")

const mockPerformDetails = {
    perform: {
        address: validAddress,
        preferredPaymentMethod: "Cash"
    },
    mockAdminToken: {
        role: "admin"
    }
}
describe("performController test", () => {
    beforeAll(async() => {
        await Perform.deleteMany({})
        await new User(validUser).save();
        await new Category(validCategory).save();
    })

    afterEach(async() => {
        await Perform.deleteMany({})
    })

    afterAll(async() => {
        await User.deleteMany({})
        await Category.deleteMany({})
        await mongoose.connection.close()
    })

    it("has a module", () => {
        expect(Perform).toBeDefined();
    })

    test("createOne return perform", async () => {
        const mockPerform = JSON.parse(JSON.stringify(mockPerformDetails))
        mockPerform.perform.performerId = await returnUserId();
        let createOneFunction = await createOne(mockPerform)
        for (let [key, value] of Object.entries(mockPerform.perform)){
            if(key === "address"){
                expect(createOneFunction[key]).toBeDefined()
            } else {
                expect(createOneFunction[key]).toEqual(value)
            }
        }
    })

    test("deleteOne return error favor is not exist", async () => {
        const mockPerform = JSON.parse(JSON.stringify(mockPerformDetails.perform))
        expect(await deleteOne(mockPerform)).toBeInstanceOf(Error)
    })

    test("deleteOne favor return success message", async () => {
        let performId = await createPerform();
        const actualResult = await deleteOne({performId : performId.toString()}, mockPerformDetails.mockAdminToken);
        expect(actualResult).toBe("success")
    })

    test("deleteOne return error message need favorId", async () => {
        const actualResult = await deleteOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("updateOne return success", async () => {
        const updatedPerform = JSON.parse(JSON.stringify(mockPerformDetails.perform));
        updatedPerform.preferredPaymentMethod = "PayPal"
        let dbPerformId = await createPerform();
        const actualResult = await updateOne({performId: dbPerformId, updatedPerform : updatedPerform}, mockPerformDetails.mockAdminToken);
        await Perform.findOne({_id: dbPerformId}, function(err, perform){
            expect(perform.preferredPaymentMethod).toBe("PayPal")
        }).clone().catch(function(err){ console.log(err)})
        expect(actualResult).toBe("success")
    })

    test("updateOne return error message need id", async () => {
        const actualResult = await updateOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("find by radios success", async () => {
        await createPerform();
        let params = {
            center: validAddress.location.coordinates, radius : 1
        }
        let actualResult = findByRadios(params)
        expect((await actualResult).length).toEqual(1)
    })

    test("find by radios didn't find", async () => {
        await createPerform();
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

    async function createPerform() {
        const mockPerform = JSON.parse(JSON.stringify(mockPerformDetails))
        mockPerform.perform.performerId = await returnUserId();
        let perform = await createOne(mockPerform)
        return perform._id
    }
})

