import express, {json} from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGODB_URL);
let db;
db = mongoClient.connect().then( () => {
    db = mongoClient.db("mywallet")
})

const server = express();
server.use(cors());
server.use(json());

server.listen(process.env.PORT, () => console.log("servidor rodando"));