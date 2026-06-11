import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function cleanEnv(value) {
  return String(value || "").trim();
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

    const { videoKey } = req.body;

    if (!videoKey) {
      return res.status(400).json({ error: "Missing videoKey" });
    }

    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: videoKey,
    });

    const watchUrl = await getSignedUrl(r2, command, {
      expiresIn: 60 * 60 * 6,
    });

    return res.status(200).json({
      watchUrl,
    });
  } catch (error) {
    console.error("R2 watch URL error:", error);

    return res.status(500).json({
      error: error.message || "Failed to create watch URL.",
    });
  }
}