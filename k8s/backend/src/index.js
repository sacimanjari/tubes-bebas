const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const promClient = require('prom-client');

const app = express();
const port = process.env.PORT || 3002;

// Prometheus metrics setup
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.use(cors());
app.use(express.json());

// Middleware to measure request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration / 1000);
  });
  next();
});

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

redis.on('connect', () => {
    console.log('Redis Client Connected');
    activeConnections.inc();
});

redis.on('close', () => {
    activeConnections.dec();
});

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
        
        // Force sync to create tables if they don't exist
        await sequelize.sync({ force: false, alter: true });
        console.log('Database synchronized and tables created/updated.');
    } catch (error) {
        console.error('Unable to connect to MySQL:', error);
        // Retry connection after 5 seconds
        setTimeout(initDatabase, 5000);
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
        // Return empty array instead of error object to prevent frontend issues
        res.json([]);
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