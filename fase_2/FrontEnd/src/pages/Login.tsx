import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { showError, showSuccess, showWarning } from "../lib/alerts";

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirige al usuario si ya esta autenticado
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      await showWarning({
        title: "Campos incompletos",
        text: "Ingresa tu correo y contraseña.",
      });
      return;
    }

    try {
      await login(trimmedEmail, trimmedPassword);
      await showSuccess({
        title: "Bienvenido",
        text: "Inicio de sesión exitoso.",
        timer: 1500,
        confirmButtonText: "Ir al panel",
      });
      setEmail("");
      setPassword("");
      setShowPassword(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("[login] autenticaci?n fallida", err);
      await showError({
        title: "Credenciales inválidas",
        text: "Correo o contraseña incorrectos. Intenta nuevamente.",
      });
    }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen font-sans antialiased">
      <div className="flex flex-col md:flex-row bg-white shadow-xl rounded-2xl w-full max-w-5xl overflow-hidden">
        {/* Lado izquierdo (Formulario) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <img src="https://dummyimage.com/50x50/004aad/ffffff.png&text=IP" alt="InventPro" className="w-10 h-10 rounded-full" />
            <span className="text-xl font-bold text-blue-600">Invent Pro</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">Iniciar sesión</h1>
          <p className="text-md text-gray-500 mb-8">Bienvenido de nuevo. Ingresa tus credenciales.</p>

          <form onSubmit={handleLogin} noValidate className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 pr-10"
                />
                <span
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={handleTogglePassword}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.135 0 2.222.17 3.25.474m-4.625 10.35A1.05 1.05 0 0112 15c-1.657 0-3-1.343-3-3s1.343-3 3-3a1.05 1.05 0 011.05.775m-1.05 2.15a1.05 1.05 0 01-1.05-1.05V12a.95.95 0 01.95-1h.1a.95.95 0 01.95.95v1.05a1.05 1.05 0 01-1.05 1.05z" />
                    )}
                  </svg>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        {/* Lado derecho (Imagen) */}
        <div className="hidden md:block w-1/2 overflow-hidden relative">
          <img
            src="https://dummyimage.com/1000x1000/004aad/ffffff.png&text=Invent+Pro"
            alt="Invent Pro"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;

