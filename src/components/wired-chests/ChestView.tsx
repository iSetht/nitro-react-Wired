import { ItemDataStructure } from '@nitrots/nitro-renderer';
import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import bellIcon from '../../assets/images/wired/bell_icon.png';
import arrowRightAdjustIcon from '../../assets/images/wired/arrow_rightadjust_hover.png';
import coinChestFull from '../../assets/images/wired/coin_chest_full.png';
import coinChestNone from '../../assets/images/wired/coin_chest_none.png';
import chestCoinIcon from '../../assets/images/wired/chest_coin.png';
import gearIcon from '../../assets/images/wired/gear_icon.png';
import genericChestPayment from '../../assets/images/wired/generic_chest_payment.png';
import transactionCompleteIcon from '../../assets/images/wired/transaction_complete.png';
import transactionFailIcon from '../../assets/images/wired/transaction_fail.png';
import { ChestCloseComposer, ChestCoinBalanceEvent, ChestDepositAcceptComposer, ChestDepositCancelComposer, ChestDepositCancelledEvent, ChestDepositCompletedEvent, ChestDepositItemsComposer, ChestDepositStartedEvent, ChestDepositUpdateEvent, ChestFurniContentsEvent, ChestFurniContentsUpdateEvent, ChestNotificationEvent, ChestOpenEvent, ChestSaveSettingsComposer, ChestStartDepositComposer, ChestTransactionFailedEvent, ChestType, ChestWithdrawAllComposer, ChestWithdrawCoinsComposer, ChestWithdrawFurniComposer, CreateLinkEvent, GetRoomEngine, GetSessionDataManager, GroupItem, LocalizeText, NotificationBubbleType, parseTradeItems, ProductTypeEnum, RegisterChestMessages, SendMessageComposer } from '../../api';
import { AutoGrid, Base, BitmapText, Column, Flex, Grid, LayoutFurniImageView, LayoutGridItem, NitroCardContentView, NitroCardView } from '../../common';
import { useInventoryFurni, useMessageEvent, useNotification, useRoomSessionManagerEvent } from '../../hooks';
import { InventoryFurnitureSearchView } from '../inventory/views/furniture/InventoryFurnitureSearchView';
import { WiredButton, WiredButtonInfoText, WiredCheckbox, WiredControlTitle, WiredSelect, WiredTextInput, WiredTextarea } from '../wired/views/WiredControls';
import { WiredIcon, wiredIconUrl } from '../wired/views/WiredIcons';

interface ChestState
{
    id: number;
    type: ChestType;
    capacity: number;
    canWithdraw: boolean;
    canDeposit: boolean;
    canConfigure: boolean;
    allowOpen: boolean;
    allowDonate: boolean;
    defaultName: string;
    displayName: string;
    description: string;
    appearanceState: number;
    previewMode: number;
    previewAmount: number;
    locked: boolean;
    autoLock: boolean;
    notificationSettings: boolean[];
}

interface DepositState
{
    active: boolean;
    chestId: number;
    type: ChestType;
    timeoutSeconds: number;
    contractType: string;
    contractData: DepositContractData;
    accepted: boolean;
    canConfirm: boolean;
    itemCount: number;
    credits: number;
    items: ItemDataStructure[];
    multiplier: number;
    autoMultiplier: boolean;
}

interface DepositContractElement
{
    type: number;
    amount: number;
    furniCode?: string;
    furniName?: string;
    spriteId?: number;
    productType?: string;
}

interface DepositContractData
{
    paymentMode: number;
    receiveText: string;
    paymentOptions: DepositContractElement[][];
    rewards: DepositContractElement[];
}

interface SettingsDraft
{
    allowOpen: boolean;
    allowDonate: boolean;
    displayName: string;
    description: string;
    appearanceState: number;
    previewMode: number;
    previewAmount: number;
    capacity: number;
    locked: boolean;
    autoLock: boolean;
    notificationSettings: boolean[];
}

const EMPTY_DEPOSIT: DepositState = {
    active: false,
    chestId: 0,
    type: ChestType.FURNI,
    timeoutSeconds: 0,
    contractType: '',
    contractData: { paymentMode: 0, receiveText: '', paymentOptions: [ [] ], rewards: [] },
    accepted: false,
    canConfirm: false,
    itemCount: 0,
    credits: 0,
    items: [],
    multiplier: 1,
    autoMultiplier: false
};

const WALLET_ICON = 'http://localhost/nitro-assets/images/wallet/-1.png';
const PAYMENT_MODE_ANYTHING = 0;
const PAYMENT_MODE_SPECIFIC = 1;
const CONTRACT_ELEMENT_CREDITS = 0;
const CONTRACT_ELEMENT_FURNI = 1;
const CHEST_DEBUG_KEY = 'nitro.wiredChests.debug';
const DEFAULT_CHEST_NOTIFICATION_CHECKS = [ true, true, true, true, true ];

const toGroups = (items: ItemDataStructure[]): GroupItem[] => parseTradeItems(items || []).getValues();

const clampElementAmount = (amount: number) => Math.max(1, Math.min(999999, Math.floor(Number.isFinite(amount) ? amount : 1)));

const normalizeDepositElement = (element: Partial<DepositContractElement> = {}): DepositContractElement =>
{
    const type = element.type === CONTRACT_ELEMENT_FURNI ? CONTRACT_ELEMENT_FURNI : CONTRACT_ELEMENT_CREDITS;

    if(type === CONTRACT_ELEMENT_CREDITS)
    {
        return {
            type,
            amount: clampElementAmount(element.amount)
        };
    }

    return {
        type,
        amount: clampElementAmount(element.amount),
        furniCode: element.furniCode || '',
        furniName: element.furniName || element.furniCode || '',
        spriteId: element.spriteId || 0,
        productType: element.productType || 'floor'
    };
}

const normalizeDepositElements = (elements: DepositContractElement[] = []) =>
    (Array.isArray(elements) ? elements : [])
        .filter(element => !!element)
        .map(normalizeDepositElement)
        .filter(element => element.type === CONTRACT_ELEMENT_CREDITS || !!element.furniCode);

const normalizeDepositOptions = (options: DepositContractElement[][] = []) =>
{
    const normalized = (Array.isArray(options) ? options : []).map(option => normalizeDepositElements(option));

    return normalized.length ? normalized : [ [] ];
}

const parseDepositContractData = (value: string): DepositContractData =>
{
    try
    {
        const data = JSON.parse(value || '{}');

        return {
            paymentMode: data?.paymentMode === PAYMENT_MODE_SPECIFIC ? PAYMENT_MODE_SPECIFIC : PAYMENT_MODE_ANYTHING,
            receiveText: data?.receiveText || '',
            paymentOptions: normalizeDepositOptions(data?.paymentOptions),
            rewards: normalizeDepositElements(data?.rewards)
        };
    }
    catch
    {
        return { paymentMode: PAYMENT_MODE_ANYTHING, receiveText: '', paymentOptions: [ [] ], rewards: [] };
    }
}

const debugChest = (message: string, data?: unknown) =>
{
    try
    {
        if(window?.localStorage?.getItem(CHEST_DEBUG_KEY) !== '1') return;
    }
    catch
    {
        return;
    }

    console.debug(`[wired-chests] ${ message }`, data);
}

