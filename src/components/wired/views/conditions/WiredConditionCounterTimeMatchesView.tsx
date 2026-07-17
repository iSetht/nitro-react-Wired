import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio, WiredSlider } from '../WiredControls';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_SELECTED  = 100;
const MAX_MINUTES      = 99;
const MAX_HALF_SECONDS = 119;

const COMPARISONS = [ 0, 1, 2 ];

const normalizeComparison = (v: number) => COMPARISONS.includes(v) ? v : 0;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const WiredConditionCounterTimeMatchesView: FC<{}> = () =>
{
    const [ comparison,  setComparison  ] = useState(0);
    const [ minutes,     setMinutes     ] = useState(0);
    const [ halfSeconds, setHalfSeconds ] = useState(0);
    const [ quantifier,  setQuantifier  ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 4, SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () => setIntParams([ comparison, minutes, halfSeconds, quantifier, furniSource ]);

    useEffect(() =>
    {
        if (!trigger) return;

        setComparison(normalizeComparison(trigger.intData?.[0] ?? 0));
        setMinutes(clamp(trigger.intData?.[1] ?? 0, 0, MAX_MINUTES));
        setHalfSeconds(clamp(trigger.intData?.[2] ?? 0, 0, MAX_HALF_SECONDS));
        setQuantifier(trigger.intData?.[3] ?? QUANTIFIER_ALL);
    }, [ trigger ]);

    const quantifierSlot = (
        <WiredConditionQuantifierSection kind="furni" name="counterQuantifier" value={ quantifier } onChange={ setQuantifier } />
    );

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            advancedSlot={ quantifierSlot }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                const next = !expanded;
                setSourceExpanded(next);
            } }>
            <WiredParam titleKey="wiredfurni.params.choose_type">
                { COMPARISONS.map(value => (
                    <WiredRadio
                        key={ value }
                        name="counterComparison"
                        checked={ comparison === value }
                        onChange={ () => setComparison(value) }
                        label={ LocalizeText(`wiredfurni.params.comparison.${ value }`) } />
                )) }
            </WiredParam>
            <WiredParam title={ LocalizeText('wiredfurni.params.clock_minutes_elapsed', [ 'minutes' ], [ String(minutes) ]) }>
                <WiredSlider
                    min={ 0 }
                    max={ MAX_MINUTES }
                    step={ 1 }
                    value={ minutes }
                    onChange={ value => setMinutes(value) } />
            </WiredParam>
            <WiredParam title={ LocalizeText('wiredfurni.params.clock_seconds_elapsed', [ 'seconds' ], [ String(halfSeconds / 2) ]) } divider={ false }>
                <WiredSlider
                    min={ 0 }
                    max={ MAX_HALF_SECONDS }
                    step={ 1 }
                    value={ halfSeconds }
                    onChange={ value => setHalfSeconds(value) } />
            </WiredParam>
        </WiredConditionBaseView>
    );
}
