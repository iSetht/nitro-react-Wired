import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredDirectionIconNames, WiredParam, WiredRadio, WiredRotationIconNames, WIRED_SOURCE_TRIGGER } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, USER_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';

const MOVEMENT_NONE = -1;
const ROTATION_NONE = -1;
const ROTATE_CLOCKWISE = 8;
const ROTATE_COUNTER_CLOCKWISE = 9;

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
    ]
];

const movementOptions: { value: number, icon?: string, labelKey?: string }[][] = [
    [
        {
            value: MOVEMENT_NONE,
            labelKey: 'wiredfurni.params.movefurni.0'
        }
    ],
    ...directionRows
];

const rotationOptions: { value: number, icon?: string, labelKey?: string }[][] = [
    [
        {
            value: ROTATION_NONE,
            labelKey: 'wiredfurni.params.rotatefurni.0'
        }
    ],
    ...directionRows,
    [
        {
            value: ROTATE_CLOCKWISE,
            icon: WiredRotationIconNames.clockwise
        },
        {
            value: ROTATE_COUNTER_CLOCKWISE,
            icon: WiredRotationIconNames.counterClockwise
        }
    ]
];

export const WiredEffectMoveRotateUserView: FC<{}> = props =>
{
    const [ movement, setMovement ] = useState(MOVEMENT_NONE);
    const [ rotation, setRotation ] = useState(ROTATION_NONE);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const save = () => setIntParams([ movement, rotation, userSource ]);

    useEffect(() =>
    {
        if(trigger.intData.length >= 2)
        {
            setMovement(trigger.intData[0]);
            setRotation(trigger.intData[1]);
        }
        else
        {
            setMovement(MOVEMENT_NONE);
            setRotation(ROTATION_NONE);
        }
    }, [ trigger ]);

    const renderOptions = (name: string, options: { value: number, icon?: string, labelKey?: string }[][], selected: number, setSelected: (value: number) => void) =>
    {
        return options.map((row, index) =>
        {
            return (
                <Flex key={ index } gap={ 2 }>
                    { row.map(option =>
                    {
                        return (
                            <WiredRadio
                                key={ option.value }
                                name={ name }
                                checked={ selected === option.value }
                                onChange={ () => setSelected(option.value) }
                                icon={ option.icon }
                                label={ option.labelKey ? LocalizeText(option.labelKey) : null } />
                        )
                    }) }
                </Flex>
            )
        });
    }

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.moveuser">
                <Column gap={ 1 }>
                { renderOptions('movement', movementOptions, movement, setMovement) }
                </Column>
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.rotateuser" divider={ false }>
                <Column gap={ 1 }>
                { renderOptions('rotation', rotationOptions, rotation, setRotation) }
                </Column>
            </WiredParam>
        </WiredEffectBaseView>
    );
}
