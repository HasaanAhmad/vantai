/**
 * Auth routes - ExpressAuth with Prisma adapter.
 */

import { ExpressAuth } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "@auth/express/providers/google";
import { Router, type IRouter } from "express";
import { prisma } from "../config/db.js";

const authRouter: IRouter = Router();

authRouter.use(
  ExpressAuth({
    providers: [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })],
    adapter: PrismaAdapter(prisma),
  })
);

export default authRouter;
