import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`https://city-monitor-3.onrender.com/verify-email/${token}`)
      .then((response) => {
        setMessage(response.data.message);
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((error) => {
        setMessage("Invalid or expired token.");
      });
  }, [token, navigate]);

  return (
    <div className="verify-container">
      <h2>{message}</h2>
    </div>
  );
};

export default VerifyEmail;
