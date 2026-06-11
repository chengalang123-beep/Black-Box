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

    if (!accountId || accountId.includes("http") || accountId.includes(".")) {
      return res.status(500).json({
        error:
          "R2_ACCOUNT_ID is incorrect. Use only the Cloudflare Account ID, not a URL.",
      });
    }

    if (!bucketName || bucketName.includes("/") || bucketName.includes("http")) {
      return res.status(500).json({
        error:
          "R2_BUCKET_NAME is incorrect. Use only the bucket name, example: streambox-videos",
      });
    }

    if (!accessKeyId || !secretAccessKey) {
      return res.status(500).json({
        error: "R2 access key or secret key is missing in Vercel.",
      });
    }

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
      expiresIn: 60 * 60,
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