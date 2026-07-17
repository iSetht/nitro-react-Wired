import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { AddEventLinkTracker, ChatEntryType, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { Flex, InfiniteScroll, Text } from '../../common';
import { useChatHistory } from '../../hooks';

export const ChatHistoryView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ searchText, setSearchText ] = useState<string>('');
    const { chatHistory = [] } = useChatHistory();
    const elementRef = useRef<HTMLDivElement>(null);

    const filteredChatHistory = useMemo(() =>
    {
        if (searchText.length === 0) return chatHistory;

        let text = searchText.toLowerCase();

        return chatHistory.filter(entry =>
            (entry.message && entry.message.toLowerCase().includes(text)) ||
            (entry.name && entry.name.toLowerCase().includes(text))
        );
    }, [ chatHistory, searchText ]);

    useEffect(() =>
    {
        if (elementRef.current && isVisible) elementRef.current.scrollTop = elementRef.current.scrollHeight;
    }, [ isVisible ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if (parts.length < 2) return;

                switch (parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'chat-history/'
        };

        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="d-flex gap-2 nitro-chat-history">
            <div className="chat-history-content h-100">
                <input
                    type="text"
                    className="form-control chat-history-search"
                    placeholder={ LocalizeText('generic.search') }
                    value={ searchText }
                    onChange={ event => setSearchText(event.target.value) }
                />
    
                <div className="w-100 h-100 overflow-auto position-relative" ref={elementRef}>
                    <InfiniteScroll rows={filteredChatHistory} scrollToBottom={true} rowRender={row =>
                    {
                        return (
                            <Flex alignItems="center" className="p-1" gap={2}>
                                <Text variant="muted">{row.timestamp}</Text>
                                {row.type === ChatEntryType.TYPE_CHAT &&
                                    <div className="bubble-container" style={{ position: 'relative' }}>
                                        {row.style === 0 &&
                                            <div className="user-container-bg" style={{ backgroundColor: row.color }} />
                                        }
                                        <div className={`chat-bubble bubble-${row.style} type-${row.chatType}`} style={{ maxWidth: '100%' }}>
                                            <div className="user-container">
                                                {row.imageUrl &&
                                                    <div className="user-image" style={{ backgroundImage: `url(${row.imageUrl})` }} />
                                                }
                                            </div>
                                            <div className="chat-content">
                                                <b className="username mr-1" dangerouslySetInnerHTML={{ __html: `${row.name}: ` }} />
                                                <span className="message" dangerouslySetInnerHTML={{ __html: `${row.message}` }} />
                                            </div>
                                        </div>
                                    </div>}
                                    {row.type === ChatEntryType.TYPE_ROOM_INFO &&
    <>
        <i className="icon icon-small-room" />
        <div className="flex-grow-1 d-inline text-black text-wrap text-break">
            <span className="text-white">{row.name}</span>
        </div>
    </>
}

                            </Flex>
                        );
                    }} />
                </div>
            </div>
            <div className="d-flex chat-collapse-button" onClick={() => setIsVisible(false)}></div>
        </div>
    );
}    
