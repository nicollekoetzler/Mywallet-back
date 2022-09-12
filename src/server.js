import express, {json} from "express";
import cors from "cors";
import dotenv from "dotenv";

import authrouter from "./routes/authrouter.js"
import transactionsrouter from "./routes/transactionsrouter.js"

dotenv.config();

const server = express();
server.use(cors());
server.use(json());
server.use(authrouter);
server.use(transactionsrouter);

server.listen(process.env.PORT, () => console.log("servidor rodando na porta " + process.env.PORT));