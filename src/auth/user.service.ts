import { AuthToken, BasicUser, BasicUserCreate, Fingerprint, User } from "./user.interface";
import * as dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { client } from "../index";
import { sendPasswordUpdatedEmail, sendResetPasswordEmail, sendWelcomeEmail } from "./email.service";
import { MediaGroup } from "../collection/mediagroup.interface";
import { find } from "../collection/mediagroup.service";
import { findByUri } from "../media/media.service";
dotenv.config();

export const findAll = async (): Promise<User[]> => {

    const db = client.db('backlog');
    const users = db.collection('users');

    const result = await users.find().project({tokens:0,recent:0,"auth.hash":0});

    return result.toArray();

}

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

    await sendWelcomeEmail(createdUser);

    const firstToken = await createNewToken(newUserRequest.email, 'normal', fingerprint);

    return firstToken;
}

export const grantMediaPermission = async (userEmail: string, mediaId: string): Promise<boolean> => {

    const db = client.db('backlog');
    const users = db.collection('users');

    users.updateOne({
        'auth.email': userEmail
    }, {
        $push: {
            'permissions.media': mediaId
        }
    })

    return true;
}

export const revokeMediaPermission = async (userEmail: string, mediaId: string): Promise<boolean> => {

    const db = client.db('backlog');
    const users = db.collection('users');

    users.updateOne({
        'auth.email': userEmail
    }, {
        $pull: {
            'permissions.media': mediaId
        }
    })

    return true;
}

export const grantCollectionPermission = async (userEmail: string, mediaId: string): Promise<boolean> => {

    const db = client.db('backlog');
    const users = db.collection('users');

    users.updateOne({
        'auth.email': userEmail
    }, {
        $push: {
            'permissions.collection': mediaId
        }
    })

    return true;
}

export const revokeCollectionPermission = async (userEmail: string, mediaId: string): Promise<boolean> => {

    const db = client.db('backlog');
    const users = db.collection('users');

    users.updateOne({
        'auth.email': userEmail
    }, {
        $pull: {
            'permissions.collection': mediaId
        }
    })

    return true;
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

export const createNewToken = async (email: string, tokenType?: string, fingerprint?: Fingerprint, validForMillis?: number, bonus?: any): Promise<AuthToken> => {

    const ttl = validForMillis || (1000 * 60 * 60 * 24 * 7);

    const token: AuthToken = {
        invalidated: false,
        expires: new Date(Date.now() + ttl),
        token: crypto.randomBytes(128).toString('hex'),
        fingerprint: fingerprint,
        type: tokenType || 'normal',
        bonus: bonus
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

export const verify = async (token: string): Promise<User | null> => {

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

    return result;

}

export const invalidate = async (token: string): Promise<null | void> => {
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

export const requestPasswordReset = async (email: string): Promise<void> => {
    const db = client.db('backlog');
    const users = db.collection('users');

    const result = await users.findOne({
        'auth.email': email
    });

    if (result != null) {
        await sendResetPasswordEmail(result);
    }
}

export const resetPassword = async (pwResetToken: string, newPw: string): Promise<AuthToken | null> => {
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

const checkUserPermission = async (user: User | null, requestId: string): Promise<boolean> => {

    const media = await findByUri(requestId);
    const mediaId = media._id;

    if (user?.permissions.media.includes(mediaId.toString())) {
        return true;
    }

    user?.permissions.collection.forEach(async (collectionId: string) => {
        const grp: MediaGroup = await find(collectionId);
        if (grp.contents.includes(mediaId)) {
            return true;
        }
    })

    return false;
}

export const getContentToken = async (token: string, requestId: string): Promise<AuthToken | null> => {
    const user = await verify(token);
    if (user && await checkUserPermission(user, requestId)) {
        const accessToken: AuthToken = await createNewToken(user.auth.email, 'content-access', undefined, undefined, requestId);
        return accessToken;
    }

    return null;
}

export const verifyContentToken = async (token: string, requestId: string): Promise<boolean> => {

    console.log("rid", requestId);

    const db = client.db('backlog');
    const users = db.collection('users');

    const result = await users.findOne({
        'tokens': {
            $elemMatch: {
                'invalidated': false,
                'token': token,
                'expires': {
                    $gte: new Date()
                },
                'type': 'content-access',
                'bonus': requestId
            }
        }
    });

    return result;
}