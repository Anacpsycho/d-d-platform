import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.DATABASE_URL || 'mongodb://localhost:27017/dnd',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
}));

// Made with Bob
