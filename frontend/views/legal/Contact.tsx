import { useEffect } from "react";

const Contact = () => {
  useEffect(() => {
    window.location.replace("https://support.trackcodex.com/contact");
  }, []);

  return null;
};

export default Contact;


