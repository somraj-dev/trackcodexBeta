import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// In production, set FIREBASE_SERVICE_ACCOUNT_KEY env var to the JSON string
// of your service account key, or use Application Default Credentials on GCP.
let serviceAccount: admin.ServiceAccount | undefined;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
        console.error("❌ [FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY");
    }
}

if (!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ [FIREBASE] Admin SDK initialized with service account");
    } else {
        // Fallback: try Application Default Credentials (works on GCP/Cloud Run)
        try {
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || "trackcodex-38862",
            });
            console.log("✅ [FIREBASE] Admin SDK initialized with default credentials");
        } catch (err) {
            console.error("❌ [FIREBASE] Admin SDK initialization failed:", err);
        }
    }
}

export const firebaseAdmin = admin;
