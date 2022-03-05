const logger = require("../logger");
const Category = require("../Models/favors/Category");
const {errorDuplicateKeyHandler} = require("./errorHandlers");
const User = require("../Models/User");

exports.createOne = async (name) => {
    let category = new Category(name)
    return await category.save().then((savedCategory) => {
        logger.debug("created new category " + savedCategory.name);
        return savedCategory;
    }).catch(error => {
        logger.debug("error in creating new category " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}

exports.updateOne = async (params) => {
    if (!params.nameToChange)
        return new Error("must get category name");
    return await Category.updateOne({name: params.nameToChange}, {name: params.changedName}, {runValidators: true}).then((category) => {
        if (!category.acknowledged) {
            return new Error("category is not found");
        }
        logger.debug("updated user " + params.email);
        return "success";
    }).catch((error) => {
        logger.error("failed to update user " + error)
        return new Error(errorDuplicateKeyHandler(error))
    });
}

exports.deleteOne = async (params) => {
    if (!params.name && !params._id)
        return new Error("must get name or id");
    return await Category.deleteOne(params).then(deletedCategory => {
        if (deletedCategory.deletedCount === 0){
            logger.debug("category is not exist");
            return new Error("category is not exist");
        }
        logger.debug("deleted category ")
        return "success";
    })
};