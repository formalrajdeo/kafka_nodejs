const express = require('express');
const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');

const kafka = new Kafka({
  clientId: 'node-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'post-group' });
const mongoClient = new MongoClient('mongodb://root:password@127.0.0.1:27018?authSource=admin&readPreference=primary&readConcernLevel=local&writeConcern=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.json()); // For parsing application/json

const batchSize = 1000; // Batch size for bulk write
let messageBatch = []; // Temporary batch storage
let timeoutId; // Timeout ID for the 5-second timer

const runConsumer = async () => {
  await mongoClient.connect();
  const db = mongoClient.db('kafka_demo');
  const collection = db.collection('posts');

  await consumer.connect();
  await consumer.subscribe({ topic: 'post-data', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const postData = JSON.parse(message.value.toString());
      console.log('Received message:', postData);
      messageBatch.push(postData);

      // If batch is full, perform bulkWrite and reset batch
      if (messageBatch.length >= batchSize) {
        await writeBatchToMongo(collection);
      } else {
        // Reset the timeout if a new message arrives
        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(async () => {
          // After 5 seconds, write the remaining messages even if batch isn't full
          await writeBatchToMongo(collection);
        }, 5000); // 5 seconds timeout
      }
    },
  });
};

// Function to write batch to MongoDB
const writeBatchToMongo = async (collection) => {
  try {
    const bulkOps = messageBatch.map(post => ({
      insertOne: {
        document: post,
      },
    }));
    await collection.bulkWrite(bulkOps);
    console.log(`Inserted ${messageBatch.length} records to MongoDB.`);
    messageBatch = []; // Reset the batch after writing
  } catch (error) {
    console.error('Error during bulk write:', error);
  }
};

app.get('/consume', async (req, res) => {
  try {
    res.status(200).send('Consumer is listening to Kafka!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const startServer = async () => {
  await runConsumer();
  app.listen(4000, () => {
    console.log('Consumer server running on http://localhost:4000');
  });
};

// Ensure any remaining data is written to MongoDB at shutdown
process.on('SIGINT', async () => {
  if (messageBatch.length > 0) {
    const db = mongoClient.db('kafka_demo');
    const collection = db.collection('posts');
    await writeBatchToMongo(collection);
    console.log(`Inserted remaining ${messageBatch.length} records to MongoDB.`);
  }
  await mongoClient.close();
  process.exit();
});

startServer().catch(console.error);
