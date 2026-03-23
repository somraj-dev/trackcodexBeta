import React, { createContext, useContext, useState, useEffect } from "react";
import { profileService, UserProfile } from "../services/activity/profile";

interface ProfileContextType {
  profile: UserProfile;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(profileService.getProfile());

  useEffect(() => {
    return profileService.subscribe(setProfile);
  }, []);

  const value = React.useMemo(() => ({ profile }), [profile]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
