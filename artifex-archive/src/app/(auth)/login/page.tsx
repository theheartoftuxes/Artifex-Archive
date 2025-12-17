import LoginForm from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In | Artifex Archive",
  description: "Sign in to access your archive",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </div>
  );
}
