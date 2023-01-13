const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
    serverId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    messageContent: {
        type: String,
        required: true
    },
    messageAuthorId: {
        type: String,
        required: true
    },
    messageAuthorDisplayName: {
        type: String,
        required: true
    },
    messageReplierId: {
        type: String,
        required: true
    },
    messageReplierDisplayName: {
        type: String,
        required: true
    },
    messageDate: {
        type: Date,
        required: true
    }
});

messageLogSchema.statics.logArglMessage = async function (arglMessage, originalMessage) {  
    this.create({
        serverId: arglMessage.guildId,
        channelId: arglMessage.channelId,
        messageId: originalMessage.id,
        // If message is just an image, save a link to the image instead of the image itself
        messageContent: originalMessage.content === '' && originalMessage.attachments.size > 0 ? originalMessage.attachments.first().attachment : originalMessage.content,
        messageAuthorId: originalMessage.author.id,
        messageAuthorDisplayName: originalMessage.author.username,
        messageReplierId: arglMessage.author.id,
        messageReplierDisplayName: arglMessage.author.username,
        messageDate: new Date()
    });
}

messageLogSchema.statics.retrieveLog = function() {
    return this.find().sort({ messageDate: -1 });
}

module.exports = mongoose.model('messageLog', messageLogSchema);