import * as dotenv from "dotenv";
import * as http from "http";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { MongoClient } from "mongodb";
import { Server as SocketServer } from "socket.io";

import { mediaRouter } from "./media/media.router";
import { userRouter } from "./auth/user.router";
import { mediaGroupRouter } from "./collection/mediagroup.router";
import { connect } from "./sockets/sockets";

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
const server = http.createServer(app);
export const io = new SocketServer(server);


app.use(helmet({
    contentSecurityPolicy: false,
  }));
app.use(cors());
app.use(express.json());

app.use('/api/media', mediaRouter);
app.use('/api/collection', mediaGroupRouter);
app.use('/user', userRouter);

io.on('connection', connect);

app.get('/socket-test', (req, res) => {
    res.set("Content-Security-Policy", "script-src 'self'");
    res.sendFile(__dirname + '/sockets/test.html');
})

app.get('/test.js', (req, res) => {
    res.set("Content-Security-Policy", "script-src 'self'");
    res.sendFile(__dirname + '/sockets/test.js');
})

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
