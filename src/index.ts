import * as dotenv from "dotenv";
import * as http from "http";
import * as child from "child_process";

import express, { Request } from "express";
import cors from "cors";
import helmet from "helmet";

import { MongoClient } from "mongodb";
import { Server as SocketServer } from "socket.io";

import { mediaRouter } from "./media/media.router";
import { userRouter } from "./auth/user.router";
import { mediaGroupRouter } from "./collection/mediagroup.router";
import { connect } from "./sockets/sockets";

const fetch = require('node-fetch');
const fileUpload = require('express-fileupload');

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

// API Routes
app.use('/api/media', mediaRouter);
app.use('/api/collection', mediaGroupRouter);
app.use('/user', userRouter);

//Socket.IO stuff
io.on('connection', connect);

// File upload Stuff
app.use(fileUpload({
    createParentPath: true
}));

app.post('/contentupload', async (req, res) => {

    try {
        if (!(req as any).files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            const newFile = (req as any).files.file;
            const type = (await newFile).name.substr((await newFile).name.lastIndexOf("."), (await newFile).name.length);
            const fileName = `${(await newFile).md5}${await (type)}`;

            (await newFile).mv('/var/www/mediabacklog.com/content/restrict/' + (await fileName));

            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: (await fileName)
                }
            });


            if (type === '.mp4') {

                console.log('reformatting')
                let process: child.ChildProcess = child.exec(`ffmpeg -i /var/www/mediabacklog.com/content/restrict/${fileName} -vcodec libx264 -crf 28 ${newFile.md5}.mp4`);
                process.on('exit', () => {
                    child.exec(`mv ${newFile.md5}.mp4 /var/www/mediabacklog.com/content/restrict/${newFile.md5}.mp4`);

                    console.log('reformatted')
                })

                // const buffer = await data.buffer();
                // const base64 = buffer.toString('base64');

                // const video = {
                //     name: (await fileName),
                //     base64: base64,
                //     type: 'video'
                // };

                // const collection = client.db("mediabacklog").collection("content");
                // await collection.insertOne(video);
            }
        }
    } catch (e) {
        res.status(500).send(e);
    }
});

// TMDB forward multisearches
app.get('/tmdb/:query', async (req, res) => {
    const resp = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDBKEY}&query=${req.params.query}`);
    const json = await resp.json();

    res.send(json);
});

app.get('/fs', async (req, res) => {
    const line = child.execSync('df -h | grep ^/dev/sda1.*\/$').toString();
    const regex = /\/sda1.+(\d.+G|M|K).+(\d.+G|M|K).+(\d.+G|M|K).+(\d.+%)/gm;
    let m;

    while ((m = regex.exec(line)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        res.send({
            total: m[1],
            used: m[2],
            free: m[3],
            percent: m[4]
        })
    }
})

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
