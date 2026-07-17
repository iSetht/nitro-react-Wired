import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { parseWiredData, WiredParam, WiredRadio, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const CARRY_ON_FURNI = 0;
const CARRY_ON_SAME_TILE = 1;
const SOURCE_ROOM_USERS = 900;
const USER_SOURCE_OPTIONS = [ SOURCE_ROOM_USERS, WIRED_SOURCE_TRIGGER, WIRED_SOURCE_SELECTOR, WIRED_SOURCE_SIGNAL ];

interface CarryAvatarData
{
    carryMode?: number;
    userSource?: number;
}

const normalizeCarryMode = (value: number) => value === CARRY_ON_SAME_TILE ? CARRY_ON_SAME_TILE : CARRY_ON_FURNI;
const normalizeUserSource = (value: number) => USER_SOURCE_OPTIONS.includes(value) ? value : SOURCE_ROOM_USERS;

export const WiredExtraCarryAvatarView: FC<{}> = props =>
{
    const [ carryMode, setCarryMode ] = useState(CARRY_ON_FURNI);
    const [ userSource, setUserSource ] = useState(SOURCE_ROOM_USERS);
    const { trigger = null, setIntParams = null } = useWired() as any;

    const data = useMemo(() => parseWiredData<CarryAvatarData>(trigger?.stringData ?? ''), [ trigger ]);

    const save = () => setIntParams([
        normalizeCarryMode(carryMode),
        normalizeUserSource(userSource)
    ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const intData = trigger.intData ?? [];
        setCarryMode(normalizeCarryMode(intData[0] ?? data.carryMode ?? CARRY_ON_FURNI));
        setUserSource(normalizeUserSource(intData[1] ?? data.userSource ?? SOURCE_ROOM_USERS));
    }, [ trigger, data ]);

    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ {
                value: userSource,
                onChange: setUserSource,
                options: USER_SOURCE_OPTIONS,
                titleKey: 'wiredfurni.params.sources.users.title.carry',
                labelPrefix: 'wiredfurni.params.sources.users'
            } as any ] }
            alwaysExpandedSources={ true }>
            <WiredParam titleKey="wiredfurni.params.carry_mode" divider={ false }>
                <WiredRadio
                    name="wiredCarryAvatarMode"
                    checked={ carryMode === CARRY_ON_FURNI }
                    onChange={ () => setCarryMode(CARRY_ON_FURNI) }
                    label={ LocalizeText('wiredfurni.params.carry_mode.0') } />
                <WiredRadio
                    name="wiredCarryAvatarMode"
                    checked={ carryMode === CARRY_ON_SAME_TILE }
                    onChange={ () => setCarryMode(CARRY_ON_SAME_TILE) }
                    label={ LocalizeText('wiredfurni.params.carry_mode.1') } />
            </WiredParam>
        </WiredBaseView>
    );
}
