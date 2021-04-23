import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { MongoClient } from "mongodb";

import { mediaRouter } from "./media/media.router";

dotenv.config();

// Mongo Stuff

if (!process.env.MONGO) {
    process.exit(1);
}
const uri = process.env.MONGO;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
client.connect();
export { client };

// Express stuff

if (!process.env.PORT) {
    process.exit(1);
}

const PORT = parseInt(process.env.PORT as string, 10);
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/media', mediaRouter);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});