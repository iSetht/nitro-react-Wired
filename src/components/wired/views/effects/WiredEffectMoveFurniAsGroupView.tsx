import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredControlTitle, WiredInfoDesc, WiredParam, WiredTextInput, WiredVariableTypeSelector, WIRED_SOURCE_CLICKED_AVATAR, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER, WIRED_VARIABLE_FURNI, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_USER, wiredClickedAvatarSourceAvailableForTrigger } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';

const MAXIMUM_FURNI_SELECTION = 5;
const TARGET_KIND_FURNI = 0;
const TARGET_KIND_USER = 1;
const MIN_OFFSET = -100;
const MAX_OFFSET = 100;

const MOVING_FURNI_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const TARGET_FURNI_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const TARGET_USER_SOURCE_OPTIONS = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const TARGET_USER_SOURCE_OPTIONS_WITH_CLICKED_AVATAR = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_CLICKED_AVATAR ];
const PRIMARY_PICK_COLOR = '#7C8039';
const SECONDARY_PICK_COLOR = '#525892';
const PRIMARY_PICK_ICON = 'wired_furni_picks';
const SECONDARY_PICK_ICON = 'wired_furni_picks2';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
const normalizeSource = (source: number, options: number[], fallback: number) => options.includes(source) ? source : fallback;
const normalizeTargetKind = (value: number) => value === TARGET_KIND_USER ? TARGET_KIND_USER : TARGET_KIND_FURNI;
const parseFurniIds = (value: string) =>
{
    if(!value) return [];

    return value.split(/[,;\r\n\t]+/)
        .map(part => parseInt(part, 10))
        .filter(id => !isNaN(id));
}
const getTriggerFurniIds = (triggerData: any) =>
{
    const ids = triggerData?.selectedItems ?? triggerData?.stuffIds ?? triggerData?.furniIds ?? triggerData?.items ?? [];

    if(!Array.isArray(ids)) return [];

    return ids
        .map(item => (typeof item === 'number') ? item : item?.id)
        .filter(id => typeof id === 'number');
}
const uniqueFurniIds = (ids: number[]) => [ ...new Set(ids) ];