const furniIconUrl = (productType: string, spriteId: number) =>
    productType === 'wall'
        ? GetRoomEngine().getFurnitureWallIconUrl(spriteId)
        : GetRoomEngine().getFurnitureFloorIconUrl(spriteId);

const getClassName = (item: { isWallItem: boolean, type: number }) =>
{
    const data = item.isWallItem ? GetSessionDataManager().getWallItemData(item.type) : GetSessionDataManager().getFloorItemData(item.type);

    return (data?.className || '').toUpperCase();
}

const isCreditFurni = (item: { isWallItem: boolean, type: number }) =>
{
    const className = getClassName(item);

    return className.startsWith('CF_') || className.startsWith('CFC_');
}

const isStorageChest = (item: { isWallItem: boolean, type: number }) => getClassName(item).startsWith('WF_STORAGE_');

const text = (key: string, fallback: string, placeholders: string[] = [], replacements: string[] = []) =>
{
    const value = LocalizeText(key, placeholders, replacements);
    let result = (!value || value === key) ? fallback : value;

    placeholders.forEach((placeholder, index) =>
    {
        result = result.split(`%${ placeholder }%`).join(replacements[index] ?? '');
    });

    return result;
}

const lineText = (value: string) => (value || '').replace(/\\n/g, '\n');

const getGroupExtraData = (group: GroupItem) => (group?.stuffData?.getLegacyString?.() || group?.extra?.toString?.() || '');

const FurniRender: FC<{ group: GroupItem, scale?: number }> = props =>
{
    const { group = null, scale = 1 } = props;

    if(!group) return null;

    return <LayoutFurniImageView productType={ group.isWallItem ? ProductTypeEnum.WALL : ProductTypeEnum.FLOOR } productClassId={ group.type } extraData={ getGroupExtraData(group) } scale={ scale } />;
}

const ChestWindowHeader: FC<{ title: string, onClose: () => void }> = props =>
(
    <div className="wired-tools-window-top wired-tools-drag-area">
        <BitmapText className="wired-tools-window-title" font="il_heading_1" text={ props.title } scale={ 1 } />
        <button className="nw-btn nw-btn-close" type="button" onClick={ props.onClose } />
    </div>
);

const ChestLabel: FC<{ children: any }> = props => <WiredButtonInfoText>{ props.children }</WiredButtonInfoText>;
const ChestPlainText: FC<{ children: any, className?: string }> = props => <span className={ `chest-plain-text ${ props.className || '' }`.trim() }>{ props.children }</span>;

const formatCompactCoins = (value: number, suffix: string) =>
{
    const compact = (value % 1 === 0) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');

    return `${ compact }${ suffix }`;
}

const formatCoins = (coins: number) =>
{
    if(coins < 10000) return coins.toLocaleString('en-US');
    if(coins < 1000000) return formatCompactCoins(coins / 1000, 'k');

    return formatCompactCoins(coins / 1000000, 'm');
}

