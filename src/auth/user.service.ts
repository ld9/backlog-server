import { AuthToken, BasicUser, BasicUserCreate, Fingerprint, User } from "./user.interface";
import * as dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { client } from "../index";
import { sendPasswordUpdatedEmail, sendResetPasswordEmail, sendWelcomeEmail } from "./email.service";
dotenv.config();

export const create = async (newUserRequest: BasicUserCreate, fingerprint: Fingerprint): Promise<AuthToken | null> => {

    const hash = await bcrypt.hash(newUserRequest.password, 12);

    const newUser: User = {
        name: newUserRequest.name,
        auth: {
            email: newUserRequest.email,
            hash: hash
        },
        tokens: [],
        permissions: {
            user: {
                verified: false,
                admin: false,
                paid: false
            },
            media: [],
            collection: []
        },
        recent: {
            audio: [],
            video: []
        }
    }

    const db = client.db('backlog');
    const users = db.collection('users');

    const result = await users.insertOne(newUser);
    const createdUser = result.ops[0];

    console.log(await sendWelcomeEmail(createdUser));

    const firstToken = await createNewToken(newUserRequest.email, 'normal', fingerprint);

    return firstToken;
}

export const login = async (authUser: BasicUser, fingerprint: Fingerprint): Promise<AuthToken | null> => {

    const db = client.db('backlog');
    const users = db.collection('users');

    const result = await users.findOne({
        "auth.email": authUser.email
    });

    const isLegit = await bcrypt.compare(authUser.password, result.auth.hash);

    if (isLegit) {
        return await createNewToken(authUser.email, 'normal', fingerprint);
    } else {
        return null;
    }

}

export const createNewToken = async (email: String, tokenType?: String, fingerprint?: Fingerprint, validForMillis?: number): Promise<AuthToken> => {

    const ttl = validForMillis || (1000 * 60 * 60 * 24 * 7);

    const token: AuthToken = {
        invalidated: false,
        expires: new Date(Date.now() + ttl),
        token: crypto.randomBytes(128).toString('hex'),
        fingerprint: fingerprint,
        type: tokenType || 'normal'
    }

    const db = client.db('backlog');
    const users = db.collection('users');

    const res = users.updateOne(
        { 'auth.email': email },
        {
            $push: {
                'tokens': token
            }
        }
    );

    return token;
}

export const verify = async (token: String): Promise<String | null> => {

    const db = client.db('backlog');
    const users = db.collection('users');

    const result = await users.findOne({
        'tokens': {
            $elemMatch: {
                'invalidated': false,
                'token': token,
                'expires': {
                    $gte: new Date()
                }
            }
        }
    });

    if (result != null) {
        return result.auth.email;
    } else {
        return null;
    }

}

export const invalidate = async (token: String): Promise<null | void> => {
    const v_token = await verify(token);
    if (v_token == null) {
        return null;
    }

    const db = client.db('backlog');
    const users = db.collection('users');

    
    const result = users.updateOne(
        {
            'tokens': {
                $elemMatch: {
                    'invalidated': false,
                    'token': token,
                    'expires': {
                        $gte: new Date()
                    }
                }
            }
        },
        {
            $set: {
                'tokens.$.invalidated': true,
                'tokens.$.invalid_at': new Date()
            }
        }
    )
}

export const requestPasswordReset = async (email: String): Promise<void> => {
    const db = client.db('backlog');
    const users = db.collection('users');

    const result = await users.findOne({
        'auth.email': email
    });

    if (result != null) {
        await sendResetPasswordEmail(result);
    }
}

export const resetPassword = async (pwResetToken: String, newPw: String): Promise<AuthToken | null> => {
    const db = client.db('backlog');
    const users = db.collection('users');

    const hash = await bcrypt.hash(newPw, 12);

    const result = await users.findOneAndUpdate(
        {
            'tokens': {
                $elemMatch: {
                    'invalidated': false,
                    'token': pwResetToken,
                    'type': 'reset-password',
                    'expires': {
                        $gte: new Date()
                    }
                }
            }
        },
        {
            $set: {
                'auth.hash': hash
            }
        }
    );

    if (result != null) {
        const user = result.value;

        const newToken = await createNewToken(user.auth.email);
        await sendPasswordUpdatedEmail(user);

        invalidate(pwResetToken);

        return newToken;
    } else {
        return null;
    }
}