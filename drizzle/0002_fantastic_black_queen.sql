CREATE INDEX "file_name_idx" ON "hellok8s_image" USING btree ("file_name");--> statement-breakpoint
ALTER TABLE "hellok8s_image" ADD CONSTRAINT "hellok8s_image_fileName_unique" UNIQUE("file_name");