export const ChestView: FC<{}> = () =>
{
    RegisterChestMessages();

    const [ chest, setChest ] = useState<ChestState>(null);
    const chestIdRef = useRef(0);
    const [ coins, setCoins ] = useState(0);
    const [ coinAmount, setCoinAmount ] = useState(1);
    const [ storedItems, setStoredItems ] = useState<ItemDataStructure[]>([]);
    const [ selectedStoredGroup, setSelectedStoredGroup ] = useState<GroupItem>(null);
    const [ withdrawAmount, setWithdrawAmount ] = useState(1);
    const [ deposit, setDeposit ] = useState<DepositState>(EMPTY_DEPOSIT);
    const [ depositGroup, setDepositGroup ] = useState<GroupItem>(null);
    const [ filteredInventoryGroups, setFilteredInventoryGroups ] = useState<GroupItem[]>([]);
    const [ depositQuantity, setDepositQuantity ] = useState(1);
    const [ settingsOpen, setSettingsOpen ] = useState(false);
    const [ notificationsOpen, setNotificationsOpen ] = useState(false);
    const [ withdrawConfirmOpen, setWithdrawConfirmOpen ] = useState(false);
    const [ notificationInfoOpen, setNotificationInfoOpen ] = useState(true);
    const [ settingsDraft, setSettingsDraft ] = useState<SettingsDraft>(null);
    const { groupItems = [], setGroupItems = null, activate = null, deactivate = null } = useInventoryFurni();
    const { showSingleBubble = null, showChestBubble = null } = useNotification();

    const storedGroups = useMemo(() => toGroups(storedItems), [ storedItems ]);
    const depositGroups = useMemo(() => toGroups(deposit.items), [ deposit.items ]);
    const stagedItemIds = useMemo(() => deposit.items.map(item => item.ref), [ deposit.items ]);
    const usedCapacity = chest?.type === ChestType.COINS ? coins : storedItems.length;
    const chestTitle = chest?.displayName || (chest?.type === ChestType.COINS ? 'Credit Chest' : 'Furni Chest');
    const chestDescription = lineText(chest?.description || (chest?.type === ChestType.COINS ? 'Certified 100% scam-free. Probably.' : ''));
    const notificationChecks = chest?.notificationSettings || DEFAULT_CHEST_NOTIFICATION_CHECKS;

    const closeChest = () =>
    {
        if(chest) SendMessageComposer(new ChestCloseComposer(chest.id));

        setChest(null);
        setStoredItems([]);
        setDeposit(EMPTY_DEPOSIT);
        setSettingsOpen(false);
        setNotificationsOpen(false);
        setWithdrawConfirmOpen(false);
    }

    useEffect(() =>
    {
        chestIdRef.current = chest?.id || 0;
    }, [ chest?.id ]);

    const closeDeposit = () =>
    {
        if(deposit.active) SendMessageComposer(new ChestDepositCancelComposer(0));

        setDeposit(EMPTY_DEPOSIT);
        resetDepositSelection();
    }

    const updateAmount = (value: number, setter: (value: number) => void, max: number) =>
    {
        if(isNaN(Number(value)) || value < 1) value = 1;

        setter(Math.min(Math.max(1, Number(value)), Math.max(1, max)));
    }

    const canDepositItem = (group: { isWallItem: boolean, type: number }) =>
    {
        if(!group) return false;

        if(deposit.active && deposit.contractType)
        {
            const paymentOptions = deposit.contractData.paymentMode === PAYMENT_MODE_ANYTHING ? [ [] ] : normalizeDepositOptions(deposit.contractData.paymentOptions);
            const acceptsAnything = paymentOptions.some(option => !option.length);
            const acceptsCredits = acceptsAnything || paymentOptions.some(option => option.some(element => element.type === CONTRACT_ELEMENT_CREDITS));
            const acceptsFurni = acceptsAnything || paymentOptions.some(option => option.some(element => element.type !== CONTRACT_ELEMENT_CREDITS));

            return isCreditFurni(group) ? acceptsCredits : acceptsFurni && !isStorageChest(group);
        }

        if(deposit.type === ChestType.COINS) return isCreditFurni(group);

        return !isCreditFurni(group) && !isStorageChest(group);
    }

    const offerDepositItems = (count: number) =>
    {
        if(!depositGroup || !canDepositItem(depositGroup)) return;

        const items = depositGroup.getTradeItems(count).filter(item =>
        {
            if(deposit.active && deposit.contractType) return canDepositItem(item);

            if(deposit.type === ChestType.COINS) return isCreditFurni(item);

            return !isCreditFurni(item) && !isStorageChest(item);
        });

        if(!items.length) return;

        SendMessageComposer(new ChestDepositItemsComposer(false, items.map(item => item.id)));
    }

    const removeDepositItems = (group: GroupItem) =>
    {
        const item = group?.getLastItem();

        if(!item) return;

        SendMessageComposer(new ChestDepositItemsComposer(true, [ item.id ]));
    }

    const withdrawSelectedGroup = () =>
    {
        if(!chest || !selectedStoredGroup) return;

        SendMessageComposer(new ChestWithdrawFurniComposer(
            chest.id,
            selectedStoredGroup.isWallItem,
            selectedStoredGroup.type,
            selectedStoredGroup.stuffData?.getLegacyString?.() || '',
            withdrawAmount
        ));
    }

    const withdrawAll = () =>
    {
        if(!chest || !chest.canWithdraw) return;

        setWithdrawConfirmOpen(true);
    }

    const confirmWithdrawAll = () =>
    {
        if(chest) SendMessageComposer(new ChestWithdrawAllComposer(chest.id));

        setWithdrawConfirmOpen(false);
    }

    const startDeposit = () =>
    {
        if(chest?.canDeposit) SendMessageComposer(new ChestStartDepositComposer(chest.id));
    }

    const openSettings = () =>
    {
        if(!chest?.canConfigure) return;

        setSettingsDraft({
            allowOpen: chest.allowOpen,
            allowDonate: chest.allowDonate,
            displayName: chest.displayName,
            description: chest.description,
            appearanceState: chest.appearanceState,
            previewMode: chest.previewMode,
            previewAmount: chest.previewAmount,
            capacity: chest.capacity,
            locked: chest.locked,
            autoLock: chest.autoLock,
            notificationSettings: chest.notificationSettings || DEFAULT_CHEST_NOTIFICATION_CHECKS
        });
        setSettingsOpen(true);
    }

    const saveSettings = () =>
    {
        if(!chest || !settingsDraft) return;

        SendMessageComposer(new ChestSaveSettingsComposer(chest.id, settingsDraft.allowOpen, settingsDraft.allowDonate, settingsDraft.displayName, settingsDraft.description, settingsDraft.appearanceState, settingsDraft.previewMode, settingsDraft.previewAmount, settingsDraft.capacity, settingsDraft.locked, settingsDraft.autoLock, settingsDraft.notificationSettings));
        setChest(prev => prev ? { ...prev, ...settingsDraft } : prev);
        setSettingsOpen(false);
    }

    const saveCoinCapacity = (capacity: number) =>
    {
        if(!chest?.canConfigure) return;

        SendMessageComposer(new ChestSaveSettingsComposer(chest.id, chest.allowOpen, chest.allowDonate, chest.displayName, chest.description, chest.appearanceState, chest.previewMode, chest.previewAmount, capacity, chest.locked, chest.autoLock, chest.notificationSettings));
    }

    const saveLockSettings = (locked: boolean, autoLock: boolean) =>
    {
        if(!chest?.canConfigure) return;

        SendMessageComposer(new ChestSaveSettingsComposer(chest.id, chest.allowOpen, chest.allowDonate, chest.displayName, chest.description, chest.appearanceState, chest.previewMode, chest.previewAmount, chest.capacity, locked, autoLock, chest.notificationSettings));
        setChest(prev => prev ? { ...prev, locked, autoLock } : prev);
    }

    const saveNotificationSettings = (checks: boolean[]) =>
    {
        if(!chest?.canConfigure) return;

        const notificationSettings = DEFAULT_CHEST_NOTIFICATION_CHECKS.map((value, index) => checks[index] ?? value);

        SendMessageComposer(new ChestSaveSettingsComposer(chest.id, chest.allowOpen, chest.allowDonate, chest.displayName, chest.description, chest.appearanceState, chest.previewMode, chest.previewAmount, chest.capacity, chest.locked, chest.autoLock, notificationSettings));
        setChest(prev => prev ? { ...prev, notificationSettings } : prev);
    }

    const openChestLogs = () =>
    {
        CreateLinkEvent('wired-tools/tab/chests');
        CreateLinkEvent('wired-tools/chest-logs');
    }

    const resetDepositSelection = () =>
    {
        setDepositGroup(null);
        setFilteredInventoryGroups([]);
        setDepositQuantity(1);
    }

    useMessageEvent<ChestOpenEvent>(ChestOpenEvent, event =>
    {
        const parser = event.getParser();

        setChest(prev =>
        {
            if(prev && prev.id !== parser.chestId) SendMessageComposer(new ChestCloseComposer(prev.id));

            return {
            id: parser.chestId,
            type: parser.chestType,
            capacity: parser.capacity,
            canWithdraw: parser.canWithdraw,
            canDeposit: parser.canDeposit,
            canConfigure: parser.canConfigure,
            allowOpen: parser.allowOpen,
            allowDonate: parser.allowDonate,
            defaultName: parser.defaultName,
            displayName: parser.displayName,
            description: parser.description,
            appearanceState: parser.appearanceState,
            previewMode: parser.previewMode,
            previewAmount: parser.previewAmount,
            locked: parser.locked,
            autoLock: parser.autoLock,
            notificationSettings: parser.notificationSettings
            };
        });
        const isSameChestRefresh = chestIdRef.current === parser.chestId;

        setStoredItems(prev => isSameChestRefresh ? prev : []);
        setCoins(prev => isSameChestRefresh ? prev : 0);
        setDeposit(EMPTY_DEPOSIT);
        resetDepositSelection();
    });

    useMessageEvent<ChestFurniContentsEvent>(ChestFurniContentsEvent, event =>
    {
        const parser = event.getParser();

        if(!chest || parser.chestId === chest.id) setStoredItems(parser.items);
    });

    useMessageEvent<ChestFurniContentsUpdateEvent>(ChestFurniContentsUpdateEvent, event =>
    {
        const parser = event.getParser();

        setStoredItems(prevValue =>
        {
            const removed = new Set(parser.removedIds);
            const next = prevValue.filter(item => !removed.has(item.itemId));

            next.push(...parser.addedItems);

            return next;
        });
    });

    useMessageEvent<ChestCoinBalanceEvent>(ChestCoinBalanceEvent, event =>
    {
        const parser = event.getParser();

        setCoins(parser.coins);
        setCoinAmount(prevValue => Math.min(Math.max(1, prevValue), Math.max(1, parser.coins)));
    });

    useMessageEvent<ChestDepositStartedEvent>(ChestDepositStartedEvent, event =>
    {
        const parser = event.getParser();
        const contractData = parseDepositContractData(parser.contractDataJson);

        debugChest('deposit started', {
            chestId: parser.chestId,
            chestType: parser.chestType,
            timeoutSeconds: parser.timeoutSeconds,
            contractType: parser.contractType,
            contractData
        });

        setDeposit({
            active: true,
            chestId: parser.chestId,
            type: parser.chestType,
            timeoutSeconds: parser.timeoutSeconds,
            contractType: parser.contractType || '',
            contractData,
            accepted: false,
            canConfirm: false,
            itemCount: 0,
            credits: 0,
            items: [],
            multiplier: parser.multiplier,
            autoMultiplier: parser.autoMultiplier
        });
        resetDepositSelection();
    });

    useMessageEvent<ChestDepositUpdateEvent>(ChestDepositUpdateEvent, event =>
    {
        const parser = event.getParser();

        debugChest('deposit update', {
            chestId: parser.chestId,
            chestType: parser.chestType,
            accepted: parser.accepted,
            canConfirm: parser.canConfirm,
            itemCount: parser.itemCount,
            credits: parser.credits,
            items: parser.items.length
        });

        setDeposit(prev => ({
            active: true,
            chestId: parser.chestId,
            type: parser.chestType,
            timeoutSeconds: prev.timeoutSeconds,
            contractType: prev.contractType,
            contractData: prev.contractData,
            accepted: parser.accepted,
            canConfirm: parser.canConfirm,
            itemCount: parser.itemCount,
            credits: parser.credits,
            items: parser.items,
            multiplier: prev.multiplier,
            autoMultiplier: prev.autoMultiplier
        }));
    });

    useMessageEvent<ChestTransactionFailedEvent>(ChestTransactionFailedEvent, event =>
    {
        const parser = event.getParser();
        const message = text(parser.localizationKey, parser.message || 'Transaction failed.');

        if(showSingleBubble) showSingleBubble(message, NotificationBubbleType.INFO, transactionFailIcon);
    });

    useMessageEvent<ChestNotificationEvent>(ChestNotificationEvent, event =>
    {
        const parser = event.getParser();

        showChestBubble?.({
            key: parser.key,
            kind: parser.kind,
            active: parser.active,
            persistent: parser.persistent,
            timeoutMs: parser.timeoutMs,
            chestId: parser.chestId,
            roomId: parser.roomId,
            userId: parser.userId,
            username: parser.username,
            chestTypes: parser.chestTypes,
            furniCount: parser.furniCount,
            coinCount: parser.coinCount,
            message: lineText(parser.message)
        });
    });

    useMessageEvent<ChestDepositCancelledEvent>(ChestDepositCancelledEvent, event =>
    {
        debugChest('deposit cancelled', { reason: event.getParser().reason });
        setDeposit(EMPTY_DEPOSIT);
        resetDepositSelection();
    });
    useMessageEvent<ChestDepositCompletedEvent>(ChestDepositCompletedEvent, event =>
    {
        debugChest('deposit completed', { chestId: event.getParser().chestId });
        setDeposit(EMPTY_DEPOSIT);
        resetDepositSelection();
    });

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, event =>
    {
        setChest(null);
        setStoredItems([]);
        setDeposit(EMPTY_DEPOSIT);
        setSettingsOpen(false);
        setNotificationsOpen(false);
        setWithdrawConfirmOpen(false);
        resetDepositSelection();
    });

    useEffect(() =>
    {
        if(!deposit.active || deposit.timeoutSeconds <= 0) return;

        const timeout = window.setTimeout(() =>
        {
            SendMessageComposer(new ChestDepositCancelComposer(2));
            setDeposit(EMPTY_DEPOSIT);
            resetDepositSelection();
        }, deposit.timeoutSeconds * 1000);

        return () => window.clearTimeout(timeout);
    }, [ deposit.active, deposit.chestId, deposit.timeoutSeconds ]);

    useEffect(() =>
    {
        if(!deposit.active || !activate || !deactivate) return;

        const id = activate();

        return () => deactivate(id);
    }, [ deposit.active, activate, deactivate ]);

    useEffect(() =>
    {
        if(!setGroupItems) return;

        setGroupItems(prevValue =>
        {
            return prevValue.map(group =>
            {
                const clone = group.clone();

                if(deposit.active) clone.lockItemIds(stagedItemIds);
                else clone.unlockAllItems();

                return clone;
            });
        });
    }, [ deposit.active, stagedItemIds.join(','), setGroupItems ]);

    useEffect(() =>
    {
        setSelectedStoredGroup(prevValue =>
        {
            if(prevValue && storedGroups.indexOf(prevValue) >= 0) return prevValue;

            return storedGroups[0] || null;
        });
    }, [ storedGroups ]);

    useEffect(() =>
    {
        setWithdrawAmount(prev => Math.min(Math.max(1, prev), Math.max(1, selectedStoredGroup?.getTotalCount() || 1)));
    }, [ selectedStoredGroup ]);

    if(!chest && !deposit.active) return null;

    return (
        <>
            { chest && <NitroCardView uniqueKey="wired-chest" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-chest', chest.type === ChestType.COINS ? 'is-coin-chest' : 'is-furni-chest' ] }>
                <ChestWindowHeader title={ chestTitle } onClose={ closeChest } />
                <NitroCardContentView classNames={ [ 'wired-tools-content', 'chest-window-content' ] } gap={ 0 }>
                    <Flex className="chest-description-strip" alignItems="center" justifyContent="between">
                        <ChestPlainText className="chest-description-text">{ chestDescription }</ChestPlainText>
                        <Flex gap={ 1 } alignItems="center">
                            <button className="chest-icon-button" type="button" onClick={ () => setNotificationsOpen(true) } title="Notifications">
                                <img src={ bellIcon } />
                            </button>
                            <button className="chest-icon-button" type="button" disabled={ !chest.canConfigure } onClick={ openSettings } title="Settings">
                                <img src={ gearIcon } />
                            </button>
                        </Flex>
                    </Flex>

                    { chest.type === ChestType.FURNI &&
                        <>
                            <Grid fullHeight={ false } overflow="hidden" className="chest-furni-body">
                                <Column size={ 7 } overflow="hidden" className="chest-furni-grid-wrap">
                                    <AutoGrid columnCount={ 5 } className="chest-furni-grid">
                                        { storedGroups.map((group, index) =>
                                            <LayoutGridItem key={ index } itemImage={ group.iconUrl } itemCount={ group.getTotalCount() } itemActive={ selectedStoredGroup === group } itemUniqueNumber={ group.stuffData?.uniqueNumber } onClick={ () => setSelectedStoredGroup(group) } />) }
                                    </AutoGrid>
                                </Column>
                                <Column size={ 5 } className="chest-selected-preview">
                                    { selectedStoredGroup && <WiredControlTitle>{ selectedStoredGroup.name }</WiredControlTitle> }
                                    <Base className="chest-preview-image">
                                        <FurniRender group={ selectedStoredGroup } />
                                    </Base>
                                    <Flex gap={ 1 } alignItems="center" justifyContent="end">
                                        <WiredTextInput compact bitmapAlign="center" type="number" min={ 1 } max={ selectedStoredGroup?.getTotalCount() || 1 } value={ withdrawAmount } disabled={ !selectedStoredGroup || !chest.canWithdraw } onChange={ event => updateAmount(event.target.valueAsNumber, setWithdrawAmount, selectedStoredGroup?.getTotalCount() || 1) } />
                                        <WiredButton disabled={ !selectedStoredGroup || !chest.canWithdraw } onClick={ withdrawSelectedGroup }>{ text('wiredchests.withdraw', 'Withdraw') }</WiredButton>
                                    </Flex>
                                </Column>
                            </Grid>
                            <ChestFooter used={ usedCapacity } capacity={ chest.capacity } canConfigure={ chest.canConfigure } locked={ chest.locked } autoLock={ chest.autoLock } onLockChange={ saveLockSettings } canWithdraw={ chest.canWithdraw && !!storedItems.length } canDeposit={ chest.canDeposit } onWithdrawAll={ withdrawAll } onStartDeposit={ startDeposit } onViewLogs={ openChestLogs } />
                        </> }

                    { chest.type === ChestType.COINS &&
                        <>
                            <Base className="chest-coin-body">
                                <img className="chest-coin-art" src={ coins > 0 ? coinChestFull : coinChestNone } />
                                <div className="chest-balance-note">
                                    <ChestLabel>Balance:</ChestLabel>
                                    <Flex center gap={ 1 }>
                                        <ChestLabel>{ formatCoins(coins) }</ChestLabel>
                                        <img src={ WALLET_ICON } />
                                    </Flex>
                                </div>
                                <Flex className="chest-coin-withdraw" gap={ 1 }>
                                    <WiredTextInput className="coin-withdraw-input" compact bitmapAlign="center" type="number" min={ 1 } max={ Math.max(1, coins) } value={ coinAmount } disabled={ !chest.canWithdraw || !coins } onChange={ event => updateAmount(event.target.valueAsNumber, setCoinAmount, coins) } />
                                    <WiredButton className="coin-withdraw-button" disabled={ !chest.canWithdraw || !coins } onClick={ () => SendMessageComposer(new ChestWithdrawCoinsComposer(chest.id, coinAmount)) }>{ text('wiredchests.withdraw', 'Withdraw') }</WiredButton>
                                </Flex>
                            </Base>
                            <CoinFooter capacity={ chest.capacity } canConfigure={ chest.canConfigure } locked={ chest.locked } autoLock={ chest.autoLock } onLockChange={ saveLockSettings } setCapacity={ value => setChest(prev => prev ? { ...prev, capacity: value } : prev) } saveCapacity={ saveCoinCapacity } canWithdraw={ chest.canWithdraw && coins > 0 } canDeposit={ chest.canDeposit } onWithdrawAll={ withdrawAll } onStartDeposit={ startDeposit } onViewLogs={ openChestLogs } />
                        </> }
                </NitroCardContentView>
            </NitroCardView> }

            { deposit.active && <DepositWindow deposit={ deposit } depositGroups={ depositGroups } groupItems={ groupItems } filteredInventoryGroups={ filteredInventoryGroups } depositGroup={ depositGroup } depositQuantity={ depositQuantity } canDepositItem={ canDepositItem } setFilteredInventoryGroups={ setFilteredInventoryGroups } setDepositGroup={ setDepositGroup } setDepositQuantity={ setDepositQuantity } offerDepositItems={ offerDepositItems } removeDepositItems={ removeDepositItems } updateAmount={ updateAmount } closeDeposit={ closeDeposit } /> }
            { chest && notificationsOpen && <NotificationSettings notificationInfoOpen={ notificationInfoOpen } setNotificationInfoOpen={ setNotificationInfoOpen } notificationChecks={ notificationChecks } onSave={ saveNotificationSettings } onClose={ () => setNotificationsOpen(false) } /> }
            { chest && settingsOpen && settingsDraft && <GeneralSettings draft={ settingsDraft } chestType={ chest.type } setDraft={ setSettingsDraft } onSave={ saveSettings } onClose={ () => setSettingsOpen(false) } /> }
            { chest && withdrawConfirmOpen && <ChestConfirmDialog title={ text('wiredchests.withdraw_all.confirm.title', 'Withdraw all') } message={ text('wiredchests.withdraw_all.confirm.desc', 'Are you sure you want to withdraw all contents from this chest?') } confirmText={ LocalizeText('generic.ok') } cancelText={ LocalizeText('generic.cancel') } onConfirm={ confirmWithdrawAll } onClose={ () => setWithdrawConfirmOpen(false) } /> }
        </>
    );
}

