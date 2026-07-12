import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { WiredControlTitle, WiredParam, WiredRadio, WiredSlider, WiredTextInput } from '../WiredControls';

const OPERATION_ADD = 0;
const OPERATION_REMOVE = 1;

export const WiredEffectGivePointsToTeamView: FC<{}> = props =>
{
    const [ points, setPoints ] = useState(1);
    const [ operation, setOperation ] = useState(OPERATION_ADD);
    const [ selectedTeam, setSelectedTeam ] = useState(1);
    const { trigger = null, setIntParams = null } = useWired();

    const clampPoints = (value: number) => Math.min(1000, Math.max(1, value || 1));
    const save = () => setIntParams([ clampPoints(points), operation, selectedTeam ]);

    useEffect(() =>
    {
        setPoints(trigger.intData.length > 0 ? clampPoints(trigger.intData[0]) : 1);
        setOperation((trigger.intData.length > 1 && trigger.intData[1] === OPERATION_REMOVE) ? OPERATION_REMOVE : OPERATION_ADD);
        setSelectedTeam((trigger.intData.length > 2) ? trigger.intData[2] : 1);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam>
                <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.setpoints2') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 1 }
                        max={ 1000 }
                        value={ points }
                        onChange={ event => setPoints(clampPoints(parseInt(event.target.value))) } />
                </Flex>
                <WiredSlider
                    min={ 1 }
                    max={ 1000 }
                    value={ points }
                    onChange={ event => setPoints(clampPoints(event)) } />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.points_operation">
                { [ OPERATION_ADD, OPERATION_REMOVE ].map(value =>
                    <WiredRadio
                        key={ value }
                        name="teamPointsOperation"
                        checked={ operation === value }
                        onChange={ () => setOperation(value) }
                        label={ LocalizeText(`wiredfurni.params.points_operation.${ value }`) } />) }
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.team" divider={ false }>
                <Column gap={ 1 }>
                    <Flex gap={ 3 }>
                        { [ 1, 2 ].map(value =>
                            <WiredRadio
                                key={ value }
                                name="selectedTeam"
                                checked={ selectedTeam === value }
                                onChange={ () => setSelectedTeam(value) }
                                label={ LocalizeText(`wiredfurni.params.team.${ value }`) } />) }
                    </Flex>
                    <Flex gap={ 3 }>
                        { [ 3, 4 ].map(value =>
                            <WiredRadio
                                key={ value }
                                name="selectedTeam"
                                checked={ selectedTeam === value }
                                onChange={ () => setSelectedTeam(value) }
                                label={ LocalizeText(`wiredfurni.params.team.${ value }`) } />) }
                    </Flex>
                </Column>
            </WiredParam>
        </WiredEffectBaseView>
    );
}
