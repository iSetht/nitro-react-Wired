import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';
import { WiredControlTitle, WiredParam, WiredRadio, WiredSlider, WiredTextInput } from '../WiredControls';

const TEAM_ANY = 0;
const TEAM_RED = 1;
const TEAM_GREEN = 2;
const TEAM_BLUE = 3;
const TEAM_YELLOW = 4;

const TEAM_OPTIONS = [
    { value: TEAM_ANY, label: 'wiredfurni.params.team.any' },
    { value: TEAM_RED, label: 'wiredfurni.params.team.1' },
    { value: TEAM_GREEN, label: 'wiredfurni.params.team.2' },
    { value: TEAM_BLUE, label: 'wiredfurni.params.team.3' },
    { value: TEAM_YELLOW, label: 'wiredfurni.params.team.4' },
];

const normalizeScore = (value: number) => Math.max(1, Math.min(1000, value || 1));
const normalizeTeam = (value: number) => (value >= TEAM_ANY && value <= TEAM_YELLOW) ? value : TEAM_ANY;

export const WiredTriggerScoreAchievedView: FC<{}> = props =>
{
    const [ points, setPoints ] = useState(1);
    const [ selectedTeam, setSelectedTeam ] = useState(TEAM_ANY);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ points, selectedTeam ]);

    useEffect(() =>
    {
        setPoints(normalizeScore((trigger.intData.length > 0) ? trigger.intData[0] : 1));
        setSelectedTeam(normalizeTeam((trigger.intData.length > 1) ? trigger.intData[1] : TEAM_ANY));
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam titleKey="wiredfurni.params.team">
                <Column gap={ 1 }>
                    <WiredRadio name="selectedTeam" checked={ selectedTeam === TEAM_ANY } onChange={ () => setSelectedTeam(TEAM_ANY) } label={ LocalizeText('wiredfurni.params.team.any') } />

                    <Flex gap={ 3 }>
                        { TEAM_OPTIONS.slice(1, 3).map(option => (
                            <WiredRadio
                                key={ option.value }
                                name="selectedTeam"
                                checked={ selectedTeam === option.value }
                                onChange={ () => setSelectedTeam(option.value) }
                                label={ LocalizeText(option.label) } />
                        )) }
                    </Flex>

                    <Flex gap={ 3 }>
                        { TEAM_OPTIONS.slice(3).map(option => (
                            <WiredRadio
                                key={ option.value }
                                name="selectedTeam"
                                checked={ selectedTeam === option.value }
                                onChange={ () => setSelectedTeam(option.value) }
                                label={ LocalizeText(option.label) } />
                        )) }
                    </Flex>
                </Column>
            </WiredParam>

            <WiredParam divider={ false }>
                <Flex alignItems="center" gap={ 1 }>
                    <WiredControlTitle>{ LocalizeText('wiredfurni.params.setscore2') }</WiredControlTitle>
                    <WiredTextInput
                        compact
                        type="number"
                        min={ 1 }
                        max={ 1000 }
                        step={ 1 }
                        value={ points }
                        onChange={ event => setPoints(normalizeScore(parseInt(event.target.value))) } />
                </Flex>
                <WiredSlider
                    min={ 1 }
                    max={ 1000 }
                    value={ points }
                    onChange={ event => setPoints(event) } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
