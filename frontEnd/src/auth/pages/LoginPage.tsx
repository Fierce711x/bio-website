import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { LoginSchema } from "../../lib/zod/AuthSchema";
import { useAuth } from "../hooks/useAuth";
import type { LoginData } from "../types";
import { useNavigate } from "react-router-dom";
import type { RedirectLocation } from "../../lib/react-router/types";
import AuthForm from "../../components/AuthForm";
import { zodResolver } from "@hookform/resolvers/zod";
export default function LoginPage() {
  const form = useForm<LoginData>({ resolver: zodResolver(LoginSchema), mode: "onBlur" });
  const location = useLocation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const redirect: RedirectLocation = location.state?.from ?? {
    pathname: "/",
    search: "",
    hash: "",
  };
  async function handleLogin(userData: LoginData) {
    await login(userData);
    return navigate(redirect, { replace: true });
  }

  async function switchMode() {
    await navigate("/signup", { state: redirect, replace: true });
  }

  return (
    <AuthForm<LoginData>
      formFields={[
        { type: "text", key: "username", autoComplete: "off" },
        { type: "password", key: "password", autoComplete: "current-password" },
      ]}
      form={form}
      onSubmit={handleLogin}
      mode="login"
      switchMode={switchMode}
    />
  );
}
