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
    const BookingsCollection = db.collection('Bookings')


    // ====================================== Bookings ========================================== //
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
        const result = await servicesCollection.updateOne(filter, update)
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
    //search api 
    app.post('/services/search', async (req, res) => {
      const query = req.body.query || "";

      try {
        const result = await servicesCollection
          .find({ serviceName: { $regex: query, $options: "i" } })
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Search failed" });
      }
    });

    // filter api 
    app.post('/services/filter', async (req, res) => {
      const min = (req.body.min) || 0;
      const max = (req.body.max) || Infinity;
      console.log(min, max);
      try {
        const result = await servicesCollection.find({ price: { $gte: min, $lte: max } }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Price filter failed" });
      }
    });


    
    // ====================================== Bookings ========================================== //
    app.post('/booking', async(req, res) =>{
        const data = req.body
        // console.log(data);
        const result = await BookingsCollection.insertOne(data);
        res.send(result)
    })

    // get my booked data by email
    app.post('/my-booked', async (req, res) => {
      const { email } = req.body;
      // console.log(email); 
      const result = await BookingsCollection.find({ email }).toArray();
      res.send(result);
    });

    // delete booked data with id
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await BookingsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        console.error("Delete failed:", err);
        res.status(500).send({ error: "Failed to delete booking" });
      }
    });



// Add review to service
app.post('/bookings/review', async (req, res) => {
  const review = req.body;
  const serviceId = review.serviceId
  console.log(serviceId);

  try { 
    // Validate service exists
    const result = await servicesCollection.findOne({_id: new ObjectId(serviceId)})
    if (!result) {
      return res.status(404).send({ error: "Service not found" });
    }

    // console.log(result);

   // Update service with new review
    const filter = { _id: new ObjectId(serviceId) };
    const update = {
      $push: {
        review,
      },
      $inc: {
        rating: 1,
      },
    };

    const results = await servicesCollection.updateOne(filter, update);
    res.send(results);
  } catch (err) {
    // console.error("Review insert failed:", err);
    res.status(500).send({ error: "Failed to submit review" });
  }
});

    await client.db("admin").command({ veping: 1 });
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
