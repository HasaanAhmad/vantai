/**
 * Auth routes - ExpressAuth with Prisma adapter.
 */

import { ExpressAuth } from "@auth/express";
import { Router, type IRouter } from "express";
import { authConfig } from "@/config/auth";

const authRouter: IRouter = Router();

authRouter.use(ExpressAuth(authConfig));

export default authRouter;
