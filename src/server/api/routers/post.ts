import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import os from "os";

export const postRouter = createTRPCRouter({
  getHostname: publicProcedure.query(() => {
    return {
      hostname: os.hostname(),
    };
  }),
});
