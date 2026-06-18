import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "antd";

export interface Signup {
  name: string;
  password: string;
  confirmPassword: string;
  email: string;
  contact: string;
}

const SignUp = () => {
  const navigate = useNavigate();
  const [signupFields, setSignupFields] = useState<Signup>({
    name: "",
    password: "",
    confirmPassword: "",
    email: "",
    contact: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    if (name === "confirmPassword") {
      const pwd = signupFields?.password || "";
      if (!value) {
        setSignupFields((prev) => ({ ...prev, confirmPassword: "" }));
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
        return;
      }
      if (pwd.startsWith(value)) {
        setSignupFields((prev) => ({ ...prev, confirmPassword: value }));
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
        return;
      }
      setSignupFields((prev) => ({ ...prev, confirmPassword: "" }));
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }
    if (name === "password") {
      const nextPwd = value;
      setSignupFields((prev) => {
        const nextState = { ...prev, password: nextPwd };
        if (prev.confirmPassword && !nextPwd.startsWith(prev.confirmPassword)) {
          nextState.confirmPassword = "";
          setErrors((e) => ({
            ...e,
            confirmPassword: "Passwords do not match",
          }));
        } else {
          setErrors((e) => ({ ...e, confirmPassword: "" }));
        }
        return nextState;
      });
      setErrors((prev) => ({ ...prev, password: "" }));
      return;
    }

    setSignupFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contactRegex = /^([^\s@]+@[^\s@]+\.[^\s@]+|[0-9]{6,15})$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,18}$/;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!signupFields?.name) {
      newErrors.name = "Name is required";
    }
    if (!signupFields?.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex?.test(signupFields?.password)) {
      newErrors.password =
        "Password must be at least 8 characters, include one digit, one uppercase and one special character";
    }
    if (signupFields?.confirmPassword !== signupFields?.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!signupFields?.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(signupFields?.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (signupFields?.contact && !contactRegex.test(signupFields?.contact)) {
      newErrors.contact = "Enter a valid email or phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      navigate("/");
    }
  };

  return (
    <main className="premium-auth-bg py-10 overflow-y-auto">
      {/* Decorative background visual elements */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-auth-card p-8 w-full max-w-[440px] flex flex-col gap-6 mx-4 relative overflow-hidden my-auto">
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
              Create Admin Account
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">
              Sign up to gain administrator access
            </p>
          </div>
        </header>

        <fieldset className="flex flex-col gap-5 border-none p-0 m-0">
          <div className="glass-input-wrapper">
            <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
              Name <span className="text-indigo-400 font-bold">*</span>
            </label>
            <Input
              name="name"
              placeholder="Enter name"
              value={signupFields?.name}
              onChange={handleChange}
              className="!h-11"
            />
            {errors?.name && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {errors?.name}
              </div>
            )}
          </div>

          <div className="glass-input-wrapper">
            <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
              Password <span className="text-indigo-400 font-bold">*</span>
            </label>
            <Input.Password
              name="password"
              placeholder="Enter password"
              value={signupFields?.password}
              onChange={handleChange}
              className="!h-11"
            />
            <p className="text-[10px] text-slate-400 leading-normal mt-1.5 font-medium">
              (8-18 chars, at least one uppercase, one digit, and one special symbol)
            </p>
            {errors?.password && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {errors?.password}
              </div>
            )}
          </div>

          <div className="glass-input-wrapper">
            <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
              Confirm Password <span className="text-indigo-400 font-bold">*</span>
            </label>
            <Input.Password
              name="confirmPassword"
              placeholder="Re-enter password"
              value={signupFields?.confirmPassword}
              onChange={handleChange}
              className="!h-11"
            />
            {errors?.confirmPassword && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {errors?.confirmPassword}
              </div>
            )}
          </div>

          <div className="glass-input-wrapper">
            <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
              Email Address <span className="text-indigo-400 font-bold">*</span>
            </label>
            <Input
              name="email"
              placeholder="Enter email address"
              value={signupFields?.email}
              onChange={handleChange}
              className="!h-11"
            />
            {errors?.email && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {errors?.email}
              </div>
            )}
          </div>

          <div className="glass-input-wrapper">
            <label className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5">
              Contact (Email or Phone)
            </label>
            <Input
              name="contact"
              placeholder="Enter contact info"
              value={signupFields?.contact}
              onChange={handleChange}
              className="!h-11"
            />
            {errors?.contact && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {errors?.contact}
              </div>
            )}
          </div>
        </fieldset>

        <div className="flex flex-col items-center gap-4 mt-2">
          <Button
            size="large"
            type="primary"
            block
            onClick={handleSubmit}
            className="premium-btn-primary w-full"
          >
            Sign Up
          </Button>

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

export default SignUp;
