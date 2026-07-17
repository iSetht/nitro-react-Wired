import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { clampWiredValue, parseWiredData, WiredControlTitle, WiredParam, WiredSlider, WiredTextInput } from '../WiredControls';

const MIN_ANIMATION_TIME_MS = 50;
const MAX_ANIMATION_TIME_MS = 2000;
const STEP_ANIMATION_TIME_MS = 50;
const DEFAULT_ANIMATION_TIME_MS = 500;

interface AnimationTimeData
{
    animationTimeMs?: number;
}

const clampAnimationTime = (value: number) =>
{
    if(!Number.isFinite(value) || value <= 0) return DEFAULT_ANIMATION_TIME_MS;

    const clamped = clampWiredValue(value, MIN_ANIMATION_TIME_MS, MAX_ANIMATION_TIME_MS);

    return Math.round(clamped / STEP_ANIMATION_TIME_MS) * STEP_ANIMATION_TIME_MS;
}

export const WiredExtraAnimationTimeView: FC<{}> = props =>
{
    const [ animationTimeMs, setAnimationTimeMs ] = useState(DEFAULT_ANIMATION_TIME_MS);
    const { trigger = null, setIntParams = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<AnimationTimeData>(trigger?.stringData ?? ''), [ trigger ]);
    const save = () => setIntParams([ clampAnimationTime(animationTimeMs) ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];

        setAnimationTimeMs(clampAnimationTime(intData[0] ?? data.animationTimeMs ?? DEFAULT_ANIMATION_TIME_MS));
    }, [ trigger, data ]);

    const updateAnimationTime = (value: number) => setAnimationTimeMs(clampAnimationTime(value));

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <WiredParam divider={ false }>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.setanimationtime2') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ MIN_ANIMATION_TIME_MS }
                        max={ MAX_ANIMATION_TIME_MS }
                        step={ STEP_ANIMATION_TIME_MS }
                        value={ animationTimeMs }
                        onChange={ event => updateAnimationTime(Number(event.target.value)) } />
                </Flex>
                <WiredSlider
                    min={ MIN_ANIMATION_TIME_MS }
                    max={ MAX_ANIMATION_TIME_MS }
                    step={ STEP_ANIMATION_TIME_MS }
                    value={ animationTimeMs }
                    onChange={ updateAnimationTime } />
            </WiredParam>
        </WiredBaseView>
    );
}
