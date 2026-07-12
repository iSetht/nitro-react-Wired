import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WiredParam, WiredRadio, WiredSlider, WIRED_SOURCE_SELECTED } from '../WiredControls';

const MAX_MINUTES = 99;
const MAX_HALF_SECONDS = 119;

const operators = [ 0, 1, 2 ];

const normalizeOperator = (operator: number) => operators.includes(operator) ? operator : 0;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const WiredEffectAdjustCounterTimeView: FC<{}> = props =>
{
    const [ operator, setOperator ] = useState(0);
    const [ minutes, setMinutes ] = useState(0);
    const [ halfSeconds, setHalfSeconds ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 3, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ operator, minutes, halfSeconds, furniSource ]);

    useEffect(() =>
    {
        setOperator(normalizeOperator((trigger.intData.length > 0) ? trigger.intData[0] : 0));
        setMinutes(clamp((trigger.intData.length > 1) ? trigger.intData[1] : 0, 0, MAX_MINUTES));
        setHalfSeconds(clamp((trigger.intData.length > 2) ? trigger.intData[2] : 0, 0, MAX_HALF_SECONDS));
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.comparison_selection">
                { operators.map(value =>
                    <WiredRadio
                        key={ value }
                        name="adjustCounterOperator"
                        checked={ operator === value }
                        onChange={ () => setOperator(value) }
                        label={ LocalizeText(`wiredfurni.params.operator.${ value }`) } />) }
            </WiredParam>
            <WiredParam title={ LocalizeText('wiredfurni.params.clock_minutes', [ 'minutes' ], [ String(minutes) ]) }>
                <WiredSlider
                    min={ 0 }
                    max={ MAX_MINUTES }
                    step={ 1 }
                    value={ minutes }
                    onChange={ value => setMinutes(value) } />
            </WiredParam>
            <WiredParam title={ LocalizeText('wiredfurni.params.clock_seconds', [ 'seconds' ], [ String(halfSeconds / 2) ]) } divider={ false }>
                <WiredSlider
                    min={ 0 }
                    max={ MAX_HALF_SECONDS }
                    step={ 1 }
                    value={ halfSeconds }
                    onChange={ value => setHalfSeconds(value) } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
