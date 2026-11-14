import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

/**
 * POST /api/auth/register
 */
authRouter.post("/register", authController.register);
//declaration of api, not making, the making is in controllers folder

/**
 * GET /api/auth/get-me
 */
authRouter.get("/get-me", authController.getMe);

/**
 * POST /api/auth/login
 */
authRouter.get("/refresh-token", authController.refreshToken);


export default authRouter