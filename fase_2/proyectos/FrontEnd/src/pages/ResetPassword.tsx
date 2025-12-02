import { Link } from "react-router-dom";
import logoInventPro from "../assets/logo-invent-pro.png";

const ResetPassword = () => {
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen font-sans">
      <div className="flex flex-col md:flex-row bg-white shadow-xl rounded-2xl w-full max-w-4xl overflow-hidden">
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <img
              src={logoInventPro}
              alt="Invent Pro"
              className="w-11 h-11 object-contain rounded-md bg-white shadow-sm border border-blue-100"
            />
            <div className="leading-5">
              <span className="block text-xl font-bold text-blue-600">Invent Pro</span>
              <span className="block text-xs text-gray-500">Plataforma interna para empresas.</span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-800">Restablecimiento con soporte</h1>
            <p className="mt-2 text-sm text-gray-600">
              Este portal no permite cambiar contrasenas directamente. Solicita el restablecimiento al administrador de
              sistemas de tu empresa para que genere una nueva clave.
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Tu administrador es el unico autorizado para crear, desactivar o restablecer accesos.
          </div>

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
          >
            Volver al inicio de sesion
          </Link>
        </div>

        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-red-500 text-white relative">
          <div className="absolute inset-6 rounded-3xl border border-white/20" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-10 py-12 gap-4">
            <p className="text-3xl font-semibold tracking-wide">Clave via administrador</p>
            <p className="text-sm text-blue-50">Contacta a TI para generar una nueva clave de acceso.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
