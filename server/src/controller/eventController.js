import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const categories = ['Technology', 'Cultural', 'Workshop', 'Sports', 'Business', 'Other'];

function validateEvent(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const category = String(body.category || '');
  const venue = String(body.venue || '').trim();
  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  const capacity = Number(body.capacity);
  const imageUrl = String(body.imageUrl || '').trim();

  if (title.length < 3 || title.length > 120) throw Object.assign(new Error('Title must be 3–120 characters'), { status: 400 });
  if (description.length < 10 || description.length > 5000) throw Object.assign(new Error('Description must be 10–5000 characters'), { status: 400 });
  if (!categories.includes(category)) throw Object.assign(new Error('Choose a valid category'), { status: 400 });
  if (venue.length < 2 || venue.length > 180) throw Object.assign(new Error('Venue must be 2–180 characters'), { status: 400 });
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) throw Object.assign(new Error('End time must be after start time'), { status: 400 });
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) throw Object.assign(new Error('Capacity must be a whole number from 1 to 100000'), { status: 400 });
  if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) throw Object.assign(new Error('Image URL must start with http:// or https://'), { status: 400 });
  return { title, description, category, venue, startsAt, endsAt, capacity, imageUrl };
}

export const listEvents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit || '12', 10) || 12));
  const search = String(req.query.search || '').trim().slice(0, 100);
  const category = String(req.query.category || '');
  const filter = {};
  if (search) filter.$or = [
    { title: { $regex: escapeRegex(search), $options: 'i' } },
    { description: { $regex: escapeRegex(search), $options: 'i' } },
    { venue: { $regex: escapeRegex(search), $options: 'i' } }
  ];
  if (categories.includes(category)) filter.category = category;

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startsAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Event.countDocuments(filter)
  ]);
  const ids = events.map(e => e._id);
  const counts = await Registration.aggregate([
    { $match: { event: { $in: ids }, status: 'registered' } },
    { $group: { _id: '$event', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map(c => [String(c._id), c.count]));
  res.json({
    events: events.map(e => ({ ...e, registeredCount: countMap.get(String(e._id)) || 0 })),
    page, pages: Math.ceil(total / limit), total
  });
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const registeredCount = await Registration.countDocuments({ event: event._id, status: 'registered' });
  res.json({ event: { ...event, registeredCount } });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...validateEvent(req.body), createdBy: req.user._id });
  res.status(201).json({ event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const data = validateEvent(req.body);
  const registeredCount = await Registration.countDocuments({ event: event._id, status: 'registered' });
  if (data.capacity < registeredCount) return res.status(400).json({ message: `Capacity cannot be below the ${registeredCount} active registrations` });
  Object.assign(event, data);
  await event.save();
  res.json({ event });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  await Promise.all([
    Registration.deleteMany({ event: event._id }),
    event.deleteOne()
  ]);
  res.json({ message: 'Event and its registrations deleted' });
});