const ChestFooter: FC<{ used: number, capacity: number, canConfigure: boolean, locked: boolean, autoLock: boolean, onLockChange: (locked: boolean, autoLock: boolean) => void, canWithdraw: boolean, canDeposit: boolean, onWithdrawAll: () => void, onStartDeposit: () => void, onViewLogs: () => void }> = props =>
{
    return (
        <Column className="chest-footer" gap={ 1 }>
            <ChestLockControls locked={ props.locked } autoLock={ props.autoLock } disabled={ !props.canConfigure } onChange={ props.onLockChange } />
            <ChestLabel>{ text('wiredchests.space_used', `Used capacity: ${ props.used }/${ props.capacity }`, [ 'count', 'total' ], [ props.used.toString(), props.capacity.toString() ]) }</ChestLabel>
            <Base className="chest-footer-divider" />
            <Flex className="chest-footer-actions" justifyContent="between" alignItems="center">
                <Flex gap={ 2 }>
                    <WiredButton disabled={ !props.canWithdraw } onClick={ props.onWithdrawAll }>{ text('wiredchests.withdraw_all.confirm.title', 'Withdraw all') }</WiredButton>
                    <WiredButton disabled={ !props.canDeposit } onClick={ props.onStartDeposit }>{ text('wiredchests.start_deposit', 'Start deposit') }</WiredButton>
                </Flex>
                <WiredButton onClick={ props.onViewLogs }>{ text('wiredchests.view_logs', 'View logs') }</WiredButton>
            </Flex>
        </Column>
    );
}

