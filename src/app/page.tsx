import { SessionProvider } from "next-auth/react";

import "../styles/globals.css";
import Head from "next/head";
import { Navbar } from "./components/Navbar";
import ToastProvider from "../contexts/useToast";
import ToastContainer from "./components/ToastContainer";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import CreateWorkbookButton from "./components/CreateWorkBookButton";
import RootLayout from "./layout";



async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <div className="glass"><CreateWorkbookButton/></div>
    </HydrateClient>

  );
}

export default Home
