import mongoose, { Schema, Document } from "mongoose";
import { FLOAT } from "sequelize";

// Define an interface for each answer submission
interface Answer {

  questionId: string; // Reference to the specific question ID in the assessment
  selectedOptions?: string[]; // Array of selected option texts for multiple/single choice
  descriptiveAnswer?: string; // Text answer for descriptive questions
  yesNoAnswer?: string; // 'yes' or 'no' for yes/no questions
  isCorrect?: boolean; // Track if the answer is correct (for score calculation)
}

// Define the AnswerSubmission interface extending Mongoose's Document
export interface AnswerSubmissionDocument extends Document {
  difficulty:string;
  quizTime:number;
  user: mongoose.Types.ObjectId; // Reference to the User model
  assessment: mongoose.Types.ObjectId; // Reference to the Assessment model
  answers: Answer[]; // Array of individual answers
  totalMarks: number; // Total marks obtained by the user
  totalTime: number; // Total marks obtained by the user
  totalScore: number; // Total marks obtained by the user
  submittedAt: Date; // Date of submission
}

// Define the Answer Schema
const AnswerSchema = new Schema<Answer>({
  questionId: { type: String, required: true },
  selectedOptions: [{ type: String }], // Array of selected option texts
  descriptiveAnswer: { type: String },
  yesNoAnswer: { type: String, enum: ["yes", "no"] },
  isCorrect: { type: Boolean, default: false },
});

// Define the AnswerSubmission Schema
const AnswerSubmissionSchema = new Schema<AnswerSubmissionDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assessment: {
    type: Schema.Types.ObjectId,
    ref: "ASSESSMENT",
    required: true,
  },
  answers: { type: [AnswerSchema], required: true },
  totalTime: { type: Number, defaukt: 0 },
  difficulty: { type: String,required:true},
  quizTime: { type: Number, defaukt: 0 },
  totalMarks: { type: Number, default: 0 }, // Initial score
  totalScore: { type: Number, default: 0 }, // Initial score
  submittedAt: { type: Date, default: Date.now },
});

// Create the AnswerSubmission model
export const Answer = mongoose.model<AnswerSubmissionDocument>(
  "ANSWER",
  AnswerSubmissionSchema
);
