import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ApptDetail from "./pages/ApptDetail.tsx";
import AppartementsList from "./pages/AppartementsList.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./admin/AuthContext";
import { RequireAuth } from "./admin/RequireAuth";
import { AdminLayout } from "./admin/AdminLayout";
import Login from "./admin/pages/Login";
import PropertyList from "./admin/pages/PropertyList";
import PropertyEdit from "./admin/pages/PropertyEdit";
import Dashboard from "./admin/pages/Dashboard";
import BookingsList from "./admin/pages/BookingsList";
import BookingEdit from "./admin/pages/BookingEdit";
import Calendar from "./admin/pages/Calendar";
import AirbnbImport from "./admin/pages/AirbnbImport";
import BookingConfirmation from "./pages/BookingConfirmation";
import { LangProvider } from "./i18n/LangContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LangProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/appartements" element={<AppartementsList />} />
              <Route path="/appartements/:slug" element={<ApptDetail />} />
              <Route path="/booking/:bookingId" element={<BookingConfirmation />} />

              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="properties" element={<PropertyList />} />
                <Route path="properties/new" element={<PropertyEdit />} />
                <Route path="properties/:id" element={<PropertyEdit />} />
                <Route path="bookings" element={<BookingsList />} />
                <Route path="bookings/new" element={<BookingEdit />} />
                <Route path="bookings/:id" element={<BookingEdit />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="import-airbnb" element={<AirbnbImport />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LangProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
