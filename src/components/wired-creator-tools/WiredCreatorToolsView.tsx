import { ILinkEventTracker, RoomEngineObjectEvent, RoomEngineObjectPlacedEvent, RoomObjectCategory, RoomObjectPlacementSource, RoomObjectType, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import arrowRightAdjustIcon from '../../assets/images/wired/arrow_rightadjust_hover.png';
import chestCoinIcon from '../../assets/images/wired/chest_coin.png';
import { AddEventLinkTracker, AvatarInfoUtilities, GetConnection, GetNitroInstance, GetRoomEngine, GetRoomSession, GetUserProfile, LocalizeText, ProductTypeEnum, RemoveLinkEventTracker, SendMessageComposer, SetWiredCreatorToolsSettings } from '../../api';
import { BitmapText, Button, LayoutAvatarImageView, LayoutFurniImageView, LayoutPetImageView, NitroCardContentView, NitroCardView } from '../../common';
import { useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { chooserSelectionVisualizer } from '../../api/room/widgets/chooserSelectionVisualizer';
import { ObjectLocationView } from '../room/widgets/object-location/ObjectLocationView';
import { WiredAdjustButton, WiredSelect, WiredTextInput } from '../wired/views/WiredControls';
import { WiredIcon, wiredIconUrl } from '../wired/views/WiredIcons';
import { WIRED_CREATOR_TOOLS_DEFAULTS } from './WiredCreatorToolsContracts';
import { WiredCreatorToolCreated, WiredCreatorToolsCancelPlacementComposer, WiredCreatorToolsCatalogComposer, WiredCreatorToolsCatalogEvent, WiredCreatorToolsChestLogDetailItem, WiredCreatorToolsChestLogEntry, WiredCreatorToolsChestLogsComposer, WiredCreatorToolsChestLogsEvent, WiredCreatorToolsCreateItemComposer, WiredCreatorToolsCreateItemEvent, WiredCreatorToolsInspectionValues, WiredCreatorToolsInspectionValuesComposer, WiredCreatorToolsInspectionValuesEvent, WiredCreatorToolsLogEntry, WiredCreatorToolsLogsComposer, WiredCreatorToolsLogsEvent, WiredCreatorToolsMessageConfiguration, WiredCreatorToolsOpenEvent, WiredCreatorToolsRoomAction, WiredCreatorToolsRoomActionComposer, WiredCreatorToolsRoomStats, WiredCreatorToolsRoomStatsComposer, WiredCreatorToolsRoomStatsEvent, WiredCreatorToolsSaveSettingsComposer, WiredCreatorToolsVariableActionComposer, WiredCreatorToolsVariableHighlight, WiredCreatorToolsVariableHighlightComposer, WiredCreatorToolsVariableHighlightEvent, WiredMouseHoldStateEvent, WiredMouseHoldStateUpdate, WiredMouseHoldSubscriptionComposer } from './WiredCreatorToolsMessages';

type WiredCreatorToolsTab = 'monitor' | 'variables' | 'inspection' | 'chests' | 'tools' | 'settings';
type VariableType = 'furni' | 'user' | 'global' | 'context';
type InspectionType = 'furni' | 'user' | 'global';
type ToolType = 'triggers' | 'effects' | 'conditions' | 'selectors' | 'addons' | 'variables' | 'extras';

const TIMEZONES = [
    'Europe/London', 'America/Antigua', 'America/Barbados', 'America/Guyana',
    'America/Jamaica', 'America/Puerto_Rico', 'Australia/Adelaide', 'Australia/Brisbane',
    'Australia/Darwin', 'Australia/Eucla', 'Australia/Lord_Howe', 'Australia/Perth',
    'Australia/Sydney', 'Canada/Atlantic', 'Canada/Central', 'Canada/Eastern',
    'Canada/Mountain', 'Canada/Newfoundland', 'Canada/Pacific', 'Canada/Saskatchewan',
    'Canada/Yukon', 'Pacific/Auckland', 'US/Alaska', 'US/Aleutian', 'US/Arizona',
    'US/Central', 'US/East-Indiana', 'US/Eastern', 'US/Hawaii', 'US/Indiana-Starke',
    'US/Michigan', 'US/Mountain', 'US/Pacific', 'US/Samoa'
];

interface WiredCreatorToolsTabDefinition
{
    key: WiredCreatorToolsTab;
    label: string;
    iconClass: string;
}

interface MonitorStat
{
    key: string;
    label: string;
    value: string;
}

interface MonitorLog
{
    type: string;
    category: string;
    amount: number;
    latest: string;
    message: string;
    source: string;
}

interface MonitorLogInfo
{
    severity: 'ERROR' | 'WARNING';
    info: string;
}

interface VariableDefinition
{
    key: string;
    parentKey?: string;
    type: 'Internal' | 'Created by user';
    target: 'Furni' | 'User' | 'Global' | 'Context';
    availability: string;
    hasValue: string;
    canWriteTo: string;
    canCreateDelete: string;
    canIntercept: string;
    isAlwaysAvailable: string;
    hasCreationTime: string;
    hasUpdateTime: string;
    isTextConnected: string;
    textValues?: { value: string; text: string; }[];
}

interface WiredToolItem
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

type TextValueRow = { value: string; text: string; };

interface LogsWindowState
{
    logFilter: string;
    setLogFilter: (value: string) => void;
    logSourceFilter: string;
    setLogSourceFilter: (value: string) => void;
    logCategoryFilter: string;
    setLogCategoryFilter: (value: string) => void;
    autoRefreshLogs: boolean;
    setAutoRefreshLogs: (value: boolean) => void;
    clampedLogPage: number;
    pageCount: number;
    setLogPage: (value: number | ((previous: number) => number)) => void;
}

interface ChestLogsWindowState
{
    filter: string;
    setFilter: (value: string) => void;
    typeFilter: string;
    setTypeFilter: (value: string) => void;
    autoRefresh: boolean;
    setAutoRefresh: (value: boolean) => void;
    clampedPage: number;
    pageCount: number;
    setPage: (value: number | ((previous: number) => number)) => void;
}

type InspectionPreview =
    | { type: 'user'; id: number; name: string; figure: string; isPet?: boolean; }
    | { type: 'furni'; id: number; category: number; name: string; imageSrc: string; };

const TABS: WiredCreatorToolsTabDefinition[] = [
    { key: 'monitor', label: 'Monitor', iconClass: 'wired-tools-tab-monitor' },
    { key: 'variables', label: 'Variables', iconClass: 'wired-tools-tab-variables' },
    { key: 'inspection', label: 'Inspection', iconClass: 'wired-tools-tab-inspection' },
    { key: 'chests', label: 'Chests', iconClass: 'wired-tools-tab-chests' },
    { key: 'tools', label: 'Tools', iconClass: 'wired-tools-tab-tools' },
    { key: 'settings', label: 'Settings', iconClass: 'wired-tools-tab-settings' }
];

const ROOM_STATS_REFRESH_EVENTS = [
    RoomEngineObjectEvent.ADDED,
    RoomEngineObjectEvent.REMOVED,
    RoomEngineObjectEvent.PLACED
];

const EMPTY_MOUNTED_TABS: Record<WiredCreatorToolsTab, boolean> = {
    monitor: true,
    variables: false,
    inspection: false,
    chests: false,
    tools: false,
    settings: false
};

const LOGS_PAGE_SIZE = 50;
const WIRED_PERMISSION_RIGHTS = 1;
const WIRED_PERMISSION_GROUP_MEMBERS = 2;
const WIRED_PERMISSION_GROUP_ADMINS = 4;
const WIRED_PERMISSION_EVERYONE = 8;

const DEFAULT_SHOW_TOOLBAR = true;
const DEFAULT_SHOW_INSPECT_BUTTON = true;
const DEFAULT_PLAYTESTING_MODE = false;

type WiredPermissionOption = { key: number; label: string; };

const WIRED_MODIFY_PERMISSION_OPTIONS: WiredPermissionOption[] = [
    { key: WIRED_PERMISSION_RIGHTS, label: 'Users with rights' },
    { key: WIRED_PERMISSION_GROUP_MEMBERS, label: 'Group Members' },
    { key: WIRED_PERMISSION_GROUP_ADMINS, label: 'Group Admins' }
];

const WIRED_INSPECT_PERMISSION_OPTIONS: WiredPermissionOption[] = [
    { key: WIRED_PERMISSION_EVERYONE, label: 'Everyone' },
    { key: WIRED_PERMISSION_RIGHTS, label: 'Users with rights' },
    { key: WIRED_PERMISSION_GROUP_MEMBERS, label: 'Group Members' },
    { key: WIRED_PERMISSION_GROUP_ADMINS, label: 'Group Admins' }
];

const normalizeWiredModifyPermissions = (permissions: number) =>
{
    let normalized = permissions & (WIRED_PERMISSION_RIGHTS | WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS);

    if(normalized & WIRED_PERMISSION_GROUP_MEMBERS) normalized |= WIRED_PERMISSION_GROUP_ADMINS;

    return normalized;
};

const normalizeWiredInspectPermissions = (permissions: number) =>
{
    let normalized = permissions & (WIRED_PERMISSION_EVERYONE | WIRED_PERMISSION_RIGHTS | WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS);

    if(normalized & WIRED_PERMISSION_EVERYONE) normalized |= WIRED_PERMISSION_RIGHTS | WIRED_PERMISSION_GROUP_MEMBERS | WIRED_PERMISSION_GROUP_ADMINS;
    if(normalized & WIRED_PERMISSION_GROUP_MEMBERS) normalized |= WIRED_PERMISSION_GROUP_ADMINS;

    return normalized;
};

const WiredButtonInfoText: FC<{ children: ReactNode }> = memo(({ children }) => (
    <span className="nw-control-text wired-tools-ui-text">{ children }</span>
));

const VARIABLE_TYPE_OPTIONS: Array<{ key: VariableType; label: string; iconClass: string; }> = [
    { key: 'furni', label: 'Furni', iconClass: 'wired-tools-variable-furni' },
    { key: 'user', label: 'User', iconClass: 'wired-tools-variable-user' },
    { key: 'global', label: 'Global', iconClass: 'wired-tools-variable-global' },
    { key: 'context', label: 'Context', iconClass: 'wired-tools-variable-context' }
];

const INSPECTION_TYPE_OPTIONS: Array<{ key: InspectionType; label: string; iconClass: string; }> = [
    { key: 'furni', label: 'Furni', iconClass: 'wired-tools-variable-furni' },
    { key: 'user', label: 'User', iconClass: 'wired-tools-variable-user' },
    { key: 'global', label: 'Global', iconClass: 'wired-tools-variable-global' }
];

const TOOL_TYPE_OPTIONS: Array<{ key: ToolType; label: string; iconClass: string; }> = [
    { key: 'triggers', label: 'Triggers', iconClass: 'wired-tools-tool-triggers' },
    { key: 'effects', label: 'Effects', iconClass: 'wired-tools-tool-effects' },
    { key: 'conditions', label: 'Conditions', iconClass: 'wired-tools-tool-conditions' },
    { key: 'selectors', label: 'Selectors', iconClass: 'wired-tools-tool-selectors' },
    { key: 'addons', label: 'Add-Ons', iconClass: 'wired-tools-tool-addons' },
    { key: 'variables', label: 'Variables', iconClass: 'wired-tools-tool-variables' },
    { key: 'extras', label: 'Extras', iconClass: 'wired-tools-tool-extras' }
];

const TOOL_TYPE_LABELS: Record<ToolType, string> = TOOL_TYPE_OPTIONS.reduce((previous, option) =>
{
    previous[option.key] = option.label;

    return previous;
}, {} as Record<ToolType, string>);

const TOOL_TYPE_PAGE_IDS: Record<ToolType, number> = {
    triggers: 1,
    effects: 2,
    conditions: 3,
    selectors: 4,
    addons: 5,
    variables: 6,
    extras: 7
};

const TOOL_PAGE_ID_TYPES = Object.entries(TOOL_TYPE_PAGE_IDS).reduce((previous, [ key, value ]) =>
{
    previous[value] = key as ToolType;

    return previous;
}, {} as Record<number, ToolType>);

const MONITOR_STATS: MonitorStat[] = [
    { key: 'wiredUsage', label: 'Wired Usage', value: `0/${ WIRED_CREATOR_TOOLS_DEFAULTS.maxUsage }` },
    { key: 'isHeavy', label: 'Is Heavy', value: 'No' },
    { key: 'floorFurni', label: 'Floor Furni', value: '0/0' },
    { key: 'wallFurni', label: 'Wall Furni', value: '0/0' },
    { key: 'permanentFurniVariables', label: 'Permanent Furni Variables', value: '0/0' },
    { key: 'permanentUserVariables', label: 'Permanent User Variables', value: '0/0' },
    { key: 'permanentGlobalVariables', label: 'Permanent Global Variables', value: '0/0' }
];

const getMonitorStats = (stats: WiredCreatorToolsRoomStats): MonitorStat[] => [
    { key: 'wiredUsage', label: 'Wired Usage', value: `${ stats.wiredUsage }/${ stats.wiredUsageLimit }` },
    { key: 'isHeavy', label: 'Is Heavy', value: stats.isHeavy ? 'Yes' : 'No' },
    { key: 'floorFurni', label: 'Floor Furni', value: `${ stats.floorFurni }/${ stats.floorFurniLimit }` },
    { key: 'wallFurni', label: 'Wall Furni', value: `${ stats.wallFurni }/${ stats.wallFurniLimit }` },
    { key: 'permanentFurniVariables', label: 'Permanent Furni Variables', value: `${ stats.permanentFurniVariables }/${ stats.permanentFurniVariablesLimit }` },
    { key: 'permanentUserVariables', label: 'Permanent User Variables', value: `${ stats.permanentUserVariables }/${ stats.permanentUserVariablesLimit }` },
    { key: 'permanentGlobalVariables', label: 'Permanent Global Variables', value: `${ stats.permanentGlobalVariables }/${ stats.permanentGlobalVariablesLimit }` }
];

const getChangedMonitorStatKeys = (previous: WiredCreatorToolsRoomStats, next: WiredCreatorToolsRoomStats) =>
{
    if(!previous) return [];

    const changed: string[] = [];

    if(previous.wiredUsage !== next.wiredUsage || previous.wiredUsageLimit !== next.wiredUsageLimit) changed.push('wiredUsage');
    if(previous.isHeavy !== next.isHeavy) changed.push('isHeavy');
    if(previous.floorFurni !== next.floorFurni || previous.floorFurniLimit !== next.floorFurniLimit) changed.push('floorFurni');
    if(previous.wallFurni !== next.wallFurni || previous.wallFurniLimit !== next.wallFurniLimit) changed.push('wallFurni');
    if(previous.permanentFurniVariables !== next.permanentFurniVariables || previous.permanentFurniVariablesLimit !== next.permanentFurniVariablesLimit) changed.push('permanentFurniVariables');
    if(previous.permanentUserVariables !== next.permanentUserVariables || previous.permanentUserVariablesLimit !== next.permanentUserVariablesLimit) changed.push('permanentUserVariables');
    if(previous.permanentGlobalVariables !== next.permanentGlobalVariables || previous.permanentGlobalVariablesLimit !== next.permanentGlobalVariablesLimit) changed.push('permanentGlobalVariables');

    return changed;
};

const getChangedGlobalInspectionKeys = (previous: WiredCreatorToolsRoomStats, next: WiredCreatorToolsRoomStats) =>
{
    if(!previous) return [];

    return Array.from(new Set([
        ...VARIABLE_DEFINITIONS.global.map(variable => variable.key),
        ...Object.keys(previous.globalValues ?? {}),
        ...Object.keys(next.globalValues ?? {})
    ]))
        .filter(key => previous.globalValues?.[key] !== next.globalValues?.[key]);
};

const createEmptyWiredToolPages = () => TOOL_TYPE_OPTIONS.reduce((previous, option) =>
{
    previous[option.key] = [];

    return previous;
}, {} as Record<ToolType, WiredToolItem[]>);

const getWiredToolIconUrl = (item: WiredToolItem) =>
{
    if(!item) return '';

    if(item.productType === ProductTypeEnum.WALL) return GetRoomEngine().getFurnitureWallIconUrl(item.spriteId);

    return GetRoomEngine().getFurnitureFloorIconUrl(item.spriteId);
};

const areStringRecordsEqual = (previous: Record<string, string> = {}, next: Record<string, string> = {}) =>
{
    const previousKeys = Object.keys(previous);
    const nextKeys = Object.keys(next);

    if(previousKeys.length !== nextKeys.length) return false;

    return nextKeys.every(key => previous[key] === next[key]);
};

const areStringArraysEqual = (previous: string[] = [], next: string[] = []) =>
{
    if(previous.length !== next.length) return false;

    return next.every((value, index) => previous[index] === value);
};

const areMonitorStatsEqual = (previous: WiredCreatorToolsRoomStats, next: WiredCreatorToolsRoomStats) =>
{
    if(previous === next) return true;
    if(!previous || !next) return false;

    return getChangedMonitorStatKeys(previous, next).length === 0;
};

const areGlobalInspectionValuesEqual = (previous: WiredCreatorToolsRoomStats, next: WiredCreatorToolsRoomStats) =>
{
    if(previous === next) return true;
    if(!previous || !next) return false;

    return getChangedGlobalInspectionKeys(previous, next).length === 0 &&
        areStringArraysEqual(previous.globalVariables, next.globalVariables);
};

const areVariableDefinitionsEqual = (previous: WiredCreatorToolsRoomStats, next: WiredCreatorToolsRoomStats) =>
{
    if(previous === next) return true;
    if(!previous || !next) return false;

    return areStringArraysEqual(previous.furniVariables, next.furniVariables) &&
        areStringArraysEqual(previous.userVariables, next.userVariables) &&
        areStringArraysEqual(previous.globalVariables, next.globalVariables);
};

const areVisibleRoomStatsEqual = (previous: WiredCreatorToolsRoomStats, next: WiredCreatorToolsRoomStats, activeTab: WiredCreatorToolsTab, inspectionType: InspectionType) =>
{
    if(activeTab === 'monitor') return areMonitorStatsEqual(previous, next);
    if(activeTab === 'variables') return areVariableDefinitionsEqual(previous, next);
    if(activeTab === 'inspection' && inspectionType === 'global') return areGlobalInspectionValuesEqual(previous, next);

    return true;
};

const getVisibleRoomStatsChangedKeys = (previous: WiredCreatorToolsRoomStats, next: WiredCreatorToolsRoomStats, activeTab: WiredCreatorToolsTab, inspectionType: InspectionType) =>
{
    if(activeTab === 'monitor') return getChangedMonitorStatKeys(previous, next);
    if(activeTab === 'inspection' && inspectionType === 'global') return getChangedGlobalInspectionKeys(previous, next);

    return [];
};

const areInspectionValuesEqual = (previous: WiredCreatorToolsInspectionValues, next: WiredCreatorToolsInspectionValues) =>
{
    if(previous === next) return true;
    if(!previous || !next) return false;

    return previous.sourceType === next.sourceType &&
        previous.sourceId === next.sourceId &&
        areStringRecordsEqual(previous.values, next.values) &&
        areStringArraysEqual(previous.variables, next.variables);
};

const MONITOR_LOGS: MonitorLog[] = [
    { type: 'EXECUTION_CAP', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: EXECUTION_CAP' },
    { type: 'DELAYED_EVENTS_CAP', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: DELAYED_EVENTS_CAP' },
    { type: 'EXECUTOR_OVERLOAD', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: EXECUTOR_OVERLOAD' },
    { type: 'MARKED_AS_HEAVY', category: 'WARN', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Warning: MARKED_AS_HEAVY' },
    { type: 'KILLED', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: KILLED' },
    { type: 'RECURSION_TIMEOUT', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: RECURSION_TIMEOUT' },
    { type: 'TOO_MANY_VARIABLES', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: TOO_MANY_VARIABLES' },
    // #Implement Chests: wire transaction failures once chest backend/runtime logic exists.
    { type: 'TRANSACTION_FAILURE', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: TRANSACTION_FAILURE' },
    { type: 'PLACEMENT_FAILURE', category: 'ERROR', amount: 0, latest: '/', source: 'SYSTEM', message: 'Wired Error: PLACEMENT_FAILURE' }
];

const MONITOR_LOG_INFO: Record<string, MonitorLogInfo> = {
    EXECUTION_CAP: {
        severity: 'ERROR',
        info: 'This error occurs when the maximum Wired usage limit, which can be observed in the Monitor tab, is about to be exceeded by a Wired execution.\n\nWhen this happens, the execution of Wired will be cancelled so that the Wired usage limit is never exceeded.\n\nReaching the execution cap too quickly may be a sign of an inefficient Wired setup. If your Wired setup is not too complex, you should investigate how to improve the setup to avoid this error from unexpectedly happening. The Wired usage is a great indicator of your room\'s Wired complexity, and other factors, such as lag in the Habbo servers, are not at play.'
    },
    DELAYED_EVENTS_CAP: {
        severity: 'ERROR',
        info: 'Delayed Wired events happen when you execute a Wired effect that has a delay configured.\n\nThere is a limit to how many of these delayed Wired events can be awaiting execution at the same time. Without this limit, a smart setup with Wired signals could cause a memory leak in the Habbo servers.\n\nIn any normal scenario, it would be rare to receive this error. If you do, you may have made an error in your Wired setup. If you have not made an error, you should transform your Wired setup to use Wired counters instead.'
    },
    EXECUTOR_OVERLOAD: {
        severity: 'ERROR',
        info: 'This error occurs when the Wired engine is receiving a lot of instructions, but the Habbo servers can not keep up with it.\n\nThis is usually a sign of server issues, and may not necessarily have anything to do with your room.\n\nIf your room also gives the MARKED_AS_HEAVY warning, your room may be a contributing factor and you could look into making the Wired setup less complex.'
    },
    MARKED_AS_HEAVY: {
        severity: 'WARNING',
        info: 'The Habbo servers are analyzing the time it takes to execute your Wired setup at all times, and may consider it to be a heavy Wired setup if certain boundaries are exceeded. What happens as a result is that your room is treated slightly differently to avoid it from interfering with other rooms in the hotel.\n\nThere is no reason to panic as this is not an error, but just a warning. However, you should not completely ignore it either.\n\nWhat this means for a Wired creator is:\n- Ignore the message if Habbo is lagging, it may not be related to your Wired setup.\n- Ignore this message if your room is actually a complex Wired room. It is just a notification in that case, so you are aware.\n- If none of the above applies, and it is supposed to be a simple room, then you are likely doing something wrong and should improve the Wired setup.'
    },
    KILLED: {
        severity: 'ERROR',
        info: 'This is an error that occurs when the Habbo server suspects your room of having malicious Wired intentions. For that reason, the exact criteria for when this happens will not be disclosed.\n\nThe penalty for this error is that Wired execution is halted for 10 minutes.'
    },
    RECURSION_TIMEOUT: {
        severity: 'ERROR',
        info: 'Recursive Wired events happen when signals execute other Wired stacks in the room. This may happen 10, 100, or 1000+ times before the Wired execution actually concludes. If the Habbo servers analyze that this is taking too long, it will stop your Wired execution.\n\nThis Wired error rarely occurs, but it sometimes does when there is lag on the Habbo servers and the Wired room is either inefficient or complex.\n\nIn most cases, another Wired error will already have stopped your Wired execution before this error can occur.'
    },
    TOO_MANY_VARIABLES: {
        severity: 'ERROR',
        info: 'This error occurs when you have given too many different Wired variables to a user or a furni. However, this limit is very high and is not something you should normally reach.\n\nIf you are reaching this limit, it may be a sign that you are trying to use variables in a repetitive or incorrect way, or trying to achieve a goal that variables are not fit for.\n\nIf you are trying to use variables to store long lists of data for a user or furni, you should be aware that this is not possible and may require a more creative solution.\n\nIf you are familiar with bit operations, or are open to learning about them, you can use them to store more data in a single Wired variable depending on the use case. Wired variable values are 64-bit signed integer values, and bit operations are located under the advanced math operators.'
    },
    TRANSACTION_FAILURE: {
        severity: 'ERROR',
        info: 'This error occurs when a transaction failed due to multiple possible reasons such as insufficient funds, the chest no longer existing, a locked chest and many more. The specific error will be logged in Wired Logs'
    },
    PLACEMENT_FAILURE: {
        severity: 'ERROR',
        info: 'This error occurs when a temporary object cannot be placed. Most of the time this happens when trying to create a temporary object on a solid, non-stackable item.'
    }
};

const MONITOR_LOG_TYPES = new Set(MONITOR_LOGS.map(log => log.type));

const formatWiredLogTimestamp = (timestamp: string) =>
{
    const value = Number(timestamp);

    if(!Number.isFinite(value) || value <= 0) return '/';

    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, '0');

    return `${ pad(date.getDate()) }/${ pad(date.getMonth() + 1) }/${ date.getFullYear() } ${ pad(date.getHours()) }:${ pad(date.getMinutes()) }:${ pad(date.getSeconds()) }`;
};

const CHEST_LOG_TYPE_LABELS: Record<string, string> = {
    MANUAL: 'Manual',
    CONTRACT_PAYMENT: 'Contract Payment',
    CONTRACT_REWARD: 'Contract Reward',
    CONTRACT_TRADE: 'Contract Trade'
};

const getChestLogTypeLabel = (type: string) => CHEST_LOG_TYPE_LABELS[(type || '').toUpperCase()] ?? (type || 'Manual');

const formatChestLogAmount = (furni: number, coins: number) =>
{
    const parts: string[] = [];

    if(furni > 0) parts.push(`${ furni } furni`);
    if(coins > 0) parts.push(`${ coins } credits`);

    return parts.length ? parts.join(', ') : '/';
};

const getChestLogSearchText = (log: WiredCreatorToolsChestLogEntry) => [
    log.timestamp,
    getChestLogTypeLabel(log.type),
    log.type,
    log.username,
    formatChestLogAmount(log.withdrawalFurni, log.withdrawalCoins),
    formatChestLogAmount(log.depositFurni, log.depositCoins)
].join(' ').toLowerCase();

const filterChestLogs = (logs: WiredCreatorToolsChestLogEntry[], filter: string, typeFilter: string) =>
{
    const query = filter.trim().toLowerCase();
    const type = typeFilter.trim().toUpperCase();

    return logs.filter(log =>
    {
        if(type && type !== 'ALL' && (log.type || '').toUpperCase() !== type) return false;
        if(!query) return true;

        return getChestLogSearchText(log).includes(query);
    });
};

const wiredLogEntryToMonitorLog = (entry: WiredCreatorToolsLogEntry, index: number): MonitorLog => ({
    type: `${ entry.source || 'WIRED' }_${ index }_${ entry.timestamp }`,
    category: entry.category || 'INFO',
    amount: 1,
    latest: formatWiredLogTimestamp(entry.timestamp),
    source: entry.source || 'WIRED',
    message: entry.message || ''
});

const mergeMonitorLogSummary = (logs: MonitorLog[]) =>
{
    const summary = MONITOR_LOGS.map(log => ({ ...log }));

    logs.forEach(log =>
    {
        const summaryKey = getMonitorSummaryKey(log);
        if(!MONITOR_LOG_TYPES.has(summaryKey)) return;

        const row = summary.find(item => item.type === summaryKey);
        if(!row) return;

        row.amount += 1;
        row.category = log.category;
        if(row.latest === '/') row.latest = log.latest;
    });

    return summary;
};

const getMonitorSummaryKey = (log: MonitorLog) =>
{
    if((log.source || '').toUpperCase() !== 'SYSTEM') return '';

    const match = (log.message || '').match(/Wired\s+(?:Error|Warning):\s*([A-Z0-9_]+)/i);

    return match ? match[1].toUpperCase() : '';
};

const getVariableHighlightSignature = (highlight: WiredCreatorToolsVariableHighlight) =>
{
    if(!highlight) return '';

    return [
        highlight.sourceType,
        highlight.variableName,
        ...(highlight.targets ?? []).map(target => `${ target.category }:${ target.objectId }:${ target.value }`)
    ].join('|');
};

const VARIABLE_DEFINITIONS: Record<VariableType, VariableDefinition[]> = {
    furni: [
        createInternalVariable('@id', 'Furni', 'No', 'No'),
        createInternalVariable('@class_id', 'Furni', 'No', 'No'),
        createInternalVariable('@height', 'Furni', 'Yes', 'No'),
        createInternalVariable('@state', 'Furni', 'Yes', 'Yes', [ { value: '0', text: 'Default' } ]),
        createInternalVariable('@position.x', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@position.y', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@rotation', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@altitude', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@is_invisible', 'Furni', 'Yes', 'No'),
        createInternalVariable('@type', 'Furni', 'Yes', 'No', [
            { value: '0', text: 'Normal' },
            { value: '1', text: 'BC' },
            { value: '2', text: 'Temp' }
        ]),
        createInternalVariable('@is_stackable', 'Furni', 'Yes', 'No'),
        createInternalVariable('@can_stand_on', 'Furni', 'Yes', 'No'),
        createInternalVariable('@can_sit_on', 'Furni', 'Yes', 'No'),
        createInternalVariable('@can_lay_on', 'Furni', 'Yes', 'No'),
        createInternalVariable('@dimensions.x', 'Furni', 'Yes', 'No'),
        createInternalVariable('@dimensions.y', 'Furni', 'Yes', 'No'),
        createInternalVariable('@owner_id', 'Furni', 'Yes', 'No'),
        createInternalVariable('@wallitem_offset', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@chest.available_amount', 'Furni', 'Yes', 'No'),
        createInternalVariable('@chest.capacity', 'Furni', 'Yes', 'No'),
        createInternalVariable('@chest.is_auto_lock', 'Furni', 'Yes', 'No', [
            { value: ' ', text: 'True' },
            { value: '', text: 'False' }
        ]),
        createInternalVariable('@chest.is_donatable', 'Furni', 'Yes', 'No', [
            { value: ' ', text: 'True' },
            { value: '', text: 'False' }
        ]),
        createInternalVariable('@chest.is_open', 'Furni', 'Yes', 'No', [
            { value: ' ', text: 'True' },
            { value: '', text: 'False' }
        ]),
        createInternalVariable('@chest.locked', 'Furni', 'Yes', 'No', [
            { value: ' ', text: 'True' },
            { value: '', text: 'False' }
        ]),
        createInternalVariable('@area_hide.width', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@area_hide.length', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@area_hide.root_x', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@area_hide.root_y', 'Furni', 'Yes', 'Yes'),
        createInternalVariable('@area_hide.inverted', 'Furni', 'Yes', 'No', [
            { value: ' ', text: 'True' },
            { value: '', text: 'False' }
        ]),
        createInternalVariable('@area_hide.hiding_wallitems', 'Furni', 'Yes', 'No', [
            { value: ' ', text: 'True' },
            { value: '', text: 'False' }
        ]),
        createInternalVariable('@area_hide.is_invisible_furni', 'Furni', 'Yes', 'No', [
            { value: ' ', text: 'True' },
            { value: '', text: 'False' }
        ]),
        createInternalVariable('@projectile.animation.tiles_travelled', 'Furni', 'Yes', 'No'),
        createInternalVariable('@projectile.animation.user_collisions', 'Furni', 'Yes', 'No'),
        createInternalVariable('@projectile.animation.furni_collisions', 'Furni', 'Yes', 'No'),
        createInternalVariable('@projectile.animation.position.x', 'Furni', 'Yes', 'No'),
        createInternalVariable('@projectile.animation.position.y', 'Furni', 'Yes', 'No'),
        createInternalVariable('@projectile.animation.position.altitude', 'Furni', 'Yes', 'No'),
        createInternalVariable('@projectile.animation.is_travelling', 'Furni', 'Yes', 'No')
    ],
    user: [
        createInternalVariable('@index', 'User', 'Yes', 'No'),
        createInternalVariable('@type', 'User', 'Yes', 'No', [
            { value: '1', text: 'User' },
            { value: '2', text: 'Pet' },
            { value: '3', text: 'Old bot' },
            { value: '4', text: 'Bot' }
        ]),
        createInternalVariable('@gender', 'User', 'Yes', 'No', [
            { value: '-1', text: 'Unknown' },
            { value: '0', text: 'Male' },
            { value: '1', text: 'Female' }
        ]),
        createInternalVariable('@achievement_score', 'User', 'Yes', 'No'),
        createInternalVariable('@is_hc', 'User', 'Yes', 'No'),
        createInternalVariable('@has_rights', 'User', 'Yes', 'No'),
        createInternalVariable('@is_group_admin', 'User', 'Yes', 'No'),
        createInternalVariable('@is_owner', 'User', 'Yes', 'No'),
        createInternalVariable('@position.x', 'User', 'Yes', 'Yes'),
        createInternalVariable('@position.y', 'User', 'Yes', 'Yes'),
        createInternalVariable('@direction', 'User', 'Yes', 'Yes', [
            { value: '0', text: 'North' },
            { value: '1', text: 'North-East' },
            { value: '2', text: 'East' },
            { value: '3', text: 'South-East' },
            { value: '4', text: 'South' },
            { value: '5', text: 'South-West' },
            { value: '6', text: 'West' },
            { value: '7', text: 'North-West' }
        ]),
        createInternalVariable('@altitude', 'User', 'Yes', 'No'),
        createInternalVariable('@team.score', 'User', 'Yes', 'No'),
        createInternalVariable('@team.color', 'User', 'Yes', 'No', [
            { value: '1', text: 'Red' },
            { value: '2', text: 'Green' },
            { value: '3', text: 'Blue' },
            { value: '4', text: 'Yellow' }
        ]),
        createInternalVariable('@team.type', 'User', 'Yes', 'No', [
            { value: '0', text: 'Battle Banzai' },
            { value: '1', text: 'Freeze' },
            { value: '2', text: 'Tagging' },
            { value: '3', text: 'Swimming' },
            { value: '4', text: 'Wired' }
        ]),
        createDynamicTextInternalVariable('@handitem', 'User', 'Yes', 'No'),
        createDynamicTextInternalVariable('@effect', 'User', 'Yes', 'No'),
        createInternalVariable('@is_frozen', 'User', 'Yes', 'No'),
        createInternalVariable('@is_muted', 'User', 'Yes', 'No'),
        createInternalVariable('@is_trading', 'User', 'Yes', 'No'),
        createInternalVariable('@favourite_group_id', 'User', 'Yes', 'No'),
        createInternalVariable('@dance', 'User', 'Yes', 'No', [
            { value: '1', text: 'Dance' },
            { value: '2', text: 'Pogo Mogo' },
            { value: '3', text: 'Duck Funk' },
            { value: '4', text: 'The Rollie' }
        ]),
        createDynamicTextInternalVariable('@sign', 'User', 'Yes', 'No'),
        createInternalVariable('@is_idle', 'User', 'Yes', 'No'),
        createInternalVariable('@room_entry.method', 'User', 'Yes', 'No', [
            { value: '0', text: 'Default' },
            { value: '2', text: 'Teleport' },
            { value: '3', text: 'Room Network' }
        ]),
        createInternalVariable('@room_entry.teleport_id', 'User', 'Yes', 'No'),
        createInternalVariable('@user_id', 'User', 'Yes', 'No'),
        createInternalVariable('@pet_id', 'User', 'Yes', 'No'),
        createInternalVariable('@bot_id', 'User', 'Yes', 'No'),
        createInternalVariable('@transaction.in_trade', 'User', 'Yes', 'No'),
        createInternalVariable('@transaction.start_time', 'User', 'Yes', 'No'),
        createInternalVariable('@transaction.contract_id', 'User', 'Yes', 'No'),
        createInternalVariable('@transaction.state', 'User', 'Yes', 'No', [
            { value: '1', text: 'Adding Items' },
            { value: '2', text: 'Confirmed' }
        ]),
        createInternalVariable('@transaction.can_accept', 'User', 'Yes', 'No'),
        createInternalVariable('@transaction.current_multiplier', 'User', 'Yes', 'No'),
        createInternalVariable('@is_holding_down', 'User', 'Yes', 'No'),
        createInternalVariable('@is_holding_down.duration_ticks', 'User', 'Yes', 'No'),
        createInternalVariable('@is_holding_down.origin_type', 'User', 'Yes', 'No', [
            { value: '0', text: 'Empty' },
            { value: '1', text: 'Furni' },
            { value: '2', text: 'Tile' },
            { value: '3', text: 'User' }
        ]),
        createInternalVariable('@is_holding_down.origin_id', 'User', 'Yes', 'No'),
        createInternalVariable('@is_holding_down.origin_x', 'User', 'Yes', 'No'),
        createInternalVariable('@is_holding_down.origin_y', 'User', 'Yes', 'No')
    ],
    global: [
        createInternalVariable('@furni_count', 'Global', 'Yes', 'No'),
        createInternalVariable('@user_count', 'Global', 'Yes', 'No'),
        createInternalVariable('@wired_timer', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.red.score', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.green.score', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.blue.score', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.yellow.score', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.red.size', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.green.size', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.blue.size', 'Global', 'Yes', 'No'),
        createInternalVariable('@teams.yellow.size', 'Global', 'Yes', 'No'),
        createInternalVariable('@room_id', 'Global', 'Yes', 'No'),
        createInternalVariable('@group_id', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.milliseconds_of_seconds', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.seconds_of_minute', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.minute_of_hour', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.hour_of_day', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.day_of_week', 'Global', 'Yes', 'No', [
            { value: '1', text: 'Monday' },
            { value: '2', text: 'Tuesday' },
            { value: '3', text: 'Wednesday' },
            { value: '4', text: 'Thursday' },
            { value: '5', text: 'Friday' },
            { value: '6', text: 'Saturday' },
            { value: '7', text: 'Sunday' }
        ]),
        createInternalVariable('@current_time.day_of_month', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.day_of_year', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.week_of_year', 'Global', 'Yes', 'No'),
        createInternalVariable('@current_time.month_of_year', 'Global', 'Yes', 'No', [
            { value: '1', text: 'January' },
            { value: '2', text: 'February' },
            { value: '3', text: 'March' },
            { value: '4', text: 'April' },
            { value: '5', text: 'May' },
            { value: '6', text: 'June' },
            { value: '7', text: 'July' },
            { value: '8', text: 'August' },
            { value: '9', text: 'September' },
            { value: '10', text: 'October' },
            { value: '11', text: 'November' },
            { value: '12', text: 'December' }
        ]),
        createInternalVariable('@current_time.year', 'Global', 'Yes', 'No')
    ],
    context: [
        createInternalVariable('@selector_furni_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@selector_user_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@signal_furni_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@signal_user_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.signal.antenna_id', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.chat.type', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.chat.style', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.variable_update.box_id', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.variable_update.change_type', 'Context', 'Yes', 'No', [
            { value: '0', text: 'Created' },
            { value: '1', text: 'Value Changed' },
            { value: '2', text: 'Deleted' }
        ]),
        createInternalVariable('@event.variable_update.old_value', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.variable_update.new_value', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.variable_update.difference', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.variable_update.change_origin', 'Context', 'Yes', 'No', [
            { value: '0', text: 'In Room' },
            { value: '1', text: 'Another Room' },
            { value: '2', text: 'Inspection / Creator Tool' },
            { value: '3', text: 'External' }
        ]),
        createInternalVariable('@event.transaction_complete.multiplier', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.transaction_complete.deposit.furni_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.transaction_complete.deposit.coins_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.transaction_complete.withdrawal.furni_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.transaction_complete.withdrawal.coins_count', 'Context', 'Yes', 'No'),
        createInternalVariable('@event.transaction_failed.reason', 'Context', 'Yes', 'No', [
            { value: '0', text: 'Cancelled By User' },
            { value: '1', text: 'Invalid Trade' },
            { value: '2', text: 'Timeout' },
            { value: '3', text: 'Cancelled By Wired' },
            { value: '4', text: 'Already Trading' },
            { value: '5', text: 'Wired Misconfiguration' },
            { value: '6', text: 'No Sufficient Funds' },
            { value: '7', text: 'Funds No Longer Available' },
            { value: '10', text: 'Empty Transaction' },
            { value: '13', text: 'Chest Not In Room' },
            { value: '15', text: 'No Wired Chests Or Locked' },
            { value: '16', text: 'Can Not Give All To Multiple Users' },
            { value: '21', text: 'Misconfig Too Many Or No Contracts' },
            { value: '22', text: 'Misconfig No Users' },
            { value: '25', text: 'User Left Room' },
            { value: '1001', text: 'Internal Error Db' }
        ]),
        createInternalVariable('@held_down', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.total_duration_ticks', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.origin_type', 'Context', 'Yes', 'No', [
            { value: '0', text: 'Empty' },
            { value: '1', text: 'Furni' },
            { value: '2', text: 'Tile' },
            { value: '3', text: 'User' }
        ]),
        createInternalVariable('@held_down.origin_id', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.origin_x', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.origin_y', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.origin_valid', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.release_type', 'Context', 'Yes', 'No', [
            { value: '0', text: 'Empty' },
            { value: '1', text: 'Furni' },
            { value: '2', text: 'Tile' },
            { value: '3', text: 'User' }
        ]),
        createInternalVariable('@held_down.release_id', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.release_x', 'Context', 'Yes', 'No'),
        createInternalVariable('@held_down.release_y', 'Context', 'Yes', 'No')
    ]
};

function createInternalVariable(
    key: string,
    target: VariableDefinition['target'],
    hasValue: string,
    canWriteTo: string,
    textValues: VariableDefinition['textValues'] = []
): VariableDefinition
{
    return {
        key,
        target,
        type: 'Internal',
        availability: '/',
        hasValue,
        canWriteTo,
        canCreateDelete: 'No',
        canIntercept: 'Yes',
        isAlwaysAvailable: 'Yes',
        hasCreationTime: 'No',
        hasUpdateTime: 'No',
        isTextConnected: textValues.length ? 'Yes' : 'No',
        textValues
    };
}

function createDynamicTextInternalVariable(
    key: string,
    target: VariableDefinition['target'],
    hasValue: string,
    canWriteTo: string
): VariableDefinition
{
    return {
        ...createInternalVariable(key, target, hasValue, canWriteTo),
        isTextConnected: 'Yes'
    };
}

const getVariableProperties = (variable: VariableDefinition) => [
    { property: 'Name', value: variable.key },
    { property: 'Type', value: variable.type },
    { property: 'Target', value: variable.target },
    { property: 'Availability', value: variable.availability },
    { property: 'Has Value', value: variable.hasValue },
    { property: 'Can write to', value: variable.canWriteTo },
    { property: 'Can create/delete', value: variable.canCreateDelete },
    { property: 'Can intercept', value: variable.canIntercept },
    { property: 'Is always available', value: variable.isAlwaysAvailable },
    { property: 'Has creation time', value: variable.hasCreationTime },
    { property: 'Has update time', value: variable.hasUpdateTime },
    { property: 'Is text connected', value: variable.isTextConnected }
];

const CONDITIONAL_USER_INSPECTION_VARIABLES = new Set([
    '@is_hc',
    '@has_rights',
    '@is_group_admin',
    '@is_owner',
    '@team.score',
    '@team.color',
    '@team.type',
    '@handitem',
    '@effect',
    '@is_frozen',
    '@is_muted',
    '@is_trading',
    '@favourite_group_id',
    '@dance',
    '@sign',
    '@is_idle',
    '@room_entry.teleport_id',
    '@user_id',
    '@pet_id',
    '@bot_id',
    '@is_holding_down',
    '@is_holding_down.duration_ticks',
    '@is_holding_down.origin_type',
    '@is_holding_down.origin_id',
    '@is_holding_down.origin_x',
    '@is_holding_down.origin_y'
]);

const MOUSE_HOLD_INSPECTION_VARIABLES = [
    '@is_holding_down',
    '@is_holding_down.duration_ticks',
    '@is_holding_down.origin_type',
    '@is_holding_down.origin_id',
    '@is_holding_down.origin_x',
    '@is_holding_down.origin_y'
];

const CONDITIONAL_FURNI_INSPECTION_VARIABLES = new Set([
    '@is_invisible',
    '@is_stackable',
    '@can_stand_on',
    '@can_sit_on',
    '@can_lay_on',
    '@wallitem_offset',
    '@area_hide.width',
    '@area_hide.length',
    '@area_hide.root_x',
    '@area_hide.root_y',
    '@area_hide.inverted',
    '@area_hide.hiding_wallitems',
    '@area_hide.is_invisible_furni'
]);

const getLocalizedTextRowsByPrefix = (prefix: string, pattern: RegExp): TextValueRow[] =>
{
    const definitions = ((GetNitroInstance().localization as unknown as { _definitions?: Map<string, string>; })._definitions ?? null);

    if(!definitions) return [];

    return Array.from(definitions.keys())
        .filter(key => key.startsWith(prefix))
        .map(key =>
        {
            const match = key.match(pattern);

            if(!match) return null;

            return {
                value: match[1],
                text: LocalizeText(key)
            };
        })
        .filter((row): row is { value: string; text: string; } => !!row && row.text !== `${ prefix }${ row.value }`)
        .sort((a, b) => parseInt(a.value) - parseInt(b.value));
};

const getSignTextValues = () =>
    Array.from({ length: 18 }, (_, value) => ({
        value: String(value),
        text: LocalizeText(`wiredfurni.params.action.sign.${ value }`)
    }));

const getVariableTextValues = (variable: VariableDefinition): TextValueRow[] =>
{
    switch(variable.key)
    {
        case '@sign':
            return getSignTextValues();
        case '@handitem':
            return getLocalizedTextRowsByPrefix('handitem', /^handitem(\d+)$/);
        case '@effect':
            return getLocalizedTextRowsByPrefix('fx_', /^fx_(\d+)$/);
        default:
            return variable.textValues ?? [];
    }
};

const getLocalizedTextValue = (localizationKey: string) =>
{
    const text = LocalizeText(localizationKey);

    return text && text !== localizationKey ? text : '';
};

const getInspectionValue = (variable: VariableDefinition, inspectionType: InspectionType, globalValues: Record<string, string>, sourceValues: Record<string, string>) =>
{
    const value = inspectionType === 'global'
        ? (globalValues[variable.key] ?? '/')
        : (sourceValues[variable.key] ?? '/');

    if(value !== '/')
    {
        const dynamicText = variable.key === '@handitem'
            ? getLocalizedTextValue(`handitem${ value }`)
            : variable.key === '@effect'
                ? getLocalizedTextValue(`fx_${ value }`)
                : variable.key === '@sign'
                    ? getLocalizedTextValue(`wiredfurni.params.action.sign.${ value }`)
                    : '';

        if(dynamicText) return `${ value } (${ dynamicText })`;
    }

    const textValue = variable.textValues?.find(row => row.value === value);

    return textValue ? `${ value } (${ textValue.text })` : value;
};

const shouldShowInspectionVariable = (variable: VariableDefinition, inspectionType: InspectionType, sourceValues: Record<string, string>, hasSelectedSource: boolean) =>
{
    if(inspectionType === 'global') return true;

    if(variable.key.startsWith('@transaction.')) return hasSelectedSource && Object.prototype.hasOwnProperty.call(sourceValues, variable.key);

    if(variable.key.startsWith('@chest.')) return hasSelectedSource && Object.prototype.hasOwnProperty.call(sourceValues, variable.key);

    if(variable.key.startsWith('@projectile.'))
    {
        return hasSelectedSource && Object.prototype.hasOwnProperty.call(sourceValues, variable.key);
    }

    const isConditional = inspectionType === 'user'
        ? CONDITIONAL_USER_INSPECTION_VARIABLES.has(variable.key)
        : CONDITIONAL_FURNI_INSPECTION_VARIABLES.has(variable.key);

    if(!isConditional) return true;
    if(!hasSelectedSource) return false;

    return Object.prototype.hasOwnProperty.call(sourceValues, variable.key);
};

const getInspectionSubvariableParent = (key: string) =>
{
    const marker = '.value.';
    const markerIndex = key.indexOf(marker);

    return markerIndex > 0 ? key.substring(0, markerIndex) : '';
};

const sortInspectionVariableDefinitions = (variables: VariableDefinition[]) =>
{
    return [ ...variables ].sort((a, b) =>
    {
        const aParent = a.parentKey || a.key;
        const bParent = b.parentKey || b.key;
        const parentCompare = aParent.localeCompare(bParent);

        if(parentCompare !== 0) return parentCompare;

        if(!a.parentKey && b.parentKey) return -1;
        if(a.parentKey && !b.parentKey) return 1;

        return a.key.localeCompare(b.key);
    });
};

const createInspectionCreatedVariable = (key: string, target: 'Furni' | 'User' | 'Global'): VariableDefinition => ({
    key,
    parentKey: getInspectionSubvariableParent(key) || undefined,
    type: 'Created by user',
    target,
    availability: 'Room variable',
    hasValue: 'Yes',
    canWriteTo: 'Yes',
    canCreateDelete: 'Yes',
    canIntercept: 'Yes',
    isAlwaysAvailable: 'No',
    hasCreationTime: 'Yes',
    hasUpdateTime: 'Yes',
    isTextConnected: 'No'
});

const getCreatedVariableDefinitions = (variableType: VariableType, roomStats: WiredCreatorToolsRoomStats): VariableDefinition[] =>
{
    if(variableType === 'context') return [];

    const target = variableType === 'furni' ? 'Furni' : variableType === 'user' ? 'User' : 'Global';
    const variableNames = variableType === 'furni'
        ? (roomStats?.furniVariables ?? [])
        : variableType === 'user'
            ? (roomStats?.userVariables ?? [])
            : variableType === 'global'
                ? (roomStats?.globalVariables ?? [])
                : [];

    return variableNames.map(variableName => createInspectionCreatedVariable(variableName, target));
};

const getVariableDefinitions = (variableType: VariableType, roomStats: WiredCreatorToolsRoomStats) => [
    ...getCreatedVariableDefinitions(variableType, roomStats),
    ...VARIABLE_DEFINITIONS[variableType]
];

const getInspectionVariables = (inspectionType: InspectionType, inspectionValues: WiredCreatorToolsInspectionValues, sourceValues: Record<string, string>, hasSelectedSource: boolean, globalVariables: string[] = []) =>
{
    const internalVariables = VARIABLE_DEFINITIONS[inspectionType].filter(variable => shouldShowInspectionVariable(variable, inspectionType, sourceValues, hasSelectedSource));

    if(inspectionType === 'global')
    {
        const createdVariableNames = Array.from(new Set([
            ...globalVariables,
            ...Object.keys(sourceValues).filter(key => !!getInspectionSubvariableParent(key))
        ]));
        const createdVariables = createdVariableNames
            .map(variableName => createInspectionCreatedVariable(variableName, 'Global'));

        return [ ...sortInspectionVariableDefinitions(createdVariables), ...internalVariables ];
    }

    const createdTarget = inspectionType === 'furni' ? 'Furni' : 'User';
    const createdVariableNames = Array.from(new Set([
        ...(inspectionValues?.variables ?? []),
        ...Object.keys(sourceValues).filter(key => !!getInspectionSubvariableParent(key))
    ]));
    const createdVariables = createdVariableNames
        .filter(variableName => Object.prototype.hasOwnProperty.call(sourceValues, variableName))
        .map(variableName => createInspectionCreatedVariable(variableName, createdTarget));

    return [ ...sortInspectionVariableDefinitions(createdVariables), ...internalVariables ];
};

const isCreatedInspectionVariable = (variableKey: string) => !!variableKey && !variableKey.startsWith('@');

const EDITABLE_INTERNAL_INSPECTION_VARIABLES: Record<InspectionType, Set<string>> = {
    furni: new Set([ '@state', '@position.x', '@position.y', '@rotation', '@altitude', '@area_hide.width', '@area_hide.length', '@area_hide.root_x', '@area_hide.root_y' ]),
    user: new Set([ '@position.x', '@position.y', '@direction', '@altitude' ]),
    global: new Set([ '@teams.red.score', '@teams.green.score', '@teams.blue.score', '@teams.yellow.score' ])
};

const canEditInspectionVariable = (inspectionType: InspectionType, variableKey: string, sourceValues: Record<string, string>, hasSelectedSource: boolean, globalValues: Record<string, string> = {}, writableVariables: string[] = []) =>
{
    if(!variableKey) return false;

    if(isCreatedInspectionVariable(variableKey))
    {
        if(getInspectionSubvariableParent(variableKey) && !writableVariables.includes(variableKey)) return false;

        return inspectionType === 'global'
            ? Object.prototype.hasOwnProperty.call(globalValues, variableKey)
            : hasSelectedSource && Object.prototype.hasOwnProperty.call(sourceValues, variableKey);
    }

    return EDITABLE_INTERNAL_INSPECTION_VARIABLES[inspectionType].has(variableKey) && (inspectionType === 'global' || hasSelectedSource);
};

const getRawInspectionValue = (variableKey: string, inspectionType: InspectionType, globalValues: Record<string, string>, sourceValues: Record<string, string>) =>
{
    const values = inspectionType === 'global' ? globalValues : sourceValues;

    return Object.prototype.hasOwnProperty.call(values, variableKey) ? values[variableKey] : '/';
};

const stopRoomInputPropagation = (event: { stopPropagation: () => void; nativeEvent?: { stopImmediatePropagation?: () => void; }; }) =>
{
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
};

const clampIntegerPacketValue = (value: string) =>
{
    const parsed = Number(value || 0);

    if(!Number.isFinite(parsed)) return 0;

    return Math.max(-2147483648, Math.min(2147483647, Math.trunc(parsed)));
};

export const WiredCreatorToolsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isPlacementHidden, setIsPlacementHidden ] = useState(false);
    const [ hasOpened, setHasOpened ] = useState(false);
    const [ mountedTabs, setMountedTabs ] = useState<Record<WiredCreatorToolsTab, boolean>>(EMPTY_MOUNTED_TABS);
    const [ activeTab, setActiveTab ] = useState<WiredCreatorToolsTab>('monitor');
    const [ variableType, setVariableType ] = useState<VariableType>('furni');
    const [ inspectionType, setInspectionType ] = useState<InspectionType>('furni');
    const [ monitorLogs, setMonitorLogs ] = useState<MonitorLog[]>(MONITOR_LOGS);
    const [ logRows, setLogRows ] = useState<MonitorLog[]>([]);
    const [ keepInspectionSelected, setKeepInspectionSelected ] = useState(false);
    const [ selectedVariableKey, setSelectedVariableKey ] = useState<Record<VariableType, string>>({
        furni: VARIABLE_DEFINITIONS.furni[0].key,
        user: VARIABLE_DEFINITIONS.user[0].key,
        global: VARIABLE_DEFINITIONS.global[0].key,
        context: VARIABLE_DEFINITIONS.context[0].key
    });
    const [ logsOpen, setLogsOpen ] = useState(false);
    const [ logFilter, setLogFilter ] = useState('');
    const [ logSourceFilter, setLogSourceFilter ] = useState('All');
    const [ logCategoryFilter, setLogCategoryFilter ] = useState('All');
    const [ autoRefreshLogs, setAutoRefreshLogs ] = useState(true);
    const [ logPage, setLogPage ] = useState(1);
    const [ chestLogs, setChestLogs ] = useState<WiredCreatorToolsChestLogEntry[]>([]);
    const [ chestLogsOpen, setChestLogsOpen ] = useState(false);
    const [ selectedChestLog, setSelectedChestLog ] = useState<WiredCreatorToolsChestLogEntry>(null);
    const [ chestLogFilter, setChestLogFilter ] = useState('');
    const [ chestLogTypeFilter, setChestLogTypeFilter ] = useState('All');
    const [ autoRefreshChestLogs, setAutoRefreshChestLogs ] = useState(true);
    const [ chestLogPage, setChestLogPage ] = useState(1);
    const [ timezone, setTimezone ] = useState(TIMEZONES[0]);
    const [ wiredModifyPermissions, setWiredModifyPermissions ] = useState(WIRED_PERMISSION_RIGHTS);
    const [ wiredInspectPermissions, setWiredInspectPermissions ] = useState(WIRED_PERMISSION_RIGHTS);
    const [ showToolbar, setShowToolbar ] = useState(DEFAULT_SHOW_TOOLBAR);
    const [ showInspectButton, setShowInspectButton ] = useState(DEFAULT_SHOW_INSPECT_BUTTON);
    const [ playtestingMode, setPlaytestingMode ] = useState(DEFAULT_PLAYTESTING_MODE);
    const [ roomStats, setRoomStats ] = useState<WiredCreatorToolsRoomStats>(null);
    const [ inspectionPreview, setInspectionPreview ] = useState<InspectionPreview>(null);
    const [ inspectionValues, setInspectionValues ] = useState<WiredCreatorToolsInspectionValues>(null);
    const [ selectedInspectionVariable, setSelectedInspectionVariable ] = useState('');
    const [ giveVariableOpen, setGiveVariableOpen ] = useState(false);
    const [ giveVariableName, setGiveVariableName ] = useState('');
    const [ giveVariableValue, setGiveVariableValue ] = useState('0');
    const [ pulseKeys, setPulseKeys ] = useState<Record<string, number>>({});
    const [ variableHighlight, setVariableHighlight ] = useState<WiredCreatorToolsVariableHighlight>(null);
    const [ variableHighlightPulse, setVariableHighlightPulse ] = useState(0);
    const [ wiredToolPages, setWiredToolPages ] = useState<Record<ToolType, WiredToolItem[]>>(createEmptyWiredToolPages);
    const [ wiredToolsRequested, setWiredToolsRequested ] = useState(false);
    const roomStatsRef = useRef<WiredCreatorToolsRoomStats>(null);
    const inspectionValuesRef = useRef<WiredCreatorToolsInspectionValues>(null);
    const mouseHoldStateRef = useRef<WiredMouseHoldStateUpdate>(null);
    const pendingInspectionRequestRef = useRef<{ key: string; sentAt: number }>(null);
    const variableHighlightRef = useRef<WiredCreatorToolsVariableHighlight>(null);
    const selectedInspectionSourceRef = useRef<{ sourceType: 'furni' | 'user'; sourceId: number; }>(null);
    const statsRequestTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const inspectionValuesTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const pulseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const pulseCounterRef = useRef(0);
    const lastToggleAtRef = useRef(0);
    const repeatedWiredToolIdRef = useRef(0);
    const pendingWiredToolItemIdRef = useRef(0);

    useEffect(() =>
    {
        GetConnection()?.registerMessages(WiredCreatorToolsMessageConfiguration);
    }, []);

    const requestRoomStats = useCallback((delay = 0) =>
    {
        if(statsRequestTimerRef.current) clearTimeout(statsRequestTimerRef.current);

        statsRequestTimerRef.current = setTimeout(() =>
        {
            statsRequestTimerRef.current = null;
            SendMessageComposer(new WiredCreatorToolsRoomStatsComposer(timezone));
        }, delay);
    }, [ timezone ]);

    useRoomSessionManagerEvent<RoomSessionEvent>([
        RoomSessionEvent.CREATED,
        RoomSessionEvent.ENDED
    ], event =>
    {
        if(event.type === RoomSessionEvent.CREATED)
        {
            requestRoomStats(250);
            return;
        }

        roomStatsRef.current = null;
        setRoomStats(null);
        setChestLogs([]);
        setChestLogsOpen(false);
        setSelectedChestLog(null);
        setShowToolbar(DEFAULT_SHOW_TOOLBAR);
        setShowInspectButton(DEFAULT_SHOW_INSPECT_BUTTON);
        setPlaytestingMode(DEFAULT_PLAYTESTING_MODE);
        SetWiredCreatorToolsSettings({
            showToolbar: DEFAULT_SHOW_TOOLBAR,
            showInspectButton: DEFAULT_SHOW_INSPECT_BUTTON,
            playtestingMode: DEFAULT_PLAYTESTING_MODE,
            handitemPassingBlocked: false
        });
    });

    const requestInspectionValues = useCallback((sourceType: 'furni' | 'user', sourceId: number, delay = 0) =>
    {
        if(sourceId === null || sourceId === undefined || sourceId < 0) return;
        if(inspectionValuesTimerRef.current) clearTimeout(inspectionValuesTimerRef.current);

        selectedInspectionSourceRef.current = { sourceType, sourceId };
        inspectionValuesTimerRef.current = setTimeout(() =>
        {
            inspectionValuesTimerRef.current = null;
            const requestKey = `${ sourceType }:${ sourceId }`;
            const pendingRequest = pendingInspectionRequestRef.current;

            // Keep the 50ms inspection refresh responsive without allowing
            // delayed responses to build up and replay stale snapshots.
            if(pendingRequest?.key === requestKey && (Date.now() - pendingRequest.sentAt) < 1000) return;

            pendingInspectionRequestRef.current = { key: requestKey, sentAt: Date.now() };
            SendMessageComposer(new WiredCreatorToolsInspectionValuesComposer(sourceType, sourceId));
        }, delay);
    }, []);

    const requestLogs = useCallback((clearLogs = false) =>
    {
        SendMessageComposer(new WiredCreatorToolsLogsComposer(clearLogs));
    }, []);

    const requestChestLogs = useCallback(() =>
    {
        SendMessageComposer(new WiredCreatorToolsChestLogsComposer());
    }, []);

    const hideVariableHighlightVisuals = useCallback((highlight = variableHighlightRef.current) =>
    {
        if(highlight?.targets?.length)
        {
            highlight.targets.forEach(target => chooserSelectionVisualizer.hide(target.objectId, target.category, false));
        }
    }, []);

    const applyVariableHighlightVisuals = useCallback((highlight = variableHighlightRef.current) =>
    {
        if(highlight?.targets?.length)
        {
            highlight.targets.forEach(target => chooserSelectionVisualizer.show(target.objectId, target.category, true));
        }
    }, []);

    const clearVariableHighlight = useCallback(() =>
    {
        const activeHighlight = variableHighlightRef.current;

        if(activeHighlight?.targets?.length)
        {
            activeHighlight.targets.forEach(target => chooserSelectionVisualizer.hide(target.objectId, target.category, true));
        }

        variableHighlightRef.current = null;
        setVariableHighlight(null);
    }, []);

    const requestVariableHighlight = useCallback((sourceType: VariableType, variableName: string) =>
    {
        if(sourceType !== 'furni' && sourceType !== 'user') return;

        SendMessageComposer(new WiredCreatorToolsVariableHighlightComposer(sourceType, variableName));
    }, []);

    const showTools = useCallback(() =>
    {
        setHasOpened(true);
        setIsVisible(true);
        setIsPlacementHidden(false);

        if(!roomStatsRef.current || activeTab === 'monitor' || activeTab === 'variables' || activeTab === 'settings' || (activeTab === 'inspection' && inspectionType === 'global')) requestRoomStats();
        if(activeTab === 'chests') requestChestLogs();
        if(activeTab === 'inspection' && (inspectionType === 'furni' || inspectionType === 'user') && inspectionValuesRef.current?.sourceType === inspectionType)
        {
            requestInspectionValues(inspectionType, inspectionValuesRef.current.sourceId);
        }
    }, [ activeTab, inspectionType, requestChestLogs, requestInspectionValues, requestRoomStats ]);

    const openLogs = useCallback(() =>
    {
        setHasOpened(true);
        setIsVisible(true);
        setLogsOpen(true);
        requestLogs(false);
    }, [ requestLogs ]);

    const openChestLogs = useCallback(() =>
    {
        setHasOpened(true);
        setIsVisible(true);
        setChestLogsOpen(true);
        requestChestLogs();
    }, [ requestChestLogs ]);

    const changeInspectionType = useCallback((type: InspectionType) =>
    {
        setInspectionType(type);
        setInspectionPreview(previous => previous?.type === type ? previous : null);
        setInspectionValues(previous => previous?.sourceType === type ? previous : null);
        setSelectedInspectionVariable('');
        setGiveVariableOpen(false);
        setGiveVariableName('');
        setGiveVariableValue('0');
        inspectionValuesRef.current = inspectionValuesRef.current?.sourceType === type ? inspectionValuesRef.current : null;
        selectedInspectionSourceRef.current = selectedInspectionSourceRef.current?.sourceType === type ? selectedInspectionSourceRef.current : null;

        if(type === 'global') requestRoomStats();
    }, [ requestRoomStats ]);

    const inspectSource = useCallback((sourceType: 'furni' | 'user', sourceId: number, category?: number) =>
    {
        if(sourceId === null || sourceId === undefined || sourceId < 0) return;

        changeInspectionType(sourceType);

        if(sourceType === 'furni')
        {
            const categories = category !== undefined
                ? [ category ]
                : [ RoomObjectCategory.FLOOR, RoomObjectCategory.WALL ];
            let furniInfo = null;
            let furniCategory = categories[0];

            for(const possibleCategory of categories)
            {
                furniInfo = AvatarInfoUtilities.getFurniInfo(sourceId, possibleCategory);

                if(furniInfo)
                {
                    furniCategory = possibleCategory;
                    break;
                }
            }

            if(!furniInfo) return;

            setInspectionPreview({
                type: 'furni',
                id: sourceId,
                category: furniCategory,
                name: furniInfo.name,
                imageSrc: furniInfo.image?.src ?? ''
            });
        }
        else
        {
            const roomSession = GetRoomSession();
            const userData = roomSession?.userDataManager?.getUserDataByIndex(sourceId);

            if(!userData) return;

            if(userData.type === RoomObjectType.PET)
            {
                setInspectionPreview({
                    type: 'user',
                    id: sourceId,
                    name: userData.name,
                    figure: userData.figure,
                    isPet: true
                });
            }
            else
            {
                const userInfo = userData.type === RoomObjectType.BOT
                    ? AvatarInfoUtilities.getBotInfo(RoomObjectCategory.UNIT, userData)
                    : userData.type === RoomObjectType.RENTABLE_BOT
                        ? AvatarInfoUtilities.getRentableBotInfo(RoomObjectCategory.UNIT, userData)
                        : AvatarInfoUtilities.getUserInfo(RoomObjectCategory.UNIT, userData);

                if(!userInfo) return;

                setInspectionPreview({
                    type: 'user',
                    id: sourceId,
                    name: userInfo.name,
                    figure: userInfo.figure
                });
            }
        }

        setInspectionValues(null);
        setSelectedInspectionVariable('');
        setGiveVariableOpen(false);
        setGiveVariableName('');
        setGiveVariableValue('0');
        inspectionValuesRef.current = null;
        requestInspectionValues(sourceType, sourceId);
    }, [ changeInspectionType, requestInspectionValues ]);

    const saveSettings = useCallback((nextTimezone: string, nextModifyPermissions: number, nextInspectPermissions: number, nextShowToolbar: boolean, nextShowInspectButton: boolean, nextPlaytestingMode: boolean) =>
    {
        SetWiredCreatorToolsSettings({
            showToolbar: nextShowToolbar,
            showInspectButton: nextShowInspectButton,
            playtestingMode: nextPlaytestingMode,
            handitemPassingBlocked: roomStatsRef.current?.handitemPassingBlocked ?? false
        });
        SendMessageComposer(new WiredCreatorToolsSaveSettingsComposer(nextTimezone, nextModifyPermissions, nextInspectPermissions, nextShowToolbar, nextShowInspectButton, nextPlaytestingMode));
    }, []);

    const updateTimezone = useCallback((nextTimezone: string) =>
    {
        setTimezone(nextTimezone);
        saveSettings(nextTimezone, wiredModifyPermissions, wiredInspectPermissions, showToolbar, showInspectButton, playtestingMode);
    }, [ playtestingMode, saveSettings, showInspectButton, showToolbar, wiredInspectPermissions, wiredModifyPermissions ]);

    const updateWiredModifyPermissions = useCallback((nextPermissions: number) =>
    {
        const normalizedPermissions = normalizeWiredModifyPermissions(nextPermissions);

        setWiredModifyPermissions(normalizedPermissions);
        saveSettings(timezone, normalizedPermissions, wiredInspectPermissions, showToolbar, showInspectButton, playtestingMode);
    }, [ playtestingMode, saveSettings, showInspectButton, showToolbar, timezone, wiredInspectPermissions ]);

    const updateWiredInspectPermissions = useCallback((nextPermissions: number) =>
    {
        const normalizedPermissions = normalizeWiredInspectPermissions(nextPermissions);

        setWiredInspectPermissions(normalizedPermissions);
        saveSettings(timezone, wiredModifyPermissions, normalizedPermissions, showToolbar, showInspectButton, playtestingMode);
    }, [ playtestingMode, saveSettings, showInspectButton, showToolbar, timezone, wiredModifyPermissions ]);

    const updateShowToolbar = useCallback((checked: boolean) =>
    {
        setShowToolbar(checked);
        saveSettings(timezone, wiredModifyPermissions, wiredInspectPermissions, checked, showInspectButton, playtestingMode);
    }, [ playtestingMode, saveSettings, showInspectButton, timezone, wiredInspectPermissions, wiredModifyPermissions ]);

    const updateShowInspectButton = useCallback((checked: boolean) =>
    {
        setShowInspectButton(checked);
        saveSettings(timezone, wiredModifyPermissions, wiredInspectPermissions, showToolbar, checked, playtestingMode);
    }, [ playtestingMode, saveSettings, showToolbar, timezone, wiredInspectPermissions, wiredModifyPermissions ]);

    const updatePlaytestingMode = useCallback((checked: boolean) =>
    {
        setPlaytestingMode(checked);
        saveSettings(timezone, wiredModifyPermissions, wiredInspectPermissions, showToolbar, showInspectButton, checked);
    }, [ saveSettings, showInspectButton, showToolbar, timezone, wiredInspectPermissions, wiredModifyPermissions ]);

    const runRoomAction = useCallback((action: WiredCreatorToolsRoomAction) =>
    {
        SendMessageComposer(new WiredCreatorToolsRoomActionComposer(action));
    }, []);

    const requestWiredToolsCatalog = useCallback(() =>
    {
        if(wiredToolsRequested) return;

        setWiredToolsRequested(true);
        SendMessageComposer(new WiredCreatorToolsCatalogComposer());
    }, [ wiredToolsRequested ]);

    const requestWiredToolPlacement = useCallback((toolId: number) =>
    {
        repeatedWiredToolIdRef.current = toolId;
        SendMessageComposer(new WiredCreatorToolsCreateItemComposer(toolId));
    }, []);

    const cleanupPendingWiredToolPlacement = useCallback(() =>
    {
        const itemId = pendingWiredToolItemIdRef.current;

        if(!itemId) return;

        pendingWiredToolItemIdRef.current = 0;
        SendMessageComposer(new WiredCreatorToolsCancelPlacementComposer(itemId));
    }, []);

    const startWiredToolPlacement = useCallback((createdItem: WiredCreatorToolCreated) =>
    {
        if(!createdItem) return;

        const productType = createdItem.productType.toLowerCase();
        const category = productType === ProductTypeEnum.WALL ? RoomObjectCategory.WALL : RoomObjectCategory.FLOOR;

        if(GetRoomEngine().processRoomObjectPlacement(RoomObjectPlacementSource.INVENTORY, createdItem.itemId, category, createdItem.spriteId, createdItem.extraData))
        {
            pendingWiredToolItemIdRef.current = createdItem.itemId;
            setIsPlacementHidden(true);
            repeatedWiredToolIdRef.current = createdItem.toolId;
        }
        else
        {
            SendMessageComposer(new WiredCreatorToolsCancelPlacementComposer(createdItem.itemId));
            repeatedWiredToolIdRef.current = 0;
            pendingWiredToolItemIdRef.current = 0;
            setIsPlacementHidden(false);
        }
    }, []);

    useEffect(() =>
    {
        if(isVisible && activeTab === 'tools') return;

        cleanupPendingWiredToolPlacement();
        repeatedWiredToolIdRef.current = 0;
        setIsPlacementHidden(false);
    }, [ isVisible, activeTab, cleanupPendingWiredToolPlacement ]);

    const removeInspectionVariable = useCallback(() =>
    {
        const source = inspectionValuesRef.current;

        if(!source || source.sourceType !== inspectionType || !isCreatedInspectionVariable(selectedInspectionVariable)) return;

        SendMessageComposer(new WiredCreatorToolsVariableActionComposer(source.sourceType, source.sourceId, 'remove', selectedInspectionVariable, 0));
        setSelectedInspectionVariable('');
        setGiveVariableOpen(false);
    }, [ inspectionType, selectedInspectionVariable ]);

    const giveInspectionVariable = useCallback(() =>
    {
        const source = inspectionValuesRef.current;

        if(!source || source.sourceType !== inspectionType || !giveVariableName || Object.prototype.hasOwnProperty.call(source.values ?? {}, giveVariableName)) return;

        SendMessageComposer(new WiredCreatorToolsVariableActionComposer(source.sourceType, source.sourceId, 'give', giveVariableName, clampIntegerPacketValue(giveVariableValue)));
        setSelectedInspectionVariable(giveVariableName);
        setGiveVariableOpen(false);
        setGiveVariableName('');
    }, [ giveVariableName, giveVariableValue, inspectionType ]);

    const setInspectionVariableValue = useCallback((variableKey: string, nextValue: string) =>
    {
        if(!variableKey) return;

        if(inspectionType === 'global')
        {
            SendMessageComposer(new WiredCreatorToolsVariableActionComposer('global', 0, 'set', variableKey, clampIntegerPacketValue(nextValue)));
            return;
        }

        const source = inspectionValuesRef.current;

        if(!source || source.sourceType !== inspectionType) return;

        SendMessageComposer(new WiredCreatorToolsVariableActionComposer(source.sourceType, source.sourceId, 'set', variableKey, clampIntegerPacketValue(nextValue)));
    }, [ inspectionType ]);

    const pulseChangedKeys = useCallback((keys: string[]) =>
    {
        if(!keys.length) return;

        const stamp = ++pulseCounterRef.current;

        setPulseKeys(previous =>
        {
            const next = { ...previous };

            keys.forEach(key => next[key] = stamp);

            return next;
        });

        keys.forEach(key =>
        {
            if(pulseTimersRef.current[key]) clearTimeout(pulseTimersRef.current[key]);

            pulseTimersRef.current[key] = setTimeout(() =>
            {
                setPulseKeys(previous =>
                {
                    if(previous[key] !== stamp) return previous;

                    const next = { ...previous };

                    delete next[key];

                    return next;
                });

                delete pulseTimersRef.current[key];
            }, 480);
        });
    }, []);

    const switchTab = useCallback((tab: WiredCreatorToolsTab) =>
    {
        setMountedTabs(previous => previous[tab] ? previous : { ...previous, [tab]: true });
        setActiveTab(tab);

        if(tab === 'monitor' || tab === 'variables' || tab === 'settings' || (tab === 'inspection' && inspectionType === 'global')) requestRoomStats();
        if(tab === 'chests') requestChestLogs();
        if(tab === 'tools') requestWiredToolsCatalog();
        if(tab === 'variables') applyVariableHighlightVisuals();
        else hideVariableHighlightVisuals();
    }, [ applyVariableHighlightVisuals, hideVariableHighlightVisuals, inspectionType, requestChestLogs, requestRoomStats, requestWiredToolsCatalog ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        showTools();
                        return;
                    case 'hide':
                        cleanupPendingWiredToolPlacement();
                        repeatedWiredToolIdRef.current = 0;
                        setIsPlacementHidden(false);
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        if(Date.now() - lastToggleAtRef.current < 140) return;

                        lastToggleAtRef.current = Date.now();
                        setIsVisible(value =>
                        {
                            if(!value)
                            {
                                setHasOpened(true);
                                if(!roomStatsRef.current || activeTab === 'monitor' || activeTab === 'variables' || activeTab === 'settings' || (activeTab === 'inspection' && inspectionType === 'global')) requestRoomStats();
                            }

                            return !value;
                        });
                        return;
                    case 'tab':
                        if(parts.length > 2 && TABS.some(tab => tab.key === parts[2]))
                        {
                            switchTab(parts[2] as WiredCreatorToolsTab);
                            showTools();
                        }
                        return;
                    case 'logs':
                        openLogs();
                        return;
                    case 'chest-logs':
                        switchTab('chests');
                        requestChestLogs();
                        openChestLogs();
                        showTools();
                        return;
                    case 'inspect':
                        if(parts.length > 2 && INSPECTION_TYPE_OPTIONS.some(option => option.key === parts[2]))
                        {
                            const sourceType = parts[2] as InspectionType;
                            const sourceId = parts.length > 3 ? Number(parts[3]) : -1;
                            const category = parts.length > 4 ? Number(parts[4]) : undefined;

                            if((sourceType === 'furni' || sourceType === 'user') && Number.isFinite(sourceId) && sourceId >= 0)
                            {
                                inspectSource(sourceType, sourceId, Number.isFinite(category) ? category : undefined);
                            }
                            else
                            {
                                changeInspectionType(sourceType);
                            }

                            switchTab('inspection');
                            showTools();
                        }
                        return;
                }
            },
            eventUrlPrefix: 'wired-tools/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ activeTab, changeInspectionType, cleanupPendingWiredToolPlacement, inspectSource, inspectionType, openChestLogs, openLogs, requestChestLogs, requestRoomStats, showTools, switchTab ]);

    useMessageEvent<WiredCreatorToolsRoomStatsEvent>(WiredCreatorToolsRoomStatsEvent, event =>
    {
        const nextStats = event.getParser().stats;
        const previousStats = roomStatsRef.current;
        const shouldRenderStats = isVisible && (activeTab === 'monitor' || activeTab === 'variables' || (activeTab === 'inspection' && inspectionType === 'global'));
        const changedKeys = shouldRenderStats ? getVisibleRoomStatsChangedKeys(previousStats, nextStats, activeTab, inspectionType) : [];
        const hasVisibleChange = shouldRenderStats && !areVisibleRoomStatsEqual(roomStats, nextStats, activeTab, inspectionType);

        roomStatsRef.current = nextStats;
        if(hasVisibleChange) setRoomStats(nextStats);
        if(nextStats.timezone && TIMEZONES.includes(nextStats.timezone)) setTimezone(previous => previous === nextStats.timezone ? previous : nextStats.timezone);
        setWiredModifyPermissions(previous => previous === normalizeWiredModifyPermissions(nextStats.wiredModifyPermissions ?? WIRED_PERMISSION_RIGHTS) ? previous : normalizeWiredModifyPermissions(nextStats.wiredModifyPermissions ?? WIRED_PERMISSION_RIGHTS));
        setWiredInspectPermissions(previous => previous === normalizeWiredInspectPermissions(nextStats.wiredInspectPermissions ?? WIRED_PERMISSION_RIGHTS) ? previous : normalizeWiredInspectPermissions(nextStats.wiredInspectPermissions ?? WIRED_PERMISSION_RIGHTS));
        setShowToolbar(previous => previous === (nextStats.showToolbar ?? DEFAULT_SHOW_TOOLBAR) ? previous : (nextStats.showToolbar ?? DEFAULT_SHOW_TOOLBAR));
        setShowInspectButton(previous => previous === (nextStats.showInspectButton ?? DEFAULT_SHOW_INSPECT_BUTTON) ? previous : (nextStats.showInspectButton ?? DEFAULT_SHOW_INSPECT_BUTTON));
        setPlaytestingMode(previous => previous === (nextStats.playtestingMode ?? DEFAULT_PLAYTESTING_MODE) ? previous : (nextStats.playtestingMode ?? DEFAULT_PLAYTESTING_MODE));
        SetWiredCreatorToolsSettings({
            showToolbar: nextStats.showToolbar ?? DEFAULT_SHOW_TOOLBAR,
            showInspectButton: nextStats.showInspectButton ?? DEFAULT_SHOW_INSPECT_BUTTON,
            playtestingMode: nextStats.playtestingMode ?? DEFAULT_PLAYTESTING_MODE,
            handitemPassingBlocked: nextStats.handitemPassingBlocked ?? false
        });
        if(changedKeys.length) pulseChangedKeys(changedKeys);
    });

    useMessageEvent<WiredCreatorToolsOpenEvent>(WiredCreatorToolsOpenEvent, event =>
    {
        showTools();
    });

    useMessageEvent<WiredCreatorToolsCatalogEvent>(WiredCreatorToolsCatalogEvent, event =>
    {
        const pages = createEmptyWiredToolPages();

        event.getParser().pages.forEach((items, pageId) =>
        {
            const toolType = TOOL_PAGE_ID_TYPES[pageId];

            if(toolType) pages[toolType] = items;
        });

        setWiredToolPages(pages);
    });

    useMessageEvent<WiredCreatorToolsCreateItemEvent>(WiredCreatorToolsCreateItemEvent, event =>
    {
        startWiredToolPlacement(event.getParser().createdItem);
    });

    useMessageEvent<WiredCreatorToolsInspectionValuesEvent>(WiredCreatorToolsInspectionValuesEvent, event =>
    {
        const nextValues = event.getParser().inspectionValues;
        const pushedHold = mouseHoldStateRef.current;

        if(nextValues?.sourceType === 'user' && pushedHold?.sourceId === nextValues.sourceId)
        {
            MOUSE_HOLD_INSPECTION_VARIABLES.forEach(key => delete nextValues.values[key]);
            if(pushedHold.active) Object.assign(nextValues.values, pushedHold.values);
        }

        const responseKey = nextValues ? `${ nextValues.sourceType }:${ nextValues.sourceId }` : '';
        const pendingRequest = pendingInspectionRequestRef.current;

        if(pendingRequest?.key === responseKey) pendingInspectionRequestRef.current = null;

        const selectedSource = selectedInspectionSourceRef.current;

        if(!selectedSource || inspectionType !== nextValues?.sourceType || selectedSource.sourceType !== nextValues.sourceType || selectedSource.sourceId !== nextValues.sourceId) return;

        const previousValues = inspectionValuesRef.current;
        const changedKeys: string[] = [];

        Object.keys(nextValues.values ?? {}).forEach(key =>
        {
            if(previousValues?.sourceId === nextValues.sourceId && previousValues.values?.[key] !== nextValues.values?.[key]) changedKeys.push(key);
        });

        inspectionValuesRef.current = nextValues;
        if(!areInspectionValuesEqual(previousValues, nextValues)) setInspectionValues(nextValues);
        setSelectedInspectionVariable(previous => previous && (previous.startsWith('@') || Object.prototype.hasOwnProperty.call(nextValues.values ?? {}, previous)) ? previous : '');
        setGiveVariableName(previous => previous && (nextValues.variables ?? []).includes(previous) && !Object.prototype.hasOwnProperty.call(nextValues.values ?? {}, previous) ? previous : '');
        if(changedKeys.length) pulseChangedKeys(changedKeys);
    });

    useMessageEvent<WiredMouseHoldStateEvent>(WiredMouseHoldStateEvent, event =>
    {
        const nextHold = event.getParser().state;
        const selectedSource = selectedInspectionSourceRef.current;
        if(!nextHold || !selectedSource || selectedSource.sourceType !== 'user' || selectedSource.sourceId !== nextHold.sourceId) return;

        const previousHold = mouseHoldStateRef.current;
        if(previousHold?.sourceId === nextHold.sourceId && previousHold.holdId === nextHold.holdId && nextHold.sequence <= previousHold.sequence) return;
        if(previousHold?.sourceId === nextHold.sourceId && previousHold.holdId > 0 && nextHold.holdId > 0 && nextHold.holdId < previousHold.holdId) return;
        mouseHoldStateRef.current = nextHold;

        const previousValues = inspectionValuesRef.current;
        if(!previousValues || previousValues.sourceType !== 'user' || previousValues.sourceId !== nextHold.sourceId) return;

        const values = { ...(previousValues.values ?? {}) };
        const changedKeys: string[] = [];
        MOUSE_HOLD_INSPECTION_VARIABLES.forEach(key =>
        {
            const previous = values[key];
            const next = nextHold.active ? nextHold.values[key] : undefined;
            if(previous !== next) changedKeys.push(key);
            delete values[key];
        });
        if(nextHold.active) Object.assign(values, nextHold.values);

        const mergedValues: WiredCreatorToolsInspectionValues = { ...previousValues, values };
        inspectionValuesRef.current = mergedValues;
        setInspectionValues(mergedValues);
        if(changedKeys.length) pulseChangedKeys(changedKeys);
    });

    useMessageEvent<WiredCreatorToolsLogsEvent>(WiredCreatorToolsLogsEvent, event =>
    {
        const rows = event.getParser().logs.map(wiredLogEntryToMonitorLog);

        setLogRows(rows);
        setMonitorLogs(mergeMonitorLogSummary(rows));
    });

    useMessageEvent<WiredCreatorToolsChestLogsEvent>(WiredCreatorToolsChestLogsEvent, event =>
    {
        setChestLogs(event.getParser().logs);
    });

    useMessageEvent<WiredCreatorToolsVariableHighlightEvent>(WiredCreatorToolsVariableHighlightEvent, event =>
    {
        const nextHighlight = event.getParser().highlight;
        const previousHighlight = variableHighlightRef.current;
        const highlightChanged = getVariableHighlightSignature(previousHighlight) !== getVariableHighlightSignature(nextHighlight);

        hideVariableHighlightVisuals();
        variableHighlightRef.current = nextHighlight;
        setVariableHighlight(nextHighlight);
        if(highlightChanged && previousHighlight?.sourceType === nextHighlight?.sourceType && previousHighlight?.variableName === nextHighlight?.variableName)
        {
            setVariableHighlightPulse(++pulseCounterRef.current);
        }
        if(isVisible && activeTab === 'variables') applyVariableHighlightVisuals(nextHighlight);
    });

    useEffect(() =>
    {
        if(!isVisible || (activeTab !== 'chests' && !chestLogsOpen)) return;

        requestChestLogs();

        if(!autoRefreshChestLogs) return;

        const interval = window.setInterval(requestChestLogs, 6000);

        return () => window.clearInterval(interval);
    }, [ activeTab, autoRefreshChestLogs, chestLogsOpen, isVisible, requestChestLogs ]);

    useRoomEngineEvent<RoomEngineObjectPlacedEvent>(RoomEngineObjectEvent.PLACED, event =>
    {
        const toolId = repeatedWiredToolIdRef.current;

        if(!toolId) return;

        if(!event.placedInRoom)
        {
            cleanupPendingWiredToolPlacement();
            repeatedWiredToolIdRef.current = 0;
            setIsPlacementHidden(false);
            return;
        }

        pendingWiredToolItemIdRef.current = 0;

        window.setTimeout(() =>
        {
            if(repeatedWiredToolIdRef.current !== toolId) return;

            SendMessageComposer(new WiredCreatorToolsCreateItemComposer(toolId));
        }, 60);
    });

    useRoomEngineEvent<RoomEngineObjectEvent>(ROOM_STATS_REFRESH_EVENTS, event =>
    {
        if(!isVisible || (activeTab !== 'monitor' && activeTab !== 'variables' && activeTab !== 'inspection')) return;
        if(event.category !== RoomObjectCategory.FLOOR && event.category !== RoomObjectCategory.WALL) return;

        requestRoomStats(175);

        if(activeTab === 'inspection' && inspectionType === 'furni' && inspectionValuesRef.current?.sourceId === event.objectId)
        {
            requestInspectionValues('furni', event.objectId, 175);
        }
    });

    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.SELECTED, event =>
    {
        if(!isVisible || activeTab !== 'inspection') return;

        if(inspectionType === 'furni')
        {
            if(event.category !== RoomObjectCategory.FLOOR && event.category !== RoomObjectCategory.WALL) return;
            if(inspectionPreview?.type === 'furni' && inspectionPreview.id === event.objectId) return;
            if(keepInspectionSelected && inspectionPreview?.type === 'furni') return;

            const furniInfo = AvatarInfoUtilities.getFurniInfo(event.objectId, event.category);

            if(!furniInfo) return;

            setInspectionPreview({
                type: 'furni',
                id: event.objectId,
                category: event.category,
                name: furniInfo.name,
                imageSrc: furniInfo.image?.src ?? ''
            });
            setInspectionValues(null);
            setSelectedInspectionVariable('');
            setGiveVariableOpen(false);
            setGiveVariableName('');
            setGiveVariableValue('0');
            inspectionValuesRef.current = null;
            requestInspectionValues('furni', event.objectId);

            return;
        }

        if(inspectionType === 'user')
        {
            if(event.category !== RoomObjectCategory.UNIT) return;
            if(inspectionPreview?.type === 'user' && inspectionPreview.id === event.objectId) return;
            if(keepInspectionSelected && inspectionPreview?.type === 'user') return;

            const roomSession = GetRoomSession();
            const userData = roomSession?.userDataManager?.getUserDataByIndex(event.objectId);

            if(!userData) return;

            if(userData.type === RoomObjectType.PET)
            {
                setInspectionPreview({
                    type: 'user',
                    id: event.objectId,
                    name: userData.name,
                    figure: userData.figure,
                    isPet: true
                });
                setInspectionValues(null);
                setSelectedInspectionVariable('');
                setGiveVariableOpen(false);
                setGiveVariableName('');
                setGiveVariableValue('0');
                inspectionValuesRef.current = null;
                requestInspectionValues('user', event.objectId);
                return;
            }

            const userInfo = userData.type === RoomObjectType.BOT
                ? AvatarInfoUtilities.getBotInfo(event.category, userData)
                : userData.type === RoomObjectType.RENTABLE_BOT
                    ? AvatarInfoUtilities.getRentableBotInfo(event.category, userData)
                    : AvatarInfoUtilities.getUserInfo(event.category, userData);

            if(!userInfo) return;

            setInspectionPreview({
                type: 'user',
                id: event.objectId,
                name: userInfo.name,
                figure: userInfo.figure
            });
            setInspectionValues(null);
            setSelectedInspectionVariable('');
            setGiveVariableOpen(false);
            setGiveVariableName('');
            setGiveVariableValue('0');
            inspectionValuesRef.current = null;
            requestInspectionValues('user', event.objectId);
        }
    });

    useEffect(() =>
    {
        if(!isVisible || (activeTab !== 'monitor' && activeTab !== 'variables' && activeTab !== 'inspection')) return;

        const refreshTimer = setInterval(() =>
        {
            if(activeTab === 'monitor' || activeTab === 'variables' || inspectionType === 'global') requestRoomStats();

            if(activeTab === 'inspection' && (inspectionType === 'furni' || inspectionType === 'user') && inspectionValuesRef.current && inspectionValuesRef.current.sourceType === inspectionType)
            {
                requestInspectionValues(inspectionType, inspectionValuesRef.current.sourceId);
            }
        }, 500);

        return () => clearInterval(refreshTimer);
    }, [ activeTab, inspectionType, isVisible, requestInspectionValues, requestRoomStats ]);

    const subscribedInspectionUserId = isVisible && activeTab === 'inspection' && inspectionType === 'user'
        ? (inspectionValues?.sourceType === 'user' ? inspectionValues.sourceId : -1)
        : -1;

    useEffect(() =>
    {
        if(subscribedInspectionUserId < 0) return;
        mouseHoldStateRef.current = null;
        SendMessageComposer(new WiredMouseHoldSubscriptionComposer(true, subscribedInspectionUserId));
        return () =>
        {
            SendMessageComposer(new WiredMouseHoldSubscriptionComposer(false, subscribedInspectionUserId));
            mouseHoldStateRef.current = null;
        };
    }, [ subscribedInspectionUserId ]);

    useEffect(() =>
    {
        if(!isVisible || activeTab !== 'variables' || !variableHighlight?.variableName) return;

        const refreshTimer = setInterval(() =>
        {
            requestVariableHighlight(variableHighlight.sourceType, variableHighlight.variableName);
        }, 600);

        return () => clearInterval(refreshTimer);
    }, [ activeTab, isVisible, requestVariableHighlight, variableHighlight ]);

    useEffect(() =>
    {
        if(!isVisible || !logsOpen || !autoRefreshLogs) return;

        requestLogs(false);

        const refreshTimer = setInterval(() => requestLogs(false), 2000);

        return () => clearInterval(refreshTimer);
    }, [ autoRefreshLogs, isVisible, logsOpen, requestLogs ]);

    useEffect(() =>
    {
        if(!isVisible || logsOpen || activeTab !== 'monitor') return;

        requestLogs(false);

        const refreshTimer = setInterval(() => requestLogs(false), 2000);

        return () => clearInterval(refreshTimer);
    }, [ activeTab, isVisible, logsOpen, requestLogs ]);

    useEffect(() =>
    {
        if(isVisible && activeTab === 'variables')
        {
            applyVariableHighlightVisuals();
            return;
        }

        hideVariableHighlightVisuals();
    }, [ activeTab, applyVariableHighlightVisuals, hideVariableHighlightVisuals, isVisible ]);

    useEffect(() =>
    {
        return () =>
        {
            clearVariableHighlight();
            if(statsRequestTimerRef.current) clearTimeout(statsRequestTimerRef.current);
            if(inspectionValuesTimerRef.current) clearTimeout(inspectionValuesTimerRef.current);
            Object.values(pulseTimersRef.current).forEach(timer => clearTimeout(timer));
        };
    }, [ clearVariableHighlight ]);

    const selectedVariable = useMemo(() =>
    {
        const definitions = getVariableDefinitions(variableType, roomStatsRef.current ?? roomStats);
        const selectedKey = selectedVariableKey[variableType];

        return definitions.find(variable => variable.key === selectedKey) ?? definitions[0];
    }, [ roomStats, variableType, selectedVariableKey ]);

    const selectVariable = useCallback((type: VariableType, variableKey: string) =>
    {
        setSelectedVariableKey(previous => ({ ...previous, [type]: variableKey }));
        clearVariableHighlight();
    }, [ clearVariableHighlight ]);

    const filteredLogRows = useMemo(() =>
    {
        return logRows.filter(log =>
        {
            if(logFilter.trim() && !log.message.toLowerCase().includes(logFilter.trim().toLowerCase())) return false;
            if(logSourceFilter !== 'All' && log.source !== logSourceFilter.toUpperCase()) return false;
            if(logCategoryFilter !== 'All')
            {
                const normalizedCategory = log.category === 'WARNING' ? 'WARN' : log.category;

                if(normalizedCategory !== logCategoryFilter) return false;
            }

            return true;
        });
    }, [ logRows, logFilter, logSourceFilter, logCategoryFilter ]);

    const filteredChestLogs = useMemo(() => filterChestLogs(chestLogs, chestLogFilter, chestLogTypeFilter), [ chestLogs, chestLogFilter, chestLogTypeFilter ]);

    const pageCount = Math.max(1, Math.ceil(filteredLogRows.length / LOGS_PAGE_SIZE));
    const clampedLogPage = Math.min(logPage, pageCount);
    const chestLogPageCount = Math.max(1, Math.ceil(filteredChestLogs.length / LOGS_PAGE_SIZE));
    const clampedChestLogPage = Math.min(chestLogPage, chestLogPageCount);

    useEffect(() =>
    {
        if(logPage !== clampedLogPage) setLogPage(clampedLogPage);
    }, [ clampedLogPage, logPage ]);

    useEffect(() =>
    {
        if(chestLogPage !== clampedChestLogPage) setChestLogPage(clampedChestLogPage);
    }, [ chestLogPage, clampedChestLogPage ]);

    if(!hasOpened) return null;

    return (
        <>
            <NitroCardView uniqueKey="wired-creator-tools" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-creator-tools' ] } dragStyle={ (!isVisible || isPlacementHidden) ? { display: 'none' } : undefined }>
                <div className="wired-tools-tabbar wired-tools-drag-area">
                    { TABS.map(tab => (
                        <WiredToolsTabButton
                            key={ tab.key }
                            tab={ tab }
                            isActive={ activeTab === tab.key }
                            onSelect={ switchTab } />
                    )) }
                    <button
                        className="nw-btn nw-btn-close"
                        type="button"
                        onClick={ () =>
                        {
                            cleanupPendingWiredToolPlacement();
                            repeatedWiredToolIdRef.current = 0;
                            setIsPlacementHidden(false);
                            setIsVisible(false);
                        } } />
                </div>
                <NitroCardContentView classNames={ [ 'wired-tools-content' ] }>
                    <div className="wired-tools-tab-content">
                        { activeTab === 'monitor' && mountedTabs.monitor &&
                            <div className={ `wired-tools-tab-panel ${ activeTab === 'monitor' ? 'is-active' : '' }` }>
                                { renderMonitorTab(roomStats ? getMonitorStats(roomStats) : MONITOR_STATS, pulseKeys, monitorLogs, logRows.length > 0, () => requestLogs(true), openLogs) }
                            </div> }
                        { activeTab === 'variables' && mountedTabs.variables &&
                            <div className={ `wired-tools-tab-panel ${ activeTab === 'variables' ? 'is-active' : '' }` }>
                                <VariablesTab
                                    variableType={ variableType }
                                    setVariableType={ setVariableType }
                                    selectedVariableKey={ selectedVariableKey }
                                    selectVariable={ selectVariable }
                                    selectedVariable={ selectedVariable }
                                    roomStats={ roomStatsRef.current ?? roomStats }
                                    variableHighlight={ variableHighlight }
                                    onHighlight={ requestVariableHighlight }
                                    onClearHighlight={ clearVariableHighlight } />
                            </div> }
                        { activeTab === 'inspection' && mountedTabs.inspection &&
                            <div className={ `wired-tools-tab-panel ${ activeTab === 'inspection' ? 'is-active' : '' }` }>
                                { renderInspectionTab(inspectionType, changeInspectionType, keepInspectionSelected, setKeepInspectionSelected, roomStats?.globalValues ?? {}, roomStats?.globalVariables ?? [], inspectionValues, pulseKeys, inspectionPreview, !!inspectionValues, selectedInspectionVariable, setSelectedInspectionVariable, removeInspectionVariable, giveVariableOpen, setGiveVariableOpen, giveVariableName, setGiveVariableName, giveVariableValue, setGiveVariableValue, giveInspectionVariable, setInspectionVariableValue) }
                            </div> }
                        { activeTab === 'chests' && mountedTabs.chests &&
                            <div className={ `wired-tools-tab-panel ${ activeTab === 'chests' ? 'is-active' : '' }` }>
                                <ChestsTab
                                    logs={ chestLogs }
                                    isRoomOwner={ !!GetRoomSession()?.isRoomOwner }
                                    onRoomAction={ runRoomAction }
                                    onOpenLogs={ openChestLogs }
                                    onSelectLog={ setSelectedChestLog } />
                            </div> }
                        { activeTab === 'tools' && mountedTabs.tools &&
                            <div className={ `wired-tools-tab-panel ${ activeTab === 'tools' ? 'is-active' : '' }` }>
                                <ToolsTab
                                    toolPages={ wiredToolPages }
                                    onRequestCatalog={ requestWiredToolsCatalog }
                                    onRequestPlacement={ requestWiredToolPlacement } />
                            </div> }
                        { activeTab === 'settings' && mountedTabs.settings &&
                            <div className={ `wired-tools-tab-panel ${ activeTab === 'settings' ? 'is-active' : '' }` }>
                                <SettingsTab
                                    timezone={ timezone }
                                    setTimezone={ updateTimezone }
                                    wiredModifyPermissions={ wiredModifyPermissions }
                                    setWiredModifyPermissions={ updateWiredModifyPermissions }
                                    wiredInspectPermissions={ wiredInspectPermissions }
                                    setWiredInspectPermissions={ updateWiredInspectPermissions }
                                    showToolbar={ showToolbar }
                                    setShowToolbar={ updateShowToolbar }
                                    showInspectButton={ showInspectButton }
                                    setShowInspectButton={ updateShowInspectButton }
                                    playtestingMode={ playtestingMode }
                                    setPlaytestingMode={ updatePlaytestingMode }
                                    onRoomAction={ runRoomAction } />
                            </div> }
                    </div>
                </NitroCardContentView>
            </NitroCardView>
            { isVisible && logsOpen &&
                <NitroCardView uniqueKey="wired-creator-tools-logs" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-logs' ] }>
                    <div className="wired-tools-window-top wired-tools-drag-area">
                        <BitmapText className="wired-tools-window-title" font="il_heading_1" text="Wired Logs" scale={ 1 } />
                        <button className="nw-btn nw-btn-close" type="button" onClick={ () => setLogsOpen(false) } />
                    </div>
                    <NitroCardContentView classNames={ [ 'wired-tools-content', 'wired-tools-logs-content' ] }>
                        <LogsWindow
                            rows={ filteredLogRows }
                            state={ {
                                logFilter,
                                setLogFilter,
                                logSourceFilter,
                                setLogSourceFilter,
                                logCategoryFilter,
                                setLogCategoryFilter,
                                autoRefreshLogs,
                                setAutoRefreshLogs,
                                clampedLogPage,
                                pageCount,
                                setLogPage
                            } } />
                    </NitroCardContentView>
                </NitroCardView> }
            { isVisible && chestLogsOpen &&
                <NitroCardView uniqueKey="wired-creator-tools-chest-logs" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-chest-logs' ] }>
                    <div className="wired-tools-window-top wired-tools-drag-area">
                        <BitmapText className="wired-tools-window-title" font="il_heading_1" text="Transaction Logs" scale={ 1 } />
                        <button className="nw-btn nw-btn-close" type="button" onClick={ () => setChestLogsOpen(false) } />
                    </div>
                    <NitroCardContentView classNames={ [ 'wired-tools-content', 'wired-tools-chest-logs-content' ] }>
                        <ChestLogsWindow
                            rows={ filteredChestLogs }
                            allRows={ chestLogs }
                            state={ {
                                filter: chestLogFilter,
                                setFilter: setChestLogFilter,
                                typeFilter: chestLogTypeFilter,
                                setTypeFilter: setChestLogTypeFilter,
                                autoRefresh: autoRefreshChestLogs,
                                setAutoRefresh: setAutoRefreshChestLogs,
                                clampedPage: clampedChestLogPage,
                                pageCount: chestLogPageCount,
                                setPage: setChestLogPage
                            } }
                            onSelectLog={ setSelectedChestLog } />
                    </NitroCardContentView>
                </NitroCardView> }
            { isVisible && selectedChestLog &&
                <NitroCardView uniqueKey="wired-creator-tools-chest-log-detail" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-chest-log-detail' ] }>
                    <div className="wired-tools-window-top wired-tools-drag-area">
                        <BitmapText className="wired-tools-window-title" font="il_heading_1" text="Transaction Details" scale={ 1 } />
                        <button className="nw-btn nw-btn-close" type="button" onClick={ () => setSelectedChestLog(null) } />
                    </div>
                    <NitroCardContentView classNames={ [ 'wired-tools-content', 'wired-tools-chest-detail-content' ] }>
                        <ChestTransactionDetailWindow log={ selectedChestLog } />
                    </NitroCardContentView>
                </NitroCardView> }
            <VariableHighlightOverlay highlight={ isVisible && activeTab === 'variables' ? variableHighlight : null } pulseStamp={ variableHighlightPulse } />
        </>
    );
}

const getPulseClassName = (stamp: number) => stamp ? `is-live-updated wired-tools-pulse-${ stamp % 2 ? 'a' : 'b' }` : '';

const VariableHighlightOverlay = memo<{ highlight: WiredCreatorToolsVariableHighlight; pulseStamp: number; }>(({ highlight, pulseStamp }) =>
{
    if(!highlight?.targets?.length) return null;

    const pulseClassName = getPulseClassName(pulseStamp);

    return (
        <div className="wired-tools-highlight-overlay">
            { highlight.targets.map(target => (
                <ObjectLocationView
                    key={ `${ target.category }-${ target.objectId }-${ target.value }` }
                    objectId={ target.objectId }
                    category={ target.category }
                    className="wired-tools-highlight-location">
                    <div className={ `wired-tools-highlight-bubble ${ pulseClassName }`.trim() }>
                        <WiredButtonInfoText>{ target.value }</WiredButtonInfoText>
                        <span className="wired-tools-highlight-pointer" />
                    </div>
                </ObjectLocationView>
            )) }
        </div>
    );
});

const WiredToolsTabButton = memo<{
    tab: WiredCreatorToolsTabDefinition;
    isActive: boolean;
    onSelect: (tab: WiredCreatorToolsTab) => void;
}>(({ tab, isActive, onSelect }) => (
    <button
        className={ `wired-tools-tab ${ isActive ? 'is-active' : '' }` }
        type="button"
        onClick={ () => onSelect(tab.key) }>
        <span className="wired-tools-tab-icon-wrap">
            <span className={ `wired-tools-tab-icon ${ tab.iconClass }` } />
        </span>
        <span className="wired-tools-tab-title-shell">
            <BitmapText className="wired-tools-tab-label" font="il_heading_1" text={ tab.label } scale={ 1 } />
        </span>
    </button>
));

const MonitorStatRow = memo<{
    label: string;
    value: string;
    pulseClassName: string;
}>(({ label, value, pulseClassName }) => (
    <div className={ `wired-tools-stat-row ${ pulseClassName }` }>
        <WiredButtonInfoText>{ label }</WiredButtonInfoText>
        <span className="wired-tools-live-value"><StrongText>{ value }</StrongText></span>
    </div>
));

const MonitorLogRow = memo<{ log: MonitorLog; }>(({ log }) => (
    <tr>
        <td>
            <MonitorLogTypeInfo log={ log } />
        </td>
        <td><span className={ `wired-tools-severity wired-tools-severity-${ log.category.toLowerCase() }` }><StrongText>{ log.category }</StrongText></span></td>
        <td><WiredButtonInfoText>{ log.amount }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ log.latest }</WiredButtonInfoText></td>
    </tr>
), (previous, next) =>
    previous.log.type === next.log.type &&
    previous.log.category === next.log.category &&
    previous.log.amount === next.log.amount &&
    previous.log.latest === next.log.latest);

const MonitorLogTypeInfo = memo<{ log: MonitorLog; }>(({ log }) =>
{
    const [ hoverPosition, setHoverPosition ] = useState<{ left: number; top: number; placement: 'top' | 'bottom'; }>(null);
    const info = MONITOR_LOG_INFO[log.type] ?? {
        severity: log.category === 'WARN' ? 'WARNING' : 'ERROR',
        info: ''
    };
    const paragraphs = info.info
        ? info.info.split('\n\n')
        : [ 'No additional hover info is available for this log type yet.' ];
    const showHoverPanel = (element: HTMLElement) =>
    {
        const rect = element.getBoundingClientRect();
        const placement = rect.top < 150 ? 'bottom' : 'top';
        const left = Math.min(window.innerWidth - 195, Math.max(195, rect.left + (rect.width / 2)));
        const top = placement === 'top' ? rect.top - 10 : rect.bottom + 10;

        setHoverPosition({ left, top, placement });
    };

    return (
        <span
            className="wired-tools-log-type-info"
            onMouseEnter={ event => showHoverPanel(event.currentTarget) }
            onMouseMove={ event => showHoverPanel(event.currentTarget) }
            onMouseLeave={ () => setHoverPosition(null) }>
            <span className="wired-tools-log-type-link">
                <WiredButtonInfoText>{ log.type }</WiredButtonInfoText>
            </span>
            { hoverPosition && createPortal(
                <span
                    className={ `wired-tools-log-hover-panel wired-tools-log-hover-panel-${ hoverPosition.placement }` }
                    style={ { left: hoverPosition.left, top: hoverPosition.top } }>
                    <BitmapText className="wired-tools-log-hover-title" font="il_heading_1" text={ log.type } scale={ 1 } />
                    <span className={ `wired-tools-log-hover-icon wired-tools-log-hover-icon-${ info.severity.toLowerCase() }` } />
                    <span className="wired-tools-log-hover-copy">
                        { paragraphs.map((paragraph, index) => (
                            <span key={ index } className={ paragraph.startsWith('- ') ? 'wired-tools-log-hover-list' : '' }>
                                { paragraph.split('\n').map((line, lineIndex) => (
                                    <span key={ `${ index }-${ lineIndex }` }>{ line }{ lineIndex < paragraph.split('\n').length - 1 && <br /> }</span>
                                )) }
                            </span>
                        )) }
                    </span>
                </span>,
                document.body) }
        </span>
    );
});

const InspectionVariableRow = memo<{
    variableKey: string;
    parentKey?: string;
    displayValue: string;
    rawValue: string;
    isEditable: boolean;
    pulseClassName: string;
    isSelected: boolean;
    onSelect: (variableKey: string) => void;
    onSave: (variableKey: string, value: string) => void;
}>(({ variableKey, parentKey, displayValue, rawValue, isEditable, pulseClassName, isSelected, onSelect, onSave }) =>
{
    const [ isEditing, setIsEditing ] = useState(false);
    const [ editValue, setEditValue ] = useState(rawValue === '/' ? '' : rawValue);

    useEffect(() =>
    {
        if(!isEditing) setEditValue(rawValue === '/' ? '' : rawValue);
    }, [ isEditing, rawValue ]);

    const saveValue = useCallback(() =>
    {
        onSave(variableKey, editValue);
        setIsEditing(false);
    }, [ editValue, onSave, variableKey ]);

    return (
        <tr className={ `${ pulseClassName } ${ isSelected ? 'is-selected' : '' } ${ parentKey ? 'wired-tools-subvariable-row' : '' }`.trim() } onClick={ () => onSelect(variableKey) }>
            <td><WiredButtonInfoText>{ variableKey }</WiredButtonInfoText></td>
            <td
                className={ isEditable ? 'wired-tools-editable-value-cell' : '' }
                onClick={ event =>
                {
                    if(!isEditable) return;

                    event.stopPropagation();
                    onSelect(variableKey);
                    setIsEditing(true);
                } }>
                { isEditing
                    ? <WiredTextInput
                        autoFocus
                        bitmapAlign="center"
                        className="wired-tools-inline-value-input"
                        type="text"
                        inputMode="numeric"
                        pattern="-?[0-9]*"
                        value={ editValue }
                        onBlur={ () => setIsEditing(false) }
                        onChange={ event => setEditValue(event.target.value.replace(/[^0-9-]/g, '')) }
                        onClick={ stopRoomInputPropagation }
                        onKeyUp={ stopRoomInputPropagation }
                        onKeyDown={ event =>
                        {
                            stopRoomInputPropagation(event);
                            if(event.key === 'Enter')
                            {
                                event.preventDefault();
                                saveValue();
                            }
                            if(event.key === 'Escape')
                            {
                                event.preventDefault();
                                setIsEditing(false);
                            }
                        } } />
                    : <span className="wired-tools-live-value"><WiredButtonInfoText>{ displayValue }</WiredButtonInfoText></span> }
            </td>
        </tr>
    );
});

const TextValueTableRow = memo<{ row: TextValueRow; }>(({ row }) => (
    <tr>
        <td><WiredButtonInfoText>{ row.value }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ row.text }</WiredButtonInfoText></td>
    </tr>
), (previous, next) => previous.row.value === next.row.value && previous.row.text === next.row.text);

const TextValuesTable: FC<{ variable: VariableDefinition; }> = memo(({ variable }) =>
{
    const rows = getVariableTextValues(variable);
    const hasRows = rows.length > 0;

    return (
        <Table className="wired-tools-text-values-table" headers={ [ 'Value', 'Text' ] }>
            { hasRows
                ? rows.map(row => <TextValueTableRow key={ `${ row.value }-${ row.text }` } row={ row } />)
                :
                <TextValueTableRow row={ { value: '/', text: 'Nothing to display' } } /> }
        </Table>
    );
});

const renderMonitorTab = (monitorStats: MonitorStat[], pulseKeys: Record<string, number>, monitorLogs: MonitorLog[], hasLogs: boolean, clearLogs: () => void, openLogs: () => void) =>
{
    return (
        <div className="wired-tools-grid wired-tools-monitor">
            <section className="wired-tools-panel">
                <PanelTitle title="Room Statistics" />
                <div className="wired-tools-stat-list">
                    { monitorStats.map(stat => (
                        <MonitorStatRow
                            key={ stat.key }
                            label={ stat.label }
                            value={ stat.value }
                            pulseClassName={ getPulseClassName(pulseKeys[stat.key]) } />
                    )) }
                </div>
                <div className="wired-tools-stats-art" />
            </section>
            <section className="wired-tools-panel wired-tools-panel-wide">
                <PanelTitle title="Log Summary" />
                <Table className="wired-tools-log-table" headers={ [ 'Type', 'Category', 'Amount', 'Latest Occurence' ] }>
                    { monitorLogs.map(log => (
                        <MonitorLogRow key={ log.type } log={ log } />
                    )) }
                </Table>
                <div className="wired-tools-actions">
                    <Button disabled={ !hasLogs } variant="danger" onClick={ clearLogs }><ButtonText>Clear Logs</ButtonText></Button>
                    <Button variant="secondary" onClick={ openLogs }><ButtonText>View Logs</ButtonText></Button>
                </div>
            </section>
        </div>
    );
};

const VariablesTab = memo<{
    variableType: VariableType;
    setVariableType: (type: VariableType) => void;
    selectedVariableKey: Record<VariableType, string>;
    selectVariable: (type: VariableType, variableKey: string) => void;
    selectedVariable: VariableDefinition;
    roomStats: WiredCreatorToolsRoomStats;
    variableHighlight: WiredCreatorToolsVariableHighlight;
    onHighlight: (type: VariableType, variableKey: string) => void;
    onClearHighlight: () => void;
}>(({
    variableType,
    setVariableType,
    selectedVariableKey,
    selectVariable,
    selectedVariable,
    roomStats,
    variableHighlight,
    onHighlight,
    onClearHighlight
}) =>
{
    const variableDefinitions = getVariableDefinitions(variableType, roomStats);
    const canHighlight = selectedVariable.type === 'Created by user' && (variableType === 'furni' || variableType === 'user');
    const isHighlightActive = !!variableHighlight && variableHighlight.sourceType === variableType && variableHighlight.variableName === selectedVariable.key;
    const toggleHighlight = () =>
    {
        if(!canHighlight) return;
        if(isHighlightActive) onClearHighlight();
        else onHighlight(variableType, selectedVariable.key);
    };

    return (
        <div className="wired-tools-grid wired-tools-variables">
            <section className="wired-tools-panel wired-tools-side-panel">
                <PanelTitle title="Variable Type" />
                <IconPicker options={ VARIABLE_TYPE_OPTIONS } value={ variableType } onChange={ type =>
                {
                    onClearHighlight();
                    setVariableType(type);
                } } />
                <PanelTitle title="Variable Picker" />
                <div className="wired-tools-picker-list">
                    { variableDefinitions.map(variable => (
                        <button
                            key={ variable.key }
                            className={ `wired-tools-picker-row ${ selectedVariableKey[variableType] === variable.key ? 'is-active' : '' }` }
                            type="button"
                            onClick={ () => selectVariable(variableType, variable.key) }>
                            <WiredButtonInfoText>{ variable.key }</WiredButtonInfoText>
                        </button>
                    )) }
                </div>
                <Button disabled={ !canHighlight } variant="secondary" onClick={ toggleHighlight }><ButtonText>{ isHighlightActive ? 'Undo' : 'Highlight' }</ButtonText></Button>
            </section>
            <section className="wired-tools-panel wired-tools-panel-wide">
                <PanelTitle title="Properties" />
                <Table className="wired-tools-properties-table" headers={ [ 'Property', 'Value' ] }>
                    { getVariableProperties(selectedVariable).map(row => (
                        <tr key={ row.property }>
                            <td><WiredButtonInfoText>{ row.property }</WiredButtonInfoText></td>
                            <td><WiredButtonInfoText>{ row.value }</WiredButtonInfoText></td>
                        </tr>
                    )) }
                </Table>
                <PanelTitle title="Text Values" />
                <TextValuesTable key={ selectedVariable.key } variable={ selectedVariable } />
            </section>
        </div>
    );
});

const InspectionSidePanel = memo<{
    inspectionType: InspectionType;
    setInspectionType: (type: InspectionType) => void;
    keepSelected: boolean;
    setKeepSelected: (checked: boolean) => void;
    inspectionPreview: InspectionPreview;
}>(({ inspectionType, setInspectionType, keepSelected, setKeepSelected, inspectionPreview }) => (
    <section className="wired-tools-panel wired-tools-side-panel">
        <PanelTitle title="Variable Type" />
        <IconPicker options={ INSPECTION_TYPE_OPTIONS } value={ inspectionType } onChange={ setInspectionType } />
        <PanelTitle title="Preview" />
        <div className="wired-tools-preview">
            { renderInspectionPreview(inspectionType, inspectionPreview) }
        </div>
        <ToolCheckbox checked={ keepSelected } label="Keep Selected" onChange={ setKeepSelected } />
    </section>
));

const renderInspectionTab = (
    inspectionType: InspectionType,
    setInspectionType: (type: InspectionType) => void,
    keepSelected: boolean,
    setKeepSelected: (checked: boolean) => void,
    globalValues: Record<string, string>,
    globalVariables: string[],
    inspectionValues: WiredCreatorToolsInspectionValues,
    pulseKeys: Record<string, number>,
    inspectionPreview: InspectionPreview,
    hasSelectedSource: boolean,
    selectedInspectionVariable: string,
    setSelectedInspectionVariable: (variableKey: string) => void,
    removeInspectionVariable: () => void,
    giveVariableOpen: boolean,
    setGiveVariableOpen: (open: boolean) => void,
    giveVariableName: string,
    setGiveVariableName: (name: string) => void,
    giveVariableValue: string,
    setGiveVariableValue: (value: string) => void,
    giveInspectionVariable: () => void,
    setInspectionVariableValue: (variableKey: string, value: string) => void
) =>
{
    const sourceValues = inspectionValues?.values ?? {};
    const createdVariables = inspectionValues?.variables ?? [];
    const inspectionVariables = getInspectionVariables(inspectionType, inspectionValues, inspectionType === 'global' ? globalValues : sourceValues, hasSelectedSource, globalVariables);
    const canGiveVariable = inspectionType !== 'global' && hasSelectedSource && createdVariables.length > 0;
    const canRemoveVariable = inspectionType !== 'global' && hasSelectedSource && isCreatedInspectionVariable(selectedInspectionVariable) && Object.prototype.hasOwnProperty.call(sourceValues, selectedInspectionVariable);
    const canCreateGivenVariable = !!giveVariableName && !Object.prototype.hasOwnProperty.call(sourceValues, giveVariableName);
    const giveVariableOptions = [
        { value: '', label: 'Choose variable' },
        ...createdVariables.map(variable => ({
            value: variable,
            label: Object.prototype.hasOwnProperty.call(sourceValues, variable) ? `${ variable } (already given)` : variable,
            disabled: Object.prototype.hasOwnProperty.call(sourceValues, variable)
        }))
    ];

    return (
        <div className="wired-tools-grid wired-tools-inspection">
            <InspectionSidePanel
                inspectionType={ inspectionType }
                setInspectionType={ setInspectionType }
                keepSelected={ keepSelected }
                setKeepSelected={ setKeepSelected }
                inspectionPreview={ inspectionPreview } />
            <section className="wired-tools-panel wired-tools-panel-wide">
                <PanelTitle title="Variables" />
                <Table className="wired-tools-inspection-table" headers={ [ 'Variable', 'Value' ] }>
                    { inspectionVariables.map(variable => (
                            <InspectionVariableRow
                                key={ variable.key }
                                variableKey={ variable.key }
                                parentKey={ variable.parentKey }
                            displayValue={ getInspectionValue(variable, inspectionType, globalValues, sourceValues) }
                            rawValue={ getRawInspectionValue(variable.key, inspectionType, globalValues, sourceValues) }
                            isEditable={ canEditInspectionVariable(inspectionType, variable.key, sourceValues, hasSelectedSource, globalValues, inspectionType === 'global' ? globalVariables : createdVariables) }
                            pulseClassName={ getPulseClassName(pulseKeys[variable.key]) }
                            isSelected={ selectedInspectionVariable === variable.key }
                            onSelect={ setSelectedInspectionVariable }
                            onSave={ setInspectionVariableValue } />
                    )) }
                </Table>
                <div className="wired-tools-actions wired-tools-inspection-actions">
                    <Button disabled={ !canRemoveVariable } variant="danger" onClick={ removeInspectionVariable }><ButtonText>Remove Variable</ButtonText></Button>
                    <Button disabled={ !canGiveVariable } variant="secondary" onClick={ () => setGiveVariableOpen(!giveVariableOpen) }><ButtonText>Give Variable</ButtonText></Button>
                    { giveVariableOpen && canGiveVariable &&
                        <div className="wired-tools-give-variable-popover">
                            <label className="wired-tools-field">
                                <WiredButtonInfoText>Variable:</WiredButtonInfoText>
                                <WiredSelect
                                    className="wired-tools-dropdown"
                                    options={ giveVariableOptions }
                                    value={ giveVariableName }
                                    onChange={ event => setGiveVariableName(event.target.value) } />
                            </label>
                            <label className="wired-tools-field">
                                <WiredButtonInfoText>Value:</WiredButtonInfoText>
                                <WiredTextInput
                                    compact
                                    type="text"
                                    inputMode="numeric"
                                    pattern="-?[0-9]*"
                                    value={ giveVariableValue }
                                    onChange={ event => setGiveVariableValue(event.target.value.replace(/[^0-9-]/g, '')) }
                                    onClick={ stopRoomInputPropagation }
                                    onKeyDown={ stopRoomInputPropagation }
                                    onKeyUp={ stopRoomInputPropagation } />
                            </label>
                            <div className="wired-tools-actions">
                                <Button disabled={ !canCreateGivenVariable } variant="secondary" onClick={ giveInspectionVariable }><ButtonText>Create</ButtonText></Button>
                            </div>
                        </div> }
                </div>
            </section>
        </div>
    );
};

const renderInspectionPreview = (inspectionType: InspectionType, inspectionPreview: InspectionPreview) =>
{
    if(inspectionType === 'global') return <span className="wired-tools-global-preview" />;

    if(!inspectionPreview || inspectionPreview.type !== inspectionType)
    {
        return <WiredButtonInfoText>{ `Select a ${ inspectionType } in the room` }</WiredButtonInfoText>;
    }

    if(inspectionPreview.type === 'user')
    {
        return (
            <div className="wired-tools-selected-preview wired-tools-user-preview">
                <div className="wired-tools-selected-preview-image">
                    { inspectionPreview.isPet
                        ? <LayoutPetImageView figure={ inspectionPreview.figure } direction={ 4 } />
                        : <LayoutAvatarImageView figure={ inspectionPreview.figure } direction={ 4 } /> }
                </div>
                <WiredButtonInfoText>{ inspectionPreview.name }</WiredButtonInfoText>
            </div>
        );
    }

    return (
        <div className="wired-tools-selected-preview wired-tools-furni-preview">
            <div className="wired-tools-selected-preview-image">
                { inspectionPreview.imageSrc &&
                    <img src={ inspectionPreview.imageSrc } alt="" /> }
            </div>
            <WiredButtonInfoText>{ inspectionPreview.name }</WiredButtonInfoText>
        </div>
    );
};

const ToolsTab = memo<{
    toolPages: Record<ToolType, WiredToolItem[]>;
    onRequestCatalog: () => void;
    onRequestPlacement: (toolId: number) => void;
}>(({ toolPages, onRequestCatalog, onRequestPlacement }) =>
{
    const [ toolType, setToolType ] = useState<ToolType>('triggers');
    const [ selectedItemKey, setSelectedItemKey ] = useState(0);
    const [ hoverPreview, setHoverPreview ] = useState<{ item: WiredToolItem; left: number; top: number; placement: 'top' | 'bottom'; }>(null);
    const mouseDownItemKeyRef = useRef(0);
    const currentItems = toolPages[toolType] ?? [];
    const selectedItem = currentItems.find(item => item.key === selectedItemKey) ?? currentItems[0] ?? null;

    useEffect(() =>
    {
        setSelectedItemKey(previous =>
        {
            if(currentItems.some(item => item.key === previous)) return previous;

            return currentItems[0]?.key ?? 0;
        });

        mouseDownItemKeyRef.current = 0;
        setHoverPreview(null);
    }, [ currentItems ]);

    useEffect(() =>
    {
        onRequestCatalog();

        return () =>
        {
            mouseDownItemKeyRef.current = 0;
            setHoverPreview(null);
        };
    }, [ onRequestCatalog ]);

    const startDragPlacement = (item: WiredToolItem) =>
    {
        if(mouseDownItemKeyRef.current !== item.key) return;

        mouseDownItemKeyRef.current = 0;
        setHoverPreview(null);
        onRequestPlacement(item.key);
    };

    const showHoverPreview = (item: WiredToolItem, element: HTMLElement) =>
    {
        const rect = element.getBoundingClientRect();
        const placement = rect.top < 128 ? 'bottom' : 'top';
        const left = Math.min(window.innerWidth - 126, Math.max(126, rect.left + (rect.width / 2)));
        const top = placement === 'top' ? rect.top - 10 : rect.bottom + 10;

        setHoverPreview({ item, left, top, placement });
    };

    return (
        <div className="wired-tools-grid wired-tools-tools">
            <section className="wired-tools-panel wired-tools-side-panel">
                <PanelTitle title="Tool Type" />
                <IconPicker<ToolType> options={ TOOL_TYPE_OPTIONS } value={ toolType } onChange={ setToolType } variant="tool" />
                <PanelTitle title={ TOOL_TYPE_LABELS[toolType] } />
                <div className="wired-tools-item-grid" onMouseLeave={ () => setHoverPreview(null) }>
                    { currentItems.length > 0
                        ? currentItems.map(item => (
                            <button
                                key={ item.key }
                                className={ `wired-tools-item-button ${ selectedItem?.key === item.key ? 'is-active' : '' }` }
                                title={ item.name }
                                type="button"
                                onMouseDown={ event =>
                                {
                                    if(event.button !== 0) return;

                                    mouseDownItemKeyRef.current = item.key;
                                    setSelectedItemKey(item.key);
                                } }
                                onMouseLeave={ () =>
                                {
                                    setHoverPreview(null);
                                    startDragPlacement(item);
                                } }
                                onMouseUp={ () =>
                                {
                                    mouseDownItemKeyRef.current = 0;
                                    setHoverPreview(null);
                                } }
                                onMouseEnter={ event => showHoverPreview(item, event.currentTarget) }
                                onMouseMove={ event => showHoverPreview(item, event.currentTarget) }
                                onClick={ () => setSelectedItemKey(item.key) }
                                onDragStart={ event => event.preventDefault() }>
                                <img draggable={ false } src={ getWiredToolIconUrl(item) } alt="" />
                            </button>
                        ))
                        : <div className="wired-tools-empty-state"><WiredButtonInfoText>No wired tools found.</WiredButtonInfoText></div> }
                </div>
            </section>
            <section className="wired-tools-panel wired-tools-panel-wide wired-tools-tool-details">
                <PanelTitle title="Selected Furni" />
                { selectedItem
                    ? (
                        <div className="wired-tools-tool-preview">
                            <div className="wired-tools-tool-preview-image">
                                <LayoutFurniImageView
                                    className="d-block mx-auto"
                                    productType={ selectedItem.productType }
                                    productClassId={ selectedItem.spriteId } />
                            </div>
                            <WiredButtonInfoText>{ selectedItem.name }</WiredButtonInfoText>
                        </div>
                    )
                    : <div className="wired-tools-empty-state"><WiredButtonInfoText>Select a wired tool.</WiredButtonInfoText></div> }
                <PanelTitle title="Showcase" />
                <div className="wired-tools-showcase-skeleton">
                    { selectedItem?.previewAsset?.trim()
                        ? <img className="wired-tools-showcase-preview" src={ selectedItem.previewAsset } alt="" />
                        : <WiredButtonInfoText>Showcase preview coming soon.</WiredButtonInfoText> }
                </div>
            </section>
            { hoverPreview && createPortal(
                <div
                    className={ `wired-tools-item-bubble wired-tools-item-bubble-${ hoverPreview.placement }` }
                    style={ { left: hoverPreview.left, top: hoverPreview.top } }>
                    <span className="wired-tools-item-bubble-image">
                        <LayoutFurniImageView productType={ hoverPreview.item.productType } productClassId={ hoverPreview.item.spriteId } />
                    </span>
                    <WiredButtonInfoText>{ hoverPreview.item.name }</WiredButtonInfoText>
                </div>,
                document.body) }
        </div>
    );
});

const ChestsTab = memo<{
    logs: WiredCreatorToolsChestLogEntry[];
    isRoomOwner: boolean;
    onRoomAction: (action: WiredCreatorToolsRoomAction) => void;
    onOpenLogs: () => void;
    onSelectLog: (log: WiredCreatorToolsChestLogEntry) => void;
}>(({ logs, isRoomOwner, onRoomAction, onOpenLogs, onSelectLog }) =>
{
    const recentLogs = logs.slice(0, 10);
    const totals = logs.reduce((current, log) =>
    {
        current.withdrawalFurni += log.withdrawalFurni;
        current.withdrawalCoins += log.withdrawalCoins;
        current.depositFurni += log.depositFurni;
        current.depositCoins += log.depositCoins;
        current.chests += log.chestCount;

        return current;
    }, { withdrawalFurni: 0, withdrawalCoins: 0, depositFurni: 0, depositCoins: 0, chests: 0 });

    return (
        <div className="wired-tools-grid wired-tools-chests">
            <section className="wired-tools-panel wired-tools-side-panel">
                <PanelTitle title="Chest Controls" />
                <div className="wired-tools-actions wired-tools-chest-actions">
                    <Button variant="secondary" onClick={ () => onRoomAction('lock_own_chests') }><ButtonText>Lock all your chests</ButtonText></Button>
                    <Button variant="secondary" onClick={ () => onRoomAction('unlock_own_chests') }><ButtonText>Unlock all your chests</ButtonText></Button>
                    <Button disabled={ !isRoomOwner } variant="danger" onClick={ () => onRoomAction('lock_all_chests') }><ButtonText>Lock all chests</ButtonText></Button>
                </div>
                <PanelTitle title="Room Totals" />
                <div className="wired-tools-stat-list">
                    <MonitorStatRow label="Transactions" value={ String(logs.length) } pulseClassName="" />
                    <MonitorStatRow label="Withdrawn" value={ formatChestLogAmount(totals.withdrawalFurni, totals.withdrawalCoins) } pulseClassName="" />
                    <MonitorStatRow label="Deposited" value={ formatChestLogAmount(totals.depositFurni, totals.depositCoins) } pulseClassName="" />
                </div>
            </section>
            <section className="wired-tools-panel wired-tools-panel-wide">
                <PanelTitle title="Transaction Summary" />
                <Table className="wired-tools-chest-summary-table" headers={ [ 'Type', 'User', 'Withdrawals', 'Deposits', 'Chests' ] }>
                    { recentLogs.map((log, index) => <ChestLogSummaryRow key={ `${ log.timestamp }-${ log.userId }-${ index }` } log={ log } onSelect={ onSelectLog } />) }
                    { !recentLogs.length &&
                        <tr className="wired-tools-empty-log-row">
                            <td colSpan={ 5 }><WiredButtonInfoText>No chest transactions logged yet.</WiredButtonInfoText></td>
                        </tr> }
                </Table>
                <div className="wired-tools-actions">
                    <Button variant="secondary" onClick={ onOpenLogs }><ButtonText>View Detailed List</ButtonText></Button>
                </div>
            </section>
        </div>
    );
});

const ChestLogSummaryRow = memo<{ log: WiredCreatorToolsChestLogEntry; onSelect: (log: WiredCreatorToolsChestLogEntry) => void; }>(({ log, onSelect }) => (
    <tr className="wired-tools-clickable-row" onClick={ () => onSelect(log) }>
        <td><WiredButtonInfoText>{ getChestLogTypeLabel(log.type) }</WiredButtonInfoText></td>
        <td>
            <button
                className="wired-tools-link-button"
                type="button"
                onClick={ event =>
                {
                    event.stopPropagation();
                    if(log.userId > 0) GetUserProfile(log.userId);
                } }>
                <WiredButtonInfoText>{ log.username || '/' }</WiredButtonInfoText>
            </button>
        </td>
        <td><WiredButtonInfoText>{ formatChestLogAmount(log.withdrawalFurni, log.withdrawalCoins) }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ formatChestLogAmount(log.depositFurni, log.depositCoins) }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ log.chestCount }</WiredButtonInfoText></td>
    </tr>
), (previous, next) =>
    previous.log.timestamp === next.log.timestamp &&
    previous.log.type === next.log.type &&
    previous.log.userId === next.log.userId &&
    previous.log.withdrawalFurni === next.log.withdrawalFurni &&
    previous.log.withdrawalCoins === next.log.withdrawalCoins &&
    previous.log.depositFurni === next.log.depositFurni &&
    previous.log.depositCoins === next.log.depositCoins &&
    previous.log.chestCount === next.log.chestCount);

const ChestLogsWindow = memo<{
    rows: WiredCreatorToolsChestLogEntry[];
    allRows: WiredCreatorToolsChestLogEntry[];
    state: ChestLogsWindowState;
    onSelectLog: (log: WiredCreatorToolsChestLogEntry) => void;
}>(({ rows, allRows, state, onSelectLog }) =>
{
    const pageRows = rows.slice(((state.clampedPage - 1) * LOGS_PAGE_SIZE), (state.clampedPage * LOGS_PAGE_SIZE));
    const tableKey = `${ state.clampedPage }-${ state.filter }-${ state.typeFilter }-${ rows.length }`;
    const typeOptions = useMemo(() =>
    {
        const types = Array.from(new Set(allRows.map(log => (log.type || '').toUpperCase()).filter(Boolean)));

        return [ 'All', ...types ].map(value => ({ value, label: value === 'All' ? value : getChestLogTypeLabel(value) }));
    }, [ allRows ]);

    return (
        <div className="wired-tools-logs-window wired-tools-chest-logs-window">
            <div className="wired-tools-log-filters">
                <WiredTextInput
                    bitmapAlign="center"
                    className="wired-tools-input wired-tools-log-filter-input"
                    type="text"
                    value={ state.filter }
                    onChange={ event => state.setFilter(event.target.value) }
                    onClick={ stopRoomInputPropagation }
                    onKeyDown={ stopRoomInputPropagation }
                    onKeyUp={ stopRoomInputPropagation } />
                <WiredSelect
                    className="wired-tools-dropdown"
                    options={ typeOptions }
                    value={ state.typeFilter }
                    onChange={ event => state.setTypeFilter(event.target.value) } />
                <ToolCheckbox checked={ state.autoRefresh } label="Auto Refresh" onChange={ state.setAutoRefresh } />
            </div>
            <Table key={ tableKey } className="wired-tools-chest-log-table" headers={ [ 'Timestamp', 'Type', 'User', 'Withdrawals', 'Deposits', 'Chests' ] }>
                { pageRows.map((log, index) => <ChestLogTableRow key={ `${ log.timestamp }-${ log.userId }-${ index }` } log={ log } onSelect={ onSelectLog } />) }
                { !pageRows.length &&
                    <tr className="wired-tools-empty-log-row">
                        <td colSpan={ 6 }><WiredButtonInfoText>No chest logs found for the current filters.</WiredButtonInfoText></td>
                    </tr> }
            </Table>
            <div className="wired-tools-pager">
                <WiredAdjustButton
                    direction="left"
                    disabled={ state.clampedPage <= 1 }
                    onClick={ () => state.setPage(page => Math.max(1, page - 1)) } />
                <WiredTextInput
                    bitmapAlign="center"
                    className="wired-tools-page-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    value={ state.clampedPage }
                    onChange={ event => state.setPage(Math.min(state.pageCount, Math.max(1, Number(event.target.value || 1)))) }
                    onClick={ stopRoomInputPropagation }
                    onKeyDown={ stopRoomInputPropagation }
                    onKeyUp={ stopRoomInputPropagation } />
                <span className="wired-tools-pager-total"><WiredButtonInfoText>{ `/ ${ state.pageCount } total pages` }</WiredButtonInfoText></span>
                <WiredAdjustButton
                    direction="right"
                    disabled={ state.clampedPage >= state.pageCount }
                    onClick={ () => state.setPage(page => Math.min(state.pageCount, page + 1)) } />
            </div>
        </div>
    );
});

const ChestLogTableRow = memo<{ log: WiredCreatorToolsChestLogEntry; onSelect: (log: WiredCreatorToolsChestLogEntry) => void; }>(({ log, onSelect }) => (
    <tr className="wired-tools-clickable-row" onClick={ () => onSelect(log) }>
        <td><WiredButtonInfoText>{ formatWiredLogTimestamp(log.timestamp) }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ getChestLogTypeLabel(log.type) }</WiredButtonInfoText></td>
        <td>
            <button
                className="wired-tools-link-button"
                type="button"
                onClick={ event =>
                {
                    event.stopPropagation();
                    if(log.userId > 0) GetUserProfile(log.userId);
                } }>
                <WiredButtonInfoText>{ log.username || '/' }</WiredButtonInfoText>
            </button>
        </td>
        <td><WiredButtonInfoText>{ formatChestLogAmount(log.withdrawalFurni, log.withdrawalCoins) }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ formatChestLogAmount(log.depositFurni, log.depositCoins) }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ log.chestCount }</WiredButtonInfoText></td>
    </tr>
));

const getChestDetailIconUrl = (item: WiredCreatorToolsChestLogDetailItem) =>
{
    if((item.productType || '').toLowerCase() === 'wall') return GetRoomEngine().getFurnitureWallIconUrl(item.spriteId, item.extraData);

    return GetRoomEngine().getFurnitureFloorIconUrl(item.spriteId);
};

const ChestTransactionDetailWindow = memo<{ log: WiredCreatorToolsChestLogEntry; }>(({ log }) => (
    <div className="wired-tools-chest-detail-window">
        <div className="wired-tools-chest-detail-meta">
            <span className="wired-tools-chest-detail-meta-item">
                <WiredButtonInfoText>Timestamp</WiredButtonInfoText>
                <WiredButtonInfoText>{ formatWiredLogTimestamp(log.timestamp) }</WiredButtonInfoText>
            </span>
            <span className="wired-tools-chest-detail-meta-item">
                <WiredButtonInfoText>Type</WiredButtonInfoText>
                <WiredButtonInfoText>{ getChestLogTypeLabel(log.type) }</WiredButtonInfoText>
            </span>
            <span className="wired-tools-chest-detail-meta-item">
                <WiredButtonInfoText>User</WiredButtonInfoText>
                <button
                    className="wired-tools-link-button"
                    type="button"
                    onClick={ () => log.userId > 0 && GetUserProfile(log.userId) }>
                    <WiredButtonInfoText>{ log.username || '/' }</WiredButtonInfoText>
                </button>
            </span>
            <span className="wired-tools-chest-detail-meta-item">
                <WiredButtonInfoText>Chests Involved</WiredButtonInfoText>
                <WiredButtonInfoText>{ log.chestCount }</WiredButtonInfoText>
            </span>
        </div>
        <div className="wired-tools-chest-trade-view">
            <ChestTransactionPane title="Withdrawals" coins={ log.withdrawalCoins } items={ log.details.withdrawals } />
            <div className="wired-tools-chest-trade-divider"><img className="wired-tools-chest-trade-arrow" src={ arrowRightAdjustIcon } alt="" /></div>
            <ChestTransactionPane title="Deposits" coins={ log.depositCoins } items={ log.details.deposits } />
        </div>
    </div>
));

const ChestTransactionPane = memo<{ title: string; coins: number; items: WiredCreatorToolsChestLogDetailItem[]; }>(({ title, coins, items }) => (
    <section className="wired-tools-chest-trade-pane">
        <div className="wired-tools-chest-pane-title"><WiredButtonInfoText>{ title }</WiredButtonInfoText></div>
        <div className="wired-tools-chest-trade-items">
            { coins > 0 &&
                <div className="wired-tools-chest-trade-item">
                    <span className="wired-tools-chest-trade-icon"><img src={ chestCoinIcon } alt="" /></span>
                    <span className="wired-tools-chest-trade-copy">
                        <WiredButtonInfoText>{ `x${ coins }` }</WiredButtonInfoText>
                        <WiredButtonInfoText>Credits</WiredButtonInfoText>
                    </span>
                </div> }
            { items.map((item, index) => (
                <div key={ `${ item.furniCode }-${ item.spriteId }-${ item.extraData }-${ index }` } className="wired-tools-chest-trade-item">
                    <span className="wired-tools-chest-trade-icon">
                        <img src={ getChestDetailIconUrl(item) } alt="" />
                    </span>
                    <span className="wired-tools-chest-trade-copy">
                        <WiredButtonInfoText>{ `x${ item.amount }` }</WiredButtonInfoText>
                        <WiredButtonInfoText>{ item.name || item.furniCode || 'Furni' }</WiredButtonInfoText>
                    </span>
                </div>
            )) }
            { coins <= 0 && !items.length &&
                <div className="wired-tools-empty-state"><WiredButtonInfoText>Nothing to display.</WiredButtonInfoText></div> }
        </div>
    </section>
));

const SettingsTab = memo<{
    timezone: string;
    setTimezone: (timezone: string) => void;
    wiredModifyPermissions: number;
    setWiredModifyPermissions: (permissions: number) => void;
    wiredInspectPermissions: number;
    setWiredInspectPermissions: (permissions: number) => void;
    showToolbar: boolean;
    setShowToolbar: (checked: boolean) => void;
    showInspectButton: boolean;
    setShowInspectButton: (checked: boolean) => void;
    playtestingMode: boolean;
    setPlaytestingMode: (checked: boolean) => void;
    onRoomAction: (action: WiredCreatorToolsRoomAction) => void;
}>(({
    timezone,
    setTimezone,
    wiredModifyPermissions,
    setWiredModifyPermissions,
    wiredInspectPermissions,
    setWiredInspectPermissions,
    showToolbar,
    setShowToolbar,
    showInspectButton,
    setShowInspectButton,
    playtestingMode,
    setPlaytestingMode,
    onRoomAction
}) =>
{
    return (
        <div className="wired-tools-settings">
            <section className="wired-tools-panel">
                <PanelTitle title="Who can modify Wired" />
                <CheckboxList
                    options={ WIRED_MODIFY_PERMISSION_OPTIONS }
                    value={ wiredModifyPermissions }
                    normalize={ normalizeWiredModifyPermissions }
                    onChange={ setWiredModifyPermissions } />
            </section>
            <section className="wired-tools-panel">
                <PanelTitle title="Who can inspect Wired" />
                <CheckboxList
                    options={ WIRED_INSPECT_PERMISSION_OPTIONS }
                    value={ wiredInspectPermissions }
                    normalize={ normalizeWiredInspectPermissions }
                    onChange={ setWiredInspectPermissions } />
            </section>
            <section className="wired-tools-panel">
                <PanelTitle title="Timezone" />
                <WiredSelect
                    className="wired-tools-dropdown"
                    options={ TIMEZONES.map(timezone => ({ value: timezone, label: timezone })) }
                    value={ timezone }
                    onChange={ event => setTimezone(event.target.value) } />
            </section>
            <section className="wired-tools-panel">
                <PanelTitle title="Room State" />
                <div className="wired-tools-actions">
                    <Button variant="secondary" onClick={ () => onRoomAction('reload') }><ButtonText>Reload</ButtonText></Button>
                    <Button variant="danger" onClick={ () => onRoomAction('rollback') }><ButtonText>Rollback</ButtonText></Button>
                </div>
            </section>
            <section className="wired-tools-panel wired-tools-panel-wide">
                <PanelTitle title="Account Preferences" />
                <div className="wired-tools-checkbox-list">
                    <ToolCheckbox checked={ showToolbar } label="Show wired menu in toolbar" onChange={ setShowToolbar } />
                    <ToolCheckbox checked={ showInspectButton } label="Furni/user inspect button" onChange={ setShowInspectButton } />
                    <ToolCheckbox checked={ playtestingMode } label="Enable playtesting mode" onChange={ setPlaytestingMode } />
                </div>
            </section>
        </div>
    );
});

const LogsWindow = memo<{ rows: MonitorLog[]; state: LogsWindowState; }>(({ rows, state }) =>
{
    const pageRows = rows.slice(((state.clampedLogPage - 1) * LOGS_PAGE_SIZE), (state.clampedLogPage * LOGS_PAGE_SIZE));
    const tableKey = `${ state.clampedLogPage }-${ state.logFilter }-${ state.logSourceFilter }-${ state.logCategoryFilter }-${ rows.length }`;

    return (
        <div className="wired-tools-logs-window">
            <div className="wired-tools-log-filters">
                <WiredTextInput
                    className="wired-tools-input wired-tools-log-filter-input"
                    placeholder="Filter message"
                    type="text"
                    value={ state.logFilter }
                    onChange={ event => state.setLogFilter(event.target.value) }
                    onFocus={ event =>
                    {
                        if(state.logFilter.trim().toLowerCase() === 'filter message') state.setLogFilter('');
                        stopRoomInputPropagation(event);
                    } }
                    onClick={ stopRoomInputPropagation }
                    onKeyDown={ stopRoomInputPropagation }
                    onKeyUp={ stopRoomInputPropagation } />
                <WiredSelect
                    className="wired-tools-dropdown"
                    options={ [ 'All', 'System', 'Wired' ].map(value => ({ value, label: value })) }
                    value={ state.logSourceFilter }
                    onChange={ event => state.setLogSourceFilter(event.target.value) } />
                <WiredSelect
                    className="wired-tools-dropdown"
                    options={ [ 'All', 'INFO', 'WARN', 'ERROR', 'DEBUG' ].map(value => ({ value, label: value })) }
                    value={ state.logCategoryFilter }
                    onChange={ event => state.setLogCategoryFilter(event.target.value) } />
                <ToolCheckbox checked={ state.autoRefreshLogs } label="Auto Refresh" onChange={ state.setAutoRefreshLogs } />
            </div>
            <Table key={ tableKey } headers={ [ 'Timestamp', 'Source', 'Category', 'Message' ] }>
                { pageRows.map(row => <LogTableRow key={ row.type } row={ row } />) }
                { !pageRows.length &&
                    <tr className="wired-tools-empty-log-row">
                        <td colSpan={ 4 }><WiredButtonInfoText>No logs found for the current filters.</WiredButtonInfoText></td>
                    </tr> }
            </Table>
            <div className="wired-tools-pager">
                <WiredAdjustButton
                    direction="left"
                    disabled={ state.clampedLogPage <= 1 }
                    onClick={ () => state.setLogPage(page => Math.max(1, page - 1)) } />
                <WiredTextInput
                    bitmapAlign="center"
                    className="wired-tools-page-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    value={ state.clampedLogPage }
                    onChange={ event => state.setLogPage(Math.min(state.pageCount, Math.max(1, Number(event.target.value || 1)))) }
                    onClick={ stopRoomInputPropagation }
                    onKeyDown={ stopRoomInputPropagation }
                    onKeyUp={ stopRoomInputPropagation } />
                <span className="wired-tools-pager-total"><WiredButtonInfoText>{ `/ ${ state.pageCount } total pages` }</WiredButtonInfoText></span>
                <WiredAdjustButton
                    direction="right"
                    disabled={ state.clampedLogPage >= state.pageCount }
                    onClick={ () => state.setLogPage(page => Math.min(state.pageCount, page + 1)) } />
            </div>
        </div>
    );
});

const LogTableRow = memo<{ row: MonitorLog; }>(({ row }) => (
    <tr>
        <td><WiredButtonInfoText>{ row.latest }</WiredButtonInfoText></td>
        <td><WiredButtonInfoText>{ row.source }</WiredButtonInfoText></td>
        <td><span className={ `wired-tools-severity wired-tools-severity-${ row.category.toLowerCase() }` }><StrongText>{ row.category }</StrongText></span></td>
        <td className="wired-tools-log-message-cell">
            <WiredButtonInfoText>{ row.message }</WiredButtonInfoText>
        </td>
    </tr>
), (previous, next) =>
    previous.row.type === next.row.type &&
    previous.row.latest === next.row.latest &&
    previous.row.source === next.row.source &&
    previous.row.category === next.row.category &&
    previous.row.message === next.row.message);

const IconPicker = <T extends string>(props: {
    options: Array<{ key: T; label: string; iconClass: string; }>;
    value: T;
    onChange: (value: T) => void;
    variant?: 'variable' | 'tool';
}) =>
{
    const { options, value, onChange, variant = 'variable' } = props;

    return (
        <div className={ `wired-tools-icon-picker wired-tools-icon-picker-${ variant }` }>
            { options.map(option => (
                <button
                    key={ option.key }
                    className={ `wired-tools-icon-button ${ value === option.key ? 'is-active' : '' }` }
                    data-picker-type={ option.key }
                    data-variable-type={ variant === 'variable' ? option.key : undefined }
                    data-tool-type={ variant === 'tool' ? option.key : undefined }
                    title={ option.label }
                    type="button"
                    onClick={ () => onChange(option.key) }>
                    <span className={ `wired-tools-variable-icon ${ option.iconClass }` } />
                </button>
            )) }
        </div>
    );
};

const CheckboxList: FC<{ options: WiredPermissionOption[]; value: number; normalize: (value: number) => number; onChange: (value: number) => void; }> = ({ options, value, normalize, onChange }) =>
{
    return (
        <div className="wired-tools-checkbox-list">
            { options.map(option => (
                <ToolCheckbox
                    key={ option.key }
                    checked={ (value & option.key) === option.key }
                    label={ option.label }
                    onChange={ checked =>
                    {
                        const nextValue = checked ? (value | option.key) : (value & ~option.key);

                        onChange(normalize(nextValue));
                    } } />
            )) }
        </div>
    );
};

const PanelTitle: FC<{ title: string; }> = memo(({ title }) =>
    <BitmapText className="wired-tools-panel-title" font="il_heading_1" text={ title } scale={ 1 } />);

const ButtonText: FC<{ children: string; }> = memo(({ children }) =>
    <BitmapText className="wired-tools-button-text" font="il_link_strong" text={ children } scale={ 1 } />);

const StrongText: FC<{ children: string | number; }> = memo(({ children }) =>
    <BitmapText className="wired-tools-strong-text" font="il_link_strong" text={ String(children) } scale={ 1 } />);

const ToolCheckbox: FC<{ checked: boolean; label: string; onChange: (checked: boolean) => void; }> = memo(({ checked, label, onChange }) =>
{
    return (
        <button className="wired-tools-choice" type="button" onClick={ () => onChange(!checked) }>
            <img className="wired-tools-choice-icon" alt="" src={ wiredIconUrl(checked ? WiredIcon.checkboxSelected : WiredIcon.checkboxEmpty) } />
            <WiredButtonInfoText>{ label }</WiredButtonInfoText>
        </button>
    );
});

const Table: FC<{ headers: string[]; className?: string; children: ReactNode; }> = ({ headers, className = '', children }) =>
{
    return (
        <div className={ `wired-tools-table-wrap ${ className }`.trim() }>
            <table className="wired-tools-table">
                <thead>
                    <tr>
                        { headers.map(header => <th key={ header }><StrongText>{ header }</StrongText></th>) }
                    </tr>
                </thead>
                <tbody>
                    { children }
                </tbody>
            </table>
        </div>
    );
};
