import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const adminPassword = req.headers["x-admin-password"];

    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({
        error: "ADMIN_PASSWORD is missing in Vercel Environment Variables",
      });
    }

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized upload request" });
    }

    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: "Missing fileName or fileType" });
    }

    if (!fileType.startsWith("video/")) {
      return res.status(400).json({ error: "Only video files are allowed" });
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    const accountId = process.env.R2_ACCOUNT_ID;

    if (!bucketName || bucketName.includes("/") || bucketName.includes("http")) {
      return res.status(500).json({
        error:
          "Invalid R2_BUCKET_NAME. Use only the bucket name, like streambox-videos.",
      });
    }

    if (!accountId || accountId.includes("http") || accountId.includes(".")) {
      return res.status(500).json({
        error:
          "Invalid R2_ACCOUNT_ID. Use only the Cloudflare Account ID, not a URL.",
      });
    }

    const originalName = fileName || "video.mp4";
    const extension = originalName.includes(".")
      ? originalName.split(".").pop().toLowerCase()
      : "mp4";

    const safeBaseName = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    const finalName = safeBaseName || "uploaded-video";
    const key = `videos/${Date.now()}-${finalName}.${extension}`;

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
      error: error.message || "Failed to create upload URL",
    });
  }
}