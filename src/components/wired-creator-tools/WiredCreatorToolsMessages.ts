import { IMessageComposer, IMessageDataWrapper, IMessageEvent, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';

export interface WiredCreatorToolsRoomStats
{
    wiredUsage: number;
    wiredUsageLimit: number;
    isHeavy: boolean;
    floorFurni: number;
    floorFurniLimit: number;
    wallFurni: number;
    wallFurniLimit: number;
    permanentFurniVariables: number;
    permanentFurniVariablesLimit: number;
    permanentUserVariables: number;
    permanentUserVariablesLimit: number;
    permanentGlobalVariables: number;
    permanentGlobalVariablesLimit: number;
    timezone: string;
    globalValues: Record<string, string>;
    furniVariables: string[];
    userVariables: string[];
    globalVariables: string[];
    wiredModifyPermissions: number;
    wiredInspectPermissions: number;
    showToolbar: boolean;
    showInspectButton: boolean;
    playtestingMode: boolean;
    handitemPassingBlocked: boolean;
}

export interface WiredCreatorToolsInspectionValues
{
    sourceType: 'furni' | 'user' | 'global';
    sourceId: number;
    values: Record<string, string>;
    variables: string[];
}

export interface WiredMouseHoldStateUpdate
{
    sourceId: number;
    holdId: number;
    sequence: number;
    changeType: number;
    active: boolean;
    values: Record<string, string>;
}

export interface WiredCreatorToolsLogEntry
{
    timestamp: string;
    source: string;
    category: string;
    message: string;
}

export interface WiredCreatorToolsChestLogDetailItem
{
    furniCode: string;
    name: string;
    spriteId: number;
    productType: string;
    extraData: string;
    amount: number;
}

export interface WiredCreatorToolsChestLogDetails
{
    withdrawals: WiredCreatorToolsChestLogDetailItem[];
    deposits: WiredCreatorToolsChestLogDetailItem[];
}

export interface WiredCreatorToolsChestLogEntry
{
    timestamp: string;
    type: string;
    userId: number;
    username: string;
    withdrawalFurni: number;
    withdrawalCoins: number;
    depositFurni: number;
    depositCoins: number;
    chestCount: number;
    detailsJson: string;
    details: WiredCreatorToolsChestLogDetails;
}

export type WiredCreatorToolsRoomAction = 'reload' | 'rollback' | 'lock_own_chests' | 'unlock_own_chests' | 'lock_all_chests';

export interface WiredCreatorToolsVariableHighlightTarget
{
    objectId: number;
    category: number;
    value: string;
}

export interface WiredCreatorToolsVariableHighlight
{
    sourceType: 'furni' | 'user';
    variableName: string;
    targets: WiredCreatorToolsVariableHighlightTarget[];
}

export interface WiredCreatorToolItem
{
    key: number;
    id: number;
    orderNumber: number;
    itemId: number;
    spriteId: number;
    name: string;
    catalogName: string;
    productType: string;
    previewAsset: string;
}

export interface WiredCreatorToolCreated
{
    toolId: number;
    itemId: number;
    baseItemId: number;
    spriteId: number;
    productType: string;
    extraData: string;
}

export class WiredCreatorToolsRoomStatsParser implements IMessageParser
{
    private _stats: WiredCreatorToolsRoomStats = null;

    public flush(): boolean
    {
        this._stats = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const stats: WiredCreatorToolsRoomStats = {
            wiredUsage: wrapper.readInt(),
            wiredUsageLimit: wrapper.readInt(),
            isHeavy: wrapper.readBoolean(),
            floorFurni: wrapper.readInt(),
            floorFurniLimit: wrapper.readInt(),
            wallFurni: wrapper.readInt(),
            wallFurniLimit: wrapper.readInt(),
            permanentFurniVariables: wrapper.readInt(),
            permanentFurniVariablesLimit: wrapper.readInt(),
            permanentUserVariables: wrapper.readInt(),
            permanentUserVariablesLimit: wrapper.readInt(),
            permanentGlobalVariables: wrapper.readInt(),
            permanentGlobalVariablesLimit: wrapper.readInt(),
            timezone: wrapper.readString(),
            globalValues: {},
            furniVariables: [],
            userVariables: [],
            globalVariables: [],
            wiredModifyPermissions: wrapper.readInt(),
            wiredInspectPermissions: wrapper.readInt(),
            showToolbar: wrapper.readBoolean(),
            showInspectButton: wrapper.readBoolean(),
            playtestingMode: wrapper.readBoolean(),
            handitemPassingBlocked: wrapper.readBoolean()
        };

        const globalValueCount = wrapper.readInt();

        for(let i = 0; i < globalValueCount; i++)
        {
            stats.globalValues[wrapper.readString()] = wrapper.readString();
        }

        const furniVariableCount = wrapper.readInt();

        for(let i = 0; i < furniVariableCount; i++)
        {
            stats.furniVariables.push(wrapper.readString());
        }

        const userVariableCount = wrapper.readInt();

        for(let i = 0; i < userVariableCount; i++)
        {
            stats.userVariables.push(wrapper.readString());
        }

        const globalVariableCount = wrapper.readInt();

        for(let i = 0; i < globalVariableCount; i++)
        {
            stats.globalVariables.push(wrapper.readString());
        }

        this._stats = stats;
        return true;
    }

    public get stats(): WiredCreatorToolsRoomStats
    {
        return this._stats;
    }
}

export class WiredCreatorToolsVariableHighlightParser implements IMessageParser
{
    private _highlight: WiredCreatorToolsVariableHighlight = null;

    public flush(): boolean
    {
        this._highlight = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const highlight: WiredCreatorToolsVariableHighlight = {
            sourceType: wrapper.readString() as 'furni' | 'user',
            variableName: wrapper.readString(),
            targets: []
        };

        const targetCount = wrapper.readInt();

        for(let i = 0; i < targetCount; i++)
        {
            highlight.targets.push({
                objectId: wrapper.readInt(),
                category: wrapper.readInt(),
                value: wrapper.readString()
            });
        }

        this._highlight = highlight;
        return true;
    }

    public get highlight(): WiredCreatorToolsVariableHighlight
    {
        return this._highlight;
    }
}

export class WiredCreatorToolsVariableHighlightEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsVariableHighlightParser);
    }

    public getParser(): WiredCreatorToolsVariableHighlightParser
    {
        return this.parser as WiredCreatorToolsVariableHighlightParser;
    }
}

export class WiredCreatorToolsRoomStatsEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsRoomStatsParser);
    }

    public getParser(): WiredCreatorToolsRoomStatsParser
    {
        return this.parser as WiredCreatorToolsRoomStatsParser;
    }
}

export class WiredCreatorToolsCatalogParser implements IMessageParser
{
    private _pages: Map<number, WiredCreatorToolItem[]> = new Map();

    public flush(): boolean
    {
        this._pages = new Map();
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const pages = new Map<number, WiredCreatorToolItem[]>();
        const pageCount = wrapper.readInt();

        for(let pageIndex = 0; pageIndex < pageCount; pageIndex++)
        {
            const pageId = wrapper.readInt();
            const itemCount = wrapper.readInt();
            const items: WiredCreatorToolItem[] = [];

            for(let itemIndex = 0; itemIndex < itemCount; itemIndex++)
            {
                const id = wrapper.readInt();

                items.push({
                    key: id,
                    id,
                    orderNumber: wrapper.readInt(),
                    itemId: wrapper.readInt(),
                    spriteId: wrapper.readInt(),
                    productType: wrapper.readString().toLowerCase(),
                    catalogName: wrapper.readString(),
                    name: wrapper.readString(),
                    previewAsset: wrapper.readString()
                });
            }

            pages.set(pageId, items);
        }

        this._pages = pages;
        return true;
    }

    public get pages(): Map<number, WiredCreatorToolItem[]>
    {
        return this._pages;
    }
}

export class WiredCreatorToolsCatalogEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsCatalogParser);
    }

    public getParser(): WiredCreatorToolsCatalogParser
    {
        return this.parser as WiredCreatorToolsCatalogParser;
    }
}

export class WiredCreatorToolsCreateItemParser implements IMessageParser
{
    private _createdItem: WiredCreatorToolCreated = null;

    public flush(): boolean
    {
        this._createdItem = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._createdItem = {
            toolId: wrapper.readInt(),
            itemId: wrapper.readInt(),
            baseItemId: wrapper.readInt(),
            spriteId: wrapper.readInt(),
            productType: wrapper.readString().toLowerCase(),
            extraData: wrapper.readString()
        };

        return true;
    }

    public get createdItem(): WiredCreatorToolCreated
    {
        return this._createdItem;
    }
}

export class WiredCreatorToolsCreateItemEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsCreateItemParser);
    }

    public getParser(): WiredCreatorToolsCreateItemParser
    {
        return this.parser as WiredCreatorToolsCreateItemParser;
    }
}

export class WiredCreatorToolsOpenParser implements IMessageParser
{
    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        return true;
    }
}

export class WiredCreatorToolsOpenEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsOpenParser);
    }
}

export class WiredCreatorToolsInspectionValuesParser implements IMessageParser
{
    private _inspectionValues: WiredCreatorToolsInspectionValues = null;

