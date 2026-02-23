/**
 * Quick test script for Gitea API connectivity.
 * Run: npx tsx backend/test-gitea.ts
 */
import "dotenv/config";

const GITEA_URL = process.env.GITEA_URL || "http://localhost:3000";
const GITEA_API_TOKEN = process.env.GITEA_API_TOKEN || "";

async function testGitea() {
  console.log("=== Gitea API Test ===");
  console.log(`URL: ${GITEA_URL}`);
  console.log(`Token: ${GITEA_API_TOKEN.substring(0, 8)}...`);

  // Test 1: Version
  try {
    const res = await fetch(`${GITEA_URL}/api/v1/version`, {
      headers: { Authorization: `token ${GITEA_API_TOKEN}` },
    });
    const data = await res.json();
    console.log(`✅ Version: ${data.version}`);
  } catch (e: any) {
    console.log(`❌ Version check failed: ${e.message}`);
  }

  // Test 2: Authenticated user
  try {
    const res = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${GITEA_API_TOKEN}` },
    });
    const data = await res.json();
    console.log(`✅ Auth as: ${data.login} (admin: ${data.is_admin})`);
  } catch (e: any) {
    console.log(`❌ Auth check failed: ${e.message}`);
  }

  // Test 3: List users
  try {
    const res = await fetch(`${GITEA_URL}/api/v1/admin/users`, {
      headers: { Authorization: `token ${GITEA_API_TOKEN}` },
    });
    const data = await res.json();
    console.log(`✅ Users: ${data.map((u: any) => u.login).join(", ")}`);
  } catch (e: any) {
    console.log(`❌ List users failed: ${e.message}`);
  }

  // Test 4: Create a test repo for user "manku19524"
  try {
    console.log("\n--- Creating test repo ---");
    const res = await fetch(`${GITEA_URL}/api/v1/admin/users/manku19524/repos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GITEA_API_TOKEN}`,
      },
      body: JSON.stringify({
        name: "test-repo-from-script",
        description: "Created by test script",
        private: false,
        auto_init: true,
        default_branch: "main",
      }),
    });

    console.log(`Response status: ${res.status} ${res.statusText}`);
    const data = await res.text();
    console.log(`Response body: ${data}`);

    if (res.ok) {
      const json = JSON.parse(data);
      console.log(`✅ Repo created! clone_url: ${json.clone_url}`);
    } else {
      console.log(`❌ Repo creation failed: ${data}`);
    }
  } catch (e: any) {
    console.log(`❌ Repo creation error: ${e.message}`);
  }
}

testGitea();
