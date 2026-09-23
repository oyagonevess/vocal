import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { configureSecurity } from './middleware/security.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import turnRoutes from './routes/turnRoutes.js';
import agoraRoutes from './routes/agoraRoutes.js';
import { sfuServer } from './rtc/sfuServer.js';
import { prisma } from './services/db.js';

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Security & Parsing Middlewares
app.use(configureSecurity);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api', channelRoutes);
app.use('/api', messageRoutes);
app.use('/api/rtc/turn', turnRoutes);
app.use('/api', agoraRoutes);

// Root & Health Check Routes
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vocalis Backend API (Agora.io Powered)',
    message: 'Backend a funcionar!',
    timestamp: new Date(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vocalis RTC Engine (Agora.io Powered)', timestamp: new Date() });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// Initialize SFU Signaling Server
sfuServer.init(server);

// Start Server & Connect Database (Only in non-serverless standalone mode)
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados conectado com sucesso.');

    server.listen(config.port, () => {
      console.log(`🚀 Servidor Vocalis rodando em http://localhost:${config.port}`);
      console.log(`📡 Agora.io Token Engine & RTC Relay prontos.`);
    });
  } catch (err) {
    console.error('❌ Falha ao inicializar o servidor Vocalis:', err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  bootstrap();
}

export default app;
