import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApplication extends Document {
    userId: mongoose.Types.ObjectId;
    jobId: string;
    company: string;
    role: string;
    status: string;
    appliedAt: Date;
}

const ApplicationSchema: Schema<IApplication> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        jobId: {
            type: String,
            required: true,
        },
        company: {
            type: String,
            default: 'Unknown',
        },
        role: {
            type: String,
            default: 'Unknown',
        },
        status: {
            type: String,
            default: 'Applied',
        },
        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const Application: Model<IApplication> =
    mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;
