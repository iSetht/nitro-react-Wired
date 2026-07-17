import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = {
    CHEST_CONTRACT_OPEN: 4070,
    CHEST_REWARD_POPUP: 4072
};

const OutgoingHeaders = {
    CHEST_CONTRACT_SAVE: 4071
};

let registered = false;

export interface ContractFurniBase
{
    furniName: string;
    furniCode: string;
    productType: string;
    spriteId: number;
    furniType: string;
}

export interface ChestRewardPopupItem
{
    furniName: string;
    furniCode: string;
    productType: string;
    spriteId: number;
    amount: number;
}

export const RegisterContractMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.CHEST_CONTRACT_OPEN, ChestContractOpenEvent ],
            [ IncomingHeaders.CHEST_REWARD_POPUP, ChestRewardPopupEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.CHEST_CONTRACT_SAVE, ChestContractSaveComposer ]
        ])
    });

    registered = true;
}

abstract class Composer<T extends unknown[]> implements IMessageComposer<T>
{
    protected _data: T;

    public getMessageArray(): T
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

export class ChestContractSaveComposer extends Composer<[number, string]>
{
    constructor(contractId: number, dataJson: string)
    {
        super();
        this._data = [ contractId, dataJson || '{}' ];
    }
}

export class ChestContractOpenParser implements IMessageParser
{
    public contractId = 0;
    public contractType = 'payment';
    public title = '';
    public dataJson = '{}';
    public furniBases: ContractFurniBase[] = [];

    public flush(): boolean
    {
        this.furniBases = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.contractId = wrapper.readInt();
        this.contractType = wrapper.readString();
        this.title = wrapper.readString();
        this.dataJson = wrapper.readString();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this.furniBases.push({
                furniName: wrapper.readString(),
                furniCode: wrapper.readString(),
                productType: wrapper.readString(),
                spriteId: wrapper.readInt(),
                furniType: wrapper.readString()
            });

            count--;
        }

        return true;
    }
}

export class ChestContractOpenEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestContractOpenParser);
    }

    public getParser(): ChestContractOpenParser
    {
        return this.parser as ChestContractOpenParser;
    }
}

export class ChestRewardPopupParser implements IMessageParser
{
    public message = '';
    public credits = 0;
    public items: ChestRewardPopupItem[] = [];

    public flush(): boolean
    {
        this.items = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.message = wrapper.readString();
        this.credits = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this.items.push({
                furniName: wrapper.readString(),
                furniCode: wrapper.readString(),
                productType: wrapper.readString(),
                spriteId: wrapper.readInt(),
                amount: wrapper.readInt()
            });

            count--;
        }

        return true;
    }
}

export class ChestRewardPopupEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestRewardPopupParser);
    }

    public getParser(): ChestRewardPopupParser
    {
        return this.parser as ChestRewardPopupParser;
    }
}