const CoinFooter: FC<{ capacity: number, canConfigure: boolean, locked: boolean, autoLock: boolean, onLockChange: (locked: boolean, autoLock: boolean) => void, setCapacity: (value: number) => void, saveCapacity: (value: number) => void, canWithdraw: boolean, canDeposit: boolean, onWithdrawAll: () => void, onStartDeposit: () => void, onViewLogs: () => void }> = props =>
{
    const [ capacityDraft, setCapacityDraft ] = useState(props.capacity.toString());

    useEffect(() =>
    {
        setCapacityDraft(props.capacity.toString());
    }, [ props.capacity ]);

    const commitCapacity = () =>
    {
        const parsed = Number(capacityDraft);

        if(!Number.isFinite(parsed) || parsed < 1)
        {
            setCapacityDraft(props.capacity.toString());
            return;
        }

        const capacity = Math.floor(parsed);
        if(capacity === props.capacity)
        {
            setCapacityDraft(props.capacity.toString());
            return;
        }

        props.setCapacity(capacity);
        props.saveCapacity(capacity);
    }

    return (
        <Column className="chest-footer" gap={ 2 }>
            <ChestLockControls locked={ props.locked } autoLock={ props.autoLock } disabled={ !props.canConfigure } onChange={ props.onLockChange } />
            <Flex alignItems="center" gap={ 2 }>
                <ChestLabel>{ text('wiredchests.capacity_info.title', 'Chest capacity:') }</ChestLabel>
                <WiredTextInput className="chest-number-wide" compact bitmapAlign="center" type="number" min={ 1 } value={ capacityDraft } disabled={ !props.canConfigure } onChange={ event => setCapacityDraft(event.target.value) } onBlur={ commitCapacity } />
            </Flex>
            <Base className="chest-footer-divider" />
            <Flex className="chest-footer-actions" justifyContent="between" alignItems="center">
                <Flex gap={ 2 }>
                    <WiredButton disabled={ !props.canWithdraw } onClick={ props.onWithdrawAll }>{ text('wiredchests.withdraw_all.confirm.title', 'Withdraw all') }</WiredButton>
                    <WiredButton disabled={ !props.canDeposit } onClick={ props.onStartDeposit }>{ text('wiredchests.start_deposit', 'Start deposit') }</WiredButton>
                </Flex>
                <WiredButton onClick={ props.onViewLogs }>{ text('wiredchests.view_logs', 'View logs') }</WiredButton>
            </Flex>
        </Column>
    );
}

