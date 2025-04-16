import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { TRPCReactProvider } from "~/trpc/react";
import { Navbar } from "./components/Navbar";
import { SessionProvider } from "next-auth/react";
import { auth } from "~/server/auth";
import ToastContainer from "./components/ToastContainer";
import ToastProvider from "~/contexts/useToast";
import { UserDataProvider } from "~/contexts/useUser";


export const metadata: Metadata = {
  title: "Excello",
  description: "Copy of Excel",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    console.error("Error fetching session:", error);
  }

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="bg-slate-100">
        <TRPCReactProvider>
          <SessionProvider session={session}>
            <ToastProvider>
              <UserDataProvider>
                <Navbar />
  
                {children} 
               
                <ToastContainer />
              </UserDataProvider>
            </ToastProvider>
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

