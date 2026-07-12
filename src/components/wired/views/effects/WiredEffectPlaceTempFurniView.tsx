import { ApplySnapshotMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText, SendMessageComposer, WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import {
    normalizeWiredSource,
    parseWiredData,
    WIRED_REFERENCE_FROM_VARIABLE,
    WIRED_REFERENCE_SET_VALUE,
    WIRED_SOURCE_SECONDARY_SELECTED,
    WIRED_SOURCE_SELECTED,
    WIRED_SOURCE_SELECTOR,
    WIRED_SOURCE_SIGNAL,
    WIRED_SOURCE_TRIGGER,
    WIRED_VARIABLE_CONTEXT,
    WIRED_VARIABLE_FURNI,
    WIRED_VARIABLE_GLOBAL,
    WIRED_VARIABLE_USER,
    WiredCheckbox,
    WiredControlTitle,
    WiredDisabled,
    WiredInfoDesc,
    WiredParam,
    WiredRadio,
    WiredTextInput,
    WiredValueOrVariable,
    WiredVariableNameSelect,
    WiredVariableTypeSelector
} from '../WiredControls';

const TARGET_LOCATION_SOURCE = 0;
const TARGET_LOCATION_CUSTOM = 1;
const TARGET_ALTITUDE_ON_TOP = 0;
const TARGET_ALTITUDE_SOURCE = 1;
const TARGET_ALTITUDE_CUSTOM = 2;
const SOURCE_SNAPSHOT = 110;
const WIRED_SOURCE_TILE_SELECTOR = 202;
const WIRED_SOURCE_TRIGGERING_TILE = 203;
const FURNI_SOURCES = [ SOURCE_SNAPSHOT, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED ];
const CUSTOM_FURNI_SOURCES = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SECONDARY_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_TILE_SELECTOR, WIRED_SOURCE_TRIGGERING_TILE, WIRED_SOURCE_SIGNAL ];
const REFERENCE_FURNI_SOURCES = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const USER_SOURCES = [ WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];
const PRIMARY_PICK_COLOR = '#7C8039';
const SECONDARY_PICK_COLOR = '#525892';
const PRIMARY_PICK_ICON = 'wired_furni_picks';
const SECONDARY_PICK_ICON = 'wired_furni_picks2';

