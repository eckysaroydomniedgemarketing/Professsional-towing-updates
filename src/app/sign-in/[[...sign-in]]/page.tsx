import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-indigo-600 hover:bg-indigo-500 text-sm normal-case",
            card: "shadow-none",
            headerTitle: "Sign in to Professional Towing",
            headerSubtitle: "Welcome back! Please sign in to continue",
            socialButtonsBlockButton: 
              "bg-white hover:bg-gray-50 border border-gray-300",
            socialButtonsBlockButtonText: "text-gray-700 font-normal",
          },
        }}
      />
    </div>
  );
}