import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import AppWrapper from "./components/app-wrapper";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SidebarProvider>
      <AppWrapper>
        <AppSidebar />
        <App />
      </AppWrapper>
    </SidebarProvider>
  </React.StrictMode>,
);
