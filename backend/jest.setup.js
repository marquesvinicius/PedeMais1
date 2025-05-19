// Define o NODE_ENV como 'test' se não estiver definido
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Mock de variáveis de ambiente para teste
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_KEY = 'mock-key-for-testing';
process.env.JWT_SECRET = 'mock-jwt-secret-for-testing'; 