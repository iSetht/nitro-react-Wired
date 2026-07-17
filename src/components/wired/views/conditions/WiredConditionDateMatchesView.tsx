import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredControlText, WiredParam, WiredRadio, WiredSelect, WiredTextInput } from '../WiredControls';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const MODE_SKIP = 0;
const MODE_EXACT = 1;
const MODE_RANGE = 2;

const WEEKDAYS = [
    { day: 1, label: 'wiredfurni.params.time.weekday.1' },
    { day: 2, label: 'wiredfurni.params.time.weekday.2' },
    { day: 3, label: 'wiredfurni.params.time.weekday.3' },
    { day: 4, label: 'wiredfurni.params.time.weekday.4' },
    { day: 5, label: 'wiredfurni.params.time.weekday.5' },
    { day: 6, label: 'wiredfurni.params.time.weekday.6' },
    { day: 7, label: 'wiredfurni.params.time.weekday.7' }
];

const MONTHS = [
    { month: 1, label: 'wiredfurni.params.time.month.1' },
    { month: 2, label: 'wiredfurni.params.time.month.2' },
    { month: 3, label: 'wiredfurni.params.time.month.3' },
    { month: 4, label: 'wiredfurni.params.time.month.4' },
    { month: 5, label: 'wiredfurni.params.time.month.5' },
    { month: 6, label: 'wiredfurni.params.time.month.6' },
    { month: 7, label: 'wiredfurni.params.time.month.7' },
    { month: 8, label: 'wiredfurni.params.time.month.8' },
    { month: 9, label: 'wiredfurni.params.time.month.9' },
    { month: 10, label: 'wiredfurni.params.time.month.10' },
    { month: 11, label: 'wiredfurni.params.time.month.11' },
    { month: 12, label: 'wiredfurni.params.time.month.12' }
];

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

const chunkArray = <T,>(items: T[], size: number) =>
{
    const chunks: T[][] = [];

    for(let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));

    return chunks;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value) || 0));
const parseOrDefault = (value: string, fallback: number) =>
{
    const parsed = parseInt(value, 10);

    return isNaN(parsed) ? fallback : parsed;
}
const bitSet = (mask: number, bit: number) => (mask & (1 << (bit - 1))) !== 0;
const bitToggle = (mask: number, bit: number) => mask ^ (1 << (bit - 1));

interface DateRangeFieldProps
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

const DateRangeField: FC<DateRangeFieldProps> = props =>
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

export const WiredConditionDateMatchesView: FC<{}> = () =>
{
    const [ weekdayMask, setWeekdayMask ] = useState(0);
    const [ dayMode, setDayMode ] = useState(MODE_SKIP);
    const [ dayA, setDayA ] = useState(1);
    const [ dayB, setDayB ] = useState(31);
    const [ monthMask, setMonthMask ] = useState(0);
    const [ yearMode, setYearMode ] = useState(MODE_SKIP);
    const [ yearA, setYearA ] = useState(2024);
    const [ yearB, setYearB ] = useState(2024);
    const [ timezone, setTimezone ] = useState(TIMEZONES[0]);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const save = () =>
    {
        setIntParams([ weekdayMask, dayMode, dayA, dayB, monthMask, yearMode, yearA, yearB ]);
        setStringParam(timezone);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        const p = trigger.intData ?? [];
        setWeekdayMask(p[0] ?? 0);
        setDayMode(([ MODE_SKIP, MODE_EXACT, MODE_RANGE ].includes(p[1])) ? p[1] : MODE_SKIP);
        setDayA(clamp(p[2] ?? 1, 1, 31));
        setDayB(clamp(p[3] ?? 31, 1, 31));
        setMonthMask(p[4] ?? 0);
        setYearMode(([ MODE_SKIP, MODE_EXACT, MODE_RANGE ].includes(p[5])) ? p[5] : MODE_SKIP);
        setYearA(clamp(p[6] ?? 2024, 0, 9999));
        setYearB(clamp(p[7] ?? 2024, 0, 9999));

        const nextTimezone = trigger.stringData ?? '';
        setTimezone(TIMEZONES.includes(nextTimezone) ? nextTimezone : TIMEZONES[0]);
    }, [ trigger ]);

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam titleKey="wiredfurni.params.time.weekday_selection">
                { chunkArray(WEEKDAYS, 2).map((row, rowIndex) => (
                    <Flex key={ rowIndex } gap={ 2 }>
                        { row.map(({ day, label }) => (
                            <WiredCheckbox key={ day } className="nw-checkbox-grid-weekday" checked={ bitSet(weekdayMask, day) } onChange={ () => setWeekdayMask(bitToggle(weekdayMask, day)) } label={ LocalizeText(label) } />
                        )) }
                    </Flex>
                )) }
            </WiredParam>

            <DateRangeField prefix="day" mode={ dayMode } onModeChange={ setDayMode } valueA={ dayA } onValueA={ setDayA } valueB={ dayB } onValueB={ setDayB } min={ 1 } max={ 31 } titleKey="wiredfurni.params.time.day_selection" />

            <WiredParam titleKey="wiredfurni.params.time.month_selection">
                { chunkArray(MONTHS, 3).map((row, rowIndex) => (
                    <Flex key={ rowIndex } gap={ 1 }>
                        { row.map(({ month, label }) => (
                            <WiredCheckbox key={ month } className="nw-checkbox-grid-month" checked={ bitSet(monthMask, month) } onChange={ () => setMonthMask(bitToggle(monthMask, month)) } label={ LocalizeText(label) } />
                        )) }
                    </Flex>
                )) }
            </WiredParam>

            <DateRangeField prefix="year" mode={ yearMode } onModeChange={ setYearMode } valueA={ yearA } onValueA={ setYearA } valueB={ yearB } onValueB={ setYearB } min={ 0 } max={ 9999 } titleKey="wiredfurni.params.time.year_selection" />

            <WiredParam titleKey="wiredfurni.params.time.timezone_selection" divider={ false }>
                <WiredSelect value={ timezone } onChange={ event => setTimezone(event.target.value) } options={ TIMEZONES.map(timezone => ({ value: timezone, label: timezone })) } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
