import { Schema, model, Model, Document } from 'mongoose';
import type { Message } from 'discord.js';

export interface MessageLogDocument extends Document {
    serverId: string;
    channelId: string;
    messageId: string;
    messageContent: string;
    messageAuthorId: string;
    messageAuthorDisplayName: string;
    messageReplierId: string;
    messageReplierDisplayName: string;
    messageDate: Date;
}

export interface MessageLogModel extends Model<MessageLogDocument> {
    logArglMessage(arglMessage: Message, originalMessage: Message): Promise<void>;
    retrieveLog(): Promise<MessageLogDocument[]>;
}

const messageLogSchema = new Schema<MessageLogDocument, MessageLogModel>({
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

messageLogSchema.statics.logArglMessage = async function (arglMessage: Message, originalMessage: Message) {
    this.create({
        serverId: arglMessage.guildId,
        channelId: arglMessage.channelId,
        messageId: originalMessage.id,
        // If message is just an image, save a link to the image instead of the image itself
        messageContent: originalMessage.content === '' && originalMessage.attachments.size > 0 ? originalMessage.attachments.first()!.attachment : originalMessage.content,
        messageAuthorId: originalMessage.author.id,
        messageAuthorDisplayName: originalMessage.author.username,
        messageReplierId: arglMessage.author.id,
        messageReplierDisplayName: arglMessage.author.username,
        messageDate: new Date()
    });
};

messageLogSchema.statics.retrieveLog = function () {
    return this.find().sort({ messageDate: -1 });
};

export default model<MessageLogDocument, MessageLogModel>('messageLog', messageLogSchema);
