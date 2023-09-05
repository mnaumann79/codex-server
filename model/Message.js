import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const messageSchema = new Schema({
    role: String,
    content: String
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
