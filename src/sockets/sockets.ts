import { threadId } from "node:worker_threads";
import { Socket } from "socket.io";
import { io } from "..";

let count = 0;

function peerInform(socket: Socket, payload: string, toSelf?: boolean) {

    if (JSON.parse(payload).from !== socket.id) {
        console.log("!! Potential fake packet detected");
        // return;
    }
    
    if (count++ % 100 == 0) {
        console.log(`peerinform #${count} sent`);
    }

    socket.rooms.forEach(async (room) => {
        if (room == socket.id) {
            return;
        }

        if (toSelf) {
            // console.log('--emit-room-self');
            io.to(room).emit('inform-peer', JSON.stringify(
                {
                    ...JSON.parse(payload),
                    id: Math.floor(Math.random() * 999999)
                }
            ));
        } else {
            // console.log('--emit-room-noself');
            socket.broadcast.to(room).emit('inform-peer', JSON.stringify(
                {
                    ...JSON.parse(payload),
                    id: Math.floor(Math.random() * 999999)
                }
            ));
        }
    })

}

export function connect(socket: Socket) {
    console.log('user connected');

    socket.on('request-join', async (obj) => {
        console.log(obj);
        let stage = obj.stage;
        let user = obj.user;
        
        socket.join(stage);

        console.log(`Socket ${socket} attempt join room ${stage}`);

        // await new Promise(resolve => setTimeout(resolve, 500));

        io.in(stage).emit('inform-join', JSON.stringify(
            {
                'user': socket.id,
                display: user,
                stage
            }
        ));
    });

    socket.on('request-leave', (room) => {
        console.log(`Socket ${socket} leaves room ${room}`);
        socket.leave(room);
        io.in(room).emit('inform-leave', socket.id);
    })

    socket.on('inform-peer-self', (payload) => {
        // console.log('Got PeerInform--self')
        peerInform(socket, payload, true);
    });

    socket.on('inform-peer', (payload) => {
        // console.log('Got PeerInform--noself')
        peerInform(socket, payload);
    })

}