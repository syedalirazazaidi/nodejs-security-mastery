"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
// Set NODE_ENV
process.env.NODE_ENV = NODE_ENV;
// MongoDB Connection
const connectDB = async () => {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }
        const mongooseOptions = {
        // Development: show more detailed logs
        // Production: minimal logging
        };
        await mongoose_1.default.connect(MONGODB_URI, mongooseOptions);
        console.log('✅ MongoDB connected successfully');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1); // Exit process if connection fails
    }
};
// Mongoose connection event handlers
mongoose_1.default.connection.on('disconnected', () => {
    if (NODE_ENV === 'development') {
        console.log('⚠️  MongoDB disconnected');
    }
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Basic route
app.get('/', (_, res) => {
    res.json({ message: 'Server is running!' });
});
// Error handling middleware (development: show detailed errors)
if (NODE_ENV === 'development') {
    app.use((err, _req, res, _next) => {
        console.error('Error:', err);
        res.status(500).json({
            error: err.message,
            stack: err.stack
        });
    });
}
else {
    app.use((_err, _req, res, _next) => {
        res.status(500).json({
            error: 'Internal Server Error'
        });
    });
}
// Start server and connect to database
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📦 Environment: ${NODE_ENV}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map