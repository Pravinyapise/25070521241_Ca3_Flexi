import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.startsAt <= new Date()) return res.status(400).json({ message: 'Registration is closed because this event has started' });

  const existing = await Registration.findOne({ event: event._id, user: req.user._id });
  if (existing?.status === 'registered') return res.status(409).json({ message: 'You are already registered for this event' });

  const count = await Registration.countDocuments({ event: event._id, status: 'registered' });
  if (count >= event.capacity) return res.status(409).json({ message: 'This event is full' });

  let registration;
  if (existing) {
    existing.status = 'registered';
    registration = await existing.save();
  } else {
    registration = await Registration.create({ event: event._id, user: req.user._id, status: 'registered' });
  }
  res.status(201).json({ message: 'Registration successful', registration });
});

export const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findOne({ event: req.params.eventId, user: req.user._id, status: 'registered' });
  if (!registration) return res.status(404).json({ message: 'Active registration not found' });
  registration.status = 'cancelled';
  await registration.save();
  res.json({ message: 'Registration cancelled' });
});

export const myRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('event', 'title category venue startsAt endsAt imageUrl capacity')
    .lean();
  res.json({ registrations });
});
