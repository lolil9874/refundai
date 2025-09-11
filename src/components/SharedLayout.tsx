import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollGlassEffect } from "./ScrollGlassEffect";

export const SharedLayout = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <ScrollGlassEffect />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};