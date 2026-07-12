import { IMessageComposer, IMessageDataWrapper, IMessageParser, ItemDataStructure, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

export enum ChestType
{
    FURNI = 0,
    COINS = 1
}

const IncomingHeaders = {
    CHEST_OPEN: 40,
    CHEST_FURNI_CONTENTS: 1062,
    CHEST_FURNI_UPDATE: 2655,
    CHEST_COIN_BALANCE: 3316,
    CHEST_DEPOSIT_STARTED: 666,
    CHEST_DEPOSIT_UPDATE: 140,
    CHEST_DEPOSIT_COMPLETED: 1106,
    CHEST_DEPOSIT_CANCELLED: 3282,
    CHEST_TRANSACTION_FAILED: 4073,
    CHEST_NOTIFICATION: 4075
};

const OutgoingHeaders = {
    CHEST_OPEN: 1460,
    CHEST_CLOSE: 3739,
    CHEST_WITHDRAW_FURNI: 1084,
    CHEST_WITHDRAW_COINS: 2728,
    CHEST_WITHDRAW_ALL: 1336,
    CHEST_START_DEPOSIT: 2377,
    CHEST_DEPOSIT_ITEMS: 1014,
    CHEST_DEPOSIT_ACCEPT: 1966,
    CHEST_DEPOSIT_CANCEL: 212,
    CHEST_SAVE_SETTINGS: 3901
};

let registered = false;

export const RegisterChestMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.CHEST_OPEN, ChestOpenEvent ],
            [ IncomingHeaders.CHEST_FURNI_CONTENTS, ChestFurniContentsEvent ],
            [ IncomingHeaders.CHEST_FURNI_UPDATE, ChestFurniContentsUpdateEvent ],
            [ IncomingHeaders.CHEST_COIN_BALANCE, ChestCoinBalanceEvent ],
            [ IncomingHeaders.CHEST_DEPOSIT_STARTED, ChestDepositStartedEvent ],
            [ IncomingHeaders.CHEST_DEPOSIT_UPDATE, ChestDepositUpdateEvent ],
            [ IncomingHeaders.CHEST_DEPOSIT_COMPLETED, ChestDepositCompletedEvent ],
            [ IncomingHeaders.CHEST_DEPOSIT_CANCELLED, ChestDepositCancelledEvent ],
            [ IncomingHeaders.CHEST_TRANSACTION_FAILED, ChestTransactionFailedEvent ],
            [ IncomingHeaders.CHEST_NOTIFICATION, ChestNotificationEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.CHEST_OPEN, ChestOpenComposer ],
            [ OutgoingHeaders.CHEST_CLOSE, ChestCloseComposer ],
            [ OutgoingHeaders.CHEST_WITHDRAW_FURNI, ChestWithdrawFurniComposer ],
            [ OutgoingHeaders.CHEST_WITHDRAW_COINS, ChestWithdrawCoinsComposer ],
            [ OutgoingHeaders.CHEST_WITHDRAW_ALL, ChestWithdrawAllComposer ],
            [ OutgoingHeaders.CHEST_START_DEPOSIT, ChestStartDepositComposer ],
            [ OutgoingHeaders.CHEST_DEPOSIT_ITEMS, ChestDepositItemsComposer ],
            [ OutgoingHeaders.CHEST_DEPOSIT_ACCEPT, ChestDepositAcceptComposer ],
            [ OutgoingHeaders.CHEST_DEPOSIT_CANCEL, ChestDepositCancelComposer ],
            [ OutgoingHeaders.CHEST_SAVE_SETTINGS, ChestSaveSettingsComposer ]
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

export class ChestOpenComposer extends Composer<[number]>
{
    constructor(chestId: number)
    {
        super();
        this._data = [ chestId ];
    }
}

export class ChestCloseComposer extends Composer<[number]>
{
    constructor(chestId: number)
    {
        super();
        this._data = [ chestId ];
    }
}

export class ChestStartDepositComposer extends Composer<[number]>
{
    constructor(chestId: number)
    {
        super();
        this._data = [ chestId ];
    }
}

export class ChestDepositItemsComposer extends Composer<unknown[]>
{
    constructor(remove: boolean, itemIds: number[])
    {
        super();
        this._data = [ remove, itemIds.length, ...itemIds ];
    }
}

export class ChestDepositAcceptComposer extends Composer<[boolean]>
{
    constructor(confirm: boolean)
    {
        super();
        this._data = [ confirm ];
    }
}

export class ChestDepositCancelComposer extends Composer<[number]>
{
    constructor(reason = 0)
    {
        super();
        this._data = [ reason ];
    }
}

