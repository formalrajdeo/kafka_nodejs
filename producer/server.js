const express = require('express');
const { Kafka } = require('kafkajs');
const { faker } = require('@faker-js/faker');  // Update to use @faker-js/faker

const kafka = new Kafka({
  clientId: 'node-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const app = express();
app.use(express.json()); // For parsing application/json

// Update the generatePostData function to use the new Faker API
const generatePostData = () => {
  return {
    name: faker.internet.username(),
    state: faker.internet.username(),
    registerAt: faker.date.past(),
  };
};

const produceMessage = async (postData) => {
  const partition = 0; // TODO : Partition logic based on state
  await producer.send({
    topic: 'post-data',
    messages: [
      { value: JSON.stringify(postData), partition },
    ],
  });
  console.log('Message sent:', postData);
};

// HTTP endpoint to trigger message production
app.post('/produce', async (req, res) => {
  try {
    const postData = generatePostData();
    await produceMessage(postData);
    res.status(200).json({ message: 'Data produced', data: postData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const startServer = async () => {
  await producer.connect();
  app.listen(3000, () => {
    console.log('Producer server running on http://localhost:3000');
  });
};

startServer().catch(console.error);
