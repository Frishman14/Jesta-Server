const cron = require('node-cron');
const logger = require("../logger");

exports.start = (args) => {
    args["everyDayServices"].forEach(service => service.run())
    args["every15minServices"].forEach(service => service.run())

    cron.schedule('0 16 * * *', function(){
        logger.info('running the everyDayServices');
        args["everyDayServices"].forEach(service => service.run())
    });

    cron.schedule('*/15 * * * *', function(){
        logger.info('running the every15minServices');
        args["every15minServices"].forEach(service => service.run())
    });
}