import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredControlText, WiredParam, WiredRadio, WiredSelect, WiredTextInput } from '../WiredControls';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const MODE_SKIP = 0;
const MODE_EXACT = 1;
const MODE_RANGE = 2;

const TIMEZONES = [
    'Europe/London',
    'America/Antigua',
    'America/Barbados',
    'America/Guyana',
    'America/Jamaica',
    'America/Puerto_Rico',
    'Australia/Adelaide',
    'Australia/Brisbane',
    'Australia/Darwin',
    'Australia/Eucla',
    'Australia/Lord_Howe',
    'Australia/Perth',
    'Australia/Sydney',
    'Canada/Atlantic',
    'Canada/Central',
    'Canada/Eastern',
    'Canada/Mountain',
    'Canada/Newfoundland',
    'Canada/Pacific',
    'Canada/Saskatchewan',
    'Canada/Yukon',
    'Pacific/Auckland',
    'US/Alaska',
    'US/Aleutian',
    'US/Arizona',
    'US/Central',
    'US/East-Indiana',
    'US/Eastern',
    'US/Hawaii',
    'US/Indiana-Starke',
    'US/Michigan',
    'US/Mountain',
    'US/Pacific',
    'US/Samoa'
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value) || 0));
const parseOrDefault = (value: string, fallback: number) =>
{
    const parsed = parseInt(value, 10);

    return isNaN(parsed) ? fallback : parsed;
}

interface TimeFieldProps
{
    prefix: string;
    mode: number;
    onModeChange: (mode: number) => void;
    valueA: number;
    onValueA: (value: number) => void;
    valueB: number;
    onValueB: (value: number) => void;
    min: number;
    max: number;
    titleKey: string;
}

const TimeField: FC<TimeFieldProps> = props =>
{
    const { prefix, mode, onModeChange, valueA, onValueA, valueB, onValueB, min, max, titleKey } = props;
    const handleA = (raw: string) => onValueA(clamp(parseOrDefault(raw, valueA), min, max));
    const handleB = (raw: string) => onValueB(clamp(parseOrDefault(raw, valueB), min, max));

    return (
        <WiredParam titleKey={ titleKey }>
            <WiredRadio name={ `${ prefix }Mode` } checked={ mode === MODE_SKIP } onChange={ () => onModeChange(MODE_SKIP) } label={ LocalizeText('wiredfurni.params.time.skip') } />

            <Flex alignItems="center" gap={ 1 }>
                <WiredRadio name={ `${ prefix }Mode` } checked={ mode === MODE_EXACT } onChange={ () => onModeChange(MODE_EXACT) } label={ LocalizeText('wiredfurni.params.time.exact') } />
                <WiredTextInput compact className="nw-w-32" type="number" min={ min } max={ max } value={ valueA } disabled={ mode !== MODE_EXACT } onChange={ event => handleA(event.target.value) } />
            </Flex>

            <Flex alignItems="center" gap={ 1 }>
                <WiredRadio name={ `${ prefix }Mode` } checked={ mode === MODE_RANGE } onChange={ () => onModeChange(MODE_RANGE) } label={ LocalizeText('wiredfurni.params.time.range') } />
                <WiredTextInput compact className="nw-w-32" type="number" min={ min } max={ max } value={ valueA } disabled={ mode !== MODE_RANGE } onChange={ event => handleA(event.target.value) } />
                <WiredControlText>-</WiredControlText>
                <WiredTextInput compact className="nw-w-32" type="number" min={ min } max={ max } value={ valueB } disabled={ mode !== MODE_RANGE } onChange={ event => handleB(event.target.value) } />
            </Flex>
        </WiredParam>
    );
}

export const WiredConditionTimeMatchesView: FC<{}> = () =>
{
    const [ hourMode, setHourMode ] = useState(MODE_SKIP);
    const [ hourA, setHourA ] = useState(0);
    const [ hourB, setHourB ] = useState(23);
    const [ minMode, setMinMode ] = useState(MODE_SKIP);
    const [ minA, setMinA ] = useState(0);
    const [ minB, setMinB ] = useState(59);
    const [ secMode, setSecMode ] = useState(MODE_SKIP);
    const [ secA, setSecA ] = useState(0);
    const [ secB, setSecB ] = useState(59);
    const [ timezone, setTimezone ] = useState(TIMEZONES[0]);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const save = () =>
    {
        setIntParams([ hourMode, hourA, hourB, minMode, minA, minB, secMode, secA, secB ]);
        setStringParam(timezone);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const p = trigger.intData ?? [];
        setHourMode(([ MODE_SKIP, MODE_EXACT, MODE_RANGE ].includes(p[0])) ? p[0] : MODE_SKIP);
        setHourA(clamp(p[1] ?? 0, 0, 23));
        setHourB(clamp(p[2] ?? 23, 0, 23));
        setMinMode(([ MODE_SKIP, MODE_EXACT, MODE_RANGE ].includes(p[3])) ? p[3] : MODE_SKIP);
        setMinA(clamp(p[4] ?? 0, 0, 59));
        setMinB(clamp(p[5] ?? 59, 0, 59));
        setSecMode(([ MODE_SKIP, MODE_EXACT, MODE_RANGE ].includes(p[6])) ? p[6] : MODE_SKIP);
        setSecA(clamp(p[7] ?? 0, 0, 59));
        setSecB(clamp(p[8] ?? 59, 0, 59));

        const nextTimezone = trigger.stringData ?? '';
        setTimezone(TIMEZONES.includes(nextTimezone) ? nextTimezone : TIMEZONES[0]);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <TimeField prefix="hour" mode={ hourMode } onModeChange={ setHourMode } valueA={ hourA } onValueA={ setHourA } valueB={ hourB } onValueB={ setHourB } min={ 0 } max={ 23 } titleKey="wiredfurni.params.time.hour_selection" />
            <TimeField prefix="min" mode={ minMode } onModeChange={ setMinMode } valueA={ minA } onValueA={ setMinA } valueB={ minB } onValueB={ setMinB } min={ 0 } max={ 59 } titleKey="wiredfurni.params.time.minute_selection" />
            <TimeField prefix="sec" mode={ secMode } onModeChange={ setSecMode } valueA={ secA } onValueA={ setSecA } valueB={ secB } onValueB={ setSecB } min={ 0 } max={ 59 } titleKey="wiredfurni.params.time.second_selection" />
            <WiredParam titleKey="wiredfurni.params.time.timezone_selection" divider={ false }>
                <WiredSelect value={ timezone } onChange={ event => setTimezone(event.target.value) } options={ TIMEZONES.map(timezone => ({ value: timezone, label: timezone })) } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
