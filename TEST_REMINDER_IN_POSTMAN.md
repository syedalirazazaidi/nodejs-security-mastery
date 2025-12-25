# How to Test Reminder in Postman

Step-by-step guide to test the reminder system when creating tasks.

---

## 🎯 Quick Test Method

### Step 1: Calculate Reminder Time

The cron job runs **every 5 minutes**, so set your reminder to trigger within the next 5 minutes.

**Example:**
- Current time: `11:55 AM`
- Set reminder to: `11:57 AM` or `12:00 PM`
- Cron job will check at: `12:00 PM` (next 5-minute mark)

---

## 📝 Step-by-Step Testing

### Step 1: Login and Get Token

**Request:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Copy the `accessToken` from response.**

---

### Step 2: Create Task with Reminder (Set to 2-5 Minutes from Now)

**Request:**
```
POST http://localhost:5000/api/tasks
Content-Type: application/json
Authorization: Bearer <your_accessToken>
```

**Body (IMPORTANT: Set reminder to 2-5 minutes from now):**

```json
{
  "title": "Test Reminder - Urgent Task",
  "description": "This is a test to verify reminder system works",
  "dueDate": "2025-01-15T12:30:00.000Z",
  "priority": "high",
  "reminderType": "custom",
  "reminder": "2025-01-15T12:05:00.000Z"
}
```

**⚠️ Important:**
- Replace `"2025-01-15T12:05:00.000Z"` with a time **2-5 minutes from now**
- Replace `"2025-01-15T12:30:00.000Z"` with a time **after the reminder time**

---

### Step 3: Calculate Correct Times

**Option A: Use JavaScript (in browser console or Node.js)**

```javascript
// Get current time
const now = new Date();
console.log('Current time:', now.toISOString());

// Reminder in 3 minutes
const reminderTime = new Date(now.getTime() + 3 * 60 * 1000);
console.log('Reminder time:', reminderTime.toISOString());

// Due date in 30 minutes (after reminder)
const dueTime = new Date(now.getTime() + 30 * 60 * 1000);
console.log('Due time:', dueTime.toISOString());
```

**Copy the output times into your Postman request.**

---

**Option B: Manual Calculation**

If current time is `11:55 AM`:
- Reminder: `11:58 AM` (3 minutes from now)
- Due date: `12:25 PM` (30 minutes from now)

Convert to ISO format:
- Reminder: `2025-01-15T11:58:00.000Z` (adjust date)
- Due date: `2025-01-15T12:25:00.000Z` (adjust date)

---

### Step 4: Send Request and Verify

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "...",
    "title": "Test Reminder - Urgent Task",
    "reminder": "2025-01-15T12:05:00.000Z",
    "reminderSent": false,
    ...
  }
}
```

**Check:**
- ✅ Status: `201 Created`
- ✅ `reminderSent`: `false` (not sent yet)
- ✅ `reminder` date matches what you set

---

### Step 5: Wait for Cron Job (Up to 5 Minutes)

The cron job runs every 5 minutes. Wait for the next 5-minute mark:

- If you sent at `11:57 AM`, cron runs at `12:00 PM`
- If you sent at `12:02 PM`, cron runs at `12:05 PM`

**Check server console for:**
```
⏰ Running reminder check...
📧 Found 1 tasks to send reminders for
✅ Reminder sent for task: Test Reminder - Urgent Task (User: your_email@example.com)
```

---

### Step 6: Check Mailtrap Inbox

1. Go to [Mailtrap.io](https://mailtrap.io)
2. Login to your account
3. Open your inbox
4. Look for email with subject: `🔔 Reminder: Test Reminder - Urgent Task`

**Email should contain:**
- Task title
- Description
- Due date
- Priority
- "View Task" button

---

### Step 7: Verify Reminder Was Sent

**Check Task Again:**
```
GET http://localhost:5000/api/tasks/<task_id>
Authorization: Bearer <your_accessToken>
```

**Response should show:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "reminderSent": true,  // ✅ Changed to true
    ...
  }
}
```

---

## 🚀 Faster Testing Method (Manual Trigger)

If you don't want to wait 5 minutes, you can manually trigger the reminder check:

### Option 1: Add Test Endpoint (Temporary)

Add this to `src/routes/task.routes.ts` (for testing only):

```typescript
import { triggerReminderCheck } from '../services/reminder.service';

// Test endpoint (remove in production)
router.post('/test-reminder', authenticate, async (req, res) => {
  await triggerReminderCheck();
  res.json({ success: true, message: 'Reminder check triggered' });
});
```

