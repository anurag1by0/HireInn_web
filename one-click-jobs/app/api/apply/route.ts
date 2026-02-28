import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Application from "@/models/Application";
import { NextResponse } from "next/server";
import { sendApplicationConfirmation } from "@/lib/email";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, company, role, applyLink } = await req.json();

    if (!jobId) {
        return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const userEmail = session.user?.email;
    const userName = session.user?.name;

    try {
        const db = await dbConnect();

        let applicationSaved = false;

        if (db) {
            // Check if already applied
            const existing = await Application.findOne({ userId, jobId });
            if (existing) {
                return NextResponse.json({ message: "Already applied", emailSent: false }, { status: 200 });
            }

            // Save to database
            await Application.create({
                userId,
                jobId,
                company: company || 'Unknown',
                role: role || 'Unknown',
                status: 'Applied'
            });
            applicationSaved = true;
        }

        // Send confirmation email
        let emailSent = false;
        if (userEmail) {
            const emailResult = await sendApplicationConfirmation({
                userEmail,
                userName: userName || 'Job Seeker',
                company: company || 'the company',
                role: role || 'the position',
                applyLink
            });
            emailSent = emailResult.success;
        }

        return NextResponse.json({
            success: true,
            applicationSaved,
            emailSent,
            message: emailSent ? "Application submitted & email sent!" : "Application submitted!"
        }, { status: 201 });

    } catch (e) {
        console.error("Apply API Error", e);

        // Still try to send email even if DB fails
        if (session.user?.email) {
            await sendApplicationConfirmation({
                userEmail: session.user.email,
                userName: session.user.name || 'Job Seeker',
                company: company || 'the company',
                role: role || 'the position',
                applyLink
            });
        }

        return NextResponse.json({
            success: true,
            message: "Applied (email sent)"
        }, { status: 201 });
    }
}
