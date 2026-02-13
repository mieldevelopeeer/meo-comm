import { useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, useForm } from '@inertiajs/react';

export default function Authenticated({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { post, processing } = useForm();

    const handleLogout = (e) => {
        e.preventDefault();
        setIsLoggingOut(true);
        
        post(route('logout'), {
            onFinish: () => setIsLoggingOut(false),
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Logout Loading Overlay */}
            {isLoggingOut && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm mx-4">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <svg 
                                    className="animate-spin h-16 w-16 text-indigo-600" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24"
                                >
                                    <circle 
                                        className="opacity-25" 
                                        cx="12" 
                                        cy="12" 
                                        r="10" 
                                        stroke="currentColor" 
                                        strokeWidth="4"
                                    />
                                    <path 
                                        className="opacity-75" 
                                        fill="currentColor" 
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-gray-900">Logging Out...</h3>
                            <p className="mt-2 text-sm text-gray-600 text-center">
                                Please wait while we securely log you out
                            </p>
                            <div className="mt-4 flex gap-1">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <nav className="bg-[#1e1b4b] border-b border-[#312e81]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14">
                        <div className="flex items-center space-x-8">
                            <div className="shrink-0 flex items-center">
                                <Link href="/">
                                    <ApplicationLogo className="h-8 w-8 text-white" />
                                </Link>
                            </div>

                            <div className="flex space-x-1">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${route().current('dashboard')
                                        ? 'text-white border-b-2 border-[#818cf8]'
                                        : 'text-[#a5b4fc] hover:text-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Dashboard
                                </NavLink>
                                <NavLink
                                    href={route('communications.index')}
                                    active={route().current('communications.*')}
                                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${route().current('communications.*')
                                        ? 'text-white border-b-2 border-[#818cf8]'
                                        : 'text-[#a5b4fc] hover:text-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Communications
                                </NavLink>
                                <NavLink
                                    href={route('file-records.index')}
                                    active={route().current('file-records.*')}
                                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${route().current('file-records.*')
                                        ? 'text-white border-b-2 border-[#818cf8]'
                                        : 'text-[#a5b4fc] hover:text-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    File Records
                                </NavLink>
                                <NavLink
                                    href={route('records.index')}
                                    active={route().current('records.*')}
                                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${route().current('records.*')
                                        ? 'text-white border-b-2 border-[#818cf8]'
                                        : 'text-[#a5b4fc] hover:text-white'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Reports
                                </NavLink>
                            </div>

                        </div>

                        <div className="hidden sm:flex sm:items-center">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#a5b4fc] hover:text-white transition-colors duration-150"
                                    >
                                        {user.name}
                                        <svg
                                            className="ms-2 h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <button
                                        onClick={handleLogout}
                                        disabled={processing || isLoggingOut}
                                        className="block w-full text-left px-4 py-2 text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing || isLoggingOut ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Logging out...
                                            </span>
                                        ) : (
                                            'Log Out'
                                        )}
                                    </button>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="inline-flex items-center justify-center p-2 text-[#a5b4fc] hover:text-white transition-colors duration-150"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden border-t border-[#312e81]'}>
                    <div className="pt-2 pb-3 space-y-1">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className={`block px-4 py-2 text-base font-medium transition-colors flex items-center gap-2 ${route().current('dashboard')
                                ? 'text-white bg-[#312e81]'
                                : 'text-[#a5b4fc] hover:text-white hover:bg-[#312e81]'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('communications.index')}
                            active={route().current('communications.*')}
                            className={`block px-4 py-2 text-base font-medium transition-colors flex items-center gap-2 ${route().current('communications.*')
                                ? 'text-white bg-[#312e81]'
                                : 'text-[#a5b4fc] hover:text-white hover:bg-[#312e81]'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Communications
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('file-records.index')}
                            active={route().current('file-records.*')}
                            className={`block px-4 py-2 text-base font-medium transition-colors flex items-center gap-2 ${route().current('file-records.*')
                                ? 'text-white bg-[#312e81]'
                                : 'text-[#a5b4fc] hover:text-white hover:bg-[#312e81]'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            File Records
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('records.index')}
                            active={route().current('records.*')}
                            className={`block px-4 py-2 text-base font-medium transition-colors flex items-center gap-2 ${route().current('records.*')
                                    ? 'text-white bg-[#312e81]'
                                    : 'text-[#a5b4fc] hover:text-white hover:bg-[#312e81]'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Reports
                        </ResponsiveNavLink>
                    </div>

                    <div className="pt-4 pb-1 border-t border-[#312e81]">
                        <div className="px-4 mb-3">
                            <div className="font-medium text-sm text-white">{user.name}</div>
                            <div className="text-xs text-[#a5b4fc]">{user.email}</div>
                        </div>

                        <div className="space-y-1">
                            <ResponsiveNavLink
                                href={route('profile.edit')}
                                className="block px-4 py-2 text-base font-medium text-[#a5b4fc] hover:text-white hover:bg-[#312e81] transition-colors"
                            >
                                Profile
                            </ResponsiveNavLink>
                            <button
                                onClick={handleLogout}
                                disabled={processing || isLoggingOut}
                                className="block w-full text-left px-4 py-2 text-base font-medium text-[#a5b4fc] hover:text-white hover:bg-[#312e81] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing || isLoggingOut ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Logging out...
                                    </span>
                                ) : (
                                    'Log Out'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main className="py-6">{children}</main>
        </div>
    );
}