import { Router } from "express";
import {
  listUsers,
  //   deleteUser,
  //   listUsers,
  login,
  register,
} from "../controllers/userController";
import passport from "passport";

const router = Router();

router.post("/login", login);
router.post("/admin/login", login);
router.post("/register", register);
router.get("/user/list", listUsers);
// router.delete("/user/delete/:id", deleteUser);

export default router;
