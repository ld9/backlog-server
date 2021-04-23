export interface BaseMedia {
    meta: {
        title: String;
    };
    type: String;
    tags: String[];
}

export interface MediaItem extends BaseMedia {
    _id: number;
    uri: string;
}