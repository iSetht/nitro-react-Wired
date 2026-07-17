import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { WiredCheckbox, WiredParam, WiredSelect, WIRED_SOURCE_TRIGGER } from '../WiredControls';

const DEFAULT_EFFECT_ID = 218;

const effectOptions = [ 218, 12, 11, 53, 163 ];

export const WiredEffectFreezeAvatarView: FC<{}> = props =>
{
    const [ effectId, setEffectId ] = useState(DEFAULT_EFFECT_ID);
    const [ cancelOnTeleport, setCancelOnTeleport ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const save = () => setIntParams([ effectId, cancelOnTeleport ? 1 : 0, userSource ]);

    useEffect(() =>
    {
        setEffectId((trigger.intData.length > 0) ? trigger.intData[0] : DEFAULT_EFFECT_ID);
        setCancelOnTeleport((trigger.intData.length > 1) ? (trigger.intData[1] === 1) : false);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam titleKey="wiredfurni.params.freeze.effect_selection" divider={ false }>
                <WiredSelect
                    value={ effectId }
                    onChange={ event => setEffectId(parseInt(event.target.value)) }
                    options={ effectOptions.map(value => ({ value, label: LocalizeText(`fx_${ value }`) })) } />
                <WiredCheckbox
                    checked={ cancelOnTeleport }
                    onChange={ setCancelOnTeleport }
                    label={ LocalizeText('wiredfurni.params.freeze.cancel_on_teleport') } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
