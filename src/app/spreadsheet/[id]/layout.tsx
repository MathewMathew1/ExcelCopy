
import React from "react";
import { api } from "~/trpc/server";

export const findWorkbookWithCache = async (id: string) => {
  const workbook = await api.workbook.getById({ id });
  return workbook;
};


type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }) {
    const { id } = await params
  const workbook = await findWorkbookWithCache(id);

  return {
    title: workbook?.name || "Default Title",
  };
}

export interface RootLayoutProps {
  children: React.ReactNode;
  params: Params;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {

 
  return (
    <>
        {children}
    </>
  );
}
