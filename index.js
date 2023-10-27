const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


// middelware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json())
app.use(cookieParser());


// our middleware
const logger = async(req,res,next) =>{
  console.log('called', req.host, req.originalUrl)
  next();
}

// verify token
const verifyToken = async(req,res,next) =>{
  const token = req.cookies?.token;
  console.log('value of token', token)
  if(!token){
    return res.status(401).send({message: 'forbidden'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    // err 
    if(err){
      console.log(err)
      return res.status(401).send(message('unauthorized'))
    }

    // valid 
    console.log('value in the token', decoded)
    erq.user = decoded;
    next();
  })

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntnzcww.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingsCollection = client.db('carDoctor').collection('booking');


    // auth related data
    app.post('/jwt', logger, async(req,res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
      
      })
      .send({success: true})
    })


    // service categories
    app.get('/service', logger, async(req,res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/service/:id',async(req,res) =>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query)
        res.send(result)
    })

    // checkout categories

    app.post('/booking', logger, async(req,res) =>{
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking);
        res.send(result)

    });

    // checkout get data
    app.get('/booking',logger, verifyToken, async(req,res) =>{

        console.log(req.query.email);
        // console.log('token', req.cookies.token)
        let query ={};
        if(req.query.email){
          query = {email: req.query.email}
        }
        const cursor = bookingsCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })

    // delete booking
    app.delete('/booking/:id', async(req,res) =>{
      const id  = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await bookingsCollection.deleteOne(query);
      res.send(result)
    })

    // update item
    app.patch('/booking/:id', async(req,res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedbooking = req.body;
      console.log(updatedbooking);
      const updatedoc = {
        $set: {
          status: updatedbooking.status
        }
      }
      const result = await bookingsCollection.updateOne(filter,updatedoc);
      res.send(result)

    })








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})