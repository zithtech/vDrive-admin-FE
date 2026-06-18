import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "antd";
import type { InputRef } from "antd";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginAsync } from "../store/slices/authSlice";
import FullScreenLoader from "../components/FullScreenLoader";

export interface Login {
  userName: string;
  password: string;
}
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, isAuthenticated } = useAppSelector((state) => state.auth);
  const [login, setLogin] = useState<Login>({
    userName: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userNameRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt?.target;
    setLogin((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (evt.key === "Enter") {
      if (field === "userName" && login.userName.trim()) {
        passwordRef.current?.focus();
      } else if (field === "password" && login.userName.trim() && login.password.trim()) {
        handleSubmit();
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!login?.userName) {
      newErrors.userName = "Registered Email/Mobile Number is required";
    }
    if (!login?.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (evt?: React.FormEvent) => {
    evt?.preventDefault();
    if (validate()) {
      try {
        await dispatch(loginAsync(login)).unwrap();
        navigate("/");
      } catch (error) {
        console.error("Login failed", error);
        setErrors({
          password: "Login failed. Please check your credentials and try again.",
        });
      }
    }
  };

  const handleForgotPassword = () => {
    navigate("/reset-password");
  };

  return (
    <main className="premium-auth-bg">
      {loading && <FullScreenLoader />}

      {/* Decorative background visual elements */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <form
        onSubmit={handleSubmit}
        className="glass-auth-card p-8 w-full max-w-[440px] flex flex-col gap-6 mx-4 relative overflow-hidden"
        noValidate
      >
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
              Welcome Admin
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">
              Sign in to manage vDrive operations
            </p>
          </div>
        </header>

        <fieldset className="flex flex-col gap-5 border-none p-0 m-0">
          <div className="glass-input-wrapper">
            <label
              htmlFor="admin-username-input"
              className="block text-[13px] font-semibold text-slate-300 tracking-wide mb-1.5"
            >
              Username <span className="text-indigo-400 font-bold">*</span>
            </label>
            <Input
              id="admin-username-input"
              ref={userNameRef}
              size="large"
              name="userName"
              placeholder="Enter registered Email/Mobile"
              value={login?.userName}
              onChange={handleLogin}
              onKeyDown={(e) => handleKeyDown(e, "userName")}
              autoComplete="username"
              className="!h-11"
            />
            {errors?.userName && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {errors?.userName}
              </div>
            )}
          </div>

          <div className="glass-input-wrapper">
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="admin-password-input"
                className="block text-[13px] font-semibold text-slate-300 tracking-wide"
              >
                Password <span className="text-indigo-400 font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs !text-white hover:!text-gray-200 transition-colors font-semibold focus:outline-none focus:underline"
              >
                Forgot password?
              </button>
            </div>
            <Input.Password
              id="admin-password-input"
              ref={passwordRef}
              size="large"
              name="password"
              placeholder="Enter password"
              value={login?.password}
              onChange={handleLogin}
              onKeyDown={(e) => handleKeyDown(e, "password")}
              autoComplete="current-password"
              className="!h-11"
            />
            {errors?.password && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mt-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {errors?.password}
              </div>
            )}
          </div>
        </fieldset>

        <div className="flex flex-col items-center gap-4 mt-2">
          <Button
            id="admin-login-btn"
            size="large"
            type="primary"
            htmlType="submit"
            loading={loading}
            className="premium-btn-primary w-full"
          >
            Login
          </Button>

          <footer className="w-full text-center text-[11px] text-slate-500 font-medium tracking-wide mt-2">
            © 2026 vDrive. All rights reserved.
          </footer>
        </div>
      </form>
    </main>
  );
};

export default Login;
