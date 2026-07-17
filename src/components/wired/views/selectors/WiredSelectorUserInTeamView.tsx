import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredParam, WiredRadio } from '../WiredControls';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

const TEAM_ANY = 0;
const TEAM_RED = 1;
const TEAM_GREEN = 2;
const TEAM_BLUE = 3;
const TEAM_YELLOW = 4;

const TEAM_OPTIONS = [
    { value: TEAM_ANY,    label: 'wiredfurni.params.team.any' },
    { value: TEAM_RED,    label: 'wiredfurni.params.team.1'   },
    { value: TEAM_GREEN,  label: 'wiredfurni.params.team.2'   },
    { value: TEAM_BLUE,   label: 'wiredfurni.params.team.3'   },
    { value: TEAM_YELLOW, label: 'wiredfurni.params.team.4'   },
];

const normalizeTeam = (value: number) => (value >= TEAM_ANY && value <= TEAM_YELLOW) ? value : TEAM_ANY;

export const WiredSelectorUserInTeamView: FC<{}> = props =>
{
    const [ team, setTeam ] = useState(TEAM_ANY);
    const { trigger = null, setIntParams = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            team,
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    useEffect(() =>
    {
        if(!trigger) return;

        setTeam(normalizeTeam((trigger.intData.length > 0) ? trigger.intData[0] : TEAM_ANY));
    }, [ trigger ]);

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 1 }
        >
            <WiredParam titleKey="wiredfurni.params.team">
                <Column gap={ 1 }>
                    <WiredRadio name="teamSelection" checked={ team === TEAM_ANY } onChange={ () => setTeam(TEAM_ANY) } label={ LocalizeText('wiredfurni.params.team.any') } />
                    <Flex gap={ 3 }>
                        { TEAM_OPTIONS.slice(1, 3).map(option => (
                            <WiredRadio key={ option.value } name="teamSelection" checked={ team === option.value } onChange={ () => setTeam(option.value) } label={ LocalizeText(option.label) } />
                        )) }
                    </Flex>
                    <Flex gap={ 3 }>
                        { TEAM_OPTIONS.slice(3).map(option => (
                            <WiredRadio key={ option.value } name="teamSelection" checked={ team === option.value } onChange={ () => setTeam(option.value) } label={ LocalizeText(option.label) } />
                        )) }
                    </Flex>
                </Column>
            </WiredParam>
        </WiredSelectorBaseView>
    );
}