const ChestLockControls: FC<{ locked: boolean, autoLock: boolean, disabled: boolean, onChange: (locked: boolean, autoLock: boolean) => void }> = props =>
{
    return (
        <Column gap={ 1 } className="chest-lock-controls">
            <WiredCheckbox checked={ props.locked } disabled={ props.disabled } onChange={ checked => props.onChange(checked, props.autoLock) } label={ text('wiredchests.lock_chest', 'Lock this chest') } />
            <WiredCheckbox checked={ props.autoLock } disabled={ props.disabled } onChange={ checked => props.onChange(props.locked, checked) } label={ text('wiredchests.auto_lock_chest', 'Auto lock chest when chest owner leaves room') } />
        </Column>
    );
}

const ChestConfirmDialog: FC<{ title: string, message: string, confirmText: string, cancelText: string, onConfirm: () => void, onClose: () => void }> = props =>
{
    return (
        <NitroCardView uniqueKey="wired-chest-confirm" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-chest-dialog', 'confirm' ] }>
            <ChestWindowHeader title={ props.title } onClose={ props.onClose } />
            <NitroCardContentView classNames={ [ 'wired-tools-content', 'chest-dialog-content' ] } gap={ 2 }>
                <Base className="dialog-panel">
                    <ChestPlainText>{ props.message }</ChestPlainText>
                </Base>
                <Flex className="dialog-actions" gap={ 2 }>
                    <WiredButton className="is-danger" onClick={ props.onClose }>{ props.cancelText }</WiredButton>
                    <WiredButton onClick={ props.onConfirm }>{ props.confirmText }</WiredButton>
                </Flex>
            </NitroCardContentView>
        </NitroCardView>
    );
}

const DepositPaymentGrid: FC<{ depositGroups: GroupItem[], removeDepositItems: (group: GroupItem) => void }> = props =>
{
    return (
        <Base className="deposit-offer-grid">
            { [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ].map(index =>
            {
                const group = props.depositGroups[index];

                return group
                    ? <LayoutGridItem key={ index } itemImage={ group.iconUrl } itemCount={ group.getTotalCount() } itemUniqueNumber={ group.stuffData?.uniqueNumber } onClick={ () => props.removeDepositItems(group) } />
                    : <Base key={ index } className="deposit-empty-slot" />;
            }) }
        </Base>
    );
}

