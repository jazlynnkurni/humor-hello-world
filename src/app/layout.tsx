import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Cursor } from "@/components/cursor";

/* self-hosted: a build that fetches from Google Fonts can fail on their side,
   which is what took down one automatic deployment. The variable file covers
   every weight the site uses. */
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-Variable.woff2",
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Columbia Jokes", template: "%s · Columbia Jokes" },
  description: "The jokes that never made it past Sidechat, printed on paper.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){try{if(localStorage.getItem('theme'))return}catch(x){}document.documentElement.setAttribute('data-theme',e.matches?'dark':'light');dispatchEvent(new CustomEvent('themechange'))});`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
        <Cursor />
      </body>
    </html>
  );
}