    public flush(): boolean
    {
        this._inspectionValues = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const inspectionValues: WiredCreatorToolsInspectionValues = {
            sourceType: wrapper.readString() as 'furni' | 'user',
            sourceId: wrapper.readInt(),
            values: {},
            variables: []
        };

        const valueCount = wrapper.readInt();

        for(let i = 0; i < valueCount; i++)
        {
            inspectionValues.values[wrapper.readString()] = wrapper.readString();
        }

        const variableCount = wrapper.readInt();

        for(let i = 0; i < variableCount; i++)
        {
            inspectionValues.variables.push(wrapper.readString());
        }

        this._inspectionValues = inspectionValues;
        return true;
    }

    public get inspectionValues(): WiredCreatorToolsInspectionValues
    {
        return this._inspectionValues;
    }
}

export class WiredCreatorToolsInspectionValuesEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsInspectionValuesParser);
    }

    public getParser(): WiredCreatorToolsInspectionValuesParser
    {
        return this.parser as WiredCreatorToolsInspectionValuesParser;
    }
}

export class WiredMouseHoldStateParser implements IMessageParser
{
    private _state: WiredMouseHoldStateUpdate = null;

    public flush(): boolean
    {
        this._state = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const sourceId = wrapper.readInt();
        const holdId = wrapper.readInt();
        const sequence = wrapper.readInt();
        const changeType = wrapper.readInt();
        const active = wrapper.readBoolean();
        const durationTicks = wrapper.readString();
        const originType = wrapper.readInt();
        const originId = wrapper.readInt();
        const originX = wrapper.readInt();
        const originY = wrapper.readInt();
        const originHasTile = wrapper.readBoolean();
        const values: Record<string, string> = {};

        if(active)
        {
            values['@is_holding_down'] = ' ';
            values['@is_holding_down.duration_ticks'] = durationTicks;
            values['@is_holding_down.origin_type'] = String(originType);
            values['@is_holding_down.origin_id'] = String(originId);
            if(originHasTile)
            {
                values['@is_holding_down.origin_x'] = String(originX);
                values['@is_holding_down.origin_y'] = String(originY);
            }
        }

        this._state = { sourceId, holdId, sequence, changeType, active, values };
        return true;
    }

    public get state(): WiredMouseHoldStateUpdate
    {
        return this._state;
    }
}

export class WiredMouseHoldStateEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredMouseHoldStateParser);
    }

    public getParser(): WiredMouseHoldStateParser
    {
        return this.parser as WiredMouseHoldStateParser;
    }
}

export class WiredCreatorToolsLogsParser implements IMessageParser
{
    private _logs: WiredCreatorToolsLogEntry[] = [];

    public flush(): boolean
    {
        this._logs = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const logs: WiredCreatorToolsLogEntry[] = [];
        const logCount = wrapper.readInt();

        for(let i = 0; i < logCount; i++)
        {
            logs.push({
                timestamp: wrapper.readString(),
                source: wrapper.readString(),
                category: wrapper.readString(),
                message: wrapper.readString()
            });
        }

        this._logs = logs;
        return true;
    }

    public get logs(): WiredCreatorToolsLogEntry[]
    {
        return this._logs;
    }
}

export class WiredCreatorToolsLogsEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsLogsParser);
    }

    public getParser(): WiredCreatorToolsLogsParser
    {
        return this.parser as WiredCreatorToolsLogsParser;
    }
}

const normalizeChestLogDetailItems = (items: unknown): WiredCreatorToolsChestLogDetailItem[] =>
{
    if(!Array.isArray(items)) return [];

    return items.map(item =>
    {
        const detail = (item ?? {}) as Partial<WiredCreatorToolsChestLogDetailItem>;

        return {
            furniCode: String(detail.furniCode ?? ''),
            name: String(detail.name ?? ''),
            spriteId: Number(detail.spriteId ?? 0) || 0,
            productType: String(detail.productType ?? 'floor').toLowerCase(),
            extraData: String(detail.extraData ?? ''),
            amount: Math.max(1, Number(detail.amount ?? 1) || 1)
        };
    });
};

const parseChestLogDetails = (detailsJson: string): WiredCreatorToolsChestLogDetails =>
{
    try
    {
        const parsed = JSON.parse(detailsJson || '{}');

        return {
            withdrawals: normalizeChestLogDetailItems(parsed?.withdrawals),
            deposits: normalizeChestLogDetailItems(parsed?.deposits)
        };
    }
    catch
    {
        return { withdrawals: [], deposits: [] };
    }
};

export class WiredCreatorToolsChestLogsParser implements IMessageParser
{
    private _logs: WiredCreatorToolsChestLogEntry[] = [];

