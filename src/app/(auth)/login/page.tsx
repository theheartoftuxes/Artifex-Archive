import LoginForm from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In | The Volosphere",
  description: "Sign in to access your archive",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1E1E1E] px-4 py-12">
      <LoginForm />
    </div>
  );
}
