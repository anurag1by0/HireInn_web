'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import ProfileSidebar from '@/components/ProfileSidebar';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <Navbar onProfileClick={() => setSidebarOpen(true)} />
            <ProfileSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                session={session}
            />
            <main className="min-h-screen">
                {children}
            </main>
        </>
    );
}
