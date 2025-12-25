# Postman Test - Create Task with Reminders

Ready-to-use Postman examples for creating tasks with different reminder types.

---

## 🔐 Step 1: Login First

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

**Response:** Copy the `accessToken` from the response.

---

## 📝 Step 2: Create Task

**Endpoint:**
```
POST http://localhost:5000/api/tasks
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_accessToken>
```

---

## 🎯 Test Payloads

### Payload 1: Task with 1 Hour Reminder

```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the API",
  "dueDate": "2025-01-20T15:00:00.000Z",
  "priority": "high",
  "reminderType": "1hour"
}
```

**What happens:**
- Task due: `2025-01-20T15:00:00.000Z`
- Reminder sent: `2025-01-20T14:00:00.000Z` (1 hour before)

---

### Payload 2: Task with 1 Day Reminder

```json
{
  "title": "Team meeting preparation",
  "description": "Prepare agenda and materials for team meeting",
  "dueDate": "2025-01-20T10:00:00.000Z",
  "priority": "medium",
  "reminderType": "1day"
}
```

**What happens:**
- Task due: `2025-01-20T10:00:00.000Z`
- Reminder sent: `2025-01-19T10:00:00.000Z` (1 day before)

---

### Payload 3: Task with Custom Reminder

```json
{
  "title": "Submit quarterly report",
  "description": "Complete and submit Q4 financial report to management",
  "dueDate": "2025-01-20T17:00:00.000Z",
  "priority": "high",
  "reminderType": "custom",
  "reminder": "2025-01-19T14:00:00.000Z"
}
```

**What happens:**
- Task due: `2025-01-20T17:00:00.000Z`
- Reminder sent: `2025-01-19T14:00:00.000Z` (custom time)

---

### Payload 4: Task Without Reminder

```json
{
  "title": "Update README file",
  "description": "Add new features to documentation",
  "dueDate": "2025-01-25T16:00:00.000Z",
  "priority": "low"
}
```

**What happens:**
- Task created without reminder
- No email will be sent

---

### Payload 5: Simple Task (Minimum Fields)

```json
{
  "title": "Buy groceries",
  "dueDate": "2025-01-15T18:00:00.000Z"
}
```

**What happens:**
- Task created with default priority (medium)
- No reminder set

---

### Payload 6: Complete Task (All Fields)

```json
{
  "title": "Finish project milestone",
  "description": "Complete all features for milestone 1, run tests, and deploy to staging",
  "dueDate": "2025-01-22T17:00:00.000Z",
  "priority": "high",
  "reminderType": "1day"
}
```

---

## 📋 Field Reference

| Field | Type | Required | Options | Description |
|-------|------|----------|---------|-------------|
| `title` | string | ✅ Yes | 1-200 chars | Task title |
| `description` | string | ❌ No | max 1000 chars | Task description |
| `dueDate` | string (ISO 8601) | ✅ Yes | Future date | Target completion date |
| `priority` | enum | ❌ No | `"low"`, `"medium"`, `"high"` | Task priority (default: `"medium"`) |
| `reminderType` | enum | ❌ No | `"1hour"`, `"1day"`, `"custom"` | Type of reminder |
| `reminder` | string (ISO 8601) | ❌ No | Date before dueDate | Custom reminder date (only if `reminderType` is `"custom"`) |

---

