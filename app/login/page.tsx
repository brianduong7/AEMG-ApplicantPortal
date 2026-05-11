import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in — Applicant Portal",
  description: "Sign in to browse roles and submit your application.",
};

export default function LoginPage() {
  return <LoginForm />;
}
