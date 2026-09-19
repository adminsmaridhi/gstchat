import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Sign up with Smaridhi and get GST, Income Tax, Accounting, Bookkeeping and ROC compliance handled by dedicated experts with WhatsApp-first support.",
  alternates: { canonical: "/signup" },
  openGraph: {
    type: "website",
    url: "https://smaridhi.vercel.app/signup",
    title: "Create Account | Smaridhi",
    description:
      "Get started with Smaridhi — your Business, our Compliance. Choose a FREE or paid plan and get dedicated expert support.",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}