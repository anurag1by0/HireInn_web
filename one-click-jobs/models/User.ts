import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    name?: string;
    experience?: number;
    skills?: string[];
    preferredLocation?: string;
    resumeUrl?: string;
    image?: string;
    googleId?: string;
    onboardingComplete?: boolean;
    skillLevel?: string;
    primaryRole?: string;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: false,
        },
        name: {
            type: String,
        },
        experience: {
            type: Number, // Years of experience
            default: 0,
        },
        skillLevel: {
            type: String, // e.g. "Entry", "Mid-Senior", "Director"
        },
        primaryRole: {
            type: String, // e.g. "Backend Engineer"
        },
        skills: {
            type: [String],
            default: [],
        },
        preferredLocation: {
            type: String, // "Remote", "Bangalore", etc.
            default: 'Any',
        },
        resumeUrl: {
            type: String,
        },
        image: {
            type: String,
        },
        googleId: {
            type: String,
        },
        onboardingComplete: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
