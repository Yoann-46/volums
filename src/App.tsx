import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ApptDetail from "./pages/ApptDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./admin/AuthContext";
import { RequireAuth } from "./admin/RequireAuth";
import { AdminLayout } from "./admin/AdminLayout";
import Login from "./admin/pages/Login";
import PropertyList from "./admin/pages/PropertyList";
import PropertyEdit from "./admin/pages/PropertyEdit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/appartements/:slug" element={<ApptDetail />} />

            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<PropertyList />} />
              <Route path="properties" element={<PropertyList />} />
              <Route path="properties/new" element={<PropertyEdit />} />
              <Route path="properties/:id" element={<PropertyEdit />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
