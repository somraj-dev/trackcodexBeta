
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { profileService, UserProfile } from '../../services/activity/profile';
import { isAdmin } from './AccessMatrix';

interface RoleGuardProps {
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(profileService.getProfile());

  useEffect(() => {
    return profileService.subscribe(setProfile);
  }, []);

  if (!isAdmin(profile.systemRole)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;


