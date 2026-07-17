import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { parseWiredData, WiredCheckbox, WiredInfoDesc, WiredParam, WiredSelect, WiredTextInput } from '../WiredControls';

const SOURCE_VALUE = 0;
const SOURCE_CREATED_AT = 1;
const SOURCE_UPDATED_AT = 2;

const STANDARD_SUBVARIABLES = [
    [ 'wiredfurni.params.time_util.subvariable.1', 'milliseconds_of_seconds' ],
    [ 'wiredfurni.params.time_util.subvariable.2', 'seconds_of_minute' ],
    [ 'wiredfurni.params.time_util.subvariable.3', 'minute_of_hour' ],
    [ 'wiredfurni.params.time_util.subvariable.4', 'hour_of_day' ],
    [ 'wiredfurni.params.time_util.subvariable.5', 'day_of_week' ],
    [ 'wiredfurni.params.time_util.subvariable.6', 'day_of_month' ],
    [ 'wiredfurni.params.time_util.subvariable.7', 'day_of_year' ],
    [ 'wiredfurni.params.time_util.subvariable.8', 'week_of_year' ],
    [ 'wiredfurni.params.time_util.subvariable.9', 'month_of_year' ],
    [ 'wiredfurni.params.time_util.subvariable.10', 'year' ]
] as const;

const ADVANCED_SUBVARIABLES = [
    [ 'wiredfurni.params.time_util.subvariable.1', 'millisecond' ],
    [ 'wiredfurni.params.time_util.subvariable.2', 'second' ],
    [ 'wiredfurni.params.time_util.subvariable.3', 'minute' ],
    [ 'wiredfurni.params.time_util.subvariable.4', 'hour' ],
    [ 'wiredfurni.params.time_util.subvariable.24', 'day' ],
    [ 'wiredfurni.params.time_util.subvariable.25', 'week' ],
    [ 'wiredfurni.params.time_util.subvariable.26', 'month' ]
] as const;

interface TimeUtilitiesData
{
    sourceMode?: number;
    standardMask?: number;
    advancedMask?: number;
}

const normalizeSourceMode = (value: number) => value === SOURCE_CREATED_AT || value === SOURCE_UPDATED_AT ? value : SOURCE_VALUE;
const hasBit = (mask: number, index: number) => ((mask >> index) & 1) === 1;
const toggleBit = (mask: number, index: number, enabled: boolean) => enabled ? (mask | (1 << index)) : (mask & ~(1 << index));

const localizedFallback = (key: string, fallback: string) =>
{
    const value = LocalizeText(key);

    return value && value !== key ? value : fallback;
};

const SubvariableRows: FC<{
    rows: readonly (readonly [ string, string ])[];
    mask: number;
    onChange: (mask: number) => void;
}> = props =>
{
    const { rows, mask, onChange } = props;

    return (
        <Column gap={ 1 }>
            { rows.map(([ labelKey, name ], index) =>
                <Flex key={ name } className="nw-time-util-row" alignItems="center" gap={ 1 }>
                    <WiredCheckbox
                        className="nw-time-util-choice"
                        checked={ hasBit(mask, index) }
                        onChange={ checked => onChange(toggleBit(mask, index, checked)) }
                        label={ localizedFallback(labelKey, name) } />
                    <WiredTextInput
                        className="nw-time-util-input"
                        readOnly
                        disabled={ !hasBit(mask, index) }
                        value={ name } />
                </Flex>) }
        </Column>
    );
};

export const WiredExtraTimeUtilitiesView: FC<{}> = props =>
{
    const [ sourceMode, setSourceMode ] = useState(SOURCE_VALUE);
    const [ standardMask, setStandardMask ] = useState(0);
    const [ advancedMask, setAdvancedMask ] = useState(0);
    const [ standardExpanded, setStandardExpanded ] = useState(true);
    const [ advancedExpanded, setAdvancedExpanded ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<TimeUtilitiesData>(trigger?.stringData ?? ''), [ trigger ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];

        setSourceMode(normalizeSourceMode(intData[0] ?? data.sourceMode ?? SOURCE_VALUE));
        setStandardMask(intData[1] ?? data.standardMask ?? 0);
        setAdvancedMask(intData[2] ?? data.advancedMask ?? 0);
    }, [ trigger, data ]);

    const save = () =>
    {
        const normalizedSourceMode = normalizeSourceMode(sourceMode);

        setIntParams([ normalizedSourceMode, standardMask, advancedMask ]);
        setStringParam(JSON.stringify({
            sourceMode: normalizedSourceMode,
            standardMask,
            advancedMask
        }));
    };

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam titleKey="wiredfurni.params.chattriggertype">
                <WiredSelect
                    value={ sourceMode }
                    onChange={ event => setSourceMode(normalizeSourceMode(Number(event.target.value))) }
                    options={ [
                        { value: SOURCE_VALUE, label: localizedFallback('wiredfurni.params.time_util.mode.0', 'Value') },
                        { value: SOURCE_CREATED_AT, label: localizedFallback('wiredfurni.params.variables.compare_value.0', 'Creation Time') },
                        { value: SOURCE_UPDATED_AT, label: localizedFallback('wiredfurni.params.variables.compare_value.1', 'Last Update Time') }
                    ] } />
            </WiredParam>

            <WiredParam chevron titleKey="wiredfurni.params.create_subvariables" expanded={ standardExpanded } onToggle={ () => setStandardExpanded(value => !value) }><SubvariableRows rows={ STANDARD_SUBVARIABLES } mask={ standardMask } onChange={ setStandardMask } /></WiredParam>

            <WiredParam chevron titleKey="wiredfurni.params.create_subvariables.advanced" expanded={ advancedExpanded } onToggle={ () => setAdvancedExpanded(value => !value) } divider={ false }><WiredInfoDesc textKey="wiredfurni.params.time_util.advanced_info" /><SubvariableRows rows={ ADVANCED_SUBVARIABLES } mask={ advancedMask } onChange={ setAdvancedMask } /></WiredParam>
        </WiredBaseView>
    );
};
