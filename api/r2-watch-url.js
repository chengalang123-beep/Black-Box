import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
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
    const { videoKey } = req.body;

    if (!videoKey) {
      return res.status(400).json({ error: "Missing videoKey" });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: videoKey,
    });

    const watchUrl = await getSignedUrl(r2, command, {
      expiresIn: 60 * 60,
    });

    return res.status(200).json({
      watchUrl,
    });
  } catch (error) {
    console.error("R2 watch URL error:", error);
    return res.status(500).json({ error: "Failed to create watch URL" });
  }
}