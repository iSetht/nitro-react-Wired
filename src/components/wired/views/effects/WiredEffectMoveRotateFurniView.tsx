import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredDirectionIconNames, WiredParam, WiredRadio, WiredRotationIconNames, WIRED_SOURCE_SELECTED } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, FURNI_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';

const MOVE_NONE = -1;
const MOVE_HORIZONTAL = 8;
const MOVE_VERTICAL = 9;
const MOVE_ALL = 10;

const directionRows: { value: number, icon: string }[][] = [
    [
        { value: 0, icon: WiredDirectionIconNames.north },
        { value: 1, icon: WiredDirectionIconNames.northEast },
        { value: 2, icon: WiredDirectionIconNames.east },
        { value: 3, icon: WiredDirectionIconNames.southEast }
    ],
    [
        { value: 4, icon: WiredDirectionIconNames.south },
        { value: 5, icon: WiredDirectionIconNames.southWest },
        { value: 6, icon: WiredDirectionIconNames.west },
        { value: 7, icon: WiredDirectionIconNames.northWest }
    ],
    [
        { value: MOVE_HORIZONTAL, icon: WiredDirectionIconNames.horizontal },
        { value: MOVE_VERTICAL, icon: WiredDirectionIconNames.vertical },
        { value: MOVE_ALL, icon: WiredDirectionIconNames.all }
    ]
];

const rotationOptions: number[] = [ 0, 1, 2, 3 ];

export const WiredEffectMoveRotateFurniView: FC<{}> = props =>
{
    const [ movement, setMovement ] = useState(MOVE_NONE);
    const [ rotation, setRotation ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const [ furniSource, setFurniSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_SELECTED, FURNI_SOURCE_OPTIONS);

    const save = () => setIntParams([ movement, rotation, furniSource ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setMovement(trigger.intData[0]);
            setRotation(trigger.intData[1]);
        }
        else
        {
            setMovement(MOVE_NONE);
            setRotation(0);
        }
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createFurniSourceSelector(furniSource, setFurniSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.movefurni">
                <Column gap={ 1 }>
                    <Flex alignItems="center">
                        <WiredRadio
                            name="movement"
                            checked={ movement === MOVE_NONE }
                            onChange={ () => setMovement(MOVE_NONE) }
                            label={ LocalizeText('wiredfurni.params.movefurni.0') } />
                    </Flex>

                    { directionRows.map((row, index) => (
                        <Flex key={ index } gap={ 2 } alignItems="center">
                            { row.map(option =>
                                <WiredRadio
                                    key={ option.value }
                                    name="movement"
                                    checked={ movement === option.value }
                                    onChange={ () => setMovement(option.value) }
                                    icon={ option.icon } />) }
                        </Flex>
                    )) }
                </Column>
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.rotatefurni" divider={ false }>
                { rotationOptions.map(option =>
                    <WiredRadio
                        key={ option }
                        name="rotation"
                        checked={ rotation === option }
                        onChange={ () => setRotation(option) }
                        icon={ option === 1 ? WiredRotationIconNames.clockwise : option === 2 ? WiredRotationIconNames.counterClockwise : undefined }
                        label={ LocalizeText(`wiredfurni.params.rotatefurni.${ option }`) } />) }
            </WiredParam>
        </WiredEffectBaseView>
    );
}
