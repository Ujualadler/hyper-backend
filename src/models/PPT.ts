import mongoose, { Document, Schema } from "mongoose";

// Define the interface for an item
interface IItem {
  title: string;
  description?: string;
  ppt: string;
  thumbnail?: string;
  _id?: string;
}

// Define the document type
export type PPTDocument = Document & {
  title: string;
  items: IItem[];
  priority: number;
};

// Define the schema for items (subdocument schema)
const ItemSchema = new Schema<IItem>({
  title: { type: String, required: true },
  description: { type: String, required: false },
  ppt: { type: String, required: true },
  thumbnail: { type: String, required: false },
});

// Define the main PPT schema
const PPTSchema = new Schema<PPTDocument>(
  {
    title: { type: String, required: true },
    items: { type: [ItemSchema], default: [] }, // Use the subdocument schema for items
    priority: { type: Number }
  },
  { collection: "PPT" } // Collection name
);

// Create and export the model
const PPT = mongoose.model<PPTDocument>("PPT", PPTSchema);

export default PPT;
