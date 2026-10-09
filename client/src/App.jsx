import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import TemplatesPage from "./pages/TemplatesPage";
import FavoritesPage from "./pages/FavoritesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const [favoritesCount, setFavoritesCount] = useState(0);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
          <Navbar favoritesCount={favoritesCount} />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<TemplatesPage onFavoritesChange={setFavoritesCount} />} />
              <Route path="/templates" element={<TemplatesPage onFavoritesChange={setFavoritesCount} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Favorites Route (bonus: redirects if unauthenticated) */}
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage onFavoritesChange={setFavoritesCount} />
                  </ProtectedRoute>
                }
              />

              {/* 404 Not Found Catch-All */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <h2 className="text-4xl font-extrabold text-white mb-2">404</h2>
                    <p className="text-sm text-slate-400 mb-6">Oops! The page you were looking for does not exist.</p>
                    <Navigate to="/templates" replace />
                  </div>
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
