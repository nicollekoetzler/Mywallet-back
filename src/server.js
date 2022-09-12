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


server.listen(process.env.PORT, () => console.log("servidor rodando na porta " + process.env.PORT));