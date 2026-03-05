import React, { useState, useEffect } from "react";
import Navbar from "./components/nav";
import Footer from "./components/Footer";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import HomePage from "./components/HomePage";
import CategoryPage from "./components/CategoryPage";
import ProductPage from "./components/ProductPage";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import AccountPage from "./components/AccountPage";
import AboutPage from "./components/AboutPage";
import SupportPage from "./components/SupportPage";
import FAQPage from "./components/FAQPage";
import TermsPage from "./components/TermsPage";
import PrivacyPage from "./components/PrivacyPage";
import ShippingPolicyPage from "./components/ShippingPolicyPage";
import TrackingPage from "./components/TrackingPage";
import SpeedDialButton from "./components/SpeedDialButton";
import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import SearchPage from "./components/SearchPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import VerifyEmailPage from "./components/VerifyEmailPage";
import ThankYouPage from "./components/ThankYouPage";
import PromoLandingPage from "./components/PromoLandingPage";
import { useConfigStore } from "./store/configStore";
import { useCategoriesStore } from "./store/categoriesStore";

const queryClient = new QueryClient();

function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const fetchRate = useConfigStore(state => state.fetchRate);
  const setCategories = useCategoriesStore(state => state.setCategories);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    
    // Inicializar datos globales una sola vez
    Promise.all([
      fetchRate(apiUrl),
      fetch(`${apiUrl}/wc/categories`).then(r => r.json()).then(setCategories)
    ]).finally(() => {
      setIsAppLoading(false);
    });
  }, [fetchRate, setCategories]);

  return (
    <QueryClientProvider client={queryClient}>
      {isAppLoading && <LoadingScreen />}
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <SpeedDialButton />
          <main className="flex-grow">
            <ToastContainer position="bottom-right" autoClose={3000} />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify" element={<VerifyEmailPage />} />
              <Route path="/thanks" element={<ThankYouPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/envios" element={<ShippingPolicyPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/promo/:slug" element={<PromoLandingPage />} />
              <Route path="/categoria/:slug" element={<CategoryPage />} />
              <Route path="/producto/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;