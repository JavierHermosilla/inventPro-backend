import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState<string>('');
    const navigate = useNavigate();

    const handleForgotPassword = (e: FormEvent) => {
        e.preventDefault();
        if (email === '') {
            alert('⚠️ Por favor, ingrese su correo electrónico.');
            return;
        }
        alert(`✅ Se ha enviado un enlace de recuperación a ${email}. ¡Revise su bandeja de entrada!`);
        navigate('/reset_password'); // Redirige a la siguiente pantalla
    };

    return (
        <div className="bg-gray-100 flex items-center justify-center min-h-screen">
            <div className="flex flex-col md:flex-row bg-white shadow-xl rounded-2xl w-full max-w-5xl overflow-hidden">
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-8">
                        <img src="https://dummyimage.com/50x50/004aad/ffffff.png&text=IP" alt="InventPro" className="w-10 h-10 rounded-full" />
                        <span className="text-xl font-bold text-blue-600">Invent Pro</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">¿Olvidaste tu contraseña?</h1>
                    <p className="text-md text-gray-500 mb-8">Por favor, ingrese la dirección de correo electrónico vinculada a esta cuenta.</p>
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                required
                                placeholder="Ingrese su correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-colors">
                            Enviar Enlace de Recuperación
                        </button>
                    </form>
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            <a href="/login" className="text-blue-600 font-medium hover:underline">Volver a iniciar sesión</a>
                        </p>
                    </div>
                </div>
                <div className="hidden md:block w-1/2 bg-cover bg-center" style={{ backgroundImage: `url('http://googleusercontent.com/image_collection/image_retrieval/12571306444540190582_0')` }} />
            </div>
        </div>
    );
};

export default ForgotPassword;