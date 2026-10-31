import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import "dotenv/config";


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



app.get('/', (req, res) => {
    res.send('hello world')
})


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



app.get('/feature', async(req, res)=> {
    const featured = await studios.find({}).sort({rating: -1}).limit(6).toArray()
    res.send(featured)
})


app.listen(PORT, ()=> {
    console.log('server running at port', PORT)
})