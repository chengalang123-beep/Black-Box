import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function cleanEnv(value) {
  return String(value || "").trim();
}

function cleanFileName(fileName) {
  const originalName = fileName || "video.mp4";

  const extension = originalName.includes(".")
    ? originalName.split(".").pop().toLowerCase()
    : "mp4";

  const baseName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const safeBaseName = baseName || "uploaded-video";

  return `${Date.now()}-${safeBaseName}.${extension}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accountId = cleanEnv(process.env.R2_ACCOUNT_ID);
    const accessKeyId = cleanEnv(process.env.R2_ACCESS_KEY_ID);
    const secretAccessKey = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
    const bucketName = cleanEnv(process.env.R2_BUCKET_NAME);
    const adminPassword = cleanEnv(process.env.ADMIN_PASSWORD);

    if (!adminPassword) {
      return res.status(500).json({
        error: "ADMIN_PASSWORD is missing in Vercel Environment Variables.",
      });
    }

    if (req.headers["x-admin-password"] !== adminPassword) {
      return res.status(401).json({
        error: "Unauthorized upload request.",
      });
    }

    if (!accountId) {
      return res.status(500).json({
        error: "R2_ACCOUNT_ID is missing in Vercel Environment Variables.",
      });
    }

    if (accountId.includes("http") || accountId.includes(".r2.cloudflarestorage.com")) {
      return res.status(500).json({
        error:
          "R2_ACCOUNT_ID is wrong. It must be only the Cloudflare Account ID, not a URL.",
      });
    }

    if (!accessKeyId || !secretAccessKey) {
      return res.status(500).json({
        error:
          "R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing in Vercel Environment Variables.",
      });
    }

    if (!bucketName) {
      return res.status(500).json({
        error: "R2_BUCKET_NAME is missing in Vercel Environment Variables.",
      });
    }

    if (
      bucketName.includes("/") ||
      bucketName.includes("http") ||
      bucketName.includes(".")
    ) {
      return res.status(500).json({
        error:
          "R2_BUCKET_NAME is wrong. It must be only the bucket name, for example: streambox-videos",
      });
    }

    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        error: "Missing fileName or fileType.",
      });
    }

    if (!fileType.startsWith("video/")) {
      return res.status(400).json({
        error: "Only video files are allowed.",
      });
    }

    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const key = cleanFileName(fileName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 60 * 10,
    });

    return res.status(200).json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("R2 upload URL error:", error);

    return res.status(500).json({
      error: error.message || "Failed to create upload URL.",
    });
  }
}