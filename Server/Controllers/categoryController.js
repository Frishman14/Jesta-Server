const logger = require("../logger");
const Category = require("../Models/favors/Category");
const { ErrorId } = require("../utilities/error-id");
const {errorDuplicateKeyHandler} = require("./errorHandlers");

exports.getOne = async (params) => {
    if (params["id"] === undefined && params["name"] === undefined)
        return new Error(ErrorId.MissingParameters);
    let filter = params["id"] === undefined ? {name: params["name"]} : {"_id":params["id"]};
    return await Category.findOne(filter).exec();
}

exports.createOne = async (categoryName) => {
    let category = new Category(categoryName)
    return await category.save().then((savedCategory) => {
        logger.debug("created new category " + savedCategory.name);
        return savedCategory.populate("parentCategory");
    }).catch(error => {
        logger.debug("error in creating new category " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.updateOne = async (params) => {
    if (!params.nameToChange)
        return new Error(ErrorId.MissingParameters);
    return await Category.updateOne({name: params.nameToChange}, {name: params.changedName, parentCategory: params["newParentCategoryId"]}, {runValidators: true}).then((category) => {
        if (!category.acknowledged) {
            return new Error(ErrorId.NotExists);
        }
        logger.debug("updated category " + params.email);
        return "success";
    }).catch((error) => {
        logger.error("failed to update user " + error)
        return new Error(errorDuplicateKeyHandler(error))
    });
}

exports.deleteOne = async (params) => {
    if (!params.name && !params._id)
        return new Error(ErrorId.MissingParameters);
    return await Category.deleteOne(params).then(deletedCategory => {
        if (deletedCategory.deletedCount === 0){
            logger.debug("category is not exist");
            return new Error(ErrorId.NotExists);
        }
        logger.debug("deleted category ")
        return "success";
    })
};