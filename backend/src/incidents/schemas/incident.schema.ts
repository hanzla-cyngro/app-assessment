import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IncidentDocument = HydratedDocument<Incident>;
export const SEVERITIES = ['Low', 'Medium', 'Critical'] as const;
export const STATUSES = ['Open', 'In Progress', 'Resolved'] as const;
export type Severity = (typeof SEVERITIES)[number];
export type IncidentStatus = (typeof STATUSES)[number];

@Schema({ timestamps: true, versionKey: false })
export class Incident {
  @Prop({ required: true, trim: true, maxlength: 140 }) title!: string;
  @Prop({ required: true, enum: SEVERITIES, type: String }) severity!: Severity;
  @Prop({ required: true, enum: STATUSES, type: String, default: 'Open' }) status!: IncidentStatus;
  @Prop({ required: true, maxlength: 5000, default: '' }) description!: string;
  @Prop({ type: String, default: null, index: true }) assignedUserId!: string | null;
  @Prop({ required: true, type: String, index: true }) createdByUserId!: string;
  @Prop({ type: Date, default: null }) resolvedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
export const IncidentSchema = SchemaFactory.createForClass(Incident);
IncidentSchema.index({ status: 1, severity: 1, createdAt: -1 });
IncidentSchema.index({ updatedAt: -1 });
