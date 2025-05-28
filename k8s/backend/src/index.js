const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Redis setup
console.log('Initializing Redis client...');
const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis-service',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redis.on('connect', () => console.log('Redis Client Connected'));

// MySQL setup
const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'guestbook',
    process.env.MYSQL_USER || 'guestbook',
    process.env.MYSQL_PASSWORD || 'guestbook',
    {
        host: process.env.MYSQL_HOST || 'mysql-service',
        dialect: 'mysql',
        logging: false
    }
);

// Define Message model
const Message = sequelize.define('Message', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// Initialize database
async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('MySQL connection established successfully.');
        await sequelize.sync();
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to MySQL:', error);
    }
}

initDatabase();

app.get('/api/health', async (req, res) => {
    try {
        const redisStatus = redis.status;
        const dbStatus = sequelize.authenticate().then(() => 'Connected').catch(() => 'Disconnected');
        
        res.json({
            status: 'healthy',
            redisStatus,
            dbStatus: await dbStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Get all guestbook entries
app.get('/api/guestbook', async (req, res) => {
    try {
        // Try to get from cache first
        const cachedMessages = await redis.get('guestbook:messages');
        if (cachedMessages) {
            return res.json(JSON.parse(cachedMessages));
        }

        // If not in cache, get from database
        const messages = await Message.findAll({
            order: [['timestamp', 'DESC']]
        });

        // Cache the results for 1 minute
        await redis.set('guestbook:messages', JSON.stringify(messages), 'EX', 60);
        
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Add new guestbook entry
app.post('/api/guestbook', async (req, res) => {
    try {
        const { name, message } = req.body;
        
        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }

        // Save to database
        const newMessage = await Message.create({
            name,
            message
        });

        // Invalidate cache
        await redis.del('guestbook:messages');

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
});

// Clear all guestbook entries
app.delete('/api/guestbook', async (req, res) => {
    try {
        // Clear database
        await Message.destroy({ where: {} });
        
        // Clear cache
        await redis.del('guestbook:messages');
        
        res.json({ message: 'All messages cleared' });
    } catch (error) {
        console.error('Error clearing messages:', error);
        res.status(500).json({ error: 'Failed to clear messages' });
    }
});

app.listen(port, () => {
    console.log(`Backend service listening on port ${port}`);
}); 