export class ChestWithdrawFurniComposer extends Composer<[number, boolean, number, string, number]>
{
    constructor(chestId: number, isWallItem: boolean, spriteId: number, legacyPosterId: string, amount: number)
    {
        super();
        this._data = [ chestId, isWallItem, spriteId, legacyPosterId || '', amount ];
    }
}

export class ChestWithdrawCoinsComposer extends Composer<[number, number]>
{
    constructor(chestId: number, amount: number)
    {
        super();
        this._data = [ chestId, amount ];
    }
}

export class ChestWithdrawAllComposer extends Composer<[number]>
{
    constructor(chestId: number)
    {
        super();
        this._data = [ chestId ];
    }
}

const DEFAULT_CHEST_NOTIFICATION_SETTINGS = [ true, true, true, true, true ];

export class ChestSaveSettingsComposer extends Composer<unknown[]>
{
    constructor(chestId: number, allowOpen: boolean, allowDonate: boolean, displayName: string, description: string, appearanceState: number, previewMode: number, previewAmount: number, capacity: number, locked: boolean, autoLock: boolean, notificationSettings: boolean[] = DEFAULT_CHEST_NOTIFICATION_SETTINGS)
    {
        super();
        this._data = [ chestId, allowOpen, allowDonate, displayName || '', description || '', appearanceState, previewMode, previewAmount, capacity, locked, autoLock, ...DEFAULT_CHEST_NOTIFICATION_SETTINGS.map((value, index) => notificationSettings[index] ?? value) ];
    }
}

export class ChestOpenParser implements IMessageParser
{
    public chestId = 0;
    public chestType = ChestType.FURNI;
    public capacity = 0;
    public canWithdraw = false;
    public canDeposit = false;
    public canConfigure = false;
    public allowOpen = true;
    public allowDonate = false;
    public defaultName = '';
    public displayName = '';
    public description = '';
    public appearanceState = 0;
    public previewMode = 0;
    public previewAmount = 1;
    public locked = true;
    public autoLock = false;
    public notificationSettings = [ ...DEFAULT_CHEST_NOTIFICATION_SETTINGS ];

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chestId = wrapper.readInt();
        this.chestType = wrapper.readInt();
        this.capacity = wrapper.readInt();
        this.canWithdraw = wrapper.readBoolean();
        this.canDeposit = wrapper.readBoolean();
        this.canConfigure = wrapper.readBoolean();
        this.allowOpen = wrapper.readBoolean();
        this.allowDonate = wrapper.readBoolean();
        this.defaultName = wrapper.readString();
        this.displayName = wrapper.readString();
        this.description = wrapper.readString();
        this.appearanceState = wrapper.readInt();
        this.previewMode = wrapper.readInt();
        this.previewAmount = wrapper.readInt();
        this.locked = wrapper.readBoolean();
        this.autoLock = wrapper.readBoolean();
        this.notificationSettings = [ ...DEFAULT_CHEST_NOTIFICATION_SETTINGS ];

        try
        {
            this.notificationSettings = DEFAULT_CHEST_NOTIFICATION_SETTINGS.map(() => wrapper.readBoolean());
        }
        catch
        {}

        return true;
    }
}

export class ChestFurniContentsParser implements IMessageParser
{
    public chestId = 0;
    public totalFragments = 0;
    public fragment = 0;
    public items: ItemDataStructure[] = [];

    public flush(): boolean
    {
        this.items = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chestId = wrapper.readInt();
        this.totalFragments = wrapper.readInt();
        this.fragment = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this.items.push(new ItemDataStructure(wrapper));
            count--;
        }

        return true;
    }
}

export class ChestFurniContentsUpdateParser implements IMessageParser
{
    public chestId = 0;
    public removedIds: number[] = [];
    public addedItems: ItemDataStructure[] = [];

    public flush(): boolean
    {
        this.removedIds = [];
        this.addedItems = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chestId = wrapper.readInt();

        let removedCount = wrapper.readInt();

        while(removedCount > 0)
        {
            this.removedIds.push(wrapper.readInt());
            removedCount--;
        }

        let addedCount = wrapper.readInt();

        while(addedCount > 0)
        {
            this.addedItems.push(new ItemDataStructure(wrapper));
            addedCount--;
        }

        return true;
    }
}

export class ChestCoinBalanceParser implements IMessageParser
{
    public chestId = 0;
    public coins = 0;
    public update = false;

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chestId = wrapper.readInt();
        this.coins = wrapper.readInt();
        this.update = wrapper.readBoolean();
        return true;
    }
}

