import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RedirectAfterAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Read the intended destination or default to home
    const rawPath = localStorage.getItem("redirect_after_login") || "/dashboard/home";
    localStorage.removeItem("redirect_after_login");

    // Safety check: ensure we don't redirect back to auth related pages
    const isAuthPath = rawPath.startsWith("/login") ||
      rawPath.startsWith("/signup") ||
      rawPath.startsWith("/logout") ||
      rawPath.startsWith("/auth");

    const redirectPath = isAuthPath ? "/dashboard/home" : rawPath;

    // Redirect safely replacing the auth URL in history
    navigate(redirectPath, { replace: true });
  }, [navigate]);

  return null;
};

export default RedirectAfterAuth;
