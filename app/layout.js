import "./globals.css";

export const metadata = {
  title: "I Live Here Westchester — Business Portal",
  description: "Manage your business listing on I Live Here Westchester",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
