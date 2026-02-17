/**
 * Routes index - exports all route handlers for mounting in app.
 */

import authRouter from "@/routes/auth.route";
import meetingRouter from "@/routes/meeting.route";

export const routes = {
  auth: authRouter,
  meeting: meetingRouter,
};

export { authRouter, meetingRouter };
