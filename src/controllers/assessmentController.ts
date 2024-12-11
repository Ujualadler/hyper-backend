import { Request, Response } from "express";
import { Assessment } from "../models/Assessment"; // Import your Assessment model
import { Answer } from "../models/Answer"; // Import your Assessment model
import { getFile, uploadAssessment, uploadFile } from "../config/s3";
import { spawn } from "child_process";
import mongoose from "mongoose";
import User from "../models/User";

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const file = files["file"];
    const image = files["image"];
    const optionfile = files["optionsfile"];

    if (file?.length && file[0]) {
      await uploadAssessment(file[0]);
    }

    if (image?.length && image[0]) {
      await uploadAssessment(image[0]);
    }

    if (optionfile?.length) {
      for (let i = 0; i < optionfile.length; i++) {
        if (optionfile[i]) {
          await uploadAssessment(optionfile[i]);
        }
      }
    }

    const {
      questionText,
      questionType,
      questionMark,
      name,
      id,
      category,
      selectedClass,
      correctAnswer,
      options,
      time,
      difficulty,
    } = req.body;

    console.log(req.body);

    // Initialize question object
    const question: any = {
      text: questionText,
      type: questionType,
      time: time,
      mark: parseInt(questionMark, 10),
      correctAnswer: correctAnswer,
      file: file?.[0]?.originalname || null,
    };

    // Only add options if questionType is 'multipleChoice' or 'singleChoice'
    if (questionType === "multipleChoice" || questionType === "singleChoice") {
      question.options = options ? JSON.parse(options) : [];

      // Validate each option to ensure it has a 'text' field
      question.options.forEach((option: any, index: number) => {
        if (!option || !option.text) {
          throw new Error(`Option at index ${index} is missing 'text' field.`);
        }
      });
    }

    let assessment;
    if (id !== "") {
      assessment = await Assessment.findOne({ _id: id });
    }
    if (!assessment) {
      // Create a new assessment if it doesn't exist
      assessment = new Assessment({
        name: name,
        image: image?.[0]?.originalname || null,
        difficulty: difficulty,
        category: category,
        class: selectedClass,
        questions: [question],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await assessment.save();
      return res
        .status(201)
        .json({ message: "Created Successfully", assessment });
    } else {
      // Add the question to the existing assessment
      assessment.questions.push(question);
      assessment.updatedAt = new Date();
      await assessment.save();
      return res
        .status(200)
        .json({ message: "Created Successfully", assessment });
    }
  } catch (error) {
    console.error("Error creating/updating assessment:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getAssessmentFile = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const fileStream = await getFile(`quiz/${key}` as string);
    fileStream?.pipe(res);
  } catch (e) {
    console.log("error while fetching");
  }
};

export const getAllAssessment = async (req: any, res: Response) => {
  try {
    const { id, difficulty } = req.query;
    const category = id;
    const userId = req.user.id; // Get the current user ID

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ _id: userId });

    let data;

    if (user?.isAdmin === true) {
      data = await Assessment.find().select(
        "name category createdAt difficulty image"
      );
    } else {
      const attendedAssessments = await Answer.find({ user: userId }).distinct(
        "assessment"
      );

      console.log(
        "Assessments attended by the current user:",
        attendedAssessments
      );

      let query: any = { _id: { $nin: attendedAssessments } }; // Exclude attended assessments

      // If difficulty is not provided (i.e., it is ''), fetch all assessments.

      if (category !== "all") {
        query.category = category; // Filter by category if provided
      }

      if (difficulty !== "") {
        query.difficulty = difficulty; // Filter by difficulty if provided
      }

      // Fetch data based on the query
      data = await Assessment.find(query).select(
        "name category createdAt difficulty image"
      );
    }

    // Fetch the list of assessments attended by the current user

    console.log("Available Assessments:", data);

    if (data.length > 0) {
      res.status(200).json({ data });
    } else {
      res.status(200).json({ data: [] });
    }
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

export const getAssessmentAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.query; // Extract question and id from the request body
    console.log(id);

    let data = await Assessment.findOne({ _id: id });

    if (data) {
      const { _doc }: any = data;

      const indexedData = _doc?.questions.map(
        (question: any, index: number) => ({
          ...question._doc,
          no: index + 1,
        })
      );

      res.status(200).json({ ..._doc, questions: indexedData });
    } else {
      res.status(200).json({ questions: [] });
    }
    console.log(data);
  } catch (error) {
    console.error("Error creating/updating assessment:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

export const getAssessment = async (req: Request, res: Response) => {
  try {
    const { id, type } = req.query; // Extract question and id from the request query
    console.log(id);

    let data;
    // Fetch the assessment data from the database
    if (type == "normal") {
      data = await Assessment.findOne({ _id: id });
      if (data) {
        if (data.questions && Array.isArray(data.questions)) {
          shuffleArray(data.questions); // Shuffle the questions array
        }
        res.status(200).json(data); // Send shuffled data to the user
      }
    } else if (type === "light") {
      data = await Assessment.findOne({ _id: id }).select(
        "name category difficulty createdAt"
      );
      const token = "ajshkjhasj";
      const user = "ajshkjhasj";
      const refreshToken = "ajshkjhasj";
      const appRedirectUrl = `com.hyper://handleLogin?token=${token}&name=${user}&refreshToken=${refreshToken}`;
      res.redirect(appRedirectUrl);
      //  res.status(200).json(data);
    } else {
      res.status(200).json({ data: [] }); // Return an empty array if no data found
    }

    console.log(data);

    // Optionally log the shuffled data
  } catch (error) {
    console.error("Error retrieving assessment:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id, questionId } = req.body;

    const updatedAssessment = await Assessment.findOneAndUpdate(
      { _id: id },
      { $pull: { questions: { _id: questionId } } },
      { new: true } // Return the modified document
    );

    if (!updatedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res
      .status(200)
      .json({ message: "Question deleted successfully", updatedAssessment });
  } catch (error) {
    console.error("Error deleting question:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

export const editQuestion = async (req: Request, res: Response) => {
  try {
    // const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    // const file = files["file"];
    // const optionfile = files["optionsfile"];

    // // Upload main file if it exists
    // if (file?.length) await uploadAssessment(file[0]);

    // // Upload option files if they exist
    // if (optionfile?.length) {
    //   for (let i = 0; i < optionfile.length; i++) {
    //     await uploadAssessment(optionfile[i]);
    //   }
    // }

    const {
      questionText,
      questionType,
      questionMark,
      id, // Assessment ID
      questionId, // ID of the question to update
      correctAnswer,
      options,
      time,
    } = req.body;

    const updatedFields: any = {
      "questions.$[elem].text": questionText,
      "questions.$[elem].time": time,
      "questions.$[elem].type": questionType,
      "questions.$[elem].mark": parseInt(questionMark, 10),
      "questions.$[elem].correctAnswer": correctAnswer,
      "questions.$[elem].options": JSON.parse(options),
    };

    // if (file && file.length) {
    //   updatedFields["questions.$[elem].file"] = file[0].originalname;
    // }

    // Update the specific question using array filters
    const updatedAssessment = await Assessment.findOneAndUpdate(
      { _id: id },
      { $set: updatedFields },
      {
        new: true, // Return the updated document
        arrayFilters: [{ "elem._id": questionId }], // Filter for the specific question
      }
    );

    if (!updatedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.status(200).json({
      message: "Question updated successfully",
      updatedAssessment,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

interface User {
  user: {
    id: string;
    userId: string;
  };
}

export const deleteAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Assessment ID is required" });
    }

    const deletedAssessment = await Assessment.findByIdAndDelete(id);

    if (!deletedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// export const submitAssessment = async (req: Request | any, res: Response) => {
//   try {
//     console.log("workingg anoooooooooooooooooooo");
//     const { assessmentId, answers } = req.body;
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
//     const userId = req.user.id;

//     // console.log(assessmentId)

//     const assessment = await Assessment.findOne({ module: assessmentId });

//     console.log(assessment);
//     if (!assessment) {
//       return res.status(404).json({ message: "Assessment not found" });
//     }

//     let totalMarks = 0;
//     const gradedAnswers = answers.map((answer: any) => {
//       const question = assessment.questions.find(
//         (q) => q.id === answer.questionId
//       );
//       let isCorrect = false;

//       if (question) {
//         if (
//           question.type === "multipleChoice" ||
//           question.type === "singleChoice"
//         ) {
//           isCorrect =
//             JSON.stringify(answer.selectedOptions) ===
//             JSON.stringify(question.correctAnswer);
//         } else if (question.type === "yesNo") {
//           isCorrect = answer.yesNoAnswer === question.correctAnswer;
//         }
//         if (isCorrect) totalMarks += question.mark;
//       }
//       return { ...answer, isCorrect };
//     });

//     const answerSubmission = new Answer({
//       user: userId,
//       assessment: assessmentId,
//       answers: gradedAnswers,
//       totalMarks,
//     });

//     await answerSubmission.save();
//     res
//       .status(200)
//       .json({ message: "Assessment submitted successfully", totalMarks });
//   } catch (error) {
//     console.error("Error submitting assessment:", error);
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

// export const submitAssessment = async (req: Request | any, res: Response) => {
//   try {
//     const { assessmentId, answers } = req.body;
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
//     const userId = req.user.id;

//     const assessment = await Assessment.findOne({ module: assessmentId });
//     if (!assessment) {
//       return res.status(404).json({ message: "Assessment not found" });
//     }

//     let totalMarks = 0;
//     let totalScore = 0;
//     let feedBack: any = [];

//     // Process answers and evaluate
//     const gradedAnswers = await Promise.all(
//       answers.map(async (answer: any, index: number) => { // 'index' gives us the question number (0-based)
//         const question = assessment.questions.find(
//           (q) => q.id === answer.questionId
//         );
//         let isCorrect = false;
//         let correctAnswer;

//         if (question) {
//           const questionNumber = index + 1; // Convert to 1-based index

//           if (question.type === "descriptive") {
//             // Use Python script to evaluate descriptive answers
//             const result: any = await evaluateDescriptiveAnswer({
//               questionId: question.id,
//               student_answer: answer.descriptiveAnswer,
//               correct_answer: question.correctAnswer,
//             });

//             isCorrect = result?.isCorrect;
//             totalMarks += Math.round(result?.score * question?.mark);
//             totalScore += question.mark;
//             correctAnswer = result.feedback; // Set feedback as correct answer for descriptive type

//           } else if (question.type === "multipleChoice") {
//             const sortedSelectedOptions = answer.selectedOptions.sort();
//             const sortedCorrectAnswer = Array.isArray(question.correctAnswer)
//               ? question.correctAnswer.sort()
//               : question.correctAnswer.split(",").sort();

//             correctAnswer = sortedCorrectAnswer;
//             isCorrect =
//               JSON.stringify(sortedSelectedOptions) ===
//               JSON.stringify(sortedCorrectAnswer);
//             totalScore += question.mark;
//             if (isCorrect) totalMarks += question.mark;

//           } else if (question.type === "singleChoice") {
//             correctAnswer = question.correctAnswer;
//             isCorrect = answer.selectedOption == question.correctAnswer;
//             totalScore += question.mark;
//             if (isCorrect) totalMarks += question.mark;

//           } else if (question.type === "yesNo") {
//             correctAnswer = question.correctAnswer;
//             isCorrect = answer.yesNoAnswer === question.correctAnswer;
//             totalScore += question.mark;
//             if (isCorrect) totalMarks += question.mark;
//           }

//           // Add the question number and correct answer to feedback for every type
//           feedBack.push({
//             id: question.id,
//             questionNumber,
//             correctAnswer,
//           });
//         }

//         return { ...answer, isCorrect };
//       })
//     );

//     const answerSubmission = new Answer({
//       user: userId,
//       assessment: assessmentId,
//       answers: gradedAnswers,
//       totalMarks,
//       totalScore,
//     });

//     const markData = {
//       answers: gradedAnswers,
//       totalMarks,
//       totalScore,
//       feedBack,
//     };

//     await answerSubmission.save();
//     res
//       .status(200)
//       .json({ message: "Assessment submitted successfully", markData });
//   } catch (error) {
//     console.error("Error submitting assessment:", error);
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

export const submitAssessment = async (req: Request | any, res: Response) => {
  try {
    const { quizId, answers, totalTime, difficulty } = req.body;
    console.log(answers.map((data: any) => data.option));
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = req.user.id;

    const userData = await User.findById({ _id: userId });

    const assessment = await Assessment.findOne({ _id: quizId });
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    let totalMarks = 0;
    let totalScore = assessment.questions.reduce(
      (sum, question) => sum + question.mark,
      0
    );

    let quizTime =
      assessment.questions.reduce(
        (sum: number, question: any) => sum + Number(question.time),
        0
      ) * 1000;

    let feedBack: any = [];
    let currentMark = 0;

    // Process answers and evaluate
    const gradedAnswers = await Promise.all(
      answers.map(async (answer: any, index: number) => {
        const question = assessment.questions.find(
          (q) => q.id === answer.questionId
        );
        let isCorrect = false;
        let correctAnswer;

        if (question) {
          const questionNumber = index + 1;

          if (question.type === "descriptive") {
            const result: any = await evaluateDescriptiveAnswer({
              questionId: question.id,
              student_answer: answer.descriptiveAnswer,
              correct_answer: question.correctAnswer,
            });

            console.log(result);

            isCorrect = result?.isCorrect;
            totalMarks += Math.round(result?.score * question?.mark);
            currentMark = Math.round(result?.score * question?.mark);
            correctAnswer = result.feedback;
          } else if (question.type === "multipleChoice") {
            const sortedSelectedOptions = answer.selectedOptions.sort();
            const sortedCorrectAnswer = Array.isArray(question.correctAnswer)
              ? question.correctAnswer.sort()
              : question.correctAnswer.split(",").sort();

            correctAnswer = sortedCorrectAnswer;
            isCorrect =
              JSON.stringify(sortedSelectedOptions) ===
              JSON.stringify(sortedCorrectAnswer);
            currentMark = isCorrect ? question.mark : 0;
            if (isCorrect) totalMarks += question.mark;
          } else if (question.type === "singleChoice") {
            correctAnswer = question.correctAnswer;
            isCorrect = answer.selectedOption == question.correctAnswer;
            currentMark = isCorrect ? question.mark : 0;
            if (isCorrect) totalMarks += question.mark;
          } else if (question.type === "yesNo") {
            correctAnswer = question.correctAnswer;
            isCorrect = answer.yesNoAnswer === question.correctAnswer;
            currentMark = isCorrect ? question.mark : 0;
            if (isCorrect) totalMarks += question.mark;
          }

          feedBack.push({
            id: question.id,
            questionNumber,
            correctAnswer,
            mark: currentMark,
            submittedAnswer: answer, // Include the user's submitted answer
          });
        }

        return { ...answer, isCorrect };
      })
    );

    const answerSubmission = new Answer({
      user: userId,
      assessment: quizId,
      answers: gradedAnswers,
      totalTime: totalTime,
      difficulty: difficulty,
      quizTime: quizTime,
      totalMarks,
      totalScore,
    });

    const savedSubmission = await answerSubmission.save();

    const rankData = await Answer.aggregate([
      // Match submissions for the same assessment
      { $match: { assessment: new mongoose.Types.ObjectId(quizId) } },

      // Add a field for score percentage
      {
        $addFields: {
          priorityScore: {
            $switch: {
              branches: [
                { case: { $eq: ["$difficulty", "hard"] }, then: 1000 },
                { case: { $eq: ["$difficulty", "medium"] }, then: 500 },
                { case: { $eq: ["$difficulty", "easy"] }, then: 100 },
              ],
              default: 0, // Fallback value if no difficulty matches
            },
          },
        },
      },

      // Sort by score percentage (descending)
      {
        $addFields: {
          combinedSortField: {
            $add: [
              {
                $multiply: [
                  { $divide: ["$totalMarks", "$totalScore"] },
                  "$priorityScore",
                ],
              }, // Sort scorePercentage descending (multiply by -1)
              { $divide: [{ $subtract: ["$quizTime", "$totalTime"] }, 1000] }, // Normalize totalTime by dividing it by a factor to avoid large numbers, and ensure ascending order
            ],
          },
        },
      },

      // Sort by the combinedSortField
      {
        $sort: {
          combinedSortField: -1, // Sort by the combined field
        },
      },

      {
        $setWindowFields: {
          partitionBy: null, // Apply globally
          sortBy: { combinedSortField: -1 }, // Sort using the combined field
          output: {
            rank: { $rank: {} }, // Assign rank based on sorted order
          },
        },
      },

      // Find the rank for the current submission
      {
        $match: { _id: savedSubmission._id }, // Filter for the specific submission
      },

      // Project the final output
      {
        $project: {
          _id: 0,
          rank: 1,
          totalMarks: 1,
          totalScore: 1,
          combinedSortField: 1,
          submittedAt: 1,
        },
      },
    ]);

    const totalPoints = userData?.totalPoints + rankData[0].combinedSortField;

    const update = await User.updateOne(
      { _id: userId },
      { $set: { totalPoints: totalPoints } }
    );

    const currentRank = rankData[0]?.rank || null;

    const markData = {
      answers: gradedAnswers,
      totalMarks,
      totalScore,
      feedBack, // Includes submitted answers for feedback
      rank: currentRank,
    };

    console.log(markData);

    res
      .status(200)
      .json({ message: "Assessment submitted successfully", markData });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Function to evaluate descriptive answer using Python script
const evaluateDescriptiveAnswer = (data: any) => {
  return new Promise((resolve, reject) => {
    const python = spawn(
      "C:\\Users\\Office\\Desktop\\salesBackend\\salestrainingbackend\\venv\\Scripts\\python.exe",
      ["evaluate_answers.py"]
    );

    // Send data to Python process via stdin
    python.stdin.write(JSON.stringify(data));
    python.stdin.end();

    let result = "";
    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
      reject(data.toString());
    });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(`Python process exited with code ${code}`);
      } else {
        resolve(JSON.parse(result));
      }
    });
  });
};

export const getRankList = async (req: Request | any, res: Response) => {
  try {
    const { assessmentId } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id;

    // Validate input
    if (!assessmentId) {
      return res.status(400).json({ message: "Assessment ID is required." });
    }

    // Aggregation pipeline
    const rankList = await Answer.aggregate([
      // Match submissions for the given assessment
      { $match: { assessment: new mongoose.Types.ObjectId(assessmentId) } },

      // Calculate the score percentage for ranking
      {
        $addFields: {
          priorityScore: {
            $switch: {
              branches: [
                { case: { $eq: ["$difficulty", "hard"] }, then: 1000 },
                { case: { $eq: ["$difficulty", "medium"] }, then: 500 },
                { case: { $eq: ["$difficulty", "easy"] }, then: 100 },
              ],
              default: 0, // Fallback value if no difficulty matches
            },
          },
        },
      },

      // Create a combined sorting field:
      // - scorePercentage (descending)
      // - totalTime (ascending)
      {
        $addFields: {
          combinedSortField: {
            $add: [
              {
                $multiply: [
                  { $divide: ["$totalMarks", "$totalScore"] },
                  "$priorityScore",
                ],
              }, // Sort scorePercentage descending (multiply by -1)
              { $divide: [{ $subtract: ["$quizTime", "$totalTime"] }, 1000] }, // Normalize totalTime by dividing it by a factor to avoid large numbers, and ensure ascending order
            ],
          },
        },
      },

      // Sort by the combinedSortField
      {
        $sort: {
          combinedSortField: -1, // Sort by the combined field
        },
      },

      // Rank users based on the combined sort order
      {
        $setWindowFields: {
          partitionBy: null, // Apply globally
          sortBy: { combinedSortField: -1 }, // Sort using the combined field
          output: {
            rank: { $rank: {} }, // Assign rank based on sorted order
          },
        },
      },

      // Join with the User collection to get user details
      {
        $lookup: {
          from: "User", // The User collection
          localField: "user", // Reference the user field from AnswerSubmission
          foreignField: "_id", // Reference the _id from the User collection
          as: "userDetails",
        },
      },

      // Unwind userDetails array to get a single object
      { $unwind: "$userDetails" },

      // Project the final output (including user details, rank, totalTime)
      {
        $project: {
          _id: 0,
          rank: 1,
          user: "$user",
          userName: "$userDetails.userName",
          userEmail: "$userDetails.userEmail",
          totalMarks: 1,
          totalScore: 1,
          combinedSortField: 1,
          scorePercentage: 1,
          totalTime: 1, // Include totalTime in the final output
          submittedAt: 1,
        },
      },
    ]);

    console.log(rankList);
    return res.status(200).json({ data: rankList, user: userId });
  } catch (error) {
    console.error("Error fetching rank list:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getOverallRankList = async (req: Request | any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const overallRankList = await Answer.aggregate([
      // Match submissions for all assessments (no specific assessment filter)
      { $match: {} },

      // Map difficulty to priority score
      {
        $addFields: {
          priorityScore: {
            $switch: {
              branches: [
                { case: { $eq: ["$difficulty", "hard"] }, then: 1000 },
                { case: { $eq: ["$difficulty", "medium"] }, then: 500 },
                { case: { $eq: ["$difficulty", "easy"] }, then: 100 },
              ],
              default: 0, // Fallback value if no difficulty matches
            },
          },
        },
      },

      // Calculate the score percentage for each assessment
      {
        $addFields: {
          scorePercentage: { $divide: ["$totalMarks", "$totalScore"] },
        },
      },

      // Group by user and sum the total score percentage, total time, and priority-adjusted score
      {
        $group: {
          _id: "$user", // Group by user
          totalPercentage: {
            $sum: { $divide: ["$totalMarks", "$totalScore"] },
          }, // Sum of total percentages
          totalTime: { $sum: "$totalTime" }, // Sum of total times across all assessments
          quizTime: { $sum: "$quizTime" }, // Sum of total times across all assessments
          totalPriorityScore: {
            $sum: {
              $multiply: [
                { $divide: ["$totalMarks", "$totalScore"] },
                "$priorityScore",
              ],
            },
          }, // Priority-adjusted score
        },
      },

      // Combine sorting logic: Use totalPriorityScore as the basis for sorting

      {
        $addFields: {
          combinedSortField: {
            $add: [
              { $multiply: ["$totalPriorityScore", 1] }, // Sort by priority-adjusted score (descending by default)
              {
                $divide: [
                  { $subtract: ["$quizTime", "$totalTime"] }, // Subtract totalTime from quizTime
                  1000, // Normalize by dividing by 1000
                ],
              },
            ],
          },
        },
      },

      // Sort by the combinedSortField (totalPercentage descending, totalTime ascending)
      {
        $sort: {
          combinedSortField: 1, // Sort by combined field
        },
      },

      // Assign ranks based on the combined sorting logic using $setWindowFields
      {
        $setWindowFields: {
          partitionBy: null, // Apply globally
          sortBy: { combinedSortField: -1 }, // Sort by the combinedSortField
          output: {
            rank: { $rank: {} }, // Assign rank based on sorted combined field
          },
        },
      },

      // Join with the User collection to get user details
      {
        $lookup: {
          from: "User", // The User collection
          localField: "_id", // The user ID from the Answer collection
          foreignField: "_id", // Reference the _id from the User collection
          as: "userDetails",
        },
      },

      // Unwind userDetails array to get a single object
      { $unwind: "$userDetails" },

      // Project the final output (including user details, rank, totalPercentage, and totalTime)
      {
        $project: {
          _id: 0, // Exclude _id
          rank: 1,
          user: "$_id", // Use the user _id as reference
          userName: "$userDetails.userName",
          userEmail: "$userDetails.userEmail",
          totalPriorityScore: 1,
          combinedSortField: "$combinedSortField",
          totalTime: 1,
        },
      },
    ]);

    console.log(overallRankList);

    return res.status(200).json({ data: overallRankList, user: userId });
  } catch (error) {
    console.error("Error fetching overall rank list:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getPreviousQuizzes = async (req: any, res: Response) => {
  try {
    const userId = req.user.id; // Get the current user ID

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rewardData = {
      totalQuizzes: 0,
      totalQuestionsAnswerd: 0,
      correctQuestionsAnswerd: 0,
      totalTimesSpend: 0,
      totalpointsCollected: 0,
    };

    const userData = await User.findById({ _id: userId });

    // Fetch the list of assessments attended by the current user
    const attendedAssessments = await Answer.find({ user: userId }).populate(
      "assessment"
    );

    rewardData.totalQuizzes = attendedAssessments.length;
    rewardData.totalQuestionsAnswerd = attendedAssessments.reduce(
      (sum: any, item: any) => sum + item.answers.length,
      0
    );

    rewardData.correctQuestionsAnswerd = attendedAssessments.reduce(
      (totalCorrect, data) =>
        totalCorrect +
        data.answers.filter((answer: any) => answer.isCorrect === true).length,
      0
    );

    rewardData.totalTimesSpend = attendedAssessments.reduce(
      (totalTime, data) => totalTime + (data.totalTime || 0),
      0
    );

    rewardData.totalpointsCollected = userData?.totalPoints || 0;

    console.log(attendedAssessments);

    console.log(
      "Assessments attended by the current user:",
      attendedAssessments
    );

    // let query: any = { _id: { $in: attendedAssessments } };

    // Fetch data based on the query
    // const data = await Assessment.find(query).select(
    //   "name category createdAt difficulty"
    // );

    console.log("Available Assessments:", attendedAssessments);

    if (attendedAssessments.length > 0) {
      res
        .status(200)
        .json({ data: attendedAssessments, rewardData: rewardData });
    } else {
      res.status(200).json({ data: [] });
    }
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};
