import { NotificationBubbleType } from './NotificationBubbleType';

export class NotificationBubbleItem
{
    private static ITEM_ID: number = -1;

    private _id: number;
    private _message: string;
    private _notificationType: string;
    private _iconUrl: string;
    private _linkUrl: string;
    private _key: string;
    private _timeoutMs: number;
    private _data: any;

    constructor(message: string, notificationType: string = NotificationBubbleType.INFO, iconUrl: string = null, linkUrl: string = null, key: string = null, timeoutMs: number = 8000, data: any = null)
    {
        NotificationBubbleItem.ITEM_ID += 1;

        this._id = NotificationBubbleItem.ITEM_ID;
        this._message = message;
        this._notificationType = notificationType;
        this._iconUrl = iconUrl;
        this._linkUrl = linkUrl;
        this._key = key;
        this._timeoutMs = timeoutMs;
        this._data = data;
    }

    public get id(): number
    {
        return this._id;
    }

    public get message(): string
    {
        return this._message;
    }

    public get notificationType(): string
    {
        return this._notificationType;
    }

    public get iconUrl(): string
    {
        return this._iconUrl;
    }

    public get linkUrl(): string
    {
        return this._linkUrl;
    }

    public get key(): string
    {
        return this._key;
    }

    public get timeoutMs(): number
    {
        return this._timeoutMs;
    }

    public get data(): any
    {
        return this._data;
    }
}
