import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, superuserProcedure } from "@/server/api/trpc";
import { images } from "@/server/db/schema";
import { storageProvider } from "@/server/upload/storage";
import { imageTransformService } from "@/server/upload/transform";
import {
  validateImageFile,
  generateUniqueFileName,
  getImageDimensions,
} from "@/server/upload/utils";

export const imageRouter = createTRPCRouter({
  // Get all images (admin can see all images)
  getAll: superuserProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(images);
  }),

  // Get a single image by ID
  getById: superuserProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const image = await ctx.db
        .select()
        .from(images)
        .where(eq(images.id, input.id))
        .limit(1);

      if (!image[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      }

      return image[0];
    }),

  // Upload a new image
  upload: superuserProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file data
        mimeType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to File object
        const buffer = Buffer.from(input.fileData, "base64");
        const file = new File([buffer], input.fileName, {
          type: input.mimeType,
        });

        // Validate the file
        validateImageFile(file);

        // Generate unique filename
        const uniqueFileName = generateUniqueFileName(input.fileName);

        // Upload the file
        const uploadResult = await storageProvider.upload(file, uniqueFileName);

        // Get image dimensions
        const dimensions = await getImageDimensions(uploadResult.path);

        // Save to database
        const [newImage] = await ctx.db
          .insert(images)
          .values({
            fileName: uniqueFileName,
            originalPath: uploadResult.path,
            mimeType: input.mimeType,
            fileSize: uploadResult.fileSize,
            width: dimensions.width,
            height: dimensions.height,
            uploadedById: ctx.session.user.id,
          })
          .returning();

        return newImage;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }),

  // Rotate an image
  rotate: superuserProcedure
    .input(
      z.object({
        id: z.number(),
        degrees: z.number().min(-360).max(360),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db
        .select()
        .from(images)
        .where(eq(images.id, input.id))
        .limit(1);

      if (!image[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      }

      const rotatedPath = await imageTransformService.rotateImage(
        image[0].originalPath,
        input.degrees,
      );

      // Get updated image dimensions and file size
      const imageInfo = await imageTransformService.getImageInfo(rotatedPath);

      // Update database with new transformed path and metadata
      const [updatedImage] = await ctx.db
        .update(images)
        .set({
          transformedPath: rotatedPath,
          width: imageInfo.width,
          height: imageInfo.height,
          fileSize: imageInfo.size,
          updatedAt: new Date(),
        })
        .where(eq(images.id, input.id))
        .returning();

      return updatedImage;
    }),

  // Crop an image
  crop: superuserProcedure
    .input(
      z.object({
        id: z.number(),
        x: z.number().min(0),
        y: z.number().min(0),
        width: z.number().min(1),
        height: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db
        .select()
        .from(images)
        .where(eq(images.id, input.id))
        .limit(1);

      if (!image[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      }

      const croppedPath = await imageTransformService.cropImage(
        image[0].originalPath,
        {
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height,
        },
      );

      // Get updated image dimensions and file size
      const imageInfo = await imageTransformService.getImageInfo(croppedPath);

      // Update database with new transformed path and metadata
      const [updatedImage] = await ctx.db
        .update(images)
        .set({
          transformedPath: croppedPath,
          width: imageInfo.width,
          height: imageInfo.height,
          fileSize: imageInfo.size,
          updatedAt: new Date(),
        })
        .where(eq(images.id, input.id))
        .returning();

      return updatedImage;
    }),

  // Delete an image
  delete: superuserProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db
        .select()
        .from(images)
        .where(eq(images.id, input.id))
        .limit(1);

      if (!image[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      }

      // Delete files from storage
      await storageProvider.delete(image[0].originalPath);
      if (image[0].transformedPath) {
        await storageProvider.delete(image[0].transformedPath);
      }

      // Clean up all thumbnails for this image
      await imageTransformService.deleteThumbnails(image[0].originalPath);

      // Delete from database
      await ctx.db.delete(images).where(eq(images.id, input.id));

      return { success: true };
    }),
});
