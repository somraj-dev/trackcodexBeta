import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// In production, set FIREBASE_SERVICE_ACCOUNT_KEY env var to the JSON string
// of your service account key, or use Application Default Credentials on GCP.
let isConfigured = false;

const getFirebaseConfig = () => {
    let serviceAccount: admin.ServiceAccount | undefined;
    let fallbackToADC = process.env.FIREBASE_ADC_ENABLED === "true";

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch {
            console.error("❌ [FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON");
        }
    }

    return { serviceAccount, fallbackToADC };
};

if (!admin.apps.length) {
    const { serviceAccount, fallbackToADC } = getFirebaseConfig();

    if (serviceAccount || fallbackToADC) {
        try {
            const credential = serviceAccount
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault();

            // Guard against the infamous "Could not load the default credentials" error
            // which usually happens when applicationDefault() is called on a system without GCP ADC set up.
            // We'll wrap the actual initialization attempt.
            admin.initializeApp({
                credential,
                projectId: process.env.FIREBASE_PROJECT_ID || "trackcodex-38862",
                databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://trackcodex-38862-default-rtdb.firebaseio.com",
            });
            console.log("✅ [FIREBASE] Admin SDK successfully initialized");
            isConfigured = true;
        } catch (err: any) {
            console.error("❌ [FIREBASE] Admin SDK initialization failed:", err.message);
            console.warn("ℹ️ [FIREBASE] Continuing without Cloud features. Auth fallbacks will be used.");
            isConfigured = false;
        }
    } else {
        console.warn("⚠️ [FIREBASE] Admin SDK: Missing FIREBASE_SERVICE_ACCOUNT_KEY. Cloud features disabled.");
        isConfigured = false;
    }
} else {
    isConfigured = true;
}

export const firebaseAdmin = admin;
export const isFirebaseConfigured = isConfigured;





