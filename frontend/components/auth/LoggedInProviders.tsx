import React from "react";
import { useAuth } from "../../context/AuthContext";
import { ProfileProvider } from "../../context/ProfileContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { AppDataProvider } from "../../context/AppDataContext";
import { RealtimeProvider } from "../../contexts/RealtimeContext";
import { MessagingProvider } from "../../context/MessagingContext";
import { GlobalOffers } from "../jobs/offer/GlobalOffers";

export const LoggedInProviders = React.memo(({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  return (
    <AppDataProvider>
      <ProfileProvider>
        <NotificationProvider>
          <RealtimeProvider userId={user?.id || null}>
            <MessagingProvider>
              {children}
              <GlobalOffers />
            </MessagingProvider>
          </RealtimeProvider>
        </NotificationProvider>
      </ProfileProvider>
    </AppDataProvider>
  );
});
