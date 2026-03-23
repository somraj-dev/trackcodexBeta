import React from "react";
import { useAuth } from "../../context/AuthContext";
import { ProfileProvider } from "../../context/ProfileContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { AppDataProvider } from "../../context/AppDataContext";
import { RealtimeProvider } from "../../contexts/RealtimeContext";
import { MessagingProvider } from "../../context/MessagingContext";

export const LoggedInProviders = React.memo(({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  return (
    <AppDataProvider>
      <ProfileProvider>
        <NotificationProvider>
          <MessagingProvider>
            <RealtimeProvider userId={user?.id || null}>
              {children}
            </RealtimeProvider>
          </MessagingProvider>
        </NotificationProvider>
      </ProfileProvider>
    </AppDataProvider>
  );
});
