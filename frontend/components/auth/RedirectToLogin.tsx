import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RedirectToLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Prevent infinite loop if already at /login
    if (location.pathname === "/login") return;

    // Save the current location to redirect back after login
    // We filter out auth pages to avoid redirect loops
    const isAuthPath = 
      location.pathname.startsWith("/auth") ||
      location.pathname.startsWith("/login") ||
      location.pathname.startsWith("/signup") ||
      location.pathname.startsWith("/logout");

    if (!isAuthPath) {
      localStorage.setItem(
        "redirect_after_login",
        location.pathname + location.search,
      );
    }
    
    navigate("/login", { replace: true });
  }, [navigate, location.pathname, location.search]);

  return null;
};

export default RedirectToLogin;


