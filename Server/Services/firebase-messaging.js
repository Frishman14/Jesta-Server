const logger = require("../logger");
const {getMessaging} = require("firebase-admin/messaging");

exports.sentToOneUserMessage = (token, message, priorityRank) => {
    getMessaging().sendToDevice(token, message, {priority: priorityRank})
        .then((response) => {
            // Response is a message ID string.
            logger.debug('Successfully sent message:', response);
        })
        .catch((error) => {
            logger.error('Error sending message:', error);
        });
}