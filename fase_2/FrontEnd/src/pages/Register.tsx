import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleRegister = (e: FormEvent) => {
        e.preventDefault();
        if (name === '' || email === '' || password === '') {
            alert('⚠️ Por favor, complete todos los campos.');
            return;
        }
        alert(`✅ ¡Registro exitoso, ${name}! Ahora puedes iniciar sesión.`);
        navigate('/login'); // Redirige a la página de login
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="bg-gray-100 flex items-center justify-center min-h-screen">
            <div className="flex flex-col md:flex-row bg-white shadow-xl rounded-2xl w-full max-w-5xl overflow-hidden">
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-8">
                        <img src="https://dummyimage.com/50x50/004aad/ffffff.png&text=IP" alt="InventPro" className="w-10 h-10 rounded-full" />
                        <span className="text-xl font-bold text-blue-600">Invent Pro</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Crear una cuenta</h1>
                    <p className="text-md text-gray-500 mb-8">Regístrate para comenzar a gestionar tu inventario.</p>
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                required
                                minLength={6}
                                placeholder="***********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                            />
                            <span onClick={togglePasswordVisibility} className="toggle-password absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600">
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.135 0 2.222.17 3.25.474m-4.625 10.35A1.05 1.05 0 0112 15c-1.657 0-3-1.343-3-3s1.343-3 3-3a1.05 1.05 0 011.05.775m-1.05 2.15a1.05 1.05 0 01-1.05-1.05V12a.95.95 0 01.95-.95h1.1a.95.95 0 01.95.95v1.1a.95.95 0 01-.95.95z" /><path d="M15.825 8.175A10.05 10.05 0 0117 8c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-1.135 0-2.222-.17-3.25-.474m4.625-10.35a1.05 1.05 0 01-1.05 1.05v-1.1a.95.95 0 01.95-.95h1.1a.95.95 0 01.95.95v1.1a.95.95 0 01-.95.95z" transform="rotate(180 14 12)"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </span>
                        </div>
                        <div>
                            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-colors">
                                Registrarse
                            </button>
                        </div>
                    </form>
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta? <a href="/login" className="text-blue-600 font-medium hover:underline">Inicia sesión</a>
                        </p>
                    </div>
                </div>
                <div className="hidden md:block w-1/2 bg-cover bg-center" style={{ backgroundImage: `url('http://googleusercontent.com/image_collection/image_retrieval/6197982503736389802_0')` }} />
            </div>
        </div>
    );
};

export default Register;