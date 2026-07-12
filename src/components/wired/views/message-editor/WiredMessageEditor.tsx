import { ChangeEvent, FC, MouseEvent as ReactMouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RoomChatFormatter } from '../../../../api';
import { Text } from '../../../../common';
import { getWiredMessageVisibleLength, limitWiredMessage, normalizeWiredMessageWidth, wiredMessageAlignmentName, WIRED_MESSAGE_ALIGN_LEFT, WIRED_MESSAGE_MAX_LINES, WIRED_MESSAGE_VISIBLE_MAX_LENGTH, WIRED_MESSAGE_WIDTH_DEFAULT } from './WiredMessageFormatting';
import { WiredAdjustButton, WiredControlText, WiredTextarea, WiredTextInput } from '../WiredControls';

interface WiredMessageEditorProps
{
    value: string;
    onChange: (value: string) => void;
    previewStyle?: number;
    bubbleWidth?: number;
    onBubbleWidthChange?: (value: number) => void;
    textAlignment?: number;
    onTextAlignmentChange?: (value: number) => void;
}

export const WiredMessageEditor: FC<WiredMessageEditorProps> = props =>
{
    const { value = '', onChange, previewStyle = 34, bubbleWidth = WIRED_MESSAGE_WIDTH_DEFAULT, onBubbleWidthChange = null, textAlignment = WIRED_MESSAGE_ALIGN_LEFT } = props;
    const [ expanded, setExpanded ] = useState(false);
    const [ widthInput, setWidthInput ] = useState(String(normalizeWiredMessageWidth(bubbleWidth)));
    const [ position, setPosition ] = useState(() => ({
        left: Math.max(12, (window.innerWidth - 640) / 2),
        top: Math.max(12, (window.innerHeight - 360) / 2)
    }));
    const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const visibleLength = getWiredMessageVisibleLength(value);
    const normalizedBubbleWidth = normalizeWiredMessageWidth(bubbleWidth);
    const alignmentName = wiredMessageAlignmentName(textAlignment);
    const editorWidth = Math.max(520, Math.min(960, normalizedBubbleWidth + 230));

    const updateMessage = (nextValue: string) => onChange(limitWiredMessage(nextValue));

    useEffect(() =>
    {
        setWidthInput(String(normalizedBubbleWidth));
    }, [ normalizedBubbleWidth ]);

    const updateVisualMessage = (event: ChangeEvent<HTMLTextAreaElement>) =>
    {
        const nextValue = event.target.value;

        if(nextValue.split('\n').length > WIRED_MESSAGE_MAX_LINES) return;
        if(getWiredMessageVisibleLength(nextValue) > WIRED_MESSAGE_VISIBLE_MAX_LENGTH) return;

        updateMessage(nextValue);
    }

    const insertMarkup = (openTag: string, closeTag: string) =>
    {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? value.length;
        const end = textarea?.selectionEnd ?? value.length;
        const nextValue = value.substring(0, start) + openTag + value.substring(start, end) + closeTag + value.substring(end);

        updateMessage(nextValue);

        window.setTimeout(() =>
        {
            textarea?.focus();

            if(textarea)
            {
                textarea.selectionStart = start + openTag.length;
                textarea.selectionEnd = end + openTag.length;
            }
        }, 0);
    };

    const changeBubbleWidth = (nextValue: string) =>
    {
        const cleanedValue = nextValue.replace(/[^0-9]/g, '');

        setWidthInput(cleanedValue);
    }

    const commitBubbleWidth = () =>
    {
        const nextWidth = normalizeWiredMessageWidth(Number(widthInput));

        setWidthInput(String(nextWidth));
        onBubbleWidthChange?.(nextWidth);
    };

    const submitBubbleWidth = (event: React.KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key !== 'Enter') return;

        event.preventDefault();
        commitBubbleWidth();
    };

    const startDrag = (event: ReactMouseEvent<HTMLDivElement>) =>
    {
        dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            left: position.left,
            top: position.top
        };
        event.preventDefault();
    };

    useEffect(() =>
    {
        if(!expanded) return;

        const onMouseMove = (event: MouseEvent) =>
        {
            const drag = dragRef.current;

            if(!drag) return;

            setPosition({
                left: Math.max(0, Math.min(window.innerWidth - 120, drag.left + event.clientX - drag.x)),
                top: Math.max(0, Math.min(window.innerHeight - 48, drag.top + event.clientY - drag.y))
            });
        };
        const onMouseUp = () => dragRef.current = null;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () =>
        {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [ expanded ]);

    useEffect(() =>
    {
        if(!expanded) return;

        setPosition(position => ({
            left: Math.max(12, Math.min(window.innerWidth - Math.min(editorWidth, window.innerWidth - 24) - 12, position.left)),
            top: Math.max(12, Math.min(window.innerHeight - 48, position.top))
        }));
    }, [ editorWidth, expanded ]);

    const renderToolbarButton = (label: ReactNode, title: string, selected: boolean, onClick: () => void, className = '') => (
        <button type="button" title={ title } className={ `nw-variable-type-btn nw-message-format-btn ${ className } ${ selected ? 'is-selected' : '' }` } onClick={ onClick }>{ label }</button>
    );

    const renderAlignIcon = (align: string) => (
        <span className={ `nw-align-icon nw-align-icon-${ align }` }>
            <span />
            <span />
            <span />
        </span>
    );

    return (
        <>
            <div className="nw-message-editor-inline">
                <WiredTextarea className="nw-message-input" value={ value } onChange={ event => updateMessage(event.target.value) } />
                <WiredAdjustButton direction={ expanded ? 'left' : 'right' } className="nw-message-expand-adjust" onClick={ () => setExpanded(value => !value) } />
            </div>
            { expanded && createPortal(
                <div className="nw-message-editor-backdrop">
                    <div className="nitro-wired nw-message-editor-popout" style={ { left: position.left, top: position.top, width: editorWidth } }>
                        <div className="nw-header" onMouseDown={ startDrag }>
                            <div className="nw-header-bg" />
                            <div className="nw-header-row1">
                                <div className="nw-header-title"><Text bitmapFont="il_link_strong">Message Editor</Text></div>
                                <button type="button" className="nw-btn nw-btn-close" onMouseDown={ event => event.stopPropagation() } onClick={ () => setExpanded(false) } />
                            </div>
                        </div>
                        <div className="nw-body">
                            <div className="nw-message-editor-toolbar">
                                <div className="nw-message-editor-tools">
                                    <span className="nw-variable-type-pill nw-message-format-pill">
                                        { renderToolbarButton('B', 'Bold', false, () => insertMarkup('[b]', '[/b]'), 'nw-message-format-bold') }
                                        { renderToolbarButton('I', 'Italic', false, () => insertMarkup('[i]', '[/i]'), 'nw-message-format-italic') }
                                        { renderToolbarButton('U', 'Underline', false, () => insertMarkup('[u]', '[/u]'), 'nw-message-format-underline') }
                                    </span>
                                    <span className="nw-message-toolbar-pipe" />
                                    <span className="nw-message-tool-label"><WiredControlText>Align</WiredControlText></span>
                                    <span className="nw-variable-type-pill nw-message-format-pill">
                                        { renderToolbarButton(renderAlignIcon('left'), 'Insert left align', false, () => insertMarkup('[left]', '[/left]')) }
                                        { renderToolbarButton(renderAlignIcon('center'), 'Insert center align', false, () => insertMarkup('[center]', '[/center]')) }
                                        { renderToolbarButton(renderAlignIcon('right'), 'Insert right align', false, () => insertMarkup('[right]', '[/right]')) }
                                    </span>
                                    <span className="nw-message-toolbar-pipe" />
                                    <span className="nw-message-tool-label"><WiredControlText>Bubble Width</WiredControlText></span>
                                    <WiredTextInput
                                        className="nw-message-width-input"
                                        type="text"
                                        inputMode="numeric"
                                        value={ widthInput }
                                        onChange={ event => changeBubbleWidth(event.target.value) }
                                        onBlur={ commitBubbleWidth }
                                        onKeyDown={ submitBubbleWidth } />
                                    <span className="nw-message-width-suffix">px</span>
                                    <span className="nw-message-toolbar-pipe" />
                                    <span className="nw-message-special-wrap">
                                        <button type="button" className="nw-message-preview-link">
                                            <WiredControlText>Special Codes</WiredControlText>
                                        </button>
                                        <div className="nw-message-special-menu">
                                            { SPECIAL_CODES.map(code =>
                                                <div key={ code.label } className="nw-message-special-row">
                                                    <span className="nw-message-special-code">{ code.label }</span>
                                                    <span className="nw-message-special-preview" dangerouslySetInnerHTML={ { __html: RoomChatFormatter(code.preview) } } />
                                                </div>) }
                                        </div>
                                    </span>
                                </div>
                                <span className="nw-message-count">{ visibleLength }/{ WIRED_MESSAGE_VISIBLE_MAX_LENGTH }</span>
                            </div>
                            <WiredTextarea
                                ref={ textareaRef }
                                className="nw-message-input nw-message-input-large nw-message-rich-input"
                                value={ value }
                                onChange={ updateVisualMessage } />
                            <div className="nw-message-preview-stage">
                                <div className="bubble-container">
                                    <div className={ `chat-bubble bubble-${ previewStyle } type-1` } style={ { width: normalizedBubbleWidth, maxWidth: normalizedBubbleWidth } }>
                                        <div className="user-container" />
                                        <div className="chat-content" style={ { textAlign: alignmentName } }>
                                            <span className="message" dangerouslySetInnerHTML={ { __html: RoomChatFormatter(value || 'Preview') } } />
                                        </div>
                                        <div className="pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            ) }
        </>
    );
}

const SPECIAL_CODES = [
    { label: '[wave]...[/wave]', preview: '[wave]Preview[/wave]' },
    { label: '[shake]...[/shake]', preview: '[shake]Preview[/shake]' },
    { label: '[cuss]...[/cuss]', preview: '[cuss]Preview[/cuss]' },
    { label: '[pulse]...[/pulse]', preview: '[pulse]Preview[/pulse]' },
    { label: '[#7b4dff]...[/#7b4dff]', preview: '[#7b4dff]Preview[/#7b4dff]' },
    { label: '[line]...[/line]', preview: '[line]Preview[/line]' }
];
