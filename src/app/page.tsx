import "../styles/globals.css";
import { auth } from "~/server/auth";
import {HydrateClient } from "~/trpc/server";
import CreateWorkbookButton from "./components/CreateWorkBookButton";
import UserWorkbooks from "./components/UserWorkbooks";

import LoginPageButton from "./components/MainPage/LoginPageButton"

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
         
            <LoginPageButton/>
   
        </div>
      )}
    </HydrateClient>
  );
}

export default Home;

