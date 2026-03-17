import path from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

export const projectRoot = path.resolve(currentDirectory, "../..");
export const uploadsDirectory = path.join(projectRoot, "uploads");
