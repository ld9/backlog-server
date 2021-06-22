import express, { Request, Response } from "express";
import { AuthToken, BasicUserCreate, Fingerprint, User } from "./user.interface";
import * as AuthService from "./user.service";

export const userRouter = express.Router();

userRouter.post('/create', async (req: Request, res: Response) => {
    try {
        const fingerprint: Fingerprint = {
            ua: req.headers['user-agent'] || "unknown-browser-type",
            ip: req.ip,
            at: new Date()
        }

        const user: BasicUserCreate = req.body;
        const newUser: AuthToken | null = await AuthService.create(user, fingerprint);

        res.status(200).json(newUser);
        
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

userRouter.post('/verify', async (req: Request, res: Response) => {
    try {
        const user = await AuthService.verify(req.body.token);

        if (user != null) {

            const resUser = {
                name: user.name,
                permissions: user.permissions,
                recent: user.recent
            }

            res.status(200).json({
                auth: resUser
            });
        } else {
            res.status(401).json({auth: false});
        }

    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

userRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const fingerprint: Fingerprint = {
            ua: req.headers['user-agent'] || "unknown-browser-type",
            ip: req.ip,
            at: new Date()
        }

        const user: BasicUserCreate = req.body;
        const login = await AuthService.login(user, fingerprint);

        if (login != null) {
            res.status(200).json(login);
        } else {
            res.status(401).json({auth: false});
        }

    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

userRouter.delete('/invalidate', async (req: Request, res: Response) => {
    try {
        await AuthService.invalidate(req.body.token);

        res.status(204).send();
    } catch (e) {
        res.status(500).json({'error': e.message});
    } 
});

userRouter.post('/request-reset-password', async (req: Request, res: Response) => {
    try {
        await AuthService.requestPasswordReset(req.body.email);

        res.status(200).send();
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

userRouter.post('/reset-password', async (req: Request, res: Response) => {
    try {
        let newToken: AuthToken | null = await AuthService.resetPassword(req.body.token, req.body.password);

        res.status(200).json(newToken);
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

userRouter.post('/request-media-token', async (req: Request, res: Response) => {
    try {
        const token = req.body.token;
        const media = req.body.mediaId;

        const accessToken = await AuthService.getContentToken(token, media);
        if (accessToken != null) {
            res.status(200).json(accessToken);
        } else {
            res.status(401).json({authorized: false})
        }
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});

userRouter.get('/auth/:media', async (req: Request, res: Response) => {
    try {
        const orui = req.header('X-Original-URI');

        let token = orui?.substr(orui.indexOf("token=") + 6);
        const media = req.params.media.substr(0, req.params.media.indexOf("."));

        console.log(token, media);

        const ok = await AuthService.verifyContentToken(token, media);
        if (ok) {
            res.status(200).send();
        } else {
            res.status(401).send();
        }
        
    } catch (e) {
        res.status(500).json({'error': e.message});
    }
});