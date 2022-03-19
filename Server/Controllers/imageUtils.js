const { finished } = require("stream/promises");

exports.uploadFile = async (file, fullPath, dirPath) => {
    let { createReadStream, filename } = await file;
    let stream = createReadStream();
    let fullFileName =  new Date().getTime() + filename
    let out = require('fs').createWriteStream(fullPath + fullFileName);
    stream.pipe(out);
    await finished(out);
    return dirPath + fullFileName;
}