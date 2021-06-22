export interface BasicUser {
    email: string;
    password: string;
}

export interface Fingerprint {
    ua: string;
    ip: string;
    at: Date;
}

export interface BasicUserCreate extends BasicUser {
    name: PersonName;
}

export interface User {
    name: PersonName;
    auth: UserAuth;
    tokens: Array<AuthToken>;
    permissions: UserPermissions;
    recent: {
        audio: Array<RecentLog>;
        video: Array<RecentLog>;
    }
}

export interface RecentLog {
    mediaId: string;
    progress: number;
    at: Date;
}

export interface UserAuth {
    email: string;
    hash: string;
}

export interface UserPermissions {
    user: {
        verified: boolean;
        admin: boolean;
        paid: boolean;
    };
    media: Array<string>;
    collection: Array<string>;
}

export interface PersonName {
    first: string;
    last: string;
    middle?: string;
    title?: string;
    suffix?: string;
}

export interface AuthToken {
    invalidated: Boolean;
    expires?: Date;
    token: string;
    fingerprint?: {}
    type: string;
    bonus?: any;
}