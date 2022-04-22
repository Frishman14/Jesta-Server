const cron = require('node-cron');
const logger = require("../logger");

exports.start = (everyDayServices, every15minServices) => {
    everyDayServices.forEach(service => service.run())
    every15minServices.forEach(service => service.run())

    cron.schedule('0 23 * * *', function(){
        logger.info('running the everyDayServices');
        everyDayServices.forEach(service => service.run())
    });

    cron.schedule('*/15 * * * *', function(){
        logger.info('running the every15minServices');
        every15minServices.forEach(service => service.run())
    });
}