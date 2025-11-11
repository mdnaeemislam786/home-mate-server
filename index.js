require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();

// port 
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@homemate.mubvdtn.mongodb.net/?appName=${process.env.DB_NAME}`;

// MongoDB client setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db('HomeMateDB')
    const servicesCollection = db.collection('Services')

    //add one services
    app.post('/services', async(req, res) =>{
        const data = req.body
        const result = await servicesCollection.insertOne(data);
        res.send(result)
    })
    //get all services
    app.get('/services', async(req, res) =>{
        const result = await servicesCollection.find().toArray();
        res.send(result)
    })
    //Update one data 
    app.patch('/services/:id', async (req, res) => {
        const id = req.params;
        const data = req.body;
        const objectId = new ObjectId(id);
        const filter = {_id: objectId};
        const update= { $set: data}
        const result = servicesCollection.updateOne(filter, update)
        res.send(result)
    })
    //get one services
    app.get('/services/:id', async(req, res) =>{
        const {id} = req.params
        const result = await servicesCollection.findOne({_id: new ObjectId(id)})
        res.send(result)
    })
    // get top rating services
    app.get('/top-rating', async (req, res) => {
      const result = await servicesCollection.find().sort({rating: 'descending'}).limit(6).toArray();
      res.send(result);
    });
    // get my booking data by email
    app.post('/my-booking', async (req, res) => {
      const { email } = req.body;
      const result = await servicesCollection.find({ email }).toArray();
      res.send(result);
    });
    // delete data with id 
    app.delete('/services/:id', async(req, res ) => {
      const id = req.params
      const result = await servicesCollection.deleteOne({_id: new ObjectId(id)})
      res.send(result)
    }) 

    await client.db("admin").command({ ping: 1 });
    console.log(" Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);
       
// Test route
app.get("/", (req, res) => {
  res.send("The server is running");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
