const { finished } = require("stream/promises");
const logger = require("../logger");
const fs = require("fs");

exports.uploadFile = async (file, fullPath, dirPath) => {
    let { createReadStream, filename } = await file;
    let stream = createReadStream();
    let fullFileName =  new Date().getTime() + filename
    let out = require('fs').createWriteStream(fullPath + fullFileName);
    stream.pipe(out);
    await finished(out);
    return dirPath + fullFileName;
}

exports.deleteFile = (filePath) => {
    fs.unlink("./data/" + filePath, function (err) {
        if (err) logger.error("failed delete image " + err);
        else logger.debug("succeed delete image");
    });
}