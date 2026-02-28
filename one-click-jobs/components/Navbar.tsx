'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User } from 'lucide-react';

interface NavbarProps {
    onProfileClick?: () => void;
}

export default function Navbar({ onProfileClick }: NavbarProps) {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-[#4a6b5d] border-b border-[#3b554a] shadow-md">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="font-bold text-2xl tracking-tight flex items-center gap-0.5">
                                <span className="text-blue-200">Hire</span>
                                <span className="text-green-200">Inn</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        {session ? (
                            <>
                                <button
                                    onClick={onProfileClick}
                                    className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </button>
                                <button
                                    onClick={() => signOut()}
                                    className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center justify-center px-5 py-2 text-sm font-bold rounded-full text-black bg-white hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
