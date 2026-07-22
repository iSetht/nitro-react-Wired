import { IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const WIRED_FURNI_OPACITY_HEADER = 4069;

export interface WiredFurniOpacityUpdate
{
    roomId: number;
    itemId: number;
    wallItem: boolean;
    opacity: number;
    clickThrough: boolean;
    easing: number;
    durationMs: number;
}

let registered = false;

export const RegisterWiredFurniOpacityMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ WIRED_FURNI_OPACITY_HEADER, WiredFurniOpacityEvent ]
        ]),
        composers: new Map<number, Function>()
    });

    registered = true;
}

export class WiredFurniOpacityParser implements IMessageParser
{
    public updates: WiredFurniOpacityUpdate[] = [];

    public flush(): boolean
    {
        this.updates = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const roomId = wrapper.readInt();
        let count = wrapper.readInt();

        while(count > 0)
        {
            this.updates.push({
                roomId,
                itemId: wrapper.readInt(),
                wallItem: wrapper.readBoolean(),
                opacity: wrapper.readInt(),
                clickThrough: wrapper.readBoolean(),
                easing: wrapper.readInt(),
                durationMs: wrapper.readInt()
            });
            count--;
        }

        return true;
    }
}

export class WiredFurniOpacityEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniOpacityParser);
    }

    public getParser(): WiredFurniOpacityParser
    {
        return this.parser as WiredFurniOpacityParser;
    }
}
