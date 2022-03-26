const logger = require("../logger");
const Category = require("../Models/favors/Category");
const {errorDuplicateKeyHandler} = require("./errorHandlers");

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
        return new Error("must get category name");
    return await Category.updateOne({name: params.nameToChange}, {name: params.changedName, parentCategory: params["newParentCategoryId"]}, {runValidators: true}).then((category) => {
        if (!category.acknowledged) {
            return new Error("category is not found");
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