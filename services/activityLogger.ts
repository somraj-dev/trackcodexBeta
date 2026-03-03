// services/activityLogger.ts
import { apiInstance } from "./api";

export const logActivity = async (action: string, metadata: any = {}) => {
    try {
        // In a real app, we'd get the user ID from context/auth
        // For prototype, we'll fetch the first user or use a fixed one
        // But since we are on the frontend, let's assume we have a way or just send a dummy 'current-user' 
        // and let backend handle the "current session" logic if we had auth.
        // For Parity, we need to pass the username or ID.
        // Let's hardcode 'testuser' if no auth context is available yet.

        await apiInstance.post('/profile/activity', {
            username: 'johndoe', // Default for demo
            action, // 'save', 'commit', 'run'
            metadata
        });
        console.log(`[Analytics] Logged action: ${action}`);
    } catch (err) {
        console.error("Failed to log activity", err);
    }
};
