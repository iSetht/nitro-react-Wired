import { RoomChatSettings, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { ChatBubbleMessage, GetRoomEngine } from '../../../../api';
import { TruffleChatText } from '../../../../truffle';

const WHITE_TEXT_BUBBLES = new Set([ 2, 8, 10, 14, 15, 24, 25, 27, 31 ]);
const HIDDEN_USERNAME_BUBBLES = new Set([ 1, 34, 200, 201, 202, 210, 211, 212, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 250, 251, 252 ]);

interface ChatWidgetMessageViewProps
{
    chat: ChatBubbleMessage;
    makeRoom: (chat: ChatBubbleMessage) => void;
    bubbleWidth?: number;
}

export const ChatWidgetMessageView: FC<ChatWidgetMessageViewProps> = props =>
{
    const { chat = null, makeRoom = null, bubbleWidth = RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isReady, setIsReady ] = useState<boolean>(false);
    const elementRef = useRef<HTMLDivElement>();

    const getBubbleWidth = useMemo(() =>
    {
        switch(bubbleWidth)
        {
            case RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL:
                return 350;
            case RoomChatSettings.CHAT_BUBBLE_WIDTH_THIN:
                return 230;
            case RoomChatSettings.CHAT_BUBBLE_WIDTH_WIDE:
                return 900;
        }
    }, [ bubbleWidth ]);
    const bubbleStyle = chat.bubbleWidth
        ? { width: chat.bubbleWidth, maxWidth: chat.bubbleWidth }
        : { maxWidth: getBubbleWidth };
    const truffleStyles = useMemo(() =>
    {
        switch(chat.type)
        {
            case 1:
                return { name: 'u_chat_name_whisper', message: 'u_chat_whisper' };
            case 2:
                return { name: 'u_chat_name', message: 'u_chat_shout' };
            default:
                return { name: 'u_chat_name', message: 'u_chat_speak' };
        }
    }, [ chat.type ]);
    const bubbleTextColor = (chat.styleId === 26) ? 0xC59432 : (WHITE_TEXT_BUBBLES.has(chat.styleId) ? 0xFFFFFF : 0x000000);
    const messageColor = ((chat.type === 1) && (bubbleTextColor === 0x000000)) ? 0x595959 : bubbleTextColor;
    const contentWidth = Math.max(1, (chat.bubbleWidth || getBubbleWidth) - 40);
    const username = HIDDEN_USERNAME_BUBBLES.has(chat.styleId) ? '' : chat.username;

    useEffect(() =>
    {
        setIsVisible(false);
        
        const element = elementRef.current;

        if(!element) return;

        const width = element.offsetWidth;
        const height = element.offsetHeight;

        chat.width = width;
        chat.height = height;
        chat.elementRef = element;
        
        let left = chat.left;
        let top = chat.top;

        if(!left && !top)
        {
            left = (chat.location.x - (width / 2));
            top = (element.parentElement.offsetHeight - height);
            
            chat.left = left;
            chat.top = top;
        }

        setIsReady(true);

        return () =>
        {
            chat.elementRef = null;

            setIsReady(false);
        }
    }, [ chat ]);

    useEffect(() =>
    {
        if(!isReady || !chat || isVisible) return;
        
        if(makeRoom) makeRoom(chat);

        setIsVisible(true);
    }, [ chat, isReady, isVisible, makeRoom ]);

    return (
        <div ref={ elementRef } className={ `bubble-container ${ isVisible ? 'visible' : 'invisible' }` } onClick={ event => GetRoomEngine().selectRoomObject(chat.roomId, chat.senderId, RoomObjectCategory.UNIT) }>
            { (chat.styleId === 0) &&
                <div className="user-container-bg" style={ { backgroundColor: chat.color } } /> }
            <div className={ `chat-bubble bubble-${ chat.styleId } type-${ chat.type }` } style={ bubbleStyle }>
                <div className="user-container">
                    { chat.imageUrl && (chat.imageUrl.length > 0) &&
                        <div className="user-image" style={ { backgroundImage: `url(${ chat.imageUrl })` } } /> }
                </div>
                <div className="chat-content" style={ { textAlign: chat.textAlign ?? undefined } }>
                    <TruffleChatText
                        username={ username }
                        text={ chat.text }
                        nameStyle={ truffleStyles.name }
                        messageStyle={ truffleStyles.message }
                        maxWidth={ contentWidth }
                        nameColor={ bubbleTextColor }
                        messageColor={ messageColor }
                    />
                </div>
                <div className="pointer" />
            </div>
        </div>
    );
}