**Then call:**
```
POST http://localhost:5000/api/tasks/test-reminder
Authorization: Bearer <your_accessToken>
```

This immediately checks and sends reminders without waiting for cron.

---

### Option 2: Use Node.js Console

1. Open terminal in your project
2. Run:
```bash
node -e "require('./dist/services/reminder.service').triggerReminderCheck()"
```

---

## 📋 Complete Test Example

### Current Time: Let's say it's `11:55 AM` on `2025-01-15`

**1. Calculate Times:**
```javascript
// Reminder in 3 minutes: 11:58 AM
// Due date in 30 minutes: 12:25 PM
```

**2. Create Task:**
```json
{
  "title": "Test Reminder System",
  "description": "Testing if reminder email is sent",
  "dueDate": "2025-01-15T12:25:00.000Z",
  "priority": "high",
  "reminderType": "custom",
  "reminder": "2025-01-15T11:58:00.000Z"
}
```

**3. Wait until 12:00 PM** (next 5-minute mark)

**4. Check Mailtrap** - Email should arrive

**5. Verify task:**
```
GET http://localhost:5000/api/tasks/<task_id>
```
Check `reminderSent: true`

---

## 🧪 Test Scenarios

### Test 1: 1 Hour Reminder Type

```json
{
  "title": "Test 1 Hour Reminder",
  "dueDate": "2025-01-15T13:00:00.000Z",
  "reminderType": "1hour"
}
```

**Result:** Reminder calculated as `2025-01-15T12:00:00.000Z` (1 hour before)

**To test:** Set `dueDate` to 1 hour + 5 minutes from now, reminder will be sent in ~5 minutes.

---

### Test 2: 1 Day Reminder Type

```json
{
  "title": "Test 1 Day Reminder",
  "dueDate": "2025-01-16T10:00:00.000Z",
  "reminderType": "1day"
}
```

**Result:** Reminder calculated as `2025-01-15T10:00:00.000Z` (1 day before)

**To test:** Set `dueDate` to tomorrow, reminder will be sent today (if within 5-minute window).

---

### Test 3: Custom Reminder (Immediate Test)

```json
{
  "title": "Test Custom Reminder Now",
  "dueDate": "2025-01-15T12:30:00.000Z",
  "reminderType": "custom",
  "reminder": "2025-01-15T11:58:00.000Z"
}
```

**Set reminder to 2-5 minutes from now** for immediate testing.

---

## ✅ Verification Checklist

- [ ] Task created successfully (201 status)
- [ ] `reminder` field is set correctly
- [ ] `reminderSent` is `false` initially
- [ ] Wait for cron job (up to 5 minutes)
- [ ] Check server console for reminder logs
- [ ] Check Mailtrap inbox for email
- [ ] Verify email content is correct
- [ ] Check task again - `reminderSent` should be `true`

---

## 🐛 Troubleshooting

### Reminder Not Sent?

1. **Check cron job is running:**
   - Look for `✅ Reminder cron job started` in server console
   - Look for `⏰ Running reminder check...` every 5 minutes

2. **Check reminder time:**
   - Reminder must be in the future
   - Cron checks every 5 minutes, so reminder should be within next 5 minutes

3. **Check task status:**
   - Task must not be `completed`
   - Due date must be in the future

4. **Check user email:**
   - User email must be verified (`isEmailVerified: true`)
   - Check Mailtrap credentials in `.env`

5. **Check server logs:**
   - Look for errors in console
   - Check if email sending failed

---

## 💡 Pro Tips

1. **Set reminder to 3 minutes from now** - gives you time to verify task creation
2. **Use Mailtrap** - all emails go there, easy to check
3. **Watch server console** - see real-time reminder processing
4. **Test during development** - cron runs every 5 minutes, perfect for testing
5. **Use manual trigger** - for immediate testing without waiting

---

## 🎉 Success Indicators

✅ **Task Created:**
- Status: `201 Created`
- `reminder` field set correctly
- `reminderSent: false`

✅ **Reminder Sent:**
- Server console shows: `✅ Reminder sent for task: ...`
- Email appears in Mailtrap
- Task `reminderSent: true`

---

## 📚 Quick Reference

**Cron Schedule:** Every 5 minutes (`*/5 * * * *`)

**Reminder Window:** 5 minutes (reminder time to reminder time + 5 minutes)

**Email Provider:** Mailtrap (development) or real SMTP (production)

**Check Frequency:** Cron job automatically, or manually trigger for testing

---

You're ready to test! Follow the steps above and you'll see reminders working in action! 🚀