    public flush(): boolean
    {
        this._logs = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const logs: WiredCreatorToolsChestLogEntry[] = [];
        const logCount = wrapper.readInt();

        for(let i = 0; i < logCount; i++)
        {
            const timestamp = wrapper.readString();
            const type = wrapper.readString();
            const userId = wrapper.readInt();
            const username = wrapper.readString();
            const withdrawalFurni = wrapper.readInt();
            const withdrawalCoins = wrapper.readInt();
            const depositFurni = wrapper.readInt();
            const depositCoins = wrapper.readInt();
            const chestCount = wrapper.readInt();
            const detailsJson = wrapper.readString();

            logs.push({
                timestamp,
                type,
                userId,
                username,
                withdrawalFurni,
                withdrawalCoins,
                depositFurni,
                depositCoins,
                chestCount,
                detailsJson,
                details: parseChestLogDetails(detailsJson)
            });
        }

        this._logs = logs;
        return true;
    }

    public get logs(): WiredCreatorToolsChestLogEntry[]
    {
        return this._logs;
    }
}

export class WiredCreatorToolsChestLogsEvent extends MessageEvent implements IMessageEvent
{
    public constructor(callBack: Function)
    {
        super(callBack, WiredCreatorToolsChestLogsParser);
    }

    public getParser(): WiredCreatorToolsChestLogsParser
    {
        return this.parser as WiredCreatorToolsChestLogsParser;
    }
}

export class WiredCreatorToolsRoomStatsComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly timezone: string)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.timezone ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsInspectionValuesComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly sourceType: 'furni' | 'user', private readonly sourceId: number)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.sourceType, this.sourceId ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredMouseHoldSubscriptionComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly subscribe: boolean, private readonly sourceId: number)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.subscribe, this.sourceId ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsSaveSettingsComposer implements IMessageComposer<unknown[]>
{
    public constructor(
        private readonly timezone: string,
        private readonly wiredModifyPermissions: number,
        private readonly wiredInspectPermissions: number,
        private readonly showToolbar: boolean,
        private readonly showInspectButton: boolean,
        private readonly playtestingMode: boolean)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.timezone, this.wiredModifyPermissions, this.wiredInspectPermissions, this.showToolbar, this.showInspectButton, this.playtestingMode ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsVariableActionComposer implements IMessageComposer<unknown[]>
{
    public constructor(
        private readonly sourceType: 'furni' | 'user' | 'global',
        private readonly sourceId: number,
        private readonly action: 'give' | 'remove' | 'set',
        private readonly variableName: string,
        private readonly value: number = 0)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.sourceType, this.sourceId, this.action, this.variableName, this.value ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsLogsComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly clearLogs: boolean = false)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.clearLogs ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsVariableHighlightComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly sourceType: 'furni' | 'user', private readonly variableName: string)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.sourceType, this.variableName ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsRoomActionComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly action: WiredCreatorToolsRoomAction)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.action ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsChestLogsComposer implements IMessageComposer<unknown[]>
{
    public getMessageArray(): unknown[]
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsCatalogComposer implements IMessageComposer<unknown[]>
{
    public getMessageArray(): unknown[]
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsCreateItemComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly toolId: number)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.toolId ];
    }

    public dispose(): void
    {
        return;
    }
}

export class WiredCreatorToolsCancelPlacementComposer implements IMessageComposer<unknown[]>
{
    public constructor(private readonly itemId: number)
    {}

    public getMessageArray(): unknown[]
    {
        return [ this.itemId ];
    }

    public dispose(): void
    {
        return;
    }
}

export const WiredCreatorToolsMessageConfiguration = {
    events: new Map<number, Function>([
        [ 4051, WiredCreatorToolsRoomStatsEvent ],
        [ 4052, WiredCreatorToolsOpenEvent ],
        [ 4054, WiredCreatorToolsInspectionValuesEvent ],
        [ 4056, WiredCreatorToolsLogsEvent ],
        [ 4057, WiredCreatorToolsVariableHighlightEvent ],
        [ 4059, WiredCreatorToolsCatalogEvent ],
        [ 4060, WiredCreatorToolsCreateItemEvent ],
        [ 4065, WiredMouseHoldStateEvent ],
        [ 4074, WiredCreatorToolsChestLogsEvent ]
    ]),
    composers: new Map<number, Function>([
        [ 4050, WiredCreatorToolsRoomStatsComposer ],
        [ 4053, WiredCreatorToolsSaveSettingsComposer ],
        [ 4054, WiredCreatorToolsInspectionValuesComposer ],
        [ 4055, WiredCreatorToolsVariableActionComposer ],
        [ 4056, WiredCreatorToolsLogsComposer ],
        [ 4057, WiredCreatorToolsVariableHighlightComposer ],
        [ 4058, WiredCreatorToolsRoomActionComposer ],
        [ 4059, WiredCreatorToolsCatalogComposer ],
        [ 4060, WiredCreatorToolsCreateItemComposer ],
        [ 4061, WiredCreatorToolsCancelPlacementComposer ],
        [ 4065, WiredMouseHoldSubscriptionComposer ],
        [ 4074, WiredCreatorToolsChestLogsComposer ]
    ])
};
