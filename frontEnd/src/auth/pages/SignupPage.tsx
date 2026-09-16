import { useLocation } from "react-router-dom";
import type { SignupData } from "../types/authTypes";
import { useNavigate } from "react-router-dom";
import type { RedirectLocation } from "../../lib/react-router/types";
import AuthForm from "../../components/AuthForm";
import { SignupSchema } from "../../lib/zod/AuthSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authApi } from "../api/auth";
import { refreshConnection } from "../../lib/react-query/queryClient";
export default function SignupPage() {
  const form = useForm<SignupData>({ resolver: zodResolver(SignupSchema), mode: "onBlur" });
  const location = useLocation();
  const navigate = useNavigate();
  const redirect: RedirectLocation = location.state?.from ?? {
    pathname: "/dashboard",
    search: "",
    hash: "",
  };

  async function handleSignup(userData: SignupData) {
    try {
      await authApi.signup(userData);
      refreshConnection();
      return navigate(redirect, { replace: true });
    } catch (err) {
      console.log(err);
    }
  }

  async function switchMode() {
    await navigate("/login", { state: redirect, replace: true });
  }
  return (
    <AuthForm<SignupData>
      formFields={[
        { type: "text", key: "username", autoComplete: "off" },
        { type: "email", key: "email", autoComplete: "off" },
        { type: "text", key: "grade", autoComplete: "off" },
        { type: "number", key: "phone", autoComplete: "off" },
        { type: "password", key: "password", autoComplete: "current-password" },
      ]}
      form={form}
      onSubmit={handleSignup}
      mode="signup"
      switchMode={switchMode}
    />
  );
}
