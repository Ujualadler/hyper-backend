import { Router } from "express";
import {
  createAssessment,
  deleteAssessment,
  deleteQuestion,
  editQuestion,
  getAllAssessment,
  getAssessment,
  getAssessmentFile,
  getOverallRankList,
  getPreviousQuizzes,
  getRankList,
  submitAssessment,
} from "../controllers/assessmentController";
import multer from "multer";
import { verifyToken } from "../config/jwt";

const router = Router();
const upload = multer({ dest: "uploads" });

router.post(
  "/createQuiz",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "optionsfile", maxCount: 10 },
  ]),
  verifyToken,
  createAssessment
);
router.get("/getQuiz", verifyToken, getAssessment);
router.get("/getAllQuiz", verifyToken, getAllAssessment);
router.get("/getPrevQuiz", verifyToken, getPreviousQuizzes);

// router.get("/:key", getAssessmentFile);
router.put("/delete", verifyToken, deleteQuestion);
router.delete("/deleteQuiz", verifyToken, deleteAssessment);
router.post("/submitAssessment", verifyToken, submitAssessment);
router.post("/getRankList",verifyToken, getRankList);
router.get("/allrank",verifyToken, getOverallRankList);
router.put(
  "/edit",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "optionsfile", maxCount: 10 },
  ]),
  verifyToken,
  editQuestion
);

export default router;
