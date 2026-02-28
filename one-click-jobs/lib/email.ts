import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ApplicationEmailData {
    userEmail: string;
    userName: string;
    company: string;
    role: string;
    applyLink?: string;
}

export async function sendApplicationConfirmation(data: ApplicationEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("No RESEND_API_KEY - skipping email");
        return { success: false, error: "No API key" };
    }

    try {
        const { data: result, error } = await resend.emails.send({
            from: 'One-Click Jobs <onboarding@resend.dev>', // Use verified domain in production
            to: data.userEmail,
            subject: `✅ Application Submitted: ${data.role} at ${data.company}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1e293b; margin: 0;">🎉 Application Submitted!</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; color: white; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 10px 0; font-size: 24px;">${data.role}</h2>
                        <p style="margin: 0; font-size: 18px; opacity: 0.9;">${data.company}</p>
                    </div>
                    
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                        <p style="color: #475569; margin: 0 0 15px 0; line-height: 1.6;">
                            Hi ${data.userName || 'there'}! 👋
                        </p>
                        <p style="color: #475569; margin: 0 0 15px 0; line-height: 1.6;">
                            Your application for <strong>${data.role}</strong> at <strong>${data.company}</strong> has been recorded.
                        </p>
                        <p style="color: #475569; margin: 0; line-height: 1.6;">
                            We've saved this to your profile so you can track all your applications in one place.
                        </p>
                    </div>
                    
                    ${data.applyLink && data.applyLink !== '#' ? `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${data.applyLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                            View Job Posting →
                        </a>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                            Good luck with your interview! 🚀
                        </p>
                        <p style="color: #cbd5e1; font-size: 12px; margin: 10px 0 0 0;">
                            One-Click Jobs • Your shortcut to dream jobs
                        </p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error };
        }

        console.log("Email sent:", result);
        return { success: true, id: result?.id };
    } catch (e) {
        console.error("Email send failed:", e);
        return { success: false, error: e };
    }
}
