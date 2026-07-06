const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

jest.setTimeout(60000); // 60 seconds to allow MongoMemoryServer download

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn((token) => {
      if (token === 'valid-token') return Promise.resolve({ uid: 'test-user-123' });
      return Promise.reject(new Error('Invalid token'));
    })
  }))
}));

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => {
  const actualMockSendMessage = jest.fn();
  const actualMockGenerateContent = jest.fn();
  return {
    mockSendMessage: actualMockSendMessage,
    mockGenerateContent: actualMockGenerateContent,
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          startChat: jest.fn().mockReturnValue({
            sendMessage: actualMockSendMessage
          }),
          generateContent: actualMockGenerateContent
        })
      };
    })
  };
});

const { mockSendMessage, mockGenerateContent } = require('@google/generative-ai');

let mongoServer;

beforeAll(async () => {
  // Ensure any existing mongoose connection is closed before starting memory server
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Chat.deleteMany({});
  await Message.deleteMany({});
  jest.clearAllMocks();
  // Ensure GeminiService re-initializes with API key for tests
  process.env.GEMINI_API_KEY = 'test-key';
  const geminiService = require('../services/geminiService');
  geminiService.init();
});

describe('AI Backend Tests', () => {

  describe('Authentication & Basic API', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/chat');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized: No Bearer token provided');
    });

    it('should accept authenticated requests', async () => {
      const res = await request(app)
        .get('/api/chat')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('AI Chat System', () => {
    it('should create a chat successfully', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'My New Chat' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('My New Chat');
      expect(res.body.userId).toBe('test-user-123');
    });

    it('should reject empty prompts', async () => {
      const res = await request(app)
        .post('/api/chat/undefined/message')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Message content is required');
    });

    it('should handle invalid chatId format gracefully', async () => {
      const res = await request(app)
        .post('/api/chat/invalid123/message')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Hello' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid chat ID format');
    });

    it('should send a message and receive an AI response', async () => {
      mockSendMessage.mockResolvedValueOnce({
        response: { text: () => 'Hello, I am AI.' }
      });

      const res = await request(app)
        .post('/api/chat/undefined/message')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Hi there' });
        
      expect(res.status).toBe(200);
      expect(res.body.userMessage.content).toBe('Hi there');
      expect(res.body.aiMessage.content).toBe('Hello, I am AI.');
      expect(res.body.chat.title).toBe('Hi there'); // First message becomes title
    });
    
    it('should append to an existing chat (Continue conversation)', async () => {
      const chat = await Chat.create({ userId: 'test-user-123', title: 'Old Chat' });
      
      mockSendMessage.mockResolvedValueOnce({
        response: { text: () => 'I remember.' }
      });

      const res = await request(app)
        .post(`/api/chat/${chat._id}/message`)
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Do you remember?' });
        
      expect(res.status).toBe(200);
      expect(res.body.chat._id).toBe(chat._id.toString());
      expect(res.body.aiMessage.content).toBe('I remember.');
      
      const msgCount = await Message.countDocuments({ chatId: chat._id });
      expect(msgCount).toBe(2); // user msg + AI msg
    });

    it('should load a chat with all messages', async () => {
      const chat = await Chat.create({ userId: 'test-user-123', title: 'My Chat' });
      await Message.create([
        { chatId: chat._id, senderRole: 'user', content: 'Ping', createdAt: new Date(Date.now() - 1000) },
        { chatId: chat._id, senderRole: 'model', content: 'Pong', createdAt: new Date() }
      ]);

      const res = await request(app)
        .get(`/api/chat/${chat._id}`)
        .set('Authorization', 'Bearer valid-token');
        
      expect(res.status).toBe(200);
      expect(res.body.chat._id).toBe(chat._id.toString());
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0].content).toBe('Ping');
    });
  });

  describe('Automations & Generators', () => {
    it('should generate an email', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'Subject: Test\n\nBody' }
      });

      const res = await request(app)
        .post('/api/automations/email')
        .set('Authorization', 'Bearer valid-token')
        .send({ topic: 'Project Update' });
        
      expect(res.status).toBe(200);
      expect(res.body.result).toContain('Subject: Test');
    });

    it('should generate a workflow returning JSON safely', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => '```json\n{"name":"Test","trigger":"Push","action":"Deploy"}\n```' }
      });

      const res = await request(app)
        .post('/api/automations/workflow')
        .set('Authorization', 'Bearer valid-token')
        .send({ processDescription: 'Deploy on push' });
        
      expect(res.status).toBe(200);
      expect(res.body.workflow.name).toBe('Test');
    });

    it('should handle document analyzer JSON safely', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => '```json\n{"summary":"Good","keyPoints":["A"],"actionItems":[]}\n```' }
      });

      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('Hello world text content'), 'test.txt');
        
      if (res.status !== 200) console.error('Document error response:', res.body);

      expect(res.status).toBe(200);
      expect(res.body.analysis.summary).toBe('Good');
    });
  });

  describe('AI Error Handling (Rate Limit, Quota, Invalid Key)', () => {
    it('should handle Rate Limit (429)', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('429 Too Many Requests'));

      const res = await request(app)
        .post('/api/chat/undefined/message')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Spam' });
        
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('AI rate limit exceeded. Please try again later.');
    });

    it('should handle Quota Exceeded', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('quota exceeded'));

      const res = await request(app)
        .post('/api/chat/undefined/message')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Huge prompt' });
        
      expect(res.status).toBe(429);
    });

    it('should handle API Key Invalid', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('API_KEY_INVALID'));

      const res = await request(app)
        .post('/api/chat/undefined/message')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Hello' });
        
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid AI Assistant configuration');
    });

    it('should handle Network Failure', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('fetch failed ECONNRESET'));

      const res = await request(app)
        .post('/api/chat/undefined/message')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Hello' });
        
      expect(res.status).toBe(503);
      expect(res.body.error).toContain('Failed to reach Google AI servers');
    });
  });

});
