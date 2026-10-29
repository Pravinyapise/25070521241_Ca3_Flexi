import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const [
    totalUsers, totalEvents, activeRegistrations, upcomingEvents, categoryStats,
    recentRegistrations, eventStats
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Event.countDocuments(),
    Registration.countDocuments({ status: 'registered' }),
    Event.countDocuments({ startsAt: { $gte: now } }),
    Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Registration.find({ status: 'registered' }).sort({ createdAt: -1 }).limit(8)
      .populate('user', 'name email').populate('event', 'title startsAt').lean(),
    Registration.aggregate([
      { $match: { status: 'registered' } },
      { $group: { _id: '$event', registrations: { $sum: 1 } } },
      { $sort: { registrations: -1 } }, { $limit: 6 },
      { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $project: { _id: 0, title: '$event.title', registrations: 1, capacity: '$event.capacity' } }
    ])
  ]);
  res.json({
    summary: { totalUsers, totalEvents, activeRegistrations, upcomingEvents },
    categoryStats: categoryStats.map(x => ({ category: x._id, count: x.count })),
    recentRegistrations,
    eventStats
  });
});

export const listAllRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ status: 'registered' })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('event', 'title category venue startsAt')
    .lean();
  res.json({ registrations });
});

export const exportRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ status: 'registered' })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('event', 'title category venue startsAt')
    .lean();

  const cell = value => `"${String(value ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
  const rows = [
    ['Student name', 'Email', 'Event', 'Category', 'Venue', 'Event start', 'Registered at'],
    ...registrations.map(r => [
      r.user?.name, r.user?.email, r.event?.title, r.event?.category, r.event?.venue,
      r.event?.startsAt ? new Date(r.event.startsAt).toISOString() : '',
      r.createdAt ? new Date(r.createdAt).toISOString() : ''
    ])
  ];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="campusconnect-registrations.csv"');
  res.send(rows.map(row => row.map(cell).join(',')).join('\r\n'));
});
