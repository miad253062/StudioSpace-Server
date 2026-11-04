import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";


const app = express()
const PORT = process.env.PORT || 8000;

app.use(express.json())
app.use(cors())


const client = new MongoClient(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.eimgd93.mongodb.net/`);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}


const connectedClient = await connectToMongoDB();
const database = connectedClient.db('StudioSpaceServer')
const studios = database.collection('studios')
const bookings = database.collection('bookings')



app.get('/', (req, res) => {
    res.send('hello world')
})


const verifyApi = async(req, res, next) => {

    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized access: Token missing' });
    }
    const token = authHeader.split(' ')[1];
    const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))
     

    try {
        const {payload} = await jwtVerify(token, JWKS)
        next(); 
    } catch (error) {
        return res.status(401).send({ message: 'Unauthorized access: Invalid token' });
    }
};

app.get('/studios', async(req, res) => {
    try {
        const categoryName = req.query.category;
        
        if (categoryName) {
            const filteredData = await studios.find({category: categoryName}).toArray();
            return res.send(filteredData); 
        }
        
        const allData = await studios.find({}).toArray();
        res.send(allData);
    } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.get('/my-listing/:email', async(req, res) => {
    const userEmail = req.params.email.trim()
    const result = await studios.find({email: userEmail}).toArray()
    res.send(result)
})


app.get('/studios/edit/:id', async(req, res) => {
    const id = req.params.id
    const result = await studios.findOne({_id: new ObjectId(id)})
    if(result){
        res.send(result)
    }else{
        res.send({message: 'No data found!'})
    }
})

app.get('/studios/:id', async(req, res)=> {
    const id = req.params.id
    const result = await studios.findOne({_id: new ObjectId(id)})
    if(result){
        res.send(result)
    }else{
        res.send({message: 'No data found!'})
    }
})


app.patch("/studios/edit/:id", async (req, res) => {
  const id = req.params.id;
  const updateUser = req.body;
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      ...updateUser
    },
  };

  const result = await studios.updateOne(query, updateDoc);

  res.send(result);
});

app.patch("/status/:id", async (req, res) => {
  const id = req.params.id;
  const updateBooking = req.body;
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      ...updateBooking
    },
  };

  const result = await bookings.updateOne(query, updateDoc);

  res.send(result);
});

app.delete('/delete/:id', async(req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) };
    const result = await studios.deleteOne(query)
    res.send(result)
})

app.delete('/bookings/:id', async(req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) };
    const result = await bookings.deleteOne(query)
    res.send(result)
})



app.get('/feature', async(req, res)=> {
    const featured = await studios.find({}).sort({rating: -1}).limit(6).toArray()
    res.send(featured)
})

app.get('/bookings/:email', async(req, res)=> {
    const userEmail = req.params.email;
    const result = await bookings.find({email: userEmail}).toArray()
    res.send(result)
})



app.post('/add-studio',  async(req, res) => {
    const newData = req.body;
    const adddata = await studios.insertOne(newData)
    res.send(adddata)
})

app.post('/bookings', async(req, res) => {
    const bookingData = req.body;
    const exists = await bookings.findOne({ 
        email: bookingData.email, 
        'studio._id': bookingData.studio._id, 
        date: bookingData.date 
    });

    if (exists) {
        return res.status(409).send({ message: 'You have already booked this workspace for the selected date!' });
    }
    const result = await bookings.insertOne(bookingData);
    res.send(result);
});

app.listen(PORT, ()=> {
    console.log('server running at port', PORT)
})


export default app;