import express, {json} from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import { v4 as uuid } from 'uuid';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGODB_URL);
    let db;
    db = mongoClient.connect().then( () => {
    db = mongoClient.db("mywallet")
});

const server = express();
server.use(cors());
server.use(json());

// LOGIN

server.post("/login", async (req, res) => {

    const userLogin = req.body
    const userLoginSchema = joi.object(
        {
            email: joi.string().email().required(),
            password: joi.string().required()
        }
    );

    const isBodyValid = userLoginSchema.validate(userLogin);

    if ( isBodyValid.error ){
        return res.sendStatus(422);
    }

    try{
        const token = uuid();
        const isUserRegistered = await db.collection("users").findOne({ email: userLogin.email });

        if( !isUserRegistered || isUserRegistered.password !== userLogin.password){
            return res.status(401).send("Email ou senha incorretos.");
        }
        
        await db.collection("login").insertOne(
            { 
                token,
                userId: isUserRegistered._id
            }
        );

        res.status(201).send({ token, name: isUserRegistered.name });

    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }

});

// CADASTRO

server.post("/sign-up", async (req, res) => {

    const userData = req.body 
    const userDataSchema = joi.object(
        {
            name: joi.string().required(),
            email: joi.string().email().required(),
            password: joi.string().required(),
            passwordConfirmation: joi.string().valid(joi.ref("password")).required()
        }
    );
    
    const isBodyValid = userDataSchema.validate(userData);
    
    if ( isBodyValid.error ){
        return res.sendStatus(422);
    }

    try{
        const isUserRegistered = await db.collection("users").findOne({ email: userData.email })

        if( isUserRegistered ){
            return res.sendStatus(409)
        }

        await db.collection("users").insertOne({ name: userData.name, email: userData.email, password: userData.password})

        res.sendStatus(201)
    }catch(err){
        console.log(err)
        res.sendStatus(500)
    }
});

// REGISTROS

server.get("/registros", async (req, res) => {

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

server.post("/transactions", async (req, res) => {

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



server.listen(process.env.PORT, () => console.log("servidor rodando na porta " + process.env.PORT));