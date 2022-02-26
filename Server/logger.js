const  { createLogger, format, transports } = require('winston');
const { combine, timestamp } = format;
const config = require('./config');

const enumerateErrorFormat = format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

const logger = createLogger({
    level: config.env === 'development' ? 'debug' : 'info',
    format: combine(
        enumerateErrorFormat(),
        timestamp(),
        config.env === 'development' ? format.colorize() : format.uncolorize(),
        format.splat(),
        format.printf(({timestamp ,level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [
        new transports.Console({
            stderrLevels: ['error'],
        }),
    ],
});

module.exports = logger;