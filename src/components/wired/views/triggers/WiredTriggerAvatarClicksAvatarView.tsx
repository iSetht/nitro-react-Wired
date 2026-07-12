import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredParam } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggerAvatarClicksAvatarView: FC<{}> = props =>
{
    const [ blockMenuOpen, setBlockMenuOpen ] = useState(false);
    const [ doNotRotate,   setDoNotRotate   ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ blockMenuOpen ? 1 : 0, doNotRotate ? 1 : 0 ]);

    useEffect(() =>
    {
        if(!trigger) return;
        setBlockMenuOpen((trigger.intData.length > 0) ? trigger.intData[0] === 1 : false);
        setDoNotRotate(  (trigger.intData.length > 1) ? trigger.intData[1] === 1 : false);
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam titleKey="wiredfurni.params.click_user.settings" divider={ false }>
                <WiredCheckbox checked={ blockMenuOpen } onChange={ setBlockMenuOpen } label={ LocalizeText('wiredfurni.params.click_user.block_menu_open') } />
                <WiredCheckbox checked={ doNotRotate } onChange={ setDoNotRotate } label={ LocalizeText('wiredfurni.params.click_user.do_not_rotate') } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
