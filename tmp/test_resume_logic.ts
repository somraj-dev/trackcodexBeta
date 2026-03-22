import { ResumeService } from "../backend/services/activity/resumeService.js";
import { prisma } from "../backend/services/infra/prisma.js";

async function runTest() {
  console.log("🚀 Starting Resume Logic Verification...");

  try {
    // 1. Check connection and basic query
    console.log("🔍 Checking connection with basic query...");
    const userCount = await prisma.user.count();
    console.log(`✅ Connection OK. Total users: ${userCount}`);

    // 2. Find or create a test user
    console.log("🔍 Checking for test user...");
    let user = await prisma.user.findUnique({
      where: { email: "test_resume@example.com" }
    });

    if (!user) {
      console.log("✨ Creating test user...");
      user = await prisma.user.create({
        data: {
          email: "test_resume@example.com",
          username: "test_resume_user",
          name: "Test Resume User",
          profile: {
            create: {
              bio: "Test BIO"
            }
          }
        },
        include: { profile: true }
      });
    }
    
    const userId = user.id;
    console.log(`✅ Using User ID: ${userId}`);

    // 2. Test Resume Upload
    console.log("📤 Testing Resume Upload...");
    const mockFileBuffer = Buffer.from("This is a mock resume content.");
    const uploadResult = await ResumeService.uploadResume(
      userId,
      "test_resume.txt",
      mockFileBuffer,
      "text/plain"
    );

    if (uploadResult.success) {
      console.log("✅ Resume uploaded successfully!");
      console.log("🔗 URL:", uploadResult.url);
    } else {
      throw new Error(`❌ Upload failed: ${uploadResult.error}`);
    }

    // 3. Verify Database Update (Profile model)
    console.log("📊 Verifying Profile database record...");
    const profile = await prisma.profile.findUnique({
      where: { userId: userId }
    });

    if (profile?.resumeUrl && profile.resumeFilename === "test_resume.txt") {
      console.log("✅ Profile record updated correctly!");
    } else {
      throw new Error(`❌ Profile record mismatch: ${JSON.stringify(profile)}`);
    }

    // 4. Test Privacy Update
    console.log("🔒 Testing Privacy Update (Public)...");
    await ResumeService.updatePrivacy(userId, true);
    const publicProfile = await prisma.profile.findUnique({ where: { userId: userId } });
    if (publicProfile?.showResume === true) {
      console.log("✅ Privacy set to Public successfully!");
    } else {
        throw new Error("❌ Privacy update failed");
    }

    // 5. Test Resume Download
    console.log("📥 Testing Resume Download...");
    const downloadResult = await ResumeService.getResume(userId);
    if (downloadResult.buffer && downloadResult.buffer.toString() === "This is a mock resume content.") {
      console.log("✅ Resume downloaded and content matches!");
    } else {
      throw new Error(`❌ Download failed or content mismatch: ${downloadResult.error}`);
    }

    // 6. Test Resume Deletion
    console.log("🗑️ Testing Resume Deletion...");
    const deleteResult = await ResumeService.deleteResume(userId);
    if (deleteResult.success) {
      console.log("✅ Resume deleted successfully!");
    } else {
      throw new Error(`❌ Deletion failed: ${deleteResult.error}`);
    }

    // 7. Final Verification
    const finalProfile = await prisma.profile.findUnique({ where: { userId: userId } });
    if (!finalProfile?.resumeUrl) {
      console.log("✅ Final check: Database cleared correctly!");
    } else {
      throw new Error("❌ Final check: Resume fields still exist in DB");
    }

    console.log("\n🎊 ALL TESTS PASSED! 🎊");

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
