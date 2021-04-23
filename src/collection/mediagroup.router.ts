import express, { Request, Response } from "express";
import { MediaGroup } from "./mediagroup.interface";
import * as MediaGroupService from "./mediagroup.service";

export const mediaGroupRouter = express.Router();

mediaGroupRouter.get("/", async (req: Request, res: Response) => {
    try {
        const groups = await MediaGroupService.findAll();
        res.status(200).send(groups);
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

mediaGroupRouter.get("/:id", async (req: Request, res: Response) => {
    try {
        const group = await MediaGroupService.find(req.params.id);
        if (group) {
            return res.status(200).send(group);
        }
        
        res.status(404).json({'error': 'No such group'});
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

mediaGroupRouter.post("/", async (req: Request, res: Response) => {
    try {

    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

mediaGroupRouter.put("/:id", async (req: Request, res: Response) => {
    try {

    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

mediaGroupRouter.delete("/:id", async (req: Request, res: Response) => {
    try {

    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});