export interface BasicUser {
    email: String;
    password: String;
}

export interface Fingerprint {
    ua: String;
    ip: String;
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
    mediaId: String;
    progress: number;
    at: Date;
}

export interface UserAuth {
    email: String;
    hash: String;
}

export interface UserPermissions {
    user: {
        verified: boolean;
        admin: boolean;
        paid: boolean;
    };
    media: Array<String>;
    collection: Array<String>;
}

export interface PersonName {
    first: String;
    last: String;
    middle?: String;
    title?: String;
    suffix?: String;
}

export interface AuthToken {
    invalidated: Boolean;
    expires?: Date;
    token: String;
    fingerprint?: {}
    type: String;
}