import * as dotenv from "dotenv";
import { BaseMedia, MediaItem } from "./media.interface";

import { ObjectId } from "mongodb";
import { client } from '../index';

export const findAll = async (): Promise<MediaItem[]> => {
    const db = client.db('backlog');
    const media = db.collection('media');
    const allMedia = media.find();

    return allMedia.toArray()
}

export const find = async (id: string): Promise<MediaItem> => {

    const db = client.db('backlog');
    const media = db.collection('media');
    const item = media.findOne({ '_id': new ObjectId(id) });

    return await item;
};

export const create = async (newItem: BaseMedia): Promise<MediaItem> => {

    const uri = `/media/static/${newItem.meta.title}.mp4`;

    const db = client.db('backlog');
    const media = db.collection('media');

    const result = await media.insertOne({
        uri,
        ...newItem
    })

    return await result.ops[0];
}

export const update = async (id: string, itemUpdate: BaseMedia): Promise<MediaItem | null> => {

    const item = await find(id);
    if (!item) {
        return null;
    }

    const db = client.db('backlog');
    const media = db.collection('media');

    const result = media.updateOne(
        { '_id': item._id },
        {
            $set: { ...itemUpdate }
        });

    return media.findOne({ '_id': item._id });
}

export const remove = async (id: string): Promise<null | void> => {
    const item = await find(id);
    if (!item) {
        return null;
    }

    const db = client.db('backlog');
    const media = db.collection('media');

    const result = media.deleteOne({ _id: item._id });

    return;
}