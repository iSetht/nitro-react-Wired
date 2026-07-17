import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { limitWiredMessage, normalizeWiredMessageWidth, WIRED_MESSAGE_ALIGN_LEFT, WIRED_MESSAGE_WIDTH_DEFAULT } from '../message-editor/WiredMessageFormatting';
import { WiredMessageEditor } from '../message-editor/WiredMessageEditor';
import { WIRED_SOURCE_TRIGGER, WiredInfoDesc, WiredParam, WiredRadio, WiredSelect } from '../WiredControls';

const VISIBILITY_SOURCE_USER = 0;
const VISIBILITY_EVERYONE = 1;
const DEFAULT_NOTIFICATION_STYLE = 34;
const NOTIFICATION_STYLES = [ 34, 200, 201, 202, 210, 211, 212, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 250, 251, 252 ];

const normalizeVisibility = (value: number) => value === VISIBILITY_EVERYONE ? VISIBILITY_EVERYONE : VISIBILITY_SOURCE_USER;
const normalizeNotificationStyle = (value: number) => NOTIFICATION_STYLES.includes(value) ? value : DEFAULT_NOTIFICATION_STYLE;

export const WiredEffectShowMessageView: FC<{}> = props =>
{
    const [ message, setMessage ] = useState('');
    const [ visibility, setVisibility ] = useState(VISIBILITY_SOURCE_USER);
    const [ notificationStyle, setNotificationStyle ] = useState(DEFAULT_NOTIFICATION_STYLE);
    const [ bubbleWidth, setBubbleWidth ] = useState(WIRED_MESSAGE_WIDTH_DEFAULT);
    const [ textAlignment, setTextAlignment ] = useState(WIRED_MESSAGE_ALIGN_LEFT);
    const [ generalExpanded, setGeneralExpanded ] = useState(false);
    const [ visibilityExpanded, setVisibilityExpanded ] = useState(false);
    const [ styleExpanded, setStyleExpanded ] = useState(false);
    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);

    const save = () =>
    {
        setStringParam(message);
        setIntParams([ visibility, notificationStyle, userSource, bubbleWidth, WIRED_MESSAGE_ALIGN_LEFT ]);
    }

    useEffect(() =>
    {
        if(!trigger) return;

        setMessage(trigger.stringData);
        setVisibility(normalizeVisibility((trigger.intData.length > 0) ? trigger.intData[0] : VISIBILITY_SOURCE_USER));
        setNotificationStyle(normalizeNotificationStyle((trigger.intData.length > 1) ? trigger.intData[1] : DEFAULT_NOTIFICATION_STYLE));
        setBubbleWidth(normalizeWiredMessageWidth((trigger.intData.length > 3) ? trigger.intData[3] : WIRED_MESSAGE_WIDTH_DEFAULT));
        setTextAlignment(WIRED_MESSAGE_ALIGN_LEFT);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <Column gap={ 1 }>
                <WiredParam
                    titleKey="wiredfurni.params.general_box_info"
                    chevron
                    expanded={ generalExpanded }
                    onToggle={ () => setGeneralExpanded(value => !value) }>
                    <WiredInfoDesc textKey="wiredfurni.params.show_message.usage_info" />
                </WiredParam>
                <WiredParam titleKey="wiredfurni.params.message">
                    <WiredMessageEditor value={ message } onChange={ value => setMessage(limitWiredMessage(value)) } previewStyle={ notificationStyle } bubbleWidth={ bubbleWidth } onBubbleWidthChange={ setBubbleWidth } textAlignment={ textAlignment } onTextAlignmentChange={ setTextAlignment } />
                </WiredParam>
                <WiredParam
                    titleKey="wiredfurni.params.show_message.visibility_selection.title"
                    chevron
                    expanded={ visibilityExpanded }
                    onToggle={ () => setVisibilityExpanded(value => !value) }>
                    <Column gap={ 1 }>
                        <WiredRadio
                            name="wired-show-message-visibility"
                            checked={ visibility === VISIBILITY_SOURCE_USER }
                            onChange={ () => setVisibility(VISIBILITY_SOURCE_USER) }
                            label={ LocalizeText('wiredfurni.params.show_message.visibility_selection.0') } />
                        <WiredRadio
                            name="wired-show-message-visibility"
                            checked={ visibility === VISIBILITY_EVERYONE }
                            onChange={ () => setVisibility(VISIBILITY_EVERYONE) }
                            label={ LocalizeText('wiredfurni.params.show_message.visibility_selection.1') } />
                    </Column>
                </WiredParam>
                <WiredParam
                    titleKey="wiredfurni.params.show_message.style_selection.title"
                    chevron
                    expanded={ styleExpanded }
                    onToggle={ () => setStyleExpanded(value => !value) }
                    divider={ false }>
                    <WiredSelect
                        value={ notificationStyle }
                        onChange={ event => setNotificationStyle(normalizeNotificationStyle(Number(event.target.value))) }
                        options={ NOTIFICATION_STYLES.map(style => ({
                            value: style,
                            label: LocalizeText(`wiredfurni.params.show_message.style_selection.${ style }`)
                        })) } />
                </WiredParam>
            </Column>
        </WiredEffectBaseView>
    );
}
