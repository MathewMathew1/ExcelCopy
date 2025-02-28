import "../styles/globals.css";
import { auth } from "~/server/auth";
import {HydrateClient } from "~/trpc/server";
import CreateWorkbookButton from "./components/CreateWorkBookButton";
import UserWorkbooks from "./components/UserWorkbooks";
import Link from "next/link";

async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      {session?.user ? (
        <>
          <div className="glass flex flex-col items-center">
        
            <CreateWorkbookButton />
          </div>
          <UserWorkbooks />
        </>
      ) : (
        
        <div className="flex flex-col items-center justify-center h-screen text-center p-6">
        
          <h1 className="text-3xl font-bold">Welcome to Excello</h1>
          <p className="text-gray-600 mt-2 max-w-md">
            Excello is a powerful online spreadsheet tool inspired by Excel. Create, edit, and manage your workbooks effortlessly.
          </p>
          <Link href="/login">
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Log in to get started
            </button>
          </Link>
        </div>
      )}
    </HydrateClient>
  );
}

export default Home;

