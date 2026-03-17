import fs from "fs";
import path from "path";
import multer from "multer";
import { uploadsDirectory } from "../config/paths.js";

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname || ".jpg") || ".jpg";
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  },
});

const imageFileFilter = (_request, file, callback) => {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Only image uploads are allowed."));
};

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
