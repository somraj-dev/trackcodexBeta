import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// In production, set FIREBASE_SERVICE_ACCOUNT_KEY env var to the JSON string
// of your service account key, or use Application Default Credentials on GCP.
let serviceAccount: admin.ServiceAccount | undefined;
let isConfigured = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
        console.error("❌ [FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY");
    }
}

if (!admin.apps.length) {
    if (serviceAccount || process.env.FIREBASE_ADC_ENABLED === "true") {
        try {
            const credential = serviceAccount 
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault();
                
            admin.initializeApp({
                credential,
                projectId: process.env.FIREBASE_PROJECT_ID || "trackcodex-38862",
                databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://trackcodex-38862-default-rtdb.firebaseio.com",
            });
            console.log("✅ [FIREBASE] Admin SDK initialized");
            isConfigured = true;
        } catch (err) {
            console.error("❌ [FIREBASE] Admin SDK initialization failed:", err);
        }
    } else {
        console.warn("⚠️ [FIREBASE] Admin SDK: Missing FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_ADC_ENABLED is not true. Cloud features disabled.");
    }
} else {
    isConfigured = true;
}

export const firebaseAdmin = admin;
export const isFirebaseConfigured = isConfigured;





