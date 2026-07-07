import path from "path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  photosDir: () => path.resolve(required("PHOTOS_DIR")),
  sessionSecret: () => required("SESSION_SECRET"),
  appBaseUrl: () => required("APP_BASE_URL").replace(/\/+$/, ""),
  adminUsername: () => process.env.ADMIN_USERNAME ?? "",
  adminPassword: () => process.env.ADMIN_PASSWORD ?? "",
  stripOriginalExif: () => process.env.STRIP_ORIGINAL_EXIF === "true",
  uploadMaxBytes: () =>
    Number(process.env.UPLOAD_MAX_MB ?? "100") * 1024 * 1024
};
