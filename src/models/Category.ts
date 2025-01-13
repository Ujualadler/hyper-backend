import mongoose, { Document } from "mongoose";

const Schema = mongoose.Schema;

export type categoryDocument = Document & {
  category: string;
  isActive:boolean;
};

const categorySchema = new Schema<categoryDocument>(
  {
    category: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: false,
      default:true
    },

  }
);

export const Category = mongoose.model<categoryDocument>("Category", categorySchema);

export default Category;
