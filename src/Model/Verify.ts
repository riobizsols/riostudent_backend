import { model, Schema, Model, Document, Types, models } from 'mongoose';
import collectionNames from "../Constant/collections";
import { VerifyRequestType, VerifyType } from '../Constant/index'
export interface IMVerifyLog extends Document {
    userId: Types.ObjectId | string | null,
    type: VerifyType,
    requestType: VerifyRequestType,
    data: {
        otp?: string,
        tokenString?: string
    },
    forceExpiry: boolean,
    createdOn: Date | string | number,
    expiredOn: Date | string | number,
    matchedOn: Date | string | number | null,
}

const VerifyLogSchema: Schema = new Schema({
    userId: {
        type: Types.ObjectId,
        // required: true
        default: null
    },
    type: {
        type: String,
        enum: Object.values(VerifyType),
        required: true
    },
    requestType: {
        type: String,
        enum: Object.values(VerifyRequestType),
        required: true
    },
    data: {
        otp: {
            type: String,
            default: null
        },
        tokenString: { // for Otp , tokenString string treated as a Auth Header
            type: String,
            default: null
        }
    },
    forceExpiry: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
    expiredOn: {
        type: Date,
        required: true
    },
    matchedOn: {
        type: Date,
        default: null,
    }
});
const MVerifyLog: Model<IMVerifyLog> = models[collectionNames.VERIFY_LOG] || model(collectionNames.VERIFY_LOG, VerifyLogSchema);
export default MVerifyLog