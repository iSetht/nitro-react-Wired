import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { WiredParam, WiredRadio, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const TEAM_RED = 1;
const TEAM_GREEN = 2;
const TEAM_BLUE = 3;
const TEAM_YELLOW = 4;
const TEAM_TYPE_WIRED = 0;
const TEAM_TYPE_BATTLE_BANZAI = 1;
const TEAM_TYPE_FREEZE = 2;

const teamRows: number[][] = [
    [ TEAM_RED, TEAM_GREEN ],
    [ TEAM_BLUE, TEAM_YELLOW ]
];

const teamTypes: number[] = [ TEAM_TYPE_WIRED, TEAM_TYPE_BATTLE_BANZAI, TEAM_TYPE_FREEZE ];
const getTeamType = (type: number) => teamTypes.includes(type) ? type : TEAM_TYPE_WIRED;

export const WiredEffectJoinTeamView: FC<{}> = props =>
{
    const [ selectedTeam, setSelectedTeam ] = useState(TEAM_RED);
    const [ teamType, setTeamType ] = useState(TEAM_TYPE_WIRED);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const save = () => setIntParams([ selectedTeam, teamType, userSource ]);

    useEffect(() =>
    {
        setSelectedTeam((trigger.intData.length > 0) ? trigger.intData[0] : TEAM_RED);
        setTeamType((trigger.intData.length > 1) ? getTeamType(trigger.intData[1]) : TEAM_TYPE_WIRED);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.team">
                <Column gap={ 1 }>
                    { teamRows.map((row, index) => (
                        <Flex key={ index } gap={ 3 } alignItems="center">
                            { row.map(team =>
                                <WiredRadio
                                    key={ team }
                                    name="selectedTeam"
                                    checked={ selectedTeam === team }
                                    onChange={ () => setSelectedTeam(team) }
                                    label={ LocalizeText(`wiredfurni.params.team.${ team }`) } />) }
                        </Flex>
                    )) }
                </Column>
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.chattriggertype" divider={ false }>
                { teamTypes.map(type =>
                    <WiredRadio
                        key={ type }
                        name="teamType"
                        checked={ teamType === type }
                        onChange={ () => setTeamType(type) }
                        label={ LocalizeText(`wiredfurni.params.team_type.${ type }`) } />) }
            </WiredParam>
        </WiredEffectBaseView>
    );
}
