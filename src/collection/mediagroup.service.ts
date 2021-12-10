import { MediaGroup } from './mediagroup.interface';

import { ObjectId } from "mongodb";
import { client } from '../index';
import { mediaRouter } from '../media/media.router';
import { verify } from '../auth/user.service';

export const findAll = async (): Promise<MediaGroup[]> => {
    const db = client.db('backlog');
    const groups = db.collection('collections');
    const allGroups = groups.find();

    return allGroups.toArray()
}

export const find = async (id: string): Promise<MediaGroup> => {
    const db = client.db('backlog');
    const groups = db.collection('collections');
    const group = groups.findOne({ '_id': new ObjectId(id) });

    return await group;
}

export const create = async (newItem: MediaGroup): Promise<MediaGroup> => {
    const db = client.db('backlog');
    const groups = db.collection('collections');

    const result = await groups.insertOne(newItem);

    return await result.ops[0];
}

export const getCollectionPermissions = async (userId: string): Promise<Array<string>> => {

    const db = client.db('backlog');
    const groups = db.collection('collections');

    // const user = await verify(token);
    // console.log('39', user, token)
    // if (!user) {
    //     return [];
    // }

    const result = groups.find({ members: `${userId}` });
    const proj = await result.project({ 'contents': 1 }).toArray();

    let res: Array<string> = [];
    proj.forEach(doc => {
        res = [...res, ...doc.contents];
    })

    return res;

}

export const update = async (id: string, itemUpdate: MediaGroup): Promise<Object | null> => {

    const group = await find(id);
    if (!group) {
        console.log('nogroup')
        return null;
    }

    const db = client.db('backlog');
    const groups = db.collection('collections');

    const result = groups.updateOne(
        { '_id': group._id },
        {
            $set: {
                title: itemUpdate.title,
                contents: itemUpdate.contents,
                members: itemUpdate.members
            }
        }
    )

    return (await result);
}

export const remove = async (id: string): Promise<null | void> => {

    const group = await find(id);
    if (!group) {
        return null;
    }

    const db = client.db('backlog');
    const groups = db.collection('collections');

    const result = groups.deleteOne({ _id: group._id });

    return;
}