## ✅ Expected Success Response (201)

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation for the API",
    "dueDate": "2025-01-20T15:00:00.000Z",
    "priority": "high",
    "reminderType": "1hour",
    "reminder": "2025-01-20T14:00:00.000Z",
    "reminderSent": false,
    "status": "pending",
    "userId": "69497ebe4c4133110b9529ec",
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-10T08:00:00.000Z"
  }
}
```

---

## 🧪 Quick Test Scenarios

### Test 1: 1 Hour Reminder (Quick Test)

**Use this if you want to test reminder in ~1 hour:**

```json
{
  "title": "Test 1 Hour Reminder",
  "dueDate": "2025-01-15T12:00:00.000Z",
  "reminderType": "1hour"
}
```

Set `dueDate` to 1 hour from now, and reminder will be sent now (or within 5 minutes).

---

### Test 2: 1 Day Reminder

```json
{
  "title": "Test 1 Day Reminder",
  "dueDate": "2025-01-16T10:00:00.000Z",
  "reminderType": "1day"
}
```

Set `dueDate` to tomorrow, reminder will be sent today.

---

### Test 3: Custom Reminder (Test Now)

**Use this to test reminder immediately (within 5 minutes):**

```json
{
  "title": "Test Custom Reminder",
  "dueDate": "2025-01-15T12:00:00.000Z",
  "reminderType": "custom",
  "reminder": "2025-01-15T11:58:00.000Z"
}
```

Set `reminder` to 1-2 minutes from now to test immediately.

---

## 📅 Date Format Helper

**Current Date/Time:**
```javascript
// In browser console or Node.js
new Date().toISOString()
// Example: "2025-01-15T10:30:00.000Z"
```

**1 Hour from Now:**
```javascript
new Date(Date.now() + 60 * 60 * 1000).toISOString()
```

**1 Day from Now:**
```javascript
new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
```

**2 Minutes from Now (for testing):**
```javascript
new Date(Date.now() + 2 * 60 * 1000).toISOString()
```

---

## 🚨 Common Errors

### Error 1: Missing Authentication
```json
{
  "success": false,
  "message": "Authentication required. Please login."
}
```
**Fix:** Add `Authorization: Bearer <token>` header

---

### Error 2: Past Due Date
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "body.dueDate",
      "message": "Due date cannot be in the past"
    }
  ]
}
```
**Fix:** Use a future date

---

### Error 3: Invalid Reminder Type
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "body.reminderType",
      "message": "Reminder type must be 1hour, 1day, or custom"
    }
  ]
}
```
**Fix:** Use only `"1hour"`, `"1day"`, or `"custom"`

---

### Error 4: Reminder After Due Date
```json
{
  "success": false,
  "message": "Reminder date must be before or equal to due date"
}
```
**Fix:** Set reminder date before due date

---

## 📝 Postman Collection Setup

### Environment Variables (Optional)

Create a Postman environment with:
- `baseUrl`: `http://localhost:5000`
- `accessToken`: `<your_token>`

Then use:
```
POST {{baseUrl}}/api/tasks
Authorization: Bearer {{accessToken}}
```

---

## 🎯 Step-by-Step Postman Test

1. **Login**
   - POST `/api/auth/login`
   - Copy `accessToken`

2. **Create Task**
   - Method: `POST`
   - URL: `http://localhost:5000/api/tasks`
   - Headers:
     - `Content-Type`: `application/json`
     - `Authorization`: `Bearer <paste_token>`
   - Body (raw JSON): Use one of the payloads above
   - Click **Send**

3. **Verify Response**
   - Check status: `201 Created`
   - Verify task data in response
   - Note the `reminder` field (calculated automatically)

4. **Test Reminder** (if testing)
   - Wait for reminder time
   - Check Mailtrap inbox for email
   - Verify `reminderSent` is `true` after reminder is sent

---

## 💡 Pro Tips

1. **Test Reminders Quickly**: Set reminder to 1-2 minutes from now
2. **Use Mailtrap**: All emails go to Mailtrap inbox (not real emails)
3. **Check Logs**: Server console shows reminder processing
4. **Verify Calculation**: Check that `reminder` date is calculated correctly

---

## ✅ Checklist

- [ ] Login and get access token
- [ ] Create task with 1 hour reminder
- [ ] Create task with 1 day reminder
- [ ] Create task with custom reminder
- [ ] Create task without reminder
- [ ] Verify all responses are 201
- [ ] Check reminder dates are calculated correctly
- [ ] Test reminder email delivery (wait for cron job)

---

## 🎉 Ready to Test!

Copy any payload above and paste it into Postman to test creating tasks with reminders!

