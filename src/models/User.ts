import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export type UserDocument = Document & {
  userEmail: string;
  userPassword: string;
  userName: string;
  lastLoginTime?: Date;
  isAdmin: boolean;
  googleId?: string;
};

const userSchema = new Schema<UserDocument>(
  {
    userEmail: {
      type: String,
      required: true,
    },
    userPassword: {
      type: String,
      required: false,
    },
    userName: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },
    lastLoginTime: {
      type: Date,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
  },
  {
    collection: "User",
  }
);

export const User = mongoose.model<UserDocument>("User", userSchema);

export default User;