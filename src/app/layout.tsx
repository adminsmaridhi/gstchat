import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

const BASE = process.env.BASE_URL || "https://smaridhi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "SMRIDHI | Business Compliance & Tax Made Simple",
    template: "%s | SMRIDHI",
  },
  description:
    "SMRIDHI helps Indian businesses manage GST, Income Tax, Accounting, Bookkeeping and ROC compliance with dedicated expert support and WhatsApp-first communication.",
  keywords: [
    "GST registration",
    "GST filing",
    "income tax return",
    "tax filing India",
    "accounting services",
    "bookkeeping",
    "ROC compliance",
    "company registration",
    "CA services Bengaluru",
    "business compliance India",
  ],
  authors: [{ name: "SMRIDHI" }],
  creator: "SMRIDHI",
  publisher: "SMRIDHI",
  robots: { index: true, follow: true },
  alternates: { canonical: BASE },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE,
    siteName: "SMRIDHI",
    title: "SMRIDHI | Business Compliance & Tax Made Simple",
    description:
      "GST, Income Tax, Accounting, Bookkeeping and ROC compliance handled by professionals. Dedicated support for Indian businesses.",
    images: [
      {
        url: `${BASE}/logo.jpeg`,
        width: 295,
        height: 76,
        alt: "SMRIDHI — Business Compliance & Financial Services",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SMRIDHI | Business Compliance & Tax Made Simple",
    description:
      "GST, Income Tax, Accounting, Bookkeeping and ROC compliance handled by professionals.",
    images: [`${BASE}/logo.jpeg`],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a3d62",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${BASE}/#organization`,
        name: "SMRIDHI",
        url: BASE,
        logo: `${BASE}/logo.jpeg`,
        image: `${BASE}/logo.jpeg`,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Srinivasa, Flat No. 3, 3rd Floor, Whitefield",
          addressLocality: "Bengaluru",
          addressRegion: "Karnataka",
          postalCode: "560066",
          addressCountry: "IN",
        },
        telephone: "+919693959083",
        email: "hello@smaridhi.com",
        areaServed: "IN",
        priceRange: "₹₹",
        description:
          "Business Compliance & Financial Services for Indian businesses — GST, Income Tax, Accounting, Bookkeeping and ROC compliance with dedicated expert support.",
      },
      {
        "@type": "WebSite",
        "@id": `${BASE}/#website`,
        url: BASE,
        name: "SMRIDHI",
        publisher: { "@id": `${BASE}/#organization` },
        inLanguage: "en-IN",
      },
    ],
  };

  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}