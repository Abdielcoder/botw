const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_CNN;
const dbName = "dev_condiciones_generales";
const collectionName = "agentesPlantillaPersonalizada";
const tasksCollectionName = "tasks"; // Añadir colección para las tareas

async function getPermittedPhoneNumbers() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        const query = {};
        const options = {
            projection: { _id: 0, telefono: 1 },
        };

        const cursor = collection.find(query, options);
        const phoneNumbers = [];
        await cursor.forEach(doc => phoneNumbers.push(doc.telefono.trim()));

        return phoneNumbers;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function createTask(content) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(tasksCollectionName);

        const task = { content, createdAt: new Date() };
        const result = await collection.insertOne(task);
        return result.insertedId;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function getTasks() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(tasksCollectionName);

        const tasks = await collection.find().toArray();
        return tasks;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

module.exports = { getPermittedPhoneNumbers, createTask, getTasks };