interface PlaceTempFurniData
{
    spawnVariableName?: string;
    referenceVariableName?: string;
    referenceValue?: number;
    customTargetItemIds?: number[];
    customTargetSecondaryItemIds?: number[];
    globalVariables?: string[];
    furniVariables?: string[];
    userVariables?: string[];
    contextVariables?: string[];
    furniValueVariables?: string[];
    userValueVariables?: string[];
    contextValueVariables?: string[];
    referenceVariableType?: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const normalizeIds = (ids: any) => Array.isArray(ids) ? ids.filter(id => typeof id === 'number' && id !== 0) : [];
const uniqueFurniIds = (ids: number[]) => [ ...new Set(ids) ];
const getTriggerFurniIds = (triggerData: any) =>
{
    const ids = triggerData?.selectedItems ?? triggerData?.stuffIds ?? triggerData?.furniIds ?? triggerData?.items ?? [];

    if(!Array.isArray(ids)) return [];

    return ids
        .map(item => (typeof item === 'number') ? item : item?.id)
        .filter(id => typeof id === 'number');
}

const NumberBox: FC<{
    value: number;
    min: number;
    max: number;
    disabled?: boolean;
    onChange: (value: number) => void;
}> = props =>
{
    const { value, min, max, disabled = false, onChange } = props;

    return (
        <WiredTextInput
            compact
            type="number"
            min={ min }
            max={ max }
            value={ value }
            disabled={ disabled }
            onChange={ event => onChange(clamp(Number(event.target.value || 0), min, max)) } />
    );
}

export const WiredEffectPlaceTempFurniView: FC<{}> = props =>
{
    const [ targetLocation, setTargetLocation ] = useState(TARGET_LOCATION_SOURCE);
    const [ targetAltitude, setTargetAltitude ] = useState(TARGET_ALTITUDE_ON_TOP);
    const [ offsetXEnabled, setOffsetXEnabled ] = useState(false);
    const [ offsetX, setOffsetX ] = useState(0);
    const [ offsetYEnabled, setOffsetYEnabled ] = useState(false);
    const [ offsetY, setOffsetY ] = useState(0);
    const [ offsetAltitudeEnabled, setOffsetAltitudeEnabled ] = useState(false);
    const [ offsetAltitude, setOffsetAltitude ] = useState(0);
    const [ spawnWithVariable, setSpawnWithVariable ] = useState(false);
    const [ spawnVariableName, setSpawnVariableName ] = useState('');
    const [ referenceMode, setReferenceMode ] = useState(WIRED_REFERENCE_SET_VALUE);
    const [ referenceValue, setReferenceValue ] = useState('0');
    const [ referenceVariableType, setReferenceVariableType ] = useState(WIRED_VARIABLE_FURNI);
    const [ referenceVariableName, setReferenceVariableName ] = useState('');
    const [ placeFurniSource, setPlaceFurniSource ] = useState(SOURCE_SNAPSHOT);
    const [ customTargetType, setCustomTargetType ] = useState(WIRED_VARIABLE_FURNI);
    const [ customFurniSource, setCustomFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ customUserSource, setCustomUserSource ] = useState(WIRED_SOURCE_TRIGGER);
    const [ referenceSource, setReferenceSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ generalExpanded, setGeneralExpanded ] = useState(false);
    const [ targetLocationExpanded, setTargetLocationExpanded ] = useState(false);
    const [ targetAltitudeExpanded, setTargetAltitudeExpanded ] = useState(false);
    const [ offsetsExpanded, setOffsetsExpanded ] = useState(false);
    const [ spawnVariableExpanded, setSpawnVariableExpanded ] = useState(false);
    const [ sourceExpanded, setSourceExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null, furniIds = [], setFurniIds = null } = useWired() as any;
    const data = useMemo(() => parseWiredData<PlaceTempFurniData>(trigger?.stringData ?? ''), [ trigger ]);
    const initialSnapshotIds = useMemo(() => getTriggerFurniIds(trigger), [ trigger ]);
    const globalVariables = useMemo(() => data.globalVariables ?? [], [ data ]);
    const furniVariables = useMemo(() => data.furniVariables ?? [], [ data ]);
    const userVariables = useMemo(() => data.userVariables ?? [], [ data ]);
    const contextVariables = useMemo(() => data.contextVariables ?? [], [ data ]);
    const furniValueVariables = useMemo(() => data.furniValueVariables ?? [], [ data ]);
    const userValueVariables = useMemo(() => data.userValueVariables ?? [], [ data ]);
    const contextValueVariables = useMemo(() => data.contextValueVariables ?? [], [ data ]);
    const [ activePickSource, setActivePickSource ] = useState(SOURCE_SNAPSHOT);
    const [ snapshotFurniIds, setSnapshotFurniIds ] = useState<number[]>([]);
    const [ customTargetItemIds, setCustomTargetItemIds ] = useState<number[]>([]);
    const [ customTargetSecondaryItemIds, setCustomTargetSecondaryItemIds ] = useState<number[]>([]);
    const selectedFurniRef = useRef<number[]>([]);
    const customTargetNeeded = targetLocation === TARGET_LOCATION_CUSTOM || targetAltitude === TARGET_ALTITUDE_CUSTOM;
    const variableValueEnabled = spawnWithVariable && furniValueVariables.includes(spawnVariableName);
    const referenceNeeded = spawnWithVariable && variableValueEnabled && referenceMode === WIRED_REFERENCE_FROM_VARIABLE;
    const selectedCount = snapshotFurniIds.length;
    const customTargetSelectedCount = customTargetItemIds.length;
    const customTargetSecondaryCount = customTargetSecondaryItemIds.length;
    const selectionLimit = trigger?.maximumItemSelectionCount ?? 20;
    const snapshotLabel = `${ LocalizeText('wiredfurni.params.sources.furni.110') } [${ selectedCount }/${ selectionLimit }]`;
    const selectedPlaceLabel = `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ selectedCount }/${ selectionLimit }]`;
    const selectedTargetLabel = `${ LocalizeText('wiredfurni.params.sources.furni.100') } [${ customTargetSelectedCount }/${ selectionLimit }]`;
    const secondaryTargetLabel = `${ LocalizeText('wiredfurni.params.sources.furni.101') } [${ customTargetSecondaryCount }/${ selectionLimit }]`;
    const clearAndApplyFurniSelection = (nextFurniIds: number[], previousFurniIds: number[] = []) =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...snapshotFurniIds, ...customTargetItemIds, ...customTargetSecondaryItemIds, ...previousFurniIds, ...(Array.isArray(furniIds) ? furniIds : []) ]));

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

            if(activePickSource === WIRED_SOURCE_SELECTED) setCustomTargetItemIds(furniIds);
            else if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) setCustomTargetSecondaryItemIds(furniIds);
            else setSnapshotFurniIds(furniIds);
        }

        setActivePickSource(source);

        if(source === WIRED_SOURCE_SELECTED) clearAndApplyFurniSelection(customTargetItemIds, previousFurniIds);
        else if(source === WIRED_SOURCE_SECONDARY_SELECTED) clearAndApplyFurniSelection(customTargetSecondaryItemIds, previousFurniIds);
        else clearAndApplyFurniSelection(snapshotFurniIds, previousFurniIds);
    }
    const clearSelectedFurni = () =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...selectedFurniRef.current, ...(Array.isArray(furniIds) ? furniIds : []) ]));
    }
    const getPickersForSource = (source: number, useSnapshotForSelected = false) =>
    {
        if(source === SOURCE_SNAPSHOT || (useSnapshotForSelected && source === WIRED_SOURCE_SELECTED))
        {
            return [ {
                source: SOURCE_SNAPSHOT,
                icon: PRIMARY_PICK_ICON,
                color: PRIMARY_PICK_COLOR,
                selected: activePickSource === SOURCE_SNAPSHOT,
                onClick: () => selectPickSource(SOURCE_SNAPSHOT),
                variant: 'selected'
            } ];
        }

        if(source === WIRED_SOURCE_SELECTED)
        {
            return [ {
                source: WIRED_SOURCE_SELECTED,
                icon: PRIMARY_PICK_ICON,
                color: PRIMARY_PICK_COLOR,
                selected: activePickSource === WIRED_SOURCE_SELECTED,
                onClick: () => selectPickSource(WIRED_SOURCE_SELECTED),
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
                variant: 'secondary'
            } ];
        }

        return [];
    }
    const sourceSelectors = useMemo(() =>
    {
        const selectors: any[] = [ {
            value: placeFurniSource,
            onChange: setPlaceFurniSource,
            options: FURNI_SOURCES,
            titleKey: 'wiredfurni.params.sources.furni.title.place_furni',
            labelPrefix: 'wiredfurni.params.sources.furni',
            optionLabels: {
                [SOURCE_SNAPSHOT]: snapshotLabel,
                [WIRED_SOURCE_SELECTED]: selectedPlaceLabel,
                [WIRED_SOURCE_SECONDARY_SELECTED]: secondaryTargetLabel
            },
            pickers: getPickersForSource(placeFurniSource, true)
        } ];

        if(customTargetType === WIRED_VARIABLE_FURNI)
        {
            selectors.push({
                value: customFurniSource,
                onChange: setCustomFurniSource,
                options: CUSTOM_FURNI_SOURCES,
                titleKey: 'wiredfurni.params.sources.merged.title.custom_target',
                labelPrefix: 'wiredfurni.params.sources.furni',
                optionLabels: {
                    [WIRED_SOURCE_SELECTED]: selectedTargetLabel,
                    [WIRED_SOURCE_SECONDARY_SELECTED]: secondaryTargetLabel
                },
                pickers: getPickersForSource(customFurniSource),
                titleAccessory: (
                    <WiredVariableTypeSelector
                        value={ customTargetType }
                        onChange={ value => setCustomTargetType(value === WIRED_VARIABLE_USER ? WIRED_VARIABLE_USER : WIRED_VARIABLE_FURNI) }
                        hiddenTypes={ [ WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_CONTEXT ] } />
                ),
                disabled: !customTargetNeeded
            });
        }

        if(customTargetType === WIRED_VARIABLE_USER)
        {
            selectors.push({
                value: customUserSource,
                onChange: setCustomUserSource,
                options: USER_SOURCES,
                titleKey: 'wiredfurni.params.sources.merged.title.custom_target',
                labelPrefix: 'wiredfurni.params.sources.users',
                titleAccessory: (
                    <WiredVariableTypeSelector
                        value={ customTargetType }
                        onChange={ value => setCustomTargetType(value === WIRED_VARIABLE_USER ? WIRED_VARIABLE_USER : WIRED_VARIABLE_FURNI) }
                        hiddenTypes={ [ WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_CONTEXT ] } />
                ),
                disabled: !customTargetNeeded
            });
        }

        selectors.push({
            value: referenceSource,
            onChange: setReferenceSource,
            options: REFERENCE_FURNI_SOURCES,
            titleKey: 'wiredfurni.params.sources.merged.title.variables_reference',
            labelPrefix: 'wiredfurni.params.sources.furni',
            disabled: !referenceNeeded
        });

        return selectors;
    }, [ placeFurniSource, snapshotLabel, selectedPlaceLabel, referenceNeeded, referenceSource, customTargetNeeded, customTargetType, customFurniSource, customUserSource, selectedTargetLabel, secondaryTargetLabel, activePickSource ]);

    const save = () =>
    {
        let savedSnapshotIds = snapshotFurniIds;
        let savedCustomTargetIds = customTargetItemIds;
        let savedCustomTargetSecondaryIds = customTargetSecondaryItemIds;

        if(Array.isArray(furniIds))
        {
            if(activePickSource === WIRED_SOURCE_SELECTED) savedCustomTargetIds = furniIds;
            else if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED) savedCustomTargetSecondaryIds = furniIds;
            else savedSnapshotIds = furniIds;
        }

        if(setFurniIds) setFurniIds(savedSnapshotIds);
        setStringParam(JSON.stringify({
            spawnVariableName,
            referenceVariableType,
            referenceVariableName,
            referenceValue: Number(referenceValue || 0),
            customTargetItemIds: savedCustomTargetIds,
            customTargetSecondaryItemIds: savedCustomTargetSecondaryIds
        }));
        setIntParams([
            targetLocation,
            targetAltitude,
            offsetXEnabled ? 1 : 0,
            offsetX,
            offsetYEnabled ? 1 : 0,
            offsetY,
            offsetAltitudeEnabled ? 1 : 0,
            offsetAltitude,
            spawnWithVariable ? 1 : 0,
            referenceMode,
            placeFurniSource,
            customTargetType,
            customFurniSource,
            customUserSource,
            referenceSource
        ]);
        clearSelectedFurni();
    };

    useEffect(() =>
    {
        selectedFurniRef.current = uniqueFurniIds([ ...snapshotFurniIds, ...customTargetItemIds, ...customTargetSecondaryItemIds, ...(Array.isArray(furniIds) ? furniIds : []) ]);
    }, [ snapshotFurniIds, customTargetItemIds, customTargetSecondaryItemIds, furniIds ]);

    useEffect(() => () =>
    {
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(selectedFurniRef.current);
    }, []);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        setTargetLocation((intData[0] ?? 0) === TARGET_LOCATION_CUSTOM ? TARGET_LOCATION_CUSTOM : TARGET_LOCATION_SOURCE);
        setTargetAltitude([ TARGET_ALTITUDE_ON_TOP, TARGET_ALTITUDE_SOURCE, TARGET_ALTITUDE_CUSTOM ].includes(intData[1]) ? intData[1] : TARGET_ALTITUDE_ON_TOP);
        setOffsetXEnabled((intData[2] ?? 0) === 1);
        setOffsetX(clamp(intData[3] ?? 0, -64, 64));
        setOffsetYEnabled((intData[4] ?? 0) === 1);
        setOffsetY(clamp(intData[5] ?? 0, -64, 64));
        setOffsetAltitudeEnabled((intData[6] ?? 0) === 1);
        setOffsetAltitude(clamp(intData[7] ?? 0, -8000, 8000));
        setSpawnWithVariable((intData[8] ?? 0) === 1);
        setReferenceMode((intData[9] ?? 0) === WIRED_REFERENCE_FROM_VARIABLE ? WIRED_REFERENCE_FROM_VARIABLE : WIRED_REFERENCE_SET_VALUE);
        const hasPlaceFurniSource = intData.length > 14;
        setPlaceFurniSource(normalizeWiredSource(hasPlaceFurniSource ? intData[10] : SOURCE_SNAPSHOT, FURNI_SOURCES));
        const sourceOffset = hasPlaceFurniSource ? 1 : 0;
        setCustomTargetType((intData[10 + sourceOffset] ?? WIRED_VARIABLE_FURNI) === WIRED_VARIABLE_USER ? WIRED_VARIABLE_USER : WIRED_VARIABLE_FURNI);
        setCustomFurniSource(normalizeWiredSource(intData[11 + sourceOffset] ?? WIRED_SOURCE_SELECTED, CUSTOM_FURNI_SOURCES));
        setCustomUserSource(normalizeWiredSource(intData[12 + sourceOffset] ?? WIRED_SOURCE_TRIGGER, USER_SOURCES));
        setReferenceSource(normalizeWiredSource(intData[13 + sourceOffset] ?? WIRED_SOURCE_SELECTED, REFERENCE_FURNI_SOURCES));
        setSpawnVariableName(furniVariables.includes(data.spawnVariableName ?? '') ? data.spawnVariableName ?? '' : '');
        setReferenceVariableType([ WIRED_VARIABLE_FURNI, WIRED_VARIABLE_USER, WIRED_VARIABLE_GLOBAL, WIRED_VARIABLE_CONTEXT ].includes(data.referenceVariableType) ? data.referenceVariableType : WIRED_VARIABLE_FURNI);
        setReferenceVariableName(data.referenceVariableName ?? '');
        setReferenceValue(String(data.referenceValue ?? 0));
        setSnapshotFurniIds(initialSnapshotIds);
        setCustomTargetItemIds(normalizeIds(data.customTargetItemIds));
        setCustomTargetSecondaryItemIds(normalizeIds(data.customTargetSecondaryItemIds));
        setActivePickSource(SOURCE_SNAPSHOT);
        WiredSelectionVisualizer.clearSelectionShaderFromFurni(uniqueFurniIds([ ...initialSnapshotIds, ...normalizeIds(data.customTargetItemIds), ...normalizeIds(data.customTargetSecondaryItemIds) ]));
        if(initialSnapshotIds.length) WiredSelectionVisualizer.applySelectionShaderToFurni(initialSnapshotIds);
        if(setFurniIds) setFurniIds(initialSnapshotIds);
    }, [ trigger, data, furniVariables, initialSnapshotIds, setFurniIds ]);

    useEffect(() =>
    {
        if(!Array.isArray(furniIds)) return;

        if(activePickSource === WIRED_SOURCE_SELECTED)
        {
            setCustomTargetItemIds(furniIds);
            return;
        }

        if(activePickSource === WIRED_SOURCE_SECONDARY_SELECTED)
        {
            setCustomTargetSecondaryItemIds(furniIds);
            return;
        }

        setSnapshotFurniIds(furniIds);
    }, [ furniIds, activePickSource ]);

    const applySnapshotSlot = (
        <Text
            bitmapFont="il_regular"
            className="nw-link-underline"
            onClick={ () => SendMessageComposer(new ApplySnapshotMessageComposer(trigger?.id)) }>
            { LocalizeText('wiredfurni.applysnapshot') }
        </Text>
    );

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            hideFurniSelector={ true }
            sourceSelectors={ sourceSelectors }
            expanded={ sourceExpanded }
            onToggleExpanded={ () => setSourceExpanded(value => !value) }
            windowWidth={ 288 }
            headerSlot={ applySnapshotSlot }>
            <Column gap={ 1 }>
                <WiredParam
                    titleKey="wiredfurni.params.general_box_info"
                    chevron
                    expanded={ generalExpanded }
                    onToggle={ () => setGeneralExpanded(value => !value) }>
                    <WiredInfoDesc textKey="wiredfurni.params.place_furni.usage_info" />
                </WiredParam>

                <WiredParam
                    titleKey="wiredfurni.params.place_furni.target_location"
                    chevron
                    expanded={ targetLocationExpanded }
                    onToggle={ () => setTargetLocationExpanded(value => !value) }>
                    <Column gap={ 1 }>
                        <WiredRadio name="placeTempTargetLocation" checked={ targetLocation === TARGET_LOCATION_SOURCE } onChange={ () => setTargetLocation(TARGET_LOCATION_SOURCE) } label={ LocalizeText('wiredfurni.params.place_furni.target_location.0') } />
                        <div className="nw-indent-1">
                            <Text bitmapFont="il_regular" className="nw-furni-desc">{ LocalizeText('wiredfurni.params.place_furni.target_location.0.info') }</Text>
                        </div>
                        <WiredRadio name="placeTempTargetLocation" checked={ targetLocation === TARGET_LOCATION_CUSTOM } onChange={ () => setTargetLocation(TARGET_LOCATION_CUSTOM) } label={ LocalizeText('wiredfurni.params.place_furni.target_location.1') } />
                    </Column>
                </WiredParam>

                <WiredParam
                    titleKey="wiredfurni.params.place_furni.target_altitude"
                    chevron
                    expanded={ targetAltitudeExpanded }
                    onToggle={ () => setTargetAltitudeExpanded(value => !value) }>
                    <Column gap={ 1 }>
                        <WiredRadio name="placeTempTargetAltitude" checked={ targetAltitude === TARGET_ALTITUDE_ON_TOP } onChange={ () => setTargetAltitude(TARGET_ALTITUDE_ON_TOP) } label={ LocalizeText('wiredfurni.params.place_furni.target_altitude.0') } />
                        <WiredRadio name="placeTempTargetAltitude" checked={ targetAltitude === TARGET_ALTITUDE_SOURCE } onChange={ () => setTargetAltitude(TARGET_ALTITUDE_SOURCE) } label={ LocalizeText('wiredfurni.params.place_furni.target_altitude.1') } />
                        <WiredRadio name="placeTempTargetAltitude" checked={ targetAltitude === TARGET_ALTITUDE_CUSTOM } onChange={ () => setTargetAltitude(TARGET_ALTITUDE_CUSTOM) } label={ LocalizeText('wiredfurni.params.place_furni.target_altitude.2') } />
                    </Column>
                </WiredParam>

                <WiredParam
                    titleKey="wiredfurni.params.place_furni.offsets"
                    chevron
                    expanded={ offsetsExpanded }
                    onToggle={ () => setOffsetsExpanded(value => !value) }>
                    <Column gap={ 1 }>
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredCheckbox checked={ offsetXEnabled } onChange={ setOffsetXEnabled } label={ LocalizeText('wiredfurni.params.place_furni.offsets.x') } />
                            <NumberBox value={ offsetX } min={ -64 } max={ 64 } disabled={ !offsetXEnabled } onChange={ setOffsetX } />
                        </Flex>
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredCheckbox checked={ offsetYEnabled } onChange={ setOffsetYEnabled } label={ LocalizeText('wiredfurni.params.place_furni.offsets.y') } />
                            <NumberBox value={ offsetY } min={ -64 } max={ 64 } disabled={ !offsetYEnabled } onChange={ setOffsetY } />
                        </Flex>
                        <Flex alignItems="center" gap={ 1 }>
                            <WiredCheckbox checked={ offsetAltitudeEnabled } onChange={ setOffsetAltitudeEnabled } label={ LocalizeText('wiredfurni.params.place_furni.offsets.altitude') } />
                            <NumberBox value={ offsetAltitude } min={ -8000 } max={ 8000 } disabled={ !offsetAltitudeEnabled } onChange={ setOffsetAltitude } />
                        </Flex>
                    </Column>
                </WiredParam>

                <WiredParam
                    titleKey="wiredfurni.params.place_furni.spawn_with_variable"
                    chevron
                    expanded={ spawnVariableExpanded }
                    onToggle={ () => setSpawnVariableExpanded(value => !value) }
                    divider={ false }>
                    <Column gap={ 1 }>
                        <WiredCheckbox checked={ spawnWithVariable } onChange={ setSpawnWithVariable } label={ LocalizeText('wiredfurni.params.place_furni.spawn_with_variable') } />
                        <WiredDisabled disabled={ !spawnWithVariable }>
                            <WiredControlTitle>{ LocalizeText('wiredfurni.params.variables.variable_selection') }</WiredControlTitle>
                            <WiredVariableNameSelect
                                variableType={ WIRED_VARIABLE_FURNI }
                                variableName={ spawnVariableName }
                                onVariableNameChange={ setSpawnVariableName }
                                variables={ { furni: furniVariables } } />
                        </WiredDisabled>

                        <WiredDisabled disabled={ !variableValueEnabled }>
                            <WiredControlTitle>{ LocalizeText('wiredfurni.params.place_furni.spawn_with_value') }</WiredControlTitle>
                            <WiredValueOrVariable
                                radioName="placeTempReferenceMode"
                                mode={ referenceMode }
                                onModeChange={ setReferenceMode }
                                value={ referenceValue }
                                onValueChange={ setReferenceValue }
                                min={ -999999999 }
                                max={ 999999999 }
                                variableType={ referenceVariableType }
                                onVariableTypeChange={ type =>
                                {
                                    setReferenceVariableType(type);
                                    setReferenceVariableName('');
                                } }
                                variableName={ referenceVariableName }
                                onVariableNameChange={ setReferenceVariableName }
                                variables={ {
                                    global: globalVariables,
                                    furni: furniValueVariables,
                                    user: userValueVariables,
                                    context: contextValueVariables
                                } } />
                        </WiredDisabled>
                    </Column>
                </WiredParam>
            </Column>
        </WiredEffectBaseView>
    );
}
