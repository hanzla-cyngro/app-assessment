import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IncidentSeverity } from '../../common/enums/incident-severity.enum.js';
import { IncidentStatus } from '../../common/enums/incident-status.enum.js';

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ timestamps: true, versionKey: false })
export class Incident {
  @Prop({ required: true, trim: true, maxlength: 140 }) title!: string;
  @Prop({ required: true, enum: Object.values(IncidentSeverity), type: String }) severity!: IncidentSeverity;
  @Prop({ required: true, enum: Object.values(IncidentStatus), type: String, default: IncidentStatus.Open }) status!: IncidentStatus;
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
