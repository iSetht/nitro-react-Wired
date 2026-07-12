import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ChestContractOpenEvent, ChestContractSaveComposer, ContractFurniBase, GetRoomEngine, LocalizeText, RegisterContractMessages, SendMessageComposer } from '../../api';
import { Base, BitmapText, Flex, NitroCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';
import chestCoinIcon from '../../assets/images/wired/chest_coin.png';
import wiredChestAddIcon from '../../assets/images/wired/wired_chest_add.png';
import { WiredButton, WiredButtonInfoText, WiredCheckbox, WiredControlTitle, WiredParam, WiredRadioGroup, WiredSubInfo, WiredTextInput, WiredTextarea } from '../wired/views/WiredControls';

type ContractType = 'payment' | 'reward' | 'trade';
type ContractElementTarget = 'payment' | 'reward';

const PAYMENT_MODE_ANYTHING = 0;
const PAYMENT_MODE_SPECIFIC = 1;
const ELEMENT_CREDITS = 0;
const ELEMENT_FURNI = 1;
const MAX_PAYMENT_OPTIONS = 3;
const MAX_ELEMENTS_PER_OPTION = 5;

interface ContractElement
{
    type: number;
    amount: number;
    furniCode?: string;
    furniName?: string;
    spriteId?: number;
    productType?: string;
    furniType?: string;
}

interface ContractData
{
    paymentMode: number;
    receiveText: string;
    layoutType: string;
    rewardText: string;
    showRewardByDefault: boolean;
    paymentOptions: ContractElement[][];
    rewards: ContractElement[];
}

interface ContractState
{
    id: number;
    type: ContractType;
    title: string;
    data: ContractData;
    furniBases: ContractFurniBase[];
}

interface AddDialogState
{
    target: ContractElementTarget;
    optionIndex: number;
}

const text = (key: string, fallback: string, parameters: string[] = [], replacements: string[] = []) =>
{
    const localized = LocalizeText(key, parameters, replacements);

    return localized && localized !== key ? localized : fallback;
};

const clampAmount = (amount: number) => Math.max(1, Math.min(999999, Math.floor(Number.isFinite(amount) ? amount : 1)));

const defaultData = (): ContractData => ({
    paymentMode: PAYMENT_MODE_ANYTHING,
    receiveText: '',
    layoutType: 'generic',
    rewardText: '',
    showRewardByDefault: true,
    paymentOptions: [ [] ],
    rewards: []
});

const normalizeElement = (element: ContractElement): ContractElement =>
{
    const type = element?.type === ELEMENT_FURNI ? ELEMENT_FURNI : ELEMENT_CREDITS;

    if(type === ELEMENT_CREDITS)
    {
        return {
            type,
            amount: clampAmount(element?.amount ?? 1)
        };
    }

    return {
        type,
        amount: clampAmount(element?.amount ?? 1),
        furniCode: element?.furniCode || '',
        furniName: element?.furniName || element?.furniCode || '',
        spriteId: element?.spriteId || 0,
        productType: element?.productType || 'floor',
        furniType: element?.furniType || ''
    };
};

const normalizeElements = (elements: ContractElement[] = []) =>
    elements
        .filter(element => !!element)
        .slice(0, MAX_ELEMENTS_PER_OPTION)
        .map(normalizeElement)
        .filter(element => element.type === ELEMENT_CREDITS || !!element.furniCode);

const normalizeOptions = (options: ContractElement[][] = []) =>
{
    const normalized = options.slice(0, MAX_PAYMENT_OPTIONS).map(option => normalizeElements(option));

    return normalized.length ? normalized : [ [] ];
};

const normalizeContractData = (type: ContractType, data: Partial<ContractData> = {}): ContractData =>
{
    const next = { ...defaultData(), ...data };

    next.paymentMode = next.paymentMode === PAYMENT_MODE_SPECIFIC ? PAYMENT_MODE_SPECIFIC : PAYMENT_MODE_ANYTHING;
    next.receiveText = next.receiveText || '';
    next.layoutType = next.layoutType || 'generic';
    next.rewardText = next.rewardText || '';
    next.showRewardByDefault = next.showRewardByDefault !== false;

    if(type === 'reward')
    {
        next.paymentOptions = [];
        next.rewards = normalizeElements(next.rewards);
    }
    else if(type === 'trade')
    {
        next.paymentMode = PAYMENT_MODE_SPECIFIC;
        next.paymentOptions = normalizeOptions(next.paymentOptions);
        next.rewards = normalizeElements(next.rewards);
    }
    else
    {
        next.paymentOptions = normalizeOptions(next.paymentOptions);
        next.rewards = [];
    }

    return next;
};

const parseData = (type: ContractType, dataJson: string): ContractData =>
{
    try
    {
        return normalizeContractData(type, JSON.parse(dataJson || '{}'));
    }
    catch
    {
        return normalizeContractData(type);
    }
};

export const ContractView: FC<{}> = () =>
{
    RegisterContractMessages();

    const [ contract, setContract ] = useState<ContractState>(null);
    const [ dialog, setDialog ] = useState<AddDialogState>(null);

    useMessageEvent<ChestContractOpenEvent>(ChestContractOpenEvent, event =>
    {
        const parser = event.getParser();
        const type = (parser.contractType === 'reward' || parser.contractType === 'trade') ? parser.contractType : 'payment';

        setContract({
            id: parser.contractId,
            type,
            title: parser.title || fallbackTitle(type),
            data: parseData(type, parser.dataJson),
            furniBases: parser.furniBases
        });
    });

    const updateData = (updater: (data: ContractData) => ContractData) =>
    {
        setContract(prev =>
        {
            if(!prev) return prev;

            return {
                ...prev,
                data: normalizeContractData(prev.type, updater(prev.data))
            };
        });
    };

    const addElement = (element: ContractElement) =>
    {
        if(!dialog) return;

        updateData(data =>
        {
            if(dialog.target === 'reward')
            {
                return {
                    ...data,
                    rewards: [ ...data.rewards, element ].slice(0, MAX_ELEMENTS_PER_OPTION)
                };
            }

            const paymentOptions = normalizeOptions(data.paymentOptions);
            const option = paymentOptions[dialog.optionIndex] ?? [];

            paymentOptions[dialog.optionIndex] = [ ...option, element ].slice(0, MAX_ELEMENTS_PER_OPTION);

            return { ...data, paymentOptions };
        });

        setDialog(null);
    };

    const removeElement = (target: ContractElementTarget, optionIndex: number, elementIndex: number) =>
    {
        updateData(data =>
        {
            if(target === 'reward')
            {
                return {
                    ...data,
                    rewards: data.rewards.filter((_, index) => index !== elementIndex)
                };
            }

            const paymentOptions = normalizeOptions(data.paymentOptions);

            paymentOptions[optionIndex] = (paymentOptions[optionIndex] ?? []).filter((_, index) => index !== elementIndex);

            return { ...data, paymentOptions };
        });
    };

    const addPaymentOption = () =>
    {
        updateData(data => ({
            ...data,
            paymentOptions: [ ...normalizeOptions(data.paymentOptions), [] ].slice(0, MAX_PAYMENT_OPTIONS)
        }));
    };

    const save = () =>
    {
        if(!contract) return;

        SendMessageComposer(new ChestContractSaveComposer(contract.id, JSON.stringify(normalizeContractData(contract.type, contract.data))));
        setContract(null);
    };

    if(!contract) return null;

    return (
        <>
            <WiredContractShell uniqueKey="wired-contract" className="nitro-wired-contract" title={ contract.title } onClose={ () => setContract(null) }>
                    { contract.type === 'payment' &&
                        <PaymentContractForm
                            data={ contract.data }
                            updateData={ updateData }
                            openAddDialog={ optionIndex => setDialog({ target: 'payment', optionIndex }) }
                            removeElement={ removeElement }
                            addPaymentOption={ addPaymentOption } /> }
                    { contract.type === 'reward' &&
                        <RewardContractForm
                            data={ contract.data }
                            updateData={ updateData }
                            openAddDialog={ () => setDialog({ target: 'reward', optionIndex: 0 }) }
                            removeElement={ removeElement } /> }
                    { contract.type === 'trade' &&
                        <TradeContractForm
                            data={ contract.data }
                            openAddDialog={ (target, optionIndex = 0) => setDialog({ target, optionIndex }) }
                            removeElement={ removeElement }
                            addPaymentOption={ addPaymentOption } /> }
                    <ContractButtons onSave={ save } onClose={ () => setContract(null) } />
            </WiredContractShell>
            { dialog &&
                <AddContractElementDialog
                    furniBases={ contract.furniBases }
                    onSave={ addElement }
                    onClose={ () => setDialog(null) } /> }
        </>
    );
};

const WiredContractShell: FC<{ uniqueKey: string; className: string; title: string; width?: number; onClose: () => void; children: ReactNode; }> = props =>
{
    return (
        <NitroCardView uniqueKey={ props.uniqueKey } className={ `nitro-wired ${ props.className }` } theme="primary" style={ { width: props.width ?? 238 } }>
            <div className="nw-header drag-handler">
                <div className="nw-header-bg" />
                <div className="nw-header-row1">
                    <button className="nw-btn nw-btn-menu" />
                    <span className="nw-header-title">
                        <Text bitmapFont="il_heading_3">{ LocalizeText('wiredfurni.title') }</Text>
                    </span>
                    <button className="nw-btn nw-btn-close" onClick={ props.onClose } />
                </div>
                <div className="nw-header-row2">
                    <Text bitmapFont="il_link_strong">{ text('wiredcontracts.title', 'CONTRACT') }</Text>
                </div>
                <div className="nw-header-row3">
                    <Text bitmapFont="id_heading_2">{ props.title }</Text>
                </div>
            </div>
            <div className="nw-body">
                <div className="nw-special">
                    { props.children }
                </div>
            </div>
        </NitroCardView>
    );
};

const WiredContractSimpleShell: FC<{ uniqueKey: string; className: string; title: string; width?: number; onClose: () => void; children: ReactNode; }> = props =>
{
    return (
        <NitroCardView uniqueKey={ props.uniqueKey } className={ `nitro-wired ${ props.className }` } theme="primary" style={ { width: props.width ?? 238 } }>
            <div className="nw-header drag-handler">
                <div className="nw-header-bg" />
                <div className="nw-header-row1">
                    <span className="nw-header-title">
                        <Text bitmapFont="il_heading_3">{ props.title }</Text>
                    </span>
                    <button className="nw-btn nw-btn-close" onClick={ props.onClose } />
                </div>
            </div>
            <div className="nw-body">
                <div className="nw-special">
                    { props.children }
                </div>
            </div>
        </NitroCardView>
    );
};

const ContractButtons: FC<{ onSave: () => void; onClose: () => void; saveDisabled?: boolean; }> = props =>
(
    <div className="nw-buttons contract-footer">
        <button className="nw-text-btn" disabled={ props.saveDisabled } onClick={ props.onSave }>
            <Text bitmapFont="il_button">{ LocalizeText('wiredfurni.ready') }</Text>
        </button>
        <button className="nw-text-btn" onClick={ props.onClose }>
            <Text bitmapFont="il_button">{ LocalizeText('wiredfurni.cancel') }</Text>
        </button>
    </div>
);

const furniIconUrl = (productType: string, spriteId: number) =>
    productType === 'wall'
        ? GetRoomEngine().getFurnitureWallIconUrl(spriteId)
        : GetRoomEngine().getFurnitureFloorIconUrl(spriteId);

const PaymentContractForm: FC<{
    data: ContractData;
    updateData: (updater: (data: ContractData) => ContractData) => void;
    openAddDialog: (optionIndex: number) => void;
    removeElement: (target: ContractElementTarget, optionIndex: number, elementIndex: number) => void;
    addPaymentOption: () => void;
}> = props =>
{
    const specificPayment = props.data.paymentMode === PAYMENT_MODE_SPECIFIC;

    return (
        <>
            <ContractParam title={ text('wiredcontracts.payment_contract.mode', 'Payment mode:') }>
                <WiredRadioGroup
                    name="paymentMode"
                    value={ props.data.paymentMode }
                    onChange={ value => props.updateData(data => ({ ...data, paymentMode: Number(value) === PAYMENT_MODE_SPECIFIC ? PAYMENT_MODE_SPECIFIC : PAYMENT_MODE_ANYTHING })) }
                    options={ [
                        { value: PAYMENT_MODE_ANYTHING, label: text('wiredcontracts.payment_contract.mode.0', 'Anything (donation)') },
                        { value: PAYMENT_MODE_SPECIFIC, label: text('wiredcontracts.payment_contract.mode.1', 'Specific payment') }
                    ] } />
            </ContractParam>
            <ContractParam title={ text('wiredcontracts.payment_contract.receive_text', 'What does the user receive? (optional)') }>
                <WiredTextInput value={ props.data.receiveText } onChange={ event => props.updateData(data => ({ ...data, receiveText: event.target.value })) } />
            </ContractParam>
            <ContractParam title={ text('wiredcontracts.payment_requirements', 'Payment requirements:') } disabled={ !specificPayment }>
                <PaymentOptionsEditor
                    options={ props.data.paymentOptions }
                    disabled={ !specificPayment }
                    openAddDialog={ props.openAddDialog }
                    removeElement={ props.removeElement } />
                <WiredButton disabled={ !specificPayment || props.data.paymentOptions.length >= MAX_PAYMENT_OPTIONS } onClick={ props.addPaymentOption }>
                    { text('wiredcontracts.payment_add_more', 'Add other payment option') }
                </WiredButton>
            </ContractParam>
        </>
    );
};

const RewardContractForm: FC<{
    data: ContractData;
    updateData: (updater: (data: ContractData) => ContractData) => void;
    openAddDialog: () => void;
    removeElement: (target: ContractElementTarget, optionIndex: number, elementIndex: number) => void;
}> = props =>
{
    return (
        <>
            <ContractParam title={ text('wiredcontracts.reward_requirements', 'The user receives:') }>
                <RuleBox title={ text('wiredcontracts.reward_rule', 'Rewards') } elements={ props.data.rewards } disabled={ false } onAdd={ props.openAddDialog } onRemove={ index => props.removeElement('reward', 0, index) } />
            </ContractParam>
            <ContractParam title={ text('wiredcontracts.reward_contract.reward_popup', 'Reward pop-up:') } divider={ false }>
                <WiredTextarea value={ props.data.rewardText } placeholder={ text('wiredcontracts.reward_contract.reward_popup.text.tooltip', '') } onChange={ event => props.updateData(data => ({ ...data, rewardText: event.target.value })) } />
                <WiredCheckbox checked={ props.data.showRewardByDefault } onChange={ checked => props.updateData(data => ({ ...data, showRewardByDefault: checked })) } label={ text('wiredcontracts.reward_contract.reward_popup.show_by_default', 'Show pop-up by default') } />
            </ContractParam>
        </>
    );
};

const TradeContractForm: FC<{
    data: ContractData;
    openAddDialog: (target: ContractElementTarget, optionIndex?: number) => void;
    removeElement: (target: ContractElementTarget, optionIndex: number, elementIndex: number) => void;
    addPaymentOption: () => void;
}> = props =>
{
    return (
        <>
            <ContractParam title={ text('wiredcontracts.payment_requirements', 'Payment requirements:') }>
                <PaymentOptionsEditor options={ props.data.paymentOptions } disabled={ false } openAddDialog={ optionIndex => props.openAddDialog('payment', optionIndex) } removeElement={ props.removeElement } />
                <WiredButton disabled={ props.data.paymentOptions.length >= MAX_PAYMENT_OPTIONS } onClick={ props.addPaymentOption }>
                    { text('wiredcontracts.payment_add_more', 'Add other payment option') }
                </WiredButton>
            </ContractParam>
            <ContractParam title={ text('wiredcontracts.reward_requirements', 'The user receives:') } divider={ false }>
                <RuleBox title={ text('wiredcontracts.reward_rule', 'Rewards') } elements={ props.data.rewards } disabled={ false } onAdd={ () => props.openAddDialog('reward') } onRemove={ index => props.removeElement('reward', 0, index) } />
            </ContractParam>
        </>
    );
};

const PaymentOptionsEditor: FC<{
    options: ContractElement[][];
    disabled: boolean;
    openAddDialog: (optionIndex: number) => void;
    removeElement: (target: ContractElementTarget, optionIndex: number, elementIndex: number) => void;
}> = props =>
{
    return (
        <>
            { normalizeOptions(props.options).map((option, index) =>
                <RuleBox
                    key={ index }
                    title={ text('wiredcontracts.payment_rule', `Payment option ${ index + 1 }`, [ 'i' ], [ (index + 1).toString() ]) }
                    elements={ option }
                    disabled={ props.disabled }
                    onAdd={ () => props.openAddDialog(index) }
                    onRemove={ elementIndex => props.removeElement('payment', index, elementIndex) } />) }
        </>
    );
};

const RuleBox: FC<{
    title: string;
    elements: ContractElement[];
    disabled: boolean;
    onAdd: () => void;
    onRemove: (index: number) => void;
}> = props =>
{
    const canAdd = !props.disabled && props.elements.length < MAX_ELEMENTS_PER_OPTION;

    return (
        <Base className={ `contract-rule-box${ props.disabled ? ' is-disabled' : '' }` }>
            <div className="contract-rule-title">
                <WiredControlTitle>{ props.title }</WiredControlTitle>
            </div>
            <Flex gap={ 1 } wrap>
                { props.elements.map((element, index) =>
                    <ContractElementTile key={ index } element={ element } disabled={ props.disabled } onRemove={ () => props.onRemove(index) } />) }
                { canAdd &&
                    <button type="button" className="contract-add-tile" onClick={ props.onAdd }>
                        <img alt="" src={ wiredChestAddIcon } />
                    </button> }
            </Flex>
        </Base>
    );
};

const ContractElementTile: FC<{ element: ContractElement; disabled: boolean; onRemove: () => void; }> = props =>
{
    return (
        <Base className={ `contract-element-tile${ props.disabled ? ' is-disabled' : '' }` }>
            { props.element.type === ELEMENT_CREDITS
                ? <img className="contract-credit-icon" alt="" src={ chestCoinIcon } />
                : <img className="contract-furni-icon" alt="" src={ furniIconUrl(props.element.productType, props.element.spriteId || 0) } /> }
            <span className="contract-amount-badge">{ props.element.amount }</span>
            { !props.disabled && <button type="button" className="contract-remove-element" onClick={ props.onRemove }>x</button> }
        </Base>
    );
};

const AddContractElementDialog: FC<{
    furniBases: ContractFurniBase[];
    onSave: (element: ContractElement) => void;
    onClose: () => void;
}> = props =>
{
    const [ elementType, setElementType ] = useState(ELEMENT_CREDITS);
    const [ amount, setAmount ] = useState(1);
    const [ search, setSearch ] = useState('');
    const [ selectedCode, setSelectedCode ] = useState('');
    const [ visibleLimit, setVisibleLimit ] = useState(80);
    const tableRef = useRef<HTMLDivElement>(null);
    const normalizedSearch = search.trim().toLowerCase();

    const selectedBase = useMemo(() => props.furniBases.find(base => base.furniCode === selectedCode) ?? null, [ props.furniBases, selectedCode ]);
    const filteredBases = useMemo(() =>
    {
        const needle = normalizedSearch;

        if(!needle) return props.furniBases;

        return props.furniBases.filter(base =>
            (base.furniName || '').toLowerCase().includes(needle) ||
            (base.furniCode || '').toLowerCase().includes(needle) ||
            (base.furniType || '').toLowerCase().includes(needle));
    }, [ props.furniBases, normalizedSearch ]);

    const visibleBases = filteredBases.slice(0, visibleLimit);
    const furniDisabled = elementType !== ELEMENT_FURNI;
    const tableKey = `${ elementType }-${ normalizedSearch }-${ filteredBases.length }`;

    const updateSearch = (value: string) =>
    {
        setSearch(value);
        setVisibleLimit(80);
        setSelectedCode('');

        if(tableRef.current) tableRef.current.scrollTop = 0;
    };

    useEffect(() =>
    {
        setVisibleLimit(80);
        setSelectedCode(current => filteredBases.some(base => base.furniCode === current) ? current : '');

        if(tableRef.current) tableRef.current.scrollTop = 0;
    }, [ filteredBases, elementType ]);

    const save = () =>
    {
        if(elementType === ELEMENT_FURNI && !selectedBase) return;

        props.onSave(elementType === ELEMENT_CREDITS
            ? { type: ELEMENT_CREDITS, amount: clampAmount(amount) }
            : {
                type: ELEMENT_FURNI,
                amount: clampAmount(amount),
                furniCode: selectedBase.furniCode,
                furniName: selectedBase.furniName,
                spriteId: selectedBase.spriteId,
                productType: selectedBase.productType,
                furniType: selectedBase.furniType
            });
    };

    return (
        <WiredContractSimpleShell uniqueKey="wired-contract-element" className="nitro-wired-contract-element" title={ text('wiredcontracts.element.add', 'Add contract element') } width={ 500 } onClose={ props.onClose }>
                <Flex className="contract-element-top">
                    <Base grow className="contract-element-type">
                        <WiredControlTitle>{ text('wiredcontracts.element.type', 'Element type:') }</WiredControlTitle>
                        <WiredRadioGroup
                            name="contractElementType"
                            value={ elementType }
                            onChange={ value => setElementType(Number(value) === ELEMENT_FURNI ? ELEMENT_FURNI : ELEMENT_CREDITS) }
                            options={ [
                                { value: ELEMENT_CREDITS, label: text('wiredcontracts.element.type.0', 'Credits') },
                                { value: ELEMENT_FURNI, label: text('wiredcontracts.element.type.1', 'Furni') }
                            ] } />
                    </Base>
                    <Base grow className="contract-element-amount">
                        <WiredControlTitle>{ text('wiredcontracts.element.amount', 'Amount:') }</WiredControlTitle>
                        <WiredTextInput compact type="number" min={ 1 } max={ 999999 } value={ amount } onChange={ event => setAmount(clampAmount(event.target.valueAsNumber)) } />
                    </Base>
                </Flex>
                <Base className={ `contract-item-selection${ furniDisabled ? ' is-disabled' : '' }` }>
                    <Flex justifyContent="between" alignItems="start">
                        <Base grow>
                            <WiredControlTitle>{ text('wiredcontracts.element.itemtype.selection', 'Item type selection:') }</WiredControlTitle>
                            <label className="contract-field-row">
                                <WiredButtonInfoText>{ text('wiredcontracts.element.itemtype.furni_code', 'Furni code:') }</WiredButtonInfoText>
                                <WiredTextInput className="is-code" disabled value={ selectedCode } placeholder="furni_code (not editable)" />
                            </label>
                            <label className="contract-field-row">
                                <WiredButtonInfoText>{ text('wiredcontracts.element.itemtype.search', 'Search:') }</WiredButtonInfoText>
                                <WiredTextInput className="is-search" disabled={ furniDisabled } value={ search } onChange={ event => updateSearch(event.target.value) } />
                            </label>
                        </Base>
                        <Base className="contract-selected-preview">
                            { selectedBase && !furniDisabled &&
                                <img alt="" src={ furniIconUrl(selectedBase.productType, selectedBase.spriteId) } /> }
                        </Base>
                    </Flex>
                    <div key={ tableKey } ref={ tableRef } className="wired-tools-table-wrap wired-tools-properties-table contract-furni-table" onScroll={ event =>
                        {
                            const target = event.currentTarget;

                            if(target.scrollTop + target.clientHeight >= target.scrollHeight - 16) setVisibleLimit(limit => Math.min(filteredBases.length, limit + 80));
                        } }>
                        <table className="wired-tools-table">
                            <thead>
                                <tr>
                                    <th><ContractTableHeader>{ text('wiredcontracts.element.itemtype.col.furni_name', 'Furni name') }</ContractTableHeader></th>
                                    <th><ContractTableHeader>{ text('wiredcontracts.element.itemtype.col.furni_code', 'Furni code') }</ContractTableHeader></th>
                                    <th><ContractTableHeader>{ text('wiredcontracts.element.itemtype.col.furni_type', 'Type') }</ContractTableHeader></th>
                                </tr>
                            </thead>
                            <tbody>
                                { visibleBases.map(base =>
                                    <tr
                                        key={ base.furniCode }
                                        className={ selectedCode === base.furniCode ? 'is-selected' : '' }
                                        onClick={ () => !furniDisabled && setSelectedCode(base.furniCode) }>
                                        <td title={ base.furniName }><ContractTableText>{ base.furniName }</ContractTableText></td>
                                        <td title={ base.furniCode }><ContractTableText>{ base.furniCode }</ContractTableText></td>
                                        <td><ContractTableText>{ base.productType === 'wall' ? 'Wall' : 'Floor' }</ContractTableText></td>
                                    </tr>) }
                                { !visibleBases.length &&
                                    <tr>
                                        <td colSpan={ 3 }><ContractTableText>{ text('wiredcontracts.element.itemtype.empty', 'No furni found.') }</ContractTableText></td>
                                    </tr> }
                            </tbody>
                        </table>
                        </div>
                    <WiredSubInfo text={ `Showing ${ visibleBases.length } of ${ filteredBases.length } items` } />
                </Base>
                <ContractButtons saveDisabled={ elementType === ELEMENT_FURNI && !selectedBase } onSave={ save } onClose={ props.onClose } />
        </WiredContractSimpleShell>
    );
};

const ContractTableHeader: FC<{ children: string; }> = props =>
    <BitmapText className="wired-tools-strong-text" font="il_link_strong" text={ props.children } scale={ 1 } />;

const ContractTableText: FC<{ children: string; }> = props =>
    <span className="nw-control-text wired-tools-ui-text">{ props.children }</span>;

const ContractParam: FC<{ title: string; disabled?: boolean; divider?: boolean; children: any; }> = props =>
{
    return (
        <Base className={ `contract-param${ props.disabled ? ' is-disabled' : '' }${ props.divider === false ? '' : ' has-divider' }` }>
            <WiredParam title={ props.title } divider={ false }>
                { props.children }
            </WiredParam>
        </Base>
    );
};

const fallbackTitle = (type: ContractType) =>
{
    switch(type)
    {
        case 'reward':
            return 'Reward Contract:';
        case 'trade':
            return 'Trade Contract:';
        default:
            return 'Payment Contract:';
    }
};
