const UserGraph = require("../Models/UserGraph");
const JestaGraph = require("../Models/favors/JestaGraph");

exports.getNumOfCreatedUsers = async () => {
    const graphData = {
        labels: [],
        dataSets: []
    }
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let day = today.getDate();

    for (let i = 0; i < 30; i++) {
        let date = new Date(year, month, day - i);
        let localDate = date.toLocaleDateString();
        graphData.labels.push(localDate);
        let doc = await UserGraph.findOne({creationDate: localDate}).exec();
        let numberOfCreated = doc === null ? 0 : doc.numberOfCreated;
        graphData.dataSets.push(numberOfCreated);
    }
    return graphData;
}

exports.getNumOfCreatedJesta = async () => {
    const graphData = {
        labels: [],
        dataSets: []
    }
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let day = today.getDate();

    for (let i = 0; i < 30; i++) {
        let date = new Date(year, month, day - i);
        let localDate = date.toLocaleDateString();
        graphData.labels.push(localDate);
        let doc = await JestaGraph.findOne({creationDate: localDate}).exec();
        let numberOfCreated = doc === null ? 0 : doc.numberOfCreated;
        graphData.dataSets.push(numberOfCreated);
    }
    return graphData;
}
