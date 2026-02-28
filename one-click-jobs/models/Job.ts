import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJob extends Document {
    job_id: string;
    company: string;
    role: string;
    experience: string;
    description: string;
    qualification?: string;
    location: string;
    is_remote: boolean; // mapped to isRemote in UI
    type: string;
    salary?: string;
    url: string;
    posted_at: Date;
    expire_at: Date;
}

const JobSchema: Schema = new Schema({
    job_id: { type: String, required: true, unique: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    experience: { type: String, default: "Not specified" },
    description: { type: String, required: true },
    qualification: { type: String },
    location: { type: String },
    is_remote: { type: Boolean, default: false },
    type: { type: String, default: 'Full-time' },
    salary: { type: String },
    url: { type: String },
    posted_at: { type: Date, default: Date.now },
    expire_at: { type: Date, required: true }
});

// Create a TTL index on the expire_at field
JobSchema.index({ expire_at: 1 }, { expireAfterSeconds: 0 });
JobSchema.index({ posted_at: -1 });

// Verify if model exists before creating to prevent overwrite errors in dev
const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

export default Job;