export class ChestDepositStartedParser implements IMessageParser
{
    public chestId = 0;
    public chestType = ChestType.FURNI;
    public timeoutSeconds = 0;
    public contractType = '';
    public contractDataJson = '{}';
    public multiplier = 1;
    public autoMultiplier = false;

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chestId = wrapper.readInt();
        this.chestType = wrapper.readInt();
        this.timeoutSeconds = wrapper.readInt();
        this.contractType = wrapper.readString();
        this.contractDataJson = wrapper.readString();
        this.multiplier = wrapper.readInt();
        this.autoMultiplier = wrapper.readBoolean();
        return true;
    }
}

export class ChestDepositUpdateParser implements IMessageParser
{
    public chestId = 0;
    public chestType = ChestType.FURNI;
    public accepted = false;
    public canConfirm = false;
    public itemCount = 0;
    public credits = 0;
    public items: ItemDataStructure[] = [];

    public flush(): boolean
    {
        this.items = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chestId = wrapper.readInt();
        this.chestType = wrapper.readInt();
        this.accepted = wrapper.readBoolean();
        this.canConfirm = wrapper.readBoolean();
        this.itemCount = wrapper.readInt();
        this.credits = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this.items.push(new ItemDataStructure(wrapper));
            count--;
        }

        return true;
    }
}

export class ChestDepositCancelledParser implements IMessageParser
{
    public reason = 0;

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.reason = wrapper.readInt();
        return true;
    }
}

export class ChestDepositCompletedParser implements IMessageParser
{
    public chestId = 0;

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chestId = wrapper.readInt();
        return true;
    }
}

export class ChestTransactionFailedParser implements IMessageParser
{
    public code = 1000;
    public localizationKey = '';
    public message = '';

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.code = wrapper.readInt();
        this.localizationKey = wrapper.readString();
        this.message = wrapper.readString();
        return true;
    }
}

export class ChestNotificationParser implements IMessageParser
{
    public key = '';
    public kind = '';
    public active = true;
    public persistent = false;
    public timeoutMs = 8000;
    public chestId = 0;
    public roomId = 0;
    public userId = 0;
    public username = '';
    public chestTypes = '';
    public furniCount = 0;
    public coinCount = 0;
    public message = '';

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.key = wrapper.readString();
        this.kind = wrapper.readString();
        this.active = wrapper.readBoolean();
        this.persistent = wrapper.readBoolean();
        this.timeoutMs = wrapper.readInt();
        this.chestId = wrapper.readInt();
        this.roomId = wrapper.readInt();
        this.userId = wrapper.readInt();
        this.username = wrapper.readString();
        this.chestTypes = wrapper.readString();
        this.furniCount = wrapper.readInt();
        this.coinCount = wrapper.readInt();
        this.message = wrapper.readString();
        return true;
    }
}

export class ChestOpenEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestOpenParser);
    }

    public getParser(): ChestOpenParser
    {
        return this.parser as ChestOpenParser;
    }
}

export class ChestFurniContentsEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestFurniContentsParser);
    }

    public getParser(): ChestFurniContentsParser
    {
        return this.parser as ChestFurniContentsParser;
    }
}

export class ChestFurniContentsUpdateEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestFurniContentsUpdateParser);
    }

    public getParser(): ChestFurniContentsUpdateParser
    {
        return this.parser as ChestFurniContentsUpdateParser;
    }
}

export class ChestCoinBalanceEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestCoinBalanceParser);
    }

    public getParser(): ChestCoinBalanceParser
    {
        return this.parser as ChestCoinBalanceParser;
    }
}

export class ChestDepositStartedEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestDepositStartedParser);
    }

    public getParser(): ChestDepositStartedParser
    {
        return this.parser as ChestDepositStartedParser;
    }
}

export class ChestDepositUpdateEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestDepositUpdateParser);
    }

    public getParser(): ChestDepositUpdateParser
    {
        return this.parser as ChestDepositUpdateParser;
    }
}

export class ChestDepositCancelledEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestDepositCancelledParser);
    }

    public getParser(): ChestDepositCancelledParser
    {
        return this.parser as ChestDepositCancelledParser;
    }
}

export class ChestDepositCompletedEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestDepositCompletedParser);
    }

    public getParser(): ChestDepositCompletedParser
    {
        return this.parser as ChestDepositCompletedParser;
    }
}

export class ChestTransactionFailedEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestTransactionFailedParser);
    }

    public getParser(): ChestTransactionFailedParser
    {
        return this.parser as ChestTransactionFailedParser;
    }
}

export class ChestNotificationEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestNotificationParser);
    }

    public getParser(): ChestNotificationParser
    {
        return this.parser as ChestNotificationParser;
    }
}
