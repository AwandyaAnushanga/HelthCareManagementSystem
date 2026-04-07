const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { sendEmail } = require('../config/mailer');
const NotificationTemplate = require('../models/NotificationTemplate');

// ─── Get User Notifications (paginated) ─────────────────
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly, type } = req.query;
    const filter = { userId: req.user.userId };
    if (unreadOnly === 'true') filter.isRead = false;
    if (type) filter.type = type;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.getUnreadCount(req.user.userId);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Mark Single as Read ────────────────────────────────
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// ─── Mark All as Read ───────────────────────────────────
exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read', modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

// ─── Archive a Notification ─────────────────────────────
exports.archiveNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isArchived: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// ─── Delete a Notification ──────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Send a Notification ─────────────────────────
exports.sendNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notification = await Notification.createNotification({
      userId: req.body.userId,
      userRole: req.body.userRole,
      email: req.body.email,
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      htmlContent: req.body.htmlContent,
      data: req.body.data || {},
      channel: req.body.channel || 'both',
      priority: req.body.priority || 'normal',
    });

    // Attempt email delivery if channel includes email
    if (['email', 'both'].includes(notification.channel) && req.body.email) {
      try {
        await sendEmail(req.body.email, req.body.title, req.body.htmlContent || req.body.message);
        notification.deliveryAttempts.push({
          channel: 'email',
          status: 'success',
          attemptedAt: new Date(),
        });
      } catch (emailErr) {
        notification.deliveryAttempts.push({
          channel: 'email',
          status: 'failed',
          attemptedAt: new Date(),
          errorMessage: emailErr.message,
        });
      }
      await notification.save();
    }

    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get All Notifications (system-wide) ─────────
exports.getAllNotifications = async (req, res, next) => {
  try {
    const { type, channel, priority, userId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (channel) filter.channel = channel;
    if (priority) filter.priority = priority;
    if (userId) filter.userId = userId;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get Notification Stats ──────────────────────
exports.getNotificationStats = async (req, res, next) => {
  try {
    const [byType, byChannel, byPriority, totalCount] = await Promise.all([
      Notification.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Notification.aggregate([{ $group: { _id: '$channel', count: { $sum: 1 } } }]),
      Notification.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Notification.countDocuments(),
    ]);

    const unreadTotal = await Notification.countDocuments({ isRead: false });

    res.json({
      total: totalCount,
      unread: unreadTotal,
      byType,
      byChannel,
      byPriority,
    });
  } catch (err) {
    next(err);
  }
};
