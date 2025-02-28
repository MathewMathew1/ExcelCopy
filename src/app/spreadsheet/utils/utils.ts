import { api } from "~/trpc/server";
import type React from "react";

export const findWorkbookWithCache = async (id: string) => {
  const workbook = await api.workbook.getById({ id });
  return workbook;
};

export interface RootLayoutProps {
  children: React.ReactNode;
  params: Params;
}

export interface PageLayoutProps {
  params: Params;
}

export type Params = Promise<{ id: string }>
