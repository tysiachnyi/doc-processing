import express from "express";
import { upload } from "../lib/upload";

const router = express.Router();

router.post("/upload", upload.single("document"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const fileInfo = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    };

    console.log("File uploaded:", fileInfo);

    return res.status(200).json({ success: true, file: fileInfo });
  } catch (error) {
    return next(error);
  }
});

export const documentsRouter = router;
