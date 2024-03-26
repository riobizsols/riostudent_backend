import { model, Schema, Model, Document, Types, models } from 'mongoose';
import collectionNames from "../Constant/collections";
import { ActiveStatus, UserType } from '../Constant/index'
export interface IMUser extends Document {
  name: string,
  email: string | null,
  mobile: string | null,
  password: string,
  userType: UserType,
  status: ActiveStatus,
  createdBy: string,
  createdOn: Date | string | number,
  updatedBy: string | null,
  updatedOn: Date | string | number | null,
  mobileVerified: boolean,
  emailVerified: boolean
}



const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    index: true,
    default: null
  },
  mobile: {
    type: String,
    index: true,
    default: null,
    set: (v: string) => {
      v = v.replace('+91', '');
      v = v.replace(/\D+/g, '');
      return `+91${v ? v : ''}`
    }
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: Number,
    enum: Object.values(UserType),
    required: true,
    index: true
  },
  status: {
    type: Number,
    enum: Object.values(ActiveStatus),
    default: ActiveStatus.active,
    index: true
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Types.ObjectId,
  },
  mobileVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  updatedOn: {
    type: Date,
    default: null
  },
  updatedBy: {
    type: Types.ObjectId,
    default: null
  }
});
const MUser: Model<IMUser> = models[collectionNames.USER] || model(collectionNames.USER, UserSchema);
export default MUser
