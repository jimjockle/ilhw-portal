import "./globals.css";

export const metadata = {
  title: "I Live Here Westchester — Business Portal",
  description: "Claim and manage your business listing on I Live Here Westchester. Control how the chatbot represents your business to the community.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "I Live Here Westchester — Business Portal",
    description: "See how your business appears to Westchester residents. Claim your listing and take control.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
