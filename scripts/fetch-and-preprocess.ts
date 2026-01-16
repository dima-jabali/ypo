import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

const AWS_BUCKET = "bb-demos-public-data";
const AWS_KEY = "ypo-profiles-with-similar-nodes.json";
const REGION = "us-west-1";

async function fetchAndPreprocess() {
  console.log("[v0] Starting S3 fetch and preprocessing...");

  try {
    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error(
        "[v0] Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.",
      );
      process.exit(1);
    }

    console.log("[v0] Initializing S3 client...");
    const s3 = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log("[v0] Fetching from S3...");
    const getObjectResponse = await s3.send(
      new GetObjectCommand({
        Bucket: AWS_BUCKET,
        Key: AWS_KEY,
      }),
    );

    if (!getObjectResponse.Body) {
      console.error("[v0] No file found in S3");
      process.exit(1);
    }

    const jsonContent = await getObjectResponse.Body.transformToString();
    console.log("[v0] File content fetched:", (jsonContent.length / 1024 / 1024).toFixed(2), "MB");

    // Save to data directory
    const dataDir = join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });
    const filePath = join(dataDir, "similar-nodes.json");
    await writeFile(filePath, jsonContent, "utf-8");
    console.log("[v0] ✓ File saved to:", filePath);

    // Run preprocessing script
    console.log("[v0] Running preprocessing script...");
    execSync("bun scripts/preprocess-graph-data.ts", { stdio: "inherit" });

    console.log("[v0] ✓ Fetch and preprocessing complete!");
  } catch (error) {
    console.error("[v0] Error:", error);
    process.exit(1);
  }
}

fetchAndPreprocess();
