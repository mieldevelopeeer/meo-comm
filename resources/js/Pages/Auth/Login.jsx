    import { useEffect, useState } from 'react';
    import Checkbox from '@/Components/Checkbox';
    import InputError from '@/Components/InputError';
    import InputLabel from '@/Components/InputLabel';
    import PrimaryButton from '@/Components/PrimaryButton';
    import TextInput from '@/Components/TextInput';
    import { Head, Link, useForm } from '@inertiajs/react';

    export default function Login({ status, canResetPassword }) {
        const { data, setData, post, processing, errors, reset } = useForm({
            login: '',
            password: '',
            remember: false,
        });

        // ─────────────────────────────────────────────────────────────
        // Animation states
        // ─────────────────────────────────────────────────────────────
        const [animationPhase, setAnimationPhase] = useState('intro'); // 'intro', 'exit', 'login'

        useEffect(() => {
            const timer1 = setTimeout(() => setAnimationPhase('exit'), 2000);
            const timer2 = setTimeout(() => setAnimationPhase('login'), 2500);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                reset('password');
            };
        }, []);

        const submit = (e) => {
            e.preventDefault();
            post(route('login'));
        };

        return (
            <>
                <Head title="Log in" />

                <div className="relative min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] overflow-hidden">
                    {/* ─────────────────────────────────────────────── */}
                    {/* Intro – smaller logo, slides up and fades out   */}
                    {/* ─────────────────────────────────────────────── */}
                    <div
                        className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-700 transform ${
                            animationPhase === 'intro'
                                ? 'opacity-100 translate-y-0'
                                : animationPhase === 'exit'
                                ? 'opacity-0 -translate-y-16'
                                : 'opacity-0 -translate-y-16 pointer-events-none'
                        }`}
                    >
                        <div className="text-center">
                            {/* Smaller logo container – w-20 h-20 (was w-24 h-24) */}
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-6 shadow-lg shadow-[#818cf8]/30 overflow-hidden">
                                <img 
                                    src="/image/message.png" 
                                    alt="MEO Communication" 
                                    className="w-12 h-12 object-contain" /* reduced from w-16 h-16 */
                                />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">MEO</h1>
                            <p className="text-xl text-[#a5b4fc] font-medium">Communication</p>
                        </div>
                    </div>

                    {/* ─────────────────────────────────────────────── */}
                    {/* Login Form – more solid card, smaller logo      */}
                    {/* ─────────────────────────────────────────────── */}
                    <div
                        className={`absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8 transition-all duration-700 transform ${
                            animationPhase === 'login'
                                ? 'opacity-100 translate-y-0'
                                : animationPhase === 'exit'
                                ? 'opacity-0 translate-y-16'
                                : 'opacity-0 translate-y-16 pointer-events-none'
                        }`}
                    >
                        <div className="w-full max-w-md">
                            {/* Logo/Brand Section – smaller logo */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-xl mb-4 shadow-lg shadow-[#818cf8]/20 overflow-hidden">
                                    <img 
                                        src="/image/message.png" 
                                        alt="MEO Communication" 
                                        className="w-8 h-8 object-contain" /* reduced from w-10 h-10 */
                                    />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                                <p className="text-[#a5b4fc] text-sm">Sign in to your account to continue</p>
                            </div>

                            {/* Login Card – less transparent (more solid) */}
                            <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                                {status && (
                                    <div className="mb-4 font-medium text-sm text-[#818cf8] bg-[#818cf8]/10 border border-[#818cf8]/20 rounded-lg p-3">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="login" value="Email or Username" className="text-white text-sm font-medium mb-2" />
                                        <TextInput
                                            id="login"
                                            type="text"
                                            name="login"
                                            value={data.login || ''}
                                            className="mt-1 block w-full bg-white/5 border-white/20 text-white placeholder-[#a5b4fc]/50 rounded-lg focus:border-[#818cf8] focus:ring-[#818cf8] transition-all"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setData('login', e.target.value)}
                                            placeholder="you@example.com or username"
                                            required
                                        />
                                        <InputError message={errors.login} className="mt-2 text-red-300" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Password" className="text-white text-sm font-medium mb-2" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password || ''}
                                            className="mt-1 block w-full bg-white/5 border-white/20 text-white placeholder-[#a5b4fc]/50 rounded-lg focus:border-[#818cf8] focus:ring-[#818cf8] transition-all"
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <InputError message={errors.password} className="mt-2 text-red-300" />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center">
                                            <Checkbox
                                                name="remember"
                                                checked={data.remember || false}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="rounded border-white/20 bg-white/5 text-[#818cf8] focus:ring-[#818cf8]"
                                            />
                                            <span className="ms-2 text-sm text-[#a5b4fc]">Remember me</span>
                                        </label>

                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-sm text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>

                                    <PrimaryButton
                                        className="w-full justify-center bg-[#818cf8] hover:bg-[#6366f1] text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg shadow-[#818cf8]/20 hover:shadow-[#818cf8]/40"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Signing in...
                                            </span>
                                        ) : (
                                            'Sign in'
                                        )}
                                    </PrimaryButton>
                                </form>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-[#a5b4fc]">
                                        Don't have an account?{' '}
                                        <Link
                                            href={route('register')}
                                            className="text-[#818cf8] hover:text-white font-medium transition-colors"
                                        >
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-xs text-[#a5b4fc]/60">
                                    © 2026 MEO Communication. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }