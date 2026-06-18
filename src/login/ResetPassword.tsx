import { useState } from "react";
import { Button, Input } from "antd";

export interface Reset {
  userName: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

const ResetPassword = () => {
  const [fields, setFields] = useState<Reset>({
    userName: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=username, 2=otp, 3=new password

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt?.target;
    setFields((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear error when typing
  };

  const validateUsername = () => {
    const newErrors: Record<string, string> = {};
    if (!fields?.userName) {
      newErrors.userName = "Registered Email/Mobile Number is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = () => {
    if (validateUsername()) {
      setStep(2); // go to OTP step
    }
  };

  const handleVerifyOTP = () => {
    if (!fields.otp) {
      setErrors({ otp: "OTP is required" });
      return;
    }
    setStep(3); // go to reset password step
  };

  const handleResetPassword = () => {
    const newErrors: Record<string, string> = {};
    if (!fields.newPassword) {
      newErrors.newPassword = "New password is required";
    }
    if (fields.newPassword !== fields.confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      //  call backend
    }
  };

  return (
    <main className="premium-auth-bg">
      {/* Decorative background visual elements */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-auth-card p-8 w-full max-w-[440px] flex flex-col gap-6 mx-4 relative overflow-hidden">
        {/* Top Accent Gradient Border Glow */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />

        <header className="flex flex-col items-center gap-4">
          <div className="relative group transition-transform duration-300 hover:scale-105">
            <img 
              src="/90.png" 
              alt="vDrive Logo" 
              className="h-24 w-auto object-contain filter brightness-0 invert drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]" 
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">
              Reset Password
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">
              {step === 1 && "Verify your registered account"}
              {step === 2 && "Enter the verification code"}
              {step === 3 && "Create a secure new password"}
            </p>
          </div>
        </header>

        <fieldset className="flex flex-col gap-5 border-none p-0 m-0">
          {step === 1 && (
            <>
              <div className="glass-input-wrapper">
                <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
                  Username <span className="text-indigo-400 font-bold">*</span>
                </label>
                <Input
                  name="userName"
                  placeholder="Enter registered Email/Mobile"
                  value={fields?.userName}
                  onChange={handleChange}
                  className="!h-11"
                />
                {errors?.userName && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {errors.userName}
                  </div>
                )}
              </div>
              <Button 
                type="primary" 
                block 
                onClick={handleSendOTP}
                className="premium-btn-primary w-full mt-2"
              >
                Send OTP
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="glass-input-wrapper">
                <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
                  Enter OTP <span className="text-indigo-400 font-bold">*</span>
                </label>
                <Input
                  name="otp"
                  placeholder="Enter 6 digit code received"
                  value={fields?.otp}
                  onChange={handleChange}
                  className="!h-11"
                />
                {errors?.otp && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {errors.otp}
                  </div>
                )}
              </div>
              <Button 
                type="primary" 
                block 
                onClick={handleVerifyOTP}
                className="premium-btn-primary w-full mt-2"
              >
                Verify OTP
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="glass-input-wrapper">
                <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
                  New Password <span className="text-indigo-400 font-bold">*</span>
                </label>
                <Input.Password
                  name="newPassword"
                  placeholder="Enter new password"
                  value={fields?.newPassword}
                  onChange={handleChange}
                  className="!h-11"
                />
                {errors?.newPassword && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {errors.newPassword}
                  </div>
                )}
              </div>
              <div className="glass-input-wrapper">
                <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
                  Confirm New Password <span className="text-indigo-400 font-bold">*</span>
                </label>
                <Input.Password
                  name="confirmNewPassword"
                  placeholder="Re-enter password"
                  value={fields?.confirmNewPassword}
                  onChange={handleChange}
                  className="!h-11"
                />
                {errors?.confirmNewPassword && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {errors.confirmNewPassword}
                  </div>
                )}
              </div>
              <Button 
                type="primary" 
                block 
                onClick={handleResetPassword}
                className="premium-btn-primary w-full mt-2"
              >
                Reset Password
              </Button>
            </>
          )}
        </fieldset>

        <div className="flex flex-col items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold focus:outline-none"
          >
            Back to login
          </button>

          <footer className="w-full text-center text-[11px] text-slate-500 font-medium tracking-wide mt-2">
            © 2026 vDrive. All rights reserved.
          </footer>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
