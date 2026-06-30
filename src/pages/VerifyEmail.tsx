import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Result } from "antd";
import axiosIns from "../api/axios";
import FullScreenLoader from "../components/FullScreenLoader";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasRequested = React.useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided in the URL.");
      return;
    }

    if (hasRequested.current) return;
    hasRequested.current = true;

    const verify = async () => {
      try {
        await axiosIns.post("/api/auth/verify-email", { token });
        setStatus("success");
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(
          error.response?.data?.message || "Failed to verify email. The token might be invalid or expired."
        );
      }
    };

    verify();
  }, [token]);

  if (status === "loading") {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 max-w-md w-full mx-4">
        {status === "success" ? (
          <Result
            status="success"
            title="Email Verified Successfully!"
            subTitle="Your email address has been successfully verified. You can now log in to your account."
            extra={[
              <Button type="primary" key="login" onClick={() => navigate("/login")}>
                Go to Login
              </Button>,
            ]}
          />
        ) : (
          <Result
            status="error"
            title="Verification Failed"
            subTitle={errorMessage}
            extra={[
              <Button type="primary" key="login" onClick={() => navigate("/login")}>
                Return to Login
              </Button>,
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
