const mongoose = require('mongoose')
const mongoDB = 'mongodb://localhost/TestCategory'
mongoose.connect(mongoDB)
const Category = require('../../Models/favors/Category');
const { createOne, deleteOne, updateOne} = require('../../Controllers/categoryController');

const mockCategoryDetails = {
    category : {
        name: "mockCategory"
    }
}
describe("categoryController test", () => {
    beforeAll(async() => {
        await Category.deleteMany({})
    })

    afterEach(async() => {
        await Category.deleteMany({})
    })

    afterAll(async() => {
        await mongoose.connection.close()
    })

    it("has a module", () => {
        expect(Category).toBeDefined();
    })

    test("createOne return category", async () => {
        let createOneFunction = await createOne(mockCategoryDetails.category)
        for (let [key, value] of Object.entries(mockCategoryDetails.category)){
                expect(createOneFunction[key]).toEqual(value)
            }
    })

    test("deleteOne return error category is not exist", async () => {
        const mockCategory = JSON.parse(JSON.stringify(mockCategoryDetails.category))
        expect(await deleteOne(mockCategory)).toBeInstanceOf(Error)
    })

    test("deleteOne category return success message", async () => {
        let categoryId = await createCategory();
        const actualResult = await deleteOne({_id : categoryId._id});
        expect(actualResult).toBe("success")
    })

    test("deleteOne return error message need name or _id", async () => {
        const actualResult = await deleteOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    test("updateOne return success", async () => {
        const updatedCategory = JSON.parse(JSON.stringify(mockCategoryDetails.category));
        updatedCategory.name = "mock2"
        let dbCategory = await createCategory();
        const actualResult = await updateOne({nameToChange: dbCategory.name, changedName : "mock2"});
        await Category.findOne({_id: dbCategory._id}, function(err, category){
            expect(category.name).toBe("mock2")
        }).clone().catch(function(err){ console.log(err)})
        expect(actualResult).toBe("success")
    })

    test("updateOne return error message need id", async () => {
        const actualResult = await updateOne({});
        expect(actualResult).toBeInstanceOf(Error)
    })

    async function createCategory() {
        const mockCategory = JSON.parse(JSON.stringify(mockCategoryDetails))
        return await createOne(mockCategory.category)
    }
})

