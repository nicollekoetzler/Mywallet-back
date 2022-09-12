import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import { Router } from "express";

const transactionsrouter = Router()

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGODB_URL);
    let db;
    db = mongoClient.connect().then( () => {
    db = mongoClient.db("mywallet")
});

// REGISTROS

transactionsrouter.get("/registros", async (req, res) => {

    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", "");

    try{
        
        const sessionData = await db.collection("login").findOne({ token })

        if ( !sessionData ){
            return res.status(401).send("token inválido.");
        }

        const transactions = await db.collection("transactions").find({ userId: sessionData.userId }).toArray()

        res.status(200).send(transactions)
    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }
});

// TRANSACTIONS

transactionsrouter.post("/transactions", async (req, res) => {

    const entryData = req.body
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", "")
    const entryDataSchema = joi.object(
        {
            value: joi.number().required(),
            description: joi.string().required(),
            type: joi.string().required().valid("earning", "expense")
        }
    );

    const isBodyValid = entryDataSchema.validate(entryData, { abortEarly: false });

    if ( isBodyValid.error ){
        const errors = isBodyValid.error.details.map( err => err.message )

        return res.status(422).send(errors)
    }

    try{

        const sessionData = await db.collection("login").findOne({ token })

        if ( !sessionData ){
            return res.status(401).send("token inválido.")
        }

        await db.collection("transactions").insertOne(
            { 
                value: entryData.value, 
                description: entryData.description,
                userId: sessionData.userId,
                type: entryData.type
            }
        );

        res.sendStatus(200)
    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }
});

export default transactionsrouter