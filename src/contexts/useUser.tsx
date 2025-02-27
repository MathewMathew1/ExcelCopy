"use client";
import React, { createContext, useContext, useState } from "react";
import { api } from "~/trpc/react";
import { UserData } from "~/types/User";
import { useSession } from "next-auth/react";

export interface UserContextProps {
  userData?: UserData | null;
}

const UserContext = createContext<UserContextProps>({} as UserContextProps);

export function useUser() {
  return useContext(UserContext);
}

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession(); // Check user session
  const isLoggedIn = status === "authenticated";

  const { data: userData } = api.user.getData.useQuery(undefined, {
    enabled: isLoggedIn, 
  });

  return (
    <UserContext.Provider value={{ userData }}>
      {children}
    </UserContext.Provider>
  );
};
