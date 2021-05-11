import express, { Request, Response } from "express";
import { BaseMedia, MediaItem } from "./media.interface";
import * as MediaService from "./media.service"

export const mediaRouter = express.Router();

mediaRouter.get("/", async (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const bt = auth?.split('Bearer ')[1];
    
    if (!bt) {
        res.status(401).send();
        return;
    }

    try {
        const items = await MediaService.findAllForUser(bt);
        res.status(200).send(items);
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
})

mediaRouter.get("/:id", async (req: Request, res: Response) => {
    try {
        const item = await MediaService.find(req.params.id);
        if (item) {
            return res.status(200).send(item);
        }

        res.status(404).json({'error': 'No such media'});
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
})

mediaRouter.post("/", async (req: Request, res: Response) => {
    try {
        const item: BaseMedia = req.body;
        const newItem = await MediaService.create(item);

        res.status(201).json(newItem);
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
})

mediaRouter.put("/:id", async (req: Request, res: Response) => {

    try {
        const itemUpdate: MediaItem = req.body;
        const localItem: MediaItem = await MediaService.find(req.params.id);

        if (localItem) {
            const updatedItem = await MediaService.update(req.params.id, itemUpdate);
            return res.status(200).json(updatedItem);
        }

        const newItem = await MediaService.create(itemUpdate);

        res.status(201).json(newItem);
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
})

mediaRouter.delete("/:id", async (req: Request, res: Response) => {
    try {
        await MediaService.remove(req.params.id);

        res.status(204).send();
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
})