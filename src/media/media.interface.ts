export interface BaseMedia {
    meta: {
        title: string;
        released?: number;
        thumb?: string;
        /* Allow any meta things to be present. */
        [key: string]: any;
    };
    type: string;
    tags: string[];
}

export interface MediaItem extends BaseMedia {
    _id: number;
}