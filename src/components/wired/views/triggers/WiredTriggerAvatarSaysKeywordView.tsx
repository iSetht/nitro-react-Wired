import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredCheckbox, WiredDisabled, WiredParam, WiredRadio, WiredTextInput } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const CHAT_TYPE_CONTAINS = 0;
const CHAT_TYPE_EXACT = 1;
const CHAT_TYPE_ALL = 2;

export const WiredTriggerAvatarSaysKeywordView: FC<{}> = props =>
{
    const [ message, setMessage ] = useState('');
    const [ chatType, setChatType ] = useState(CHAT_TYPE_CONTAINS);
    const [ hideMessage, setHideMessage ] = useState(true);
    const [ ownerOnly, setOwnerOnly ] = useState(false);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const save = () =>
    {
        setStringParam((chatType === CHAT_TYPE_ALL) ? '' : message);
        setIntParams([ chatType, hideMessage ? 1 : 0, ownerOnly ? 1 : 0 ]);
    }

    useEffect(() =>
    {
        const type = (trigger.intData.length > 0) ? trigger.intData[0] : CHAT_TYPE_CONTAINS;

        setMessage(trigger.stringData);
        setChatType(type);
        setHideMessage((trigger.intData.length > 1) ? (trigger.intData[1] === 1) : true);
        setOwnerOnly((trigger.intData.length > 2) ? (trigger.intData[2] === 1) : false);
    }, [ trigger ]);
    
    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <WiredParam titleKey="wiredfurni.params.whatissaid">
                <WiredDisabled disabled={ chatType === CHAT_TYPE_ALL }>
                    <WiredTextInput type="text" value={ message } onChange={ event => setMessage(event.target.value) } />
                </WiredDisabled>
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.chattriggertype">
                <WiredRadio name="chatType" checked={ chatType === CHAT_TYPE_CONTAINS } onChange={ () => setChatType(CHAT_TYPE_CONTAINS) } label={ LocalizeText('wiredfurni.params.chatcontains') } />
                <WiredRadio name="chatType" checked={ chatType === CHAT_TYPE_EXACT } onChange={ () => setChatType(CHAT_TYPE_EXACT) } label={ LocalizeText('wiredfurni.params.exactmatch') } />
                <WiredRadio name="chatType" checked={ chatType === CHAT_TYPE_ALL } onChange={ () => setChatType(CHAT_TYPE_ALL) } label={ LocalizeText('wiredfurni.params.allmatch') } />
            </WiredParam>
            <WiredParam titleKey="wiredfurni.params.select_options" divider={ false }>
                <WiredCheckbox checked={ hideMessage } onChange={ setHideMessage } label={ LocalizeText('wiredfurni.params.chat.hide') } />
                <WiredCheckbox checked={ ownerOnly } onChange={ setOwnerOnly } label={ LocalizeText('wiredfurni.params.chat.onlyowner') } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
