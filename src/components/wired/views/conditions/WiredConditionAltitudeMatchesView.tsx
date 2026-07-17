import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredParamWithSlider, WiredRadioGroup } from '../WiredControls';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from '../effects/WiredEffectSourceSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WIRED_CONDITION_QUANTIFIER_ALL as QUANTIFIER_ALL, WIRED_CONDITION_QUANTIFIER_ANY as QUANTIFIER_ANY, WiredConditionQuantifierSection } from './WiredConditionUtils';

const SOURCE_SELECTED = 100;
const COMPARISON_LOWER_THAN = 0;
const COMPARISON_EQUALS = 1;
const COMPARISON_HIGHER_THAN = 2;
const COMPARISONS = [ COMPARISON_LOWER_THAN, COMPARISON_EQUALS, COMPARISON_HIGHER_THAN ];

const clampAltitude = (value: number) =>
{
    if (isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 80) return 80;
    return Math.round(value * 100) / 100;
};

const formatAltitude = (value: number) => clampAltitude(value).toFixed(2);

export const WiredConditionAltitudeMatchesView: FC<{}> = () =>
{
    const [ comparison, setComparison ] = useState(COMPARISON_EQUALS);
    const [ altitude, setAltitude ] = useState(0);
    const [ altitudeInput, setAltitudeInput ] = useState(formatAltitude(0));
    const [ quantifier, setQuantifier ] = useState(QUANTIFIER_ALL);

    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [ furniSource, setFurniSource, sourceExpanded, setSourceExpanded ] = useWiredEffectSource(trigger, 2, SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const expanded = quantifier !== QUANTIFIER_ALL || sourceExpanded;

    const save = () =>
    {
        setIntParams([ comparison, quantifier, furniSource ]);
        setStringParam(formatAltitude(altitudeInput === '' ? 0 : altitude));
    };

    useEffect(() =>
    {
        if (!trigger) return;

        setComparison(trigger.intData?.[0] ?? COMPARISON_EQUALS);
        setQuantifier(trigger.intData?.[1] ?? QUANTIFIER_ALL);
        const nextAltitude = clampAltitude(parseFloat(trigger.stringData || '0'));

        setAltitude(nextAltitude);
        setAltitudeInput(formatAltitude(nextAltitude));
    }, [ trigger ]);

    const onAltitudeInputChange = (value: string) =>
    {
        const nextValue = value.replace(/[^0-9.]/g, '');

        setAltitudeInput(nextValue);

        if (nextValue !== '') setAltitude(clampAltitude(parseFloat(nextValue)));
    };

    const commitAltitudeInput = () =>
    {
        const nextAltitude = altitudeInput === '' ? 0 : clampAltitude(parseFloat(altitudeInput));

        setAltitude(nextAltitude);
        setAltitudeInput(formatAltitude(nextAltitude));
    };

    const changeAltitude = (value: number) =>
    {
        const nextAltitude = clampAltitude(value);

        setAltitude(nextAltitude);
        setAltitudeInput(formatAltitude(nextAltitude));
    };

    return (
        <WiredConditionBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            advancedSlot={ <WiredConditionQuantifierSection kind="furni" name="altitudeQuantifier" value={ quantifier } onChange={ setQuantifier } /> }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                const next = !expanded;
                setSourceExpanded(next);
            } }>
            <WiredParam titleKey="wiredfurni.params.choose_type">
                <WiredRadioGroup
                    name="altitudeComparison"
                    value={ comparison }
                    onChange={ value => setComparison(Number(value)) }
                    options={ COMPARISONS.map(value => ({
                        value,
                        labelKey: `wiredfurni.params.comparison.${ value }`
                    })) } />
            </WiredParam>
            <WiredParamWithSlider
                titleKey="wiredfurni.params.setaltitude"
                value={ altitude }
                onChange={ changeAltitude }
                min={ 0 }
                max={ 80 }
                step={ 0.01 }
                inputValue={ altitudeInput }
                onInputChange={ onAltitudeInputChange }
                onInputBlur={ commitAltitudeInput }
                divider={ false } />
        </WiredConditionBaseView>
    );
}
