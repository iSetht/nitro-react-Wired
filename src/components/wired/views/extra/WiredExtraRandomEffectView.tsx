import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { clampWiredValue, parseWiredData, WiredParam, WiredSlider } from '../WiredControls';

const MIN_PICK_AMOUNT = 1;
const MAX_PICK_AMOUNT = 100;
const DEFAULT_PICK_AMOUNT = 1;
const MIN_SKIP_EXECUTIONS = 0;
const MAX_SKIP_EXECUTIONS = 100;
const DEFAULT_SKIP_EXECUTIONS = 0;

interface RandomEffectData
{
    pickAmount?: number;
    skipExecutions?: number;
}

const clamp = (value: number, min: number, max: number, fallback: number) =>
{
    if(!Number.isFinite(value) || value < min) return fallback;

    return clampWiredValue(value, min, max);
}

export const WiredExtraRandomEffectView: FC<{}> = props =>
{
    const [ pickAmount, setPickAmount ] = useState(DEFAULT_PICK_AMOUNT);
    const [ skipExecutions, setSkipExecutions ] = useState(DEFAULT_SKIP_EXECUTIONS);
    const { trigger = null, setIntParams = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<RandomEffectData>(trigger?.stringData ?? ''), [ trigger ]);

    const save = () => setIntParams([
        clamp(pickAmount, MIN_PICK_AMOUNT, MAX_PICK_AMOUNT, DEFAULT_PICK_AMOUNT),
        clamp(skipExecutions, MIN_SKIP_EXECUTIONS, MAX_SKIP_EXECUTIONS, DEFAULT_SKIP_EXECUTIONS)
    ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];

        setPickAmount(clamp(intData[0] ?? data.pickAmount ?? DEFAULT_PICK_AMOUNT, MIN_PICK_AMOUNT, MAX_PICK_AMOUNT, DEFAULT_PICK_AMOUNT));
        setSkipExecutions(clamp(intData[1] ?? data.skipExecutions ?? DEFAULT_SKIP_EXECUTIONS, MIN_SKIP_EXECUTIONS, MAX_SKIP_EXECUTIONS, DEFAULT_SKIP_EXECUTIONS));
    }, [ trigger, data ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam title={ LocalizeText('wiredfurni.params.pickamount', [ 'picks' ], [ String(pickAmount) ]) }>
                <WiredSlider
                    min={ MIN_PICK_AMOUNT }
                    max={ MAX_PICK_AMOUNT }
                    step={ 1 }
                    value={ pickAmount }
                    onChange={ setPickAmount } />
            </WiredParam>
            <WiredParam title={ LocalizeText('wiredfurni.params.skipactions', [ 'skips' ], [ String(skipExecutions) ]) } divider={ false }>
                <WiredSlider
                    min={ MIN_SKIP_EXECUTIONS }
                    max={ MAX_SKIP_EXECUTIONS }
                    step={ 1 }
                    value={ skipExecutions }
                    onChange={ setSkipExecutions } />
            </WiredParam>
        </WiredBaseView>
    );
}
