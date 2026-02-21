// src/middlewares/upload.middleware.ts
import multer from "multer";
import path from "path";

// Configure multer to store files in memory (for Supabase upload)
const storage = multer.memoryStorage();

// File filter to only accept images
const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed"));
  }
};

// Upload middleware for single image (max 5MB)
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("image");

// Error handling middleware for multer
export const handleMulterError = (
  err: any,
  req: any,
  res: any,
  next: any,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "ไฟล์มีขนาดใหญ่เกินไป (ไม่เกิน 5MB)",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};
