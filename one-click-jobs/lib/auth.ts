import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        // Email/Password fallback
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const res = await fetch("http://localhost:8000/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password
                        })
                    });

                    if (!res.ok) {
                        return null;
                    }

                    const data = await res.json();

                    const userRes = await fetch("http://localhost:8000/api/auth/me", {
                        headers: { "Authorization": `Bearer ${data.access_token}` }
                    });

                    if (!userRes.ok) {
                        return null;
                    }

                    const userData = await userRes.json();

                    return {
                        id: userData.id,
                        email: userData.email,
                        name: userData.name || userData.email.split('@')[0],
                        accessToken: data.access_token
                    };

                } catch (e) {
                    console.error("Auth failed:", e);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // For Credentials sign-in
            if (user && account?.provider === "credentials") {
                token.id = user.id;
                token.accessToken = (user as any).accessToken;
            }
            // For Google sign-in
            else if (user && account?.provider === "google") {
                token.provider = "google";
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
                    const res = await fetch(`${apiUrl}/auth/google`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: user.email,
                            name: user.name,
                            google_id: user.id || account.providerAccountId
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        token.accessToken = data.access_token;
                        token.id = data.user.id;
                    } else {
                        throw new Error(`Google Auth Sync Failed: ${res.status}`);
                    }
                } catch (err) {
                    console.error("Failed Google Backend Sync:", err);
                    token.accessToken = account.access_token; // Original fallback
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id || token.sub;
                (session.user as any).accessToken = token.accessToken;
                (session.user as any).provider = token.provider;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/signin',
    }
};
