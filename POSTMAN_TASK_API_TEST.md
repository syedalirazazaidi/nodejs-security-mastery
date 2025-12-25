# Postman Test Guide - Task API

Complete guide for testing the Task API endpoints in Postman.

---

## 🔐 Prerequisites

Before testing task APIs, you need to:

1. **Login** to get an `accessToken`
2. **Use the token** in the Authorization header

---

## Step 1: Login First (Get Access Token)

**Request:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Response:** Copy the `accessToken` from the response.

---

## Step 2: Create Task

### Endpoint
```
POST http://localhost:5000/api/tasks
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <your_accessToken>
```

**OR** (if using cookies):
```
Content-Type: application/json
```
*(Cookies will be sent automatically if you logged in via Postman)*

### Request Body Examples

#### Example 1: Basic Task (Minimum Required Fields)
```json
{
  "title": "Complete project documentation",
  "dueDate": "2025-01-20T10:00:00.000Z"
}
```

#### Example 2: Complete Task (All Fields)
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the API including all endpoints, request/response examples, and error handling",
  "dueDate": "2025-01-20T10:00:00.000Z",
  "priority": "high",
  "reminder": "2025-01-19T09:00:00.000Z"
}
```

#### Example 3: Medium Priority Task
```json
{
  "title": "Review code changes",
  "description": "Review all pull requests and provide feedback",
  "dueDate": "2025-01-18T14:00:00.000Z",
  "priority": "medium",
  "reminder": "2025-01-17T09:00:00.000Z"
}
```

#### Example 4: Low Priority Task
```json
{
  "title": "Update README file",
  "description": "Add new features to the README documentation",
  "dueDate": "2025-01-25T16:00:00.000Z",
  "priority": "low"
}
```

#### Example 5: Task Without Reminder
```json
{
  "title": "Attend team meeting",
  "description": "Weekly team sync meeting",
  "dueDate": "2025-01-15T10:00:00.000Z",
  "priority": "medium"
}
```

---

## 📋 Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `title` | string | ✅ Yes | Task title (1-200 chars) | `"Complete project"` |
| `description` | string | ❌ No | Task description (max 1000 chars) | `"Write documentation"` |
| `dueDate` | string (ISO 8601) | ✅ Yes | Target completion date | `"2025-01-20T10:00:00.000Z"` |
| `priority` | enum | ❌ No | Task priority (default: `"medium"`) | `"low"`, `"medium"`, `"high"` |
| `reminder` | string (ISO 8601) | ❌ No | Reminder date/time | `"2025-01-19T09:00:00.000Z"` |

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
    "dueDate": "2025-01-20T10:00:00.000Z",
    "priority": "high",
    "reminder": "2025-01-19T09:00:00.000Z",
    "status": "pending",
    "userId": "69497ebe4c4133110b9529ec",
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-10T08:00:00.000Z"
  }
}
```

---

## ❌ Error Responses

### 1. Missing Authentication (401)
```json
{
  "success": false,
  "message": "Authentication required. Please login."
}
```

### 2. Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "body.title",
      "message": "Task title is required"
    },
    {
      "path": "body.dueDate",
      "message": "Due date cannot be in the past"
    }
  ]
}
```

### 3. Invalid Priority (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "body.priority",
      "message": "Priority must be low, medium, or high"
    }
  ]
}
```

### 4. Reminder After Due Date (400)
```json
{
  "success": false,
  "message": "Reminder date must be before or equal to due date"
}
```

---

## 🧪 Quick Test Payloads

### Copy-Paste Ready Payloads:

#### Payload 1: Simple Task
```json
{
  "title": "Buy groceries",
  "dueDate": "2025-01-15T18:00:00.000Z"
}
```

#### Payload 2: Work Task
```json
{
  "title": "Finish quarterly report",
  "description": "Complete Q4 financial report and submit to management",
  "dueDate": "2025-01-22T17:00:00.000Z",
  "priority": "high",
  "reminder": "2025-01-21T09:00:00.000Z"
}
```

#### Payload 3: Personal Task
```json
{
  "title": "Call dentist",
  "description": "Schedule annual checkup",
  "dueDate": "2025-01-12T10:00:00.000Z",
  "priority": "medium"
}
```

#### Payload 4: Urgent Task
```json
{
  "title": "Fix critical bug in production",
  "description": "Users cannot login - urgent fix needed",
  "dueDate": "2025-01-11T12:00:00.000Z",
  "priority": "high",
  "reminder": "2025-01-11T08:00:00.000Z"
}
```

---

## 📝 Date Format Tips

**ISO 8601 Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`

**Examples:**
- `"2025-01-20T10:00:00.000Z"` - January 20, 2025 at 10:00 AM UTC
- `"2025-01-20T14:30:00.000Z"` - January 20, 2025 at 2:30 PM UTC
- `"2025-01-20T00:00:00.000Z"` - January 20, 2025 at midnight UTC

**Generate dates:**
- Use JavaScript: `new Date().toISOString()`
- Use online tools: https://www.epochconverter.com/

---

## 🔍 Testing Checklist

- [ ] Login and get access token
- [ ] Create task with only required fields (title, dueDate)
- [ ] Create task with all fields
- [ ] Test with different priorities (low, medium, high)
- [ ] Test with reminder before due date
- [ ] Test with reminder equal to due date
- [ ] Test without reminder
- [ ] Test validation errors (missing title, past due date, etc.)
- [ ] Test without authentication (should fail)

---

## 🚀 Postman Setup Steps

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:5000/api/tasks`

2. **Set Headers**
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer <your_accessToken>`

3. **Set Body**
   - Select: `raw`
   - Format: `JSON`
   - Paste one of the payload examples above

4. **Send Request**
   - Click "Send"
   - Check response

---

## 💡 Pro Tips

1. **Save as Collection**: Create a Postman collection for all task APIs
2. **Environment Variables**: Use `{{baseUrl}}` and `{{accessToken}}` variables
3. **Tests Tab**: Add tests to verify response status and structure
4. **Pre-request Script**: Auto-login before each request (optional)

---

## 🎯 Next Steps After Creating Task

1. **Get All Tasks**: `GET http://localhost:5000/api/tasks`
2. **Get Task by ID**: `GET http://localhost:5000/api/tasks/:id`
3. **Update Task**: `PUT http://localhost:5000/api/tasks/:id`
4. **Delete Task**: `DELETE http://localhost:5000/api/tasks/:id`
5. **Get Stats**: `GET http://localhost:5000/api/tasks/stats`

---

## 📚 Full API Documentation

See `TASK_API_DOCUMENTATION.md` for complete API reference.

