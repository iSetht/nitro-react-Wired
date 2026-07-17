import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredControlTitle, WiredParam, WiredRadio, WiredSlider, WiredTextInput, WIRED_SOURCE_SELECTED } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';

const MIN_ALTITUDE = 0;
const MAX_ALTITUDE = 80;
const ALTITUDE_STEP = 0.01;

const operatorOptions = [ 0, 1, 2 ];

const clampAltitude = (value: number) =>
{
    if(!Number.isFinite(value)) return MIN_ALTITUDE;

    return Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, Math.round(value * 100) / 100));
}

const formatAltitude = (value: number) => clampAltitude(value).toFixed(2);

export const WiredEffectSetFurniAltitudeView: FC<{}> = props =>
{
    const [ operator, setOperator ] = useState(0);
    const [ altitude, setAltitude ] = useState(0);
    const [ altitudeInput, setAltitudeInput ] = useState(formatAltitude(0));
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () =>
    {
        const normalizedAltitude = altitudeInput === '' ? 0 : altitude;

        setIntParams([ operator, furniSource ]);
        setStringParam(formatAltitude(normalizedAltitude));
    }

    useEffect(() =>
    {
        setOperator((trigger.intData.length > 0) ? trigger.intData[0] : 0);
        const nextAltitude = trigger.stringData ? clampAltitude(parseFloat(trigger.stringData)) : 0;

        setAltitude(nextAltitude);
        setAltitudeInput(formatAltitude(nextAltitude));
    }, [ trigger ]);

    const changeAltitudeInput = (value: string) =>
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
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.chattriggertype">
                { operatorOptions.map(option =>
                    <WiredRadio
                        key={ option }
                        name="altitudeOperator"
                        checked={ operator === option }
                        onChange={ () => setOperator(option) }
                        label={ LocalizeText(`wiredfurni.params.operator.${ option }`) } />) }
            </WiredParam>
            <WiredParam divider={ false }>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.setaltitude') }</WiredControlTitle>
                    <WiredTextInput
                        type="number"
                        compact
                        min={ MIN_ALTITUDE }
                        max={ MAX_ALTITUDE }
                        step={ ALTITUDE_STEP }
                        value={ altitudeInput }
                        onChange={ event => changeAltitudeInput(event.target.value) }
                        onBlur={ commitAltitudeInput } />
                </Flex>
                <WiredSlider
                    min={ MIN_ALTITUDE }
                    max={ MAX_ALTITUDE }
                    step={ ALTITUDE_STEP }
                    value={ altitude }
                    onChange={ event =>
                    {
                        const nextAltitude = clampAltitude(event);

                        setAltitude(nextAltitude);
                        setAltitudeInput(formatAltitude(nextAltitude));
                    } } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
