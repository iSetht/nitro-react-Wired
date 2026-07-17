import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { clampWiredValue, parseWiredData, WiredParam, WiredSlider } from '../WiredControls';

const MIN_EXECUTIONS = 1;
const MAX_EXECUTIONS = 100;
const DEFAULT_EXECUTIONS = 1;
const MIN_TIME_WINDOW_HALF_SECONDS = 1;
const MAX_TIME_WINDOW_HALF_SECONDS = 20;
const DEFAULT_TIME_WINDOW_HALF_SECONDS = 4;

interface ExecutionLimitData
{
    executions?: number;
    timeWindowHalfSeconds?: number;
}

const clamp = (value: number, min: number, max: number, fallback: number) =>
{
    if(!Number.isFinite(value) || value <= 0) return fallback;

    return clampWiredValue(value, min, max);
}

const formatSeconds = (halfSeconds: number) =>
{
    const seconds = halfSeconds / 2;

    return Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(1);
}

export const WiredExtraExecutionLimitView: FC<{}> = props =>
{
    const [ executions, setExecutions ] = useState(DEFAULT_EXECUTIONS);
    const [ timeWindowHalfSeconds, setTimeWindowHalfSeconds ] = useState(DEFAULT_TIME_WINDOW_HALF_SECONDS);
    const { trigger = null, setIntParams = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<ExecutionLimitData>(trigger?.stringData ?? ''), [ trigger ]);

    const save = () => setIntParams([
        clamp(executions, MIN_EXECUTIONS, MAX_EXECUTIONS, DEFAULT_EXECUTIONS),
        clamp(timeWindowHalfSeconds, MIN_TIME_WINDOW_HALF_SECONDS, MAX_TIME_WINDOW_HALF_SECONDS, DEFAULT_TIME_WINDOW_HALF_SECONDS)
    ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];

        setExecutions(clamp(intData[0] ?? data.executions ?? DEFAULT_EXECUTIONS, MIN_EXECUTIONS, MAX_EXECUTIONS, DEFAULT_EXECUTIONS));
        setTimeWindowHalfSeconds(clamp(intData[1] ?? data.timeWindowHalfSeconds ?? DEFAULT_TIME_WINDOW_HALF_SECONDS, MIN_TIME_WINDOW_HALF_SECONDS, MAX_TIME_WINDOW_HALF_SECONDS, DEFAULT_TIME_WINDOW_HALF_SECONDS));
    }, [ trigger, data ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam title={ LocalizeText('wiredfurni.params.setexecutions', [ 'amount' ], [ String(executions) ]) }>
                <WiredSlider
                    min={ MIN_EXECUTIONS }
                    max={ MAX_EXECUTIONS }
                    step={ 1 }
                    value={ executions }
                    onChange={ setExecutions } />
            </WiredParam>
            <WiredParam title={ LocalizeText('wiredfurni.params.settimewindow', [ 'timewindow' ], [ formatSeconds(timeWindowHalfSeconds) ]) } divider={ false }>
                <WiredSlider
                    min={ MIN_TIME_WINDOW_HALF_SECONDS }
                    max={ MAX_TIME_WINDOW_HALF_SECONDS }
                    step={ 1 }
                    value={ timeWindowHalfSeconds }
                    onChange={ setTimeWindowHalfSeconds } />
            </WiredParam>
        </WiredBaseView>
    );
}
