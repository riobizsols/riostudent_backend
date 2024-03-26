import { model, Schema, Model, Document, Types, models } from 'mongoose';
import collectionNames from "../Constant/collections";
import { SessionParams } from '../Type'
export interface IMLoginLogs extends Document {
    userId: Types.ObjectId | string,
    token: string,
    ip: string,
    userAgent: string,
    loggedIn: Date | string | number,
    loggedOut: Date | string | number | null,
    device: string
}

const LoginLogSchema: Schema = new Schema({
    userId: {
        type: Types.ObjectId,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    userType: {
        type: Number,
        required: true
    },
    token: { // auth token
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        default: null
    },
    loggedIn: {
        type: Date,
        default: Date.now,
    },
    loggedOut: {
        type: Date,
        default: null,
    },
    device: {
        type: String,
        default: null
    }
});
const MLoginLog: Model<IMLoginLogs> = models[collectionNames.LOGIN_LOG] || model(collectionNames.LOGIN_LOG, LoginLogSchema);
export default MLoginLog
