const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    // Force Node.js to use Google/Cloudflare public DNS to bypass broken IPv6 resolvers
    dns.setServers(['8.8.8.8', '1.1.1.1']);

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('\n[FATAL ERROR] MONGODB_URI environment variable is missing.');
      process.exit(1);
    }

    // Disable Mongoose buffering globally to fail-fast if disconnected
    mongoose.set('bufferCommands', false);

    // Attach lifecycle event listeners
    mongoose.connection.on('connecting', () => {
      console.log('MongoDB: Connecting...');
    });
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB: Connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB: Connection failed', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB: Disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB: Reconnecting...');
    });

    // Wait for the connection to establish. If it fails, it will immediately throw.
    await mongoose.connect(mongoURI);
    
  } catch (error) {
    console.error('\n======================================================');
    console.error('CRITICAL ERROR: Failed to connect to MongoDB Atlas!');
    console.error(error.message);
    console.error('======================================================\n');
    throw error; // Force the process to explicitly fail during initialization
  }
};

module.exports = connectDB;
