import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type AttachmentDocument = HydratedDocument<Attachment>;
@Schema({ timestamps: true, versionKey: false })
export class Attachment {
  @Prop({ required: true, type: Types.ObjectId, index: true }) incidentId!: Types.ObjectId;
  @Prop({ required: true, type: String }) uploaderUserId!: string;
  @Prop({ required: true, type: String }) bucket!: string;
  @Prop({ required: true, type: String, unique: true }) objectPath!: string;
  @Prop({ required: true, type: String, maxlength: 255 }) originalFilename!: string;
  @Prop({ required: true, type: String }) mimeType!: string;
  @Prop({ required: true, min: 1, max: 10485760 }) sizeBytes!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
AttachmentSchema.index({ incidentId: 1, createdAt: -1 });
