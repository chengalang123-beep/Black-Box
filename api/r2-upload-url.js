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
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: "Missing fileName or fileType" });
    }

    if (!fileType.startsWith("video/")) {
      return res.status(400).json({ error: "Only video files are allowed" });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const key = `videos/${Date.now()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 60 * 5,
    });

    return res.status(200).json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("R2 upload URL error:", error);
    return res.status(500).json({ error: "Failed to create upload URL" });
  }
}