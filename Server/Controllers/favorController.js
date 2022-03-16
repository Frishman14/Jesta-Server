const logger = require("../logger");
const Favor = require("../Models/favors/Favor");
const {errorDuplicateKeyHandler} = require("./errorHandlers");

exports.createOne = async (args) => {
    let favor = new Favor(args.favor)
    return await favor.save().then((savedFavor) => {
        logger.debug("created new favor " + savedFavor._id);
        return savedFavor;
    }).catch(error => {
        logger.debug("error in creating new favor " + error);
        return new Error(errorDuplicateKeyHandler(error))
    })
}