const DepositWindow: FC<any> = props =>
{
    const { deposit, depositGroups, groupItems, filteredInventoryGroups, depositGroup, depositQuantity, canDepositItem, setFilteredInventoryGroups, setDepositGroup, setDepositQuantity, offerDepositItems, removeDepositItems, updateAmount, closeDeposit } = props;
    const [ countdownTick, setCountdownTick ] = useState<number>(null);

    useEffect(() =>
    {
        if(!deposit.accepted)
        {
            setCountdownTick(null);
            return;
        }

        setCountdownTick(3);

        const interval = setInterval(() =>
        {
            setCountdownTick(prevValue =>
            {
                const newValue = (prevValue - 1);

                if(newValue === 0) clearInterval(interval);

                return newValue;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [ deposit.accepted ]);

    return (
        <NitroCardView uniqueKey="wired-chest-deposit" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-chest-deposit' ] }>
            <ChestWindowHeader title="Inventory" onClose={ closeDeposit } />
            <NitroCardContentView classNames={ [ 'wired-tools-content', 'deposit-window-content' ] } gap={ 1 }>
                <Base className="deposit-main">
                    <Column overflow="hidden" className="deposit-inventory-panel">
                        <InventoryFurnitureSearchView groupItems={ groupItems.filter(canDepositItem) } setGroupItems={ setFilteredInventoryGroups } />
                        <Base className="deposit-inventory-grid">
                            { filteredInventoryGroups.map((group, index) =>
                            {
                                const count = group.getUnlockedCount();

                                return <LayoutGridItem key={ index } className={ !count ? 'opacity-0-5' : '' } itemImage={ group.iconUrl } itemCount={ count } itemActive={ depositGroup === group } itemUniqueNumber={ group.stuffData?.uniqueNumber } onClick={ () => count && setDepositGroup(group) } onDoubleClick={ () => offerDepositItems(1) } />;
                            }) }
                        </Base>
                    </Column>
                    <Column className="deposit-selected-side">
                        <Base className="deposit-selected-preview">
                            <FurniRender group={ depositGroup } />
                        </Base>
                        { depositGroup && <ChestPlainText className="deposit-selected-name">{ depositGroup.name }</ChestPlainText> }
                        <Flex gap={ 1 }>
                            <WiredTextInput className="chest-number-wide" compact bitmapAlign="center" type="number" min={ 1 } max={ depositGroup?.getUnlockedCount() || 1 } value={ depositQuantity } disabled={ !depositGroup } onChange={ event => updateAmount(event.target.valueAsNumber, setDepositQuantity, depositGroup?.getUnlockedCount() || 1) } />
                            <WiredButton disabled={ !depositGroup } onClick={ () => offerDepositItems(depositQuantity) }>Offer</WiredButton>
                        </Flex>
                    </Column>
                </Base>
                <Base className={ `deposit-offer-area ${ deposit.contractData.rewards.length > 0 ? 'has-rewards' : 'has-art' }` }>
                    <Base className="deposit-trade-row">
                        <Column className="deposit-grid-column">
                            <Base className="deposit-grid-title">
                                <WiredControlTitle>{ deposit.type === ChestType.COINS ? `${ deposit.credits } credits` : `${ deposit.itemCount } items` }</WiredControlTitle>
                            </Base>
                            <DepositPaymentGrid depositGroups={ depositGroups } removeDepositItems={ removeDepositItems } />
                        </Column>
                        <Base className="requirements-arrow deposit-transfer-arrow"><img src={ arrowRightAdjustIcon } alt="" /></Base>
                        <Column center className="deposit-payment-column">
                            { deposit.contractData.rewards.length > 0
                                ? <DepositRewardGrid rewards={ deposit.contractData.rewards } />
                                : <img className="deposit-payment-art" src={ genericChestPayment } /> }
                        </Column>
                    </Base>
                </Base>
                <Flex justifyContent="between">
                    <WiredButton className="is-danger" onClick={ closeDeposit }>{ LocalizeText('generic.cancel') }</WiredButton>
                    { !deposit.accepted && <WiredButton disabled={ !deposit.canConfirm } onClick={ () => SendMessageComposer(new ChestDepositAcceptComposer(false)) }>Accept trade</WiredButton> }
                    { deposit.accepted && (countdownTick > 0) && <WiredButton disabled>{ `Please wait... ${ countdownTick }` }</WiredButton> }
                    { deposit.accepted && (countdownTick === 0) && <WiredButton disabled={ !deposit.canConfirm } onClick={ () => SendMessageComposer(new ChestDepositAcceptComposer(true)) }>Confirm</WiredButton> }
                </Flex>
            </NitroCardContentView>
            <RequirementsPanel deposit={ deposit } />
        </NitroCardView>
    );
}

const countDepositElement = (deposit: DepositState, element: DepositContractElement) =>
{
    if(element.type === CONTRACT_ELEMENT_CREDITS) return deposit.credits;

    const code = (element.furniCode || '').toUpperCase();
    if(!code) return 0;

    return deposit.items.filter(item => getClassName(item as any) === code).length;
}

const fulfilledMultiplierForOption = (deposit: DepositState, option: DepositContractElement[]) =>
{
    if(!option?.length) return deposit.itemCount > 0 || deposit.credits > 0 ? 1 : 0;

    return option.reduce((current, element) =>
    {
        const required = Math.max(1, element.amount || 1);
        const available = countDepositElement(deposit, element);

        return Math.min(current, Math.floor(available / required));
    }, Number.MAX_SAFE_INTEGER);
}

const getRequirementProgress = (deposit: DepositState) =>
{
    if(deposit.contractData.paymentMode === PAYMENT_MODE_ANYTHING)
    {
        return deposit.itemCount > 0 || deposit.credits > 0 ? 1 : 0;
    }

    return Math.max(0, ...normalizeDepositOptions(deposit.contractData.paymentOptions).map(option => fulfilledMultiplierForOption(deposit, option)));
}

const RequirementElement: FC<{ element: DepositContractElement }> = props =>
{
    const { element } = props;
    const image = element.type === CONTRACT_ELEMENT_CREDITS
        ? chestCoinIcon
        : furniIconUrl(element.productType || 'floor', element.spriteId || 0);

    return (
        <Base className="requirements-item">
            <img src={ image } alt="" />
            <ChestPlainText>{ `x${ Math.max(1, element.amount || 1) }` }</ChestPlainText>
        </Base>
    );
}

const RequirementOption: FC<{ option: DepositContractElement[] }> = props =>
{
    if(!props.option?.length)
    {
        return <Base className="requirements-any"><ChestPlainText>Any payment</ChestPlainText></Base>;
    }

    return (
        <Flex gap={ 1 } wrap>
            { props.option.map((element, index) => <RequirementElement key={ index } element={ element } />) }
        </Flex>
    );
}

const RequirementsPanel: FC<{ deposit: DepositState }> = props =>
{
    const { deposit } = props;
    const hasContract = !!deposit.contractType;
    const paymentOptions = deposit.contractData.paymentMode === PAYMENT_MODE_ANYTHING ? [ [] ] : normalizeDepositOptions(deposit.contractData.paymentOptions);
    const hasPayment = hasContract && (deposit.contractType === 'payment' || deposit.contractType === 'trade');

    if(!hasPayment) return null;

    const progress = getRequirementProgress(deposit);
    const target = Math.max(1, deposit.multiplier || 1);
    const met = deposit.canConfirm;
    const typeLabel = deposit.contractType === 'trade' ? 'Trade' : 'Payment';
    const receiveText = deposit.contractType === 'payment' ? (deposit.contractData.receiveText || '').trim() : '';
    const statusText = deposit.autoMultiplier
        ? text('inventory.wired_trading.requirements.auto_mode_hint_trade', `Note: You can keep adding items to perform this trade multiple times. (max ${ target }x)`, [ 'amount' ], [ target.toString() ])
        : target > 1
            ? text('inventory.wired_trading.requirements.indicator.multi', `The requirements need to be met ${ target } times (${ Math.min(progress, target) }/${ target })`, [ 'amount', 'times' ], [ Math.min(progress, target).toString(), target.toString() ])
            : text(met ? 'inventory.wired_trading.requirements.indicator.met' : 'inventory.wired_trading.requirements.indicator.not_met', met ? 'The requirements are met' : 'The requirements are not met');

    return (
        <Base className="wired-chest-requirements-panel">
            <Base className="requirements-header">
                <WiredControlTitle>{ text('inventory.wired_trading.requirements.title', `${ typeLabel } requirements`, [ 'type' ], [ typeLabel ]) }</WiredControlTitle>
            </Base>
            <Base className="requirements-trade-grid">
                <Base className="requirements-side requirements-side-give">
                    <WiredControlTitle>{ text('inventory.wired_trading.requirements.offering', 'You Give') }</WiredControlTitle>
                    <Base className="requirements-options">
                        { paymentOptions.map((option, index) => (
                            <Base key={ index } className="requirements-option-wrap">
                                <RequirementOption option={ option } />
                                { index < paymentOptions.length - 1 && <Base className="requirements-or"><WiredControlTitle>OR</WiredControlTitle></Base> }
                            </Base>
                        )) }
                    </Base>
                </Base>
                <Base className="requirements-arrow"><img src={ arrowRightAdjustIcon } alt="" /></Base>
                <Base className="requirements-side requirements-side-get">
                    <WiredControlTitle>{ text('inventory.wired_trading.requirements.receiving', 'You Get') }</WiredControlTitle>
                    { receiveText
                        ? <Base className="requirements-receive-text"><ChestPlainText>{ receiveText }</ChestPlainText></Base>
                        : <Flex className="requirements-rewards" gap={ 1 } wrap>
                            { deposit.contractData.rewards.map((reward, index) => <RequirementElement key={ index } element={ reward } />) }
                        </Flex> }
                </Base>
            </Base>
            <Flex className="requirements-status" alignItems="center" gap={ 1 }>
                <ChestPlainText>{ statusText.replace(/<\/?b>|<\/?i>/g, '') }</ChestPlainText>
                <img src={ met ? transactionCompleteIcon : transactionFailIcon } alt="" />
            </Flex>
        </Base>
    );
}

const DepositRewardGrid: FC<{ rewards: DepositContractElement[] }> = props =>
{
    const rewards = (props.rewards || []).slice(0, 9);

    return (
        <Column center gap={ 0 } className="deposit-reward-preview">
            <Base className="deposit-offer-grid deposit-reward-grid">
                { [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ].map(index =>
                {
                    const reward = rewards[index];

                    if(!reward) return <Base key={ index } className="deposit-empty-slot" />;

                    const image = reward.type === CONTRACT_ELEMENT_CREDITS
                        ? chestCoinIcon
                        : furniIconUrl(reward.productType || 'floor', reward.spriteId || 0);

                    return <LayoutGridItem key={ index } itemImage={ image } itemCount={ Math.max(1, reward.amount || 1) } />;
                }) }
            </Base>
        </Column>
    );
}

const NotificationSettings: FC<any> = props =>
{
    const generic = [ 0, 1 ];
    const wired = [ 2, 3, 4 ];
    const [ checks, setChecks ] = useState<boolean[]>(props.notificationChecks || DEFAULT_CHEST_NOTIFICATION_CHECKS);

    useEffect(() =>
    {
        setChecks(props.notificationChecks || DEFAULT_CHEST_NOTIFICATION_CHECKS);
    }, [ props.notificationChecks ]);

    const toggleNotification = (index: number) =>
    {
        setChecks(prev =>
        {
            const next = [ ...prev ];

            next[index] = !next[index];

            return next;
        });
    }

    const save = () =>
    {
        props.onSave(checks);
        props.onClose();
    }

    return (
        <NitroCardView uniqueKey="wired-chest-notifications" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-chest-dialog', 'notifications' ] }>
            <ChestWindowHeader title="Furni Chest notification settings" onClose={ save } />
            <NitroCardContentView classNames={ [ 'wired-tools-content', 'chest-dialog-content' ] } gap={ 2 }>
                <Column className="dialog-section">
                    <Flex justifyContent="between" pointer onClick={ () => props.setNotificationInfoOpen(!props.notificationInfoOpen) }>
                        <WiredControlTitle>{ text('wiredchests.notification_settings.notification_info', 'Info about notifications') }</WiredControlTitle>
                        <img className={ `nw-param-chevron ${ props.notificationInfoOpen ? 'is-expanded' : '' }` } alt="" src={ wiredIconUrl(WiredIcon.chevron) } />
                    </Flex>
                    { props.notificationInfoOpen && <Base className="white-space-pre-line"><ChestPlainText>{ lineText(text('wiredchests.notification_settings.notification_info.desc', "Configure the notifications you'll receive when the chest contents are modified. You can click a notification to go to the room with the chest.")) }</ChestPlainText></Base> }
                </Column>
                <Column className="dialog-section">
                    <WiredControlTitle>{ text('wiredchests.notification_settings.enable_notifications', 'Notifications to enable') }</WiredControlTitle>
                    <Base className="dialog-panel">
                        <WiredControlTitle>{ text('wiredchests.notification_settings.enable_notifications.generic', 'General notifications') }</WiredControlTitle>
                        { generic.map(index => <WiredCheckbox key={ index } checked={ checks[index] } onChange={ () => toggleNotification(index) } label={ text(`wiredchests.notification_settings.enable_notifications.generic.${ index }`, index === 0 ? 'Notify me when the chest is full' : 'Notify me when someone makes a donation') } />) }
                        <hr />
                        <WiredControlTitle>{ text('wiredchests.notification_settings.enable_notifications.wired', 'Only for Wired chests:') }</WiredControlTitle>
                        { wired.map((index, wiredIndex) => <WiredCheckbox key={ index } checked={ checks[index] } onChange={ () => toggleNotification(index) } label={ text(`wiredchests.notification_settings.enable_notifications.wired.${ wiredIndex }`, [ 'Notify me when someone withdraws from chest', 'Notify me when the chest is empty', 'Notify me for any Wired transaction' ][wiredIndex]) } />) }
                    </Base>
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}

const GeneralSettings: FC<any> = props =>
{
    const { draft, setDraft, chestType, onSave } = props;
    const set = (patch: Partial<SettingsDraft>) => setDraft(prev => ({ ...prev, ...patch }));

    return (
        <NitroCardView uniqueKey="wired-chest-settings" theme="wired-tools" handleSelector=".wired-tools-drag-area" classNames={ [ 'nitro-wired-chest-dialog', 'settings' ] }>
            <ChestWindowHeader title="Furni Chest settings" onClose={ onSave } />
            <NitroCardContentView classNames={ [ 'wired-tools-content', 'chest-dialog-content' ] } gap={ 2 }>
                <Column className="dialog-section">
                    <WiredControlTitle>{ text('wiredchests.settings.access', 'Extra access settings') }</WiredControlTitle>
                    <Base className="dialog-panel">
                        <WiredCheckbox checked={ draft.allowOpen } onChange={ checked => set({ allowOpen: checked }) } label={ text('wiredchests.settings.access.open', 'Everyone can open the chest') } />
                        <WiredCheckbox checked={ draft.allowDonate } onChange={ checked => set({ allowDonate: checked }) } label={ text('wiredchests.settings.access.donate', 'Everyone can donate to the chest') } />
                        <WiredCheckbox checked={ draft.locked } onChange={ checked => set({ locked: checked }) } label={ text('wiredchests.lock_chest', 'Lock this chest') } />
                        <WiredCheckbox checked={ draft.autoLock } onChange={ checked => set({ autoLock: checked }) } label={ text('wiredchests.auto_lock_chest', 'Auto lock chest when chest owner leaves room') } />
                    </Base>
                </Column>
                <Column className="dialog-section">
                    <WiredControlTitle>{ text('wiredchests.settings.info', 'Chest info (optional)') }</WiredControlTitle>
                    <Base className="dialog-panel">
                        <ChestLabel>{ text('wiredchests.settings.info.name', 'Chest name:') }</ChestLabel>
                        <WiredTextInput value={ draft.displayName } onChange={ event => set({ displayName: event.target.value }) } />
                        <ChestLabel>{ text('wiredchests.settings.info.desc', 'Chest description:') }</ChestLabel>
                        <WiredTextarea className="chest-textarea" value={ draft.description } onChange={ event => set({ description: event.target.value }) } />
                    </Base>
                </Column>
                <Column className="dialog-section">
                    <WiredControlTitle>{ text('wiredchests.settings.appearance', 'Appearance settings') }</WiredControlTitle>
                    <Base className="dialog-panel">
                        <ChestLabel>{ text('wiredchests.settings.appearance.state', 'Chest state:') }</ChestLabel>
                        <WiredSelect className="chest-select" value={ draft.appearanceState } onChange={ event => set({ appearanceState: Number(event.target.value) }) } options={ [ 0, 1, 2, 3 ].map(index => ({ value: index, label: text(`wiredchests.settings.appearance.state.${ index }`, [ 'Open when someone looks inside', 'Always open', 'Always closed', 'Control with Wired' ][index]) })) } />
                        <ChestLabel>{ text('wiredchests.settings.appearance.preview', 'Items to preview in open state:') }</ChestLabel>
                        <WiredSelect className="chest-select" value={ draft.previewMode } onChange={ event => set({ previewMode: Number(event.target.value) }) } options={ [ 'None', 'Random items', 'Random items (*)', 'Most recent items', 'Most recent items (*)', 'Oldest items', 'Oldest items (*)', 'Next-in-line random items to be given through Wired' ].map((fallback, index) => ({ value: index, label: text(`wiredchests.settings.appearance.preview.${ index }`, fallback) })) } />
                        <ChestLabel>{ text('wiredchests.settings.appearance.preview.note', '(*) = Prefer to show different item types') }</ChestLabel>
                        <ChestLabel>{ text('wiredchests.settings.appearance.preview_amount', 'Amount of preview items:') }</ChestLabel>
                        <WiredSelect className="chest-select is-small" value={ draft.previewAmount } onChange={ event => set({ previewAmount: Number(event.target.value) }) } options={ [ 1, 2, 3, 4 ].map(value => ({ value, label: value.toString() })) } />
                        { chestType === ChestType.COINS &&
                            <>
                                <ChestLabel>{ text('wiredchests.capacity_info.title', 'Chest capacity:') }</ChestLabel>
                                <WiredTextInput type="number" min={ 1 } value={ draft.capacity } onChange={ event => set({ capacity: Math.max(1, event.target.valueAsNumber || 1) }) } />
                            </> }
                    </Base>
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}
