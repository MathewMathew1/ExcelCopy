import type { Params, RootLayoutProps } from "../utils/utils";
import { findWorkbookWithCache } from "../utils/utils";

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params; 
  const workbook = await findWorkbookWithCache(id);

  return {
    title: workbook?.name ?? "Default Title",
  };
}

export default async function RootLayout({
  children,
}: RootLayoutProps) {

 
  return (
    <>
        {children}
    </>
  );
}
