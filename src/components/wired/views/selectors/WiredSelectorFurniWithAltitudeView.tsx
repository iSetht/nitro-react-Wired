import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';
import { WiredParam, WiredRadio, WiredSlider, WiredTextInput } from '../WiredControls';

const COMPARISON_LOWER_THAN = 0;
const COMPARISON_EQUALS = 1;
const COMPARISON_HIGHER_THAN = 2;

const clampAltitude = (value: number) =>
{
    if(isNaN(value)) return 0;

    if(value < 0) return 0;
    if(value > 80) return 80;

    return Math.round(value * 100) / 100;
}

const formatAltitude = (value: number) => clampAltitude(value).toFixed(2);

export const WiredSelectorFurniWithAltitudeView: FC<{}> = props =>
{
    const [ comparison, setComparison ] = useState(COMPARISON_EQUALS);
    const [ altitude, setAltitude ] = useState(0);
    const [ altitudeInput, setAltitudeInput ] = useState(formatAltitude(0));
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            comparison,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);

        setStringParam(formatAltitude(altitudeInput === '' ? 0 : altitude));
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setComparison((trigger.intData.length > 0) ? trigger.intData[0] : COMPARISON_EQUALS);
        const nextAltitude = clampAltitude(parseFloat(trigger.stringData || '0'));

        setAltitude(nextAltitude);
        setAltitudeInput(formatAltitude(nextAltitude));
    }, [ trigger ]);

    const onAltitudeInputChange = (value: string) =>
    {
        const nextValue = value.replace(/[^0-9.]/g, '');

        setAltitudeInput(nextValue);

        if(nextValue !== '') setAltitude(clampAltitude(parseFloat(nextValue)));
    };

    const commitAltitudeInput = () =>
    {
        const nextAltitude = altitudeInput === '' ? 0 : clampAltitude(parseFloat(altitudeInput));

        setAltitude(nextAltitude);
        setAltitudeInput(formatAltitude(nextAltitude));
    };

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 1 }
        >
            <WiredParam titleKey="wiredfurni.params.chattriggertype">
                { [ COMPARISON_LOWER_THAN, COMPARISON_EQUALS, COMPARISON_HIGHER_THAN ].map(value =>
                    <WiredRadio
                        key={ value }
                        name="altitudeComparison"
                        checked={ comparison === value }
                        onChange={ () => setComparison(value) }
                        label={ LocalizeText(`wiredfurni.params.comparison.${ value }`) } />
                ) }
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.setaltitude">
                <Flex alignItems="center" gap={ 1 }>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 0 }
                        max={ 80 }
                        step={ 0.01 }
                        value={ altitudeInput }
                        onChange={ event => onAltitudeInputChange(event.target.value) }
                        onBlur={ commitAltitudeInput } />
                </Flex>
                <WiredSlider
                    min={ 0 }
                    max={ 80 }
                    step={ 0.01 }
                    value={ altitude }
                    onChange={ event =>
                    {
                        const nextAltitude = clampAltitude(event);

                        setAltitude(nextAltitude);
                        setAltitudeInput(formatAltitude(nextAltitude));
                    } } />
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
