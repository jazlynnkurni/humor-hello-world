import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Columbia Jokes", template: "%s · Columbia Jokes" },
  description: "The jokes that never made it past Sidechat, in print.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
