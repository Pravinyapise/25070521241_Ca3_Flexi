import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  category: { type: String, required: true, enum: ['Technology', 'Cultural', 'Workshop', 'Sports', 'Business', 'Other'] },
  venue: { type: String, required: true, trim: true, maxlength: 180 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1, max: 100000 },
  imageUrl: { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

eventSchema.index({ startsAt: 1, category: 1 });
export default mongoose.model('Event', eventSchema);
