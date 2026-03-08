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
        // Fallback: use Application Default Credentials (works with gcloud auth application-default login)
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID || "trackcodex-38862",
                databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://trackcodex-38862-default-rtdb.firebaseio.com",
            });
            console.log("✅ [FIREBASE] Admin SDK initialized with Application Default Credentials (gcloud)");
        } catch (err) {
            console.error("❌ [FIREBASE] Admin SDK initialization failed:", err);
        }
    }
}

export const firebaseAdmin = admin;
