import mongoose, { Schema, Document } from "mongoose";

// Define an Option interface
interface Option {
  text: string;
  file: string | null; // Store the file URLs or paths
}

// Define a Question interface
interface Question {
  id?: string;
  text: string;
  time: string;
  type: "multipleChoice" | "singleChoice" | "yesNo" | "descriptive";
  mark: number;
  options?: Option[];
  correctAnswer: string | string[];
  file?: string | null; // Store the file URLs or paths
}

// Define the Assessment interface that extends Mongoose's Document
export interface AssessmentDocument extends Document {
  name: string;
  questions: Question[];
  difficulty: string;
  category: "live" | "practice"; // Category of the assessment
  class?: string; // Target class for "student" category
  createdAt: Date;
  updatedAt: Date;
}

// Define the Option Schema
const OptionSchema = new Schema<Option>({
  text: { type: String, required: false },
  file: { type: String, default: null }, // URL or path to the uploaded file
});

// Define the Question Schema
const QuestionSchema = new Schema<Question>({
  text: { type: String, required: true },
  time: { type: String, required: false, default: "5" },
  type: {
    type: String,
    enum: ["multipleChoice", "singleChoice", "yesNo", "descriptive"],
    required: true,
  },
  mark: { type: Number, required: true },
  options: [OptionSchema], // Array of options
  correctAnswer: { type: Schema.Types.Mixed, required: true }, // Can be a string or array of strings
  file: { type: String, default: null }, // URL or path to the uploaded file
});

// Define the Assessment Schema with a reference to the PPT schema
const AssessmentSchema = new Schema<AssessmentDocument>({
  name: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true }, // Array of questions
  category: {
    type: String,
    enum: ["live", "practice"], // Define the categories
    required: true,
  },
  class: {
    type: String,
    required: false,
  },
  difficulty: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create the ASSESSMENT model
export const Assessment = mongoose.model<AssessmentDocument>(
  "ASSESSMENT", // Model name in uppercase
  AssessmentSchema
);