export const WiredEffectMoveFurniAsGroupView: FC<{}> = () =>
{
    const wired = useWired() as any;
    const {
        trigger = null,
        setIntParams = null,
        setStringParam = null,
        furniIds = null,
        setFurniIds = null
    } = wired;
    const initialPrimaryIds = useMemo(() => getTriggerFurniIds(trigger), [ trigger ]);
    const initialSecondaryIds = useMemo(() => parseFurniIds(trigger?.stringData ?? trigger?.stringParam ?? ''), [ trigger ]);
    const [ infoExpanded, setInfoExpanded ] = useState(false);
    const [ activePickSource, setActivePickSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ primaryFurniIds, setPrimaryFurniIds ] = useState<number[]>([]);
    const [ secondaryFurniIds, setSecondaryFurniIds ] = useState<number[]>([]);
    const [ movingFurniSource, setMovingFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ targetKind, setTargetKind ] = useState(TARGET_KIND_FURNI);
    const [ targetSource, setTargetSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ offsetX, setOffsetX ] = useState(0);
    const [ offsetY, setOffsetY ] = useState(0);
    const includeClickedAvatar = wiredClickedAvatarSourceAvailableForTrigger(trigger);
    const targetUserOptions = includeClickedAvatar ? TARGET_USER_SOURCE_OPTIONS_WITH_CLICKED_AVATAR : TARGET_USER_SOURCE_OPTIONS;
    const targetOptions = targetKind === TARGET_KIND_USER ? targetUserOptions : TARGET_FURNI_SOURCE_OPTIONS;

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        const nextTargetKind = normalizeTargetKind(intData[1] ?? TARGET_KIND_FURNI);
        const nextTargetOptions = nextTargetKind === TARGET_KIND_USER
            ? (wiredClickedAvatarSourceAvailableForTrigger(trigger) ? TARGET_USER_SOURCE_OPTIONS_WITH_CLICKED_AVATAR : TARGET_USER_SOURCE_OPTIONS)
            : TARGET_FURNI_SOURCE_OPTIONS;

        setMovingFurniSource(normalizeSource(intData[0] ?? WIRED_SOURCE_SELECTED, MOVING_FURNI_SOURCE_OPTIONS, WIRED_SOURCE_SELECTED));
        setTargetKind(nextTargetKind);
        setTargetSource(normalizeSource(intData[2] ?? WIRED_SOURCE_SELECTED, nextTargetOptions, nextTargetKind === TARGET_KIND_USER ? WIRED_SOURCE_TRIGGER : WIRED_SOURCE_SELECTED));
        setOffsetX(clamp(intData[3] ?? 0, MIN_OFFSET, MAX_OFFSET));
        setOffsetY(clamp(intData[4] ?? 0, MIN_OFFSET, MAX_OFFSET));
        setPrimaryFurniIds(initialPrimaryIds);
        setSecondaryFurniIds(initialSecondaryIds);
        setActivePickSource(WIRED_SOURCE_SELECTED);

        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...initialPrimaryIds, ...initialSecondaryIds ]));
        if(initialPrimaryIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(initialPrimaryIds);
        if(setFurniIds) setFurniIds(initialPrimaryIds);
    }, [ trigger, initialPrimaryIds, initialSecondaryIds, setFurniIds ]);

    useEffect(() =>
    {
        if(!Array.isArray(furniIds)) return;

        if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            setSecondaryFurniIds(furniIds);
            return;
        }

        setPrimaryFurniIds(furniIds);
    }, [ furniIds, activePickSource ]);

    useEffect(() =>
    {
        setTargetSource(source => normalizeSource(source, targetOptions, targetKind === TARGET_KIND_USER ? WIRED_SOURCE_TRIGGER : WIRED_SOURCE_SELECTED));
    }, [ targetKind, targetOptions ]);

    const clearAndApplyFurniSelection = (nextFurniIds: number[], previousFurniIds: number[] = []) =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...primaryFurniIds, ...secondaryFurniIds, ...previousFurniIds, ...(Array.isArray(furniIds) ? furniIds : []) ]));

        if(nextFurniIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(nextFurniIds);
        if(setFurniIds) setFurniIds(nextFurniIds);
    }

    const selectPickSource = (source: number) =>
    {
        if(activePickSource === source) return;

        let previousFurniIds: number[] = [];

        if(Array.isArray(furniIds))
        {
            previousFurniIds = furniIds;

            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setSecondaryFurniIds(furniIds);
            else setPrimaryFurniIds(furniIds);
        }

        setActivePickSource(source);
        clearAndApplyFurniSelection(source === WIRED_SOURCE_SECONDARY_SELECTED ? secondaryFurniIds : primaryFurniIds, previousFurniIds);
    }

    const selectedCount = primaryFurniIds.length;
    const secondaryCount = secondaryFurniIds.length;
    const sourceOptionLabels = {
        [WIRED_SOURCE_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ MAXIMUM_FURNI_SELECTION }]`,
        [WIRED_SOURCE_SECONDARY_SELECTED]: `${ LocalizeText('wiredfurni.params.sources.furni.101') } [${ secondaryCount }/${ MAXIMUM_FURNI_SELECTION }]`
    };
    const getPickersForSource = (source: number) =>
    {
        if(source === WIRED_SOURCE_SELECTED)
        {
            return [ {
                source: WIRED_SOURCE_SELECTED,
                icon: PRIMARY_PICK_ICON,
                color: PRIMARY_PICK_COLOR,
                selected: activePickSource === WIRED_SOURCE_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SELECTED),
                count: selectedCount,
                max: MAXIMUM_FURNI_SELECTION,
                variant: 'selected'
            } ];
        }

        if(source === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            return [ {
                source: WIRED_SOURCE_SECONDARY_SELECTED,
                icon: SECONDARY_PICK_ICON,
                color: SECONDARY_PICK_COLOR,
                selected: activePickSource === WIRED_SOURCE_SECONDARY_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SECONDARY_SELECTED),
                count: secondaryCount,
                max: MAXIMUM_FURNI_SELECTION,
                variant: 'secondary'
            } ];
        }

        return [];
    }
    const sourceSelectors = [
        {
            value: movingFurniSource,
            onChange: setMovingFurniSource,
            options: MOVING_FURNI_SOURCE_OPTIONS,
            titleKey: 'wiredfurni.params.sources.furni.title.mv.0',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels: sourceOptionLabels,
            pickers: getPickersForSource(movingFurniSource)
        },
        {
            value: targetSource,
            onChange: setTargetSource,
            options: targetOptions,
            titleKey: 'wiredfurni.params.sources.merged.title.target_location',
            labelPrefix: targetKind === TARGET_KIND_USER ? 'wiredfurni.params.sources.users' : 'wiredfurni.params.sources.furni',
            optionLabels: targetKind === TARGET_KIND_FURNI ? sourceOptionLabels : undefined,
            pickers: targetKind === TARGET_KIND_FURNI ? getPickersForSource(targetSource) : [],
            titleAccessory: (
                <WiredVariableTypeSelector
                    value={ targetKind === TARGET_KIND_USER ? WIRED_VARIABLE_USER : WIRED_VARIABLE_FURNI }
                    onChange={ value =>
                    {
                        const nextKind = value === WIRED_VARIABLE_USER ? TARGET_KIND_USER : TARGET_KIND_FURNI;
                        setTargetKind(nextKind);
                    } }
                    hiddenTypes={ [ WIRED_VARIABLE_GLOBAL, 3 ] } />
            )
        }
    ] as any;

    const save = () =>
    {
        if(Array.isArray(furniIds))
        {
            if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setSecondaryFurniIds(furniIds);
            else setPrimaryFurniIds(furniIds);
        }

        const savedPrimaryIds = (activePickSource === WIRED_SOURCE_SELECTED && Array.isArray(furniIds)) ? furniIds : primaryFurniIds;
        const savedSecondaryIds = (activePickSource === WIRED_SOURCE_SECONDARY_SELECTED && Array.isArray(furniIds)) ? furniIds : secondaryFurniIds;
        const normalizedTargetSource = normalizeSource(targetSource, targetOptions, targetKind === TARGET_KIND_USER ? WIRED_SOURCE_TRIGGER : WIRED_SOURCE_SELECTED);

        if(setFurniIds) setFurniIds(savedPrimaryIds);
        setStringParam(savedSecondaryIds.join(','));
        setIntParams([
            movingFurniSource,
            targetKind,
            normalizedTargetSource,
            offsetX,
            offsetY,
            savedPrimaryIds.length,
            ...savedPrimaryIds,
            savedSecondaryIds.length,
            ...savedSecondaryIds
        ]);

        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...savedPrimaryIds, ...savedSecondaryIds ]));
    }

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ true }
            sourceSelectors={ sourceSelectors }
            alwaysExpandedSources={ true }
            expanded={ true }>
            <WiredParam titleKey="wiredfurni.params.general_box_info" chevron expanded={ infoExpanded } onToggle={ () => setInfoExpanded(value => !value) }>
                <WiredInfoDesc textKey="wiredfurni.params.move_as_group.usage_info" />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.place_furni.offsets" divider={ false }>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.place_furni.offsets.x') }</WiredControlTitle>
                    <WiredTextInput compact type="number" min={ MIN_OFFSET } max={ MAX_OFFSET } value={ offsetX } onChange={ event => setOffsetX(clamp(Number(event.target.value || 0), MIN_OFFSET, MAX_OFFSET)) } />
                </Flex>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.place_furni.offsets.y') }</WiredControlTitle>
                    <WiredTextInput compact type="number" min={ MIN_OFFSET } max={ MAX_OFFSET } value={ offsetY } onChange={ event => setOffsetY(clamp(Number(event.target.value || 0), MIN_OFFSET, MAX_OFFSET)) } />
                </Flex>
            </WiredParam>
        </WiredEffectBaseView>
    );
}
