import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    let user = null;
    try {
        const db = await dbConnect();
        if (db) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user = await User.findById((session.user as any).id).lean();
        }
    } catch (e) {
        console.error("Profile Fetch Error", e);
    }

    if (!user) {
        // Mock User if DB failed
        user = {
            name: session.user?.name || 'Test User',
            experience: 0,
            skills: [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            email: session.user?.email
        } as any;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Profile</h1>
            <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
                <ProfileForm user={JSON.parse(JSON.stringify(user))} />
            </div>
        </div>
    );
}
