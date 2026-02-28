import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, experience, skills, preferredLocation, onboardingComplete } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    try {
        const db = await dbConnect();
        if (!db) {
            return NextResponse.json({
                _id: userId, name, experience, skills, preferredLocation, onboardingComplete
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, experience, skills, preferredLocation, onboardingComplete },
            { new: true }
        );

        return NextResponse.json(updatedUser);
    } catch (e) {
        console.error("Profile Update Error", e);
        return NextResponse.json({
            _id: userId, name, experience, skills, preferredLocation, onboardingComplete
        });
    }
}
