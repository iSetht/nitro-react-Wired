import type { TruffleBuffer } from 'truffle-text';
import type { PackedTruffleText } from 'truffle-text/packed';
import { getTruffle } from 'truffle-text/react';
import { FC, useLayoutEffect, useMemo, useRef } from 'react';

interface TruffleChatTextProps
{
    username?: string;
    text?: string;
    nameStyle: string;
    messageStyle: string;
    maxWidth: number;
    nameColor?: number;
    messageColor?: number;
}

interface RenderedSegment
{
    buffer: TruffleBuffer;
    x: number;
}

interface RenderedLine
{
    segments: RenderedSegment[];
    height: number;
    y: number;
}

const measureWidth = (truffle: PackedTruffleText, text: string, style: string) =>
    truffle.measure(text, style).textWidth;

const splitLongToken = (truffle: PackedTruffleText, token: string, style: string, width: number) =>
{
    const characters = Array.from(token);
    let splitAt = 1;

    for(let i = 1; i <= characters.length; i++)
    {
        if(measureWidth(truffle, characters.slice(0, i).join(''), style) > width) break;

        splitAt = i;
    }

    return [ characters.slice(0, splitAt).join(''), characters.slice(splitAt).join('') ];
}

const wrapMessage = (truffle: PackedTruffleText, text: string, style: string, maxWidth: number, firstLineOffset: number) =>
{
    const lines: string[] = [];
    const tokens = text.replace(/\r\n?/g, '\n').match(/\n|[^\S\n]+|[^\s]+/g) ?? [ '' ];
    let current = '';
    let isFirstLine = true;

    const availableWidth = () => Math.max(1, maxWidth - (isFirstLine ? firstLineOffset : 0));
    const pushLine = () =>
    {
        lines.push(current.replace(/[^\S\n]+$/g, ''));
        current = '';
        isFirstLine = false;
    };

    for(const originalToken of tokens)
    {
        if(originalToken === '\n')
        {
            pushLine();
            continue;
        }

        if(/^\s+$/.test(originalToken))
        {
            if(current) current += originalToken;
            continue;
        }

        let token = originalToken;
        const candidate = current + token;

        if(isFirstLine && !current && firstLineOffset && (measureWidth(truffle, candidate, style) > availableWidth()))
        {
            pushLine();
        }
        else if(current && (measureWidth(truffle, candidate, style) > availableWidth()))
        {
            pushLine();
            token = token.replace(/^\s+/, '');
        }

        while(token && (measureWidth(truffle, token, style) > availableWidth()))
        {
            const [ fitting, remainder ] = splitLongToken(truffle, token, style, availableWidth());

            current = fitting;
            pushLine();
            token = remainder;
        }

        current += token;
    }

    if(current || !lines.length) pushLine();

    return lines;
}

const drawBuffer = (context: CanvasRenderingContext2D, buffer: TruffleBuffer, x: number, y: number) =>
{
    const source = document.createElement('canvas');
    source.width = buffer.width;
    source.height = buffer.height;
    source.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height), 0, 0);
    context.drawImage(source, x, y);
}

export const TruffleChatText: FC<TruffleChatTextProps> = props =>
{
    const { username = '', text = '', nameStyle, messageStyle, maxWidth, nameColor, messageColor } = props;
    const canvasRef = useRef<HTMLCanvasElement>();
    const rendered = useMemo(() =>
    {
        const truffle = getTruffle();

        if(!truffle) return null;

        const nameText = username ? `${ username }: ` : '';
        const nameWidth = nameText ? measureWidth(truffle, nameText, nameStyle) : 0;
        const messageLines = wrapMessage(truffle, text, messageStyle, maxWidth, nameWidth);
        const lines: RenderedLine[] = [];
        let canvasWidth = 1;
        let canvasHeight = 0;

        messageLines.forEach((messageLine, index) =>
        {
            const segments: RenderedSegment[] = [];
            let lineHeight = 1;

            if((index === 0) && nameText)
            {
                const buffer = truffle.renderToBuffer(nameText, nameStyle, nameColor === undefined ? {} : { color: nameColor });
                segments.push({ buffer, x: 0 });
                lineHeight = Math.max(lineHeight, buffer.height);
                canvasWidth = Math.max(canvasWidth, buffer.width);
            }

            if(messageLine)
            {
                const x = ((index === 0) && nameText) ? Math.round(nameWidth) : 0;
                const buffer = truffle.renderToBuffer(messageLine, messageStyle, messageColor === undefined ? {} : { color: messageColor });
                segments.push({ buffer, x });
                lineHeight = Math.max(lineHeight, buffer.height);
                canvasWidth = Math.max(canvasWidth, x + buffer.width);
            }

            lines.push({ segments, height: lineHeight, y: canvasHeight });
            canvasHeight += lineHeight;
        });

        return {
            lines,
            width: Math.max(1, Math.ceil(canvasWidth)),
            height: Math.max(1, Math.ceil(canvasHeight))
        };
    }, [ maxWidth, messageColor, messageStyle, nameColor, nameStyle, text, username ]);

    useLayoutEffect(() =>
    {
        if(!rendered || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        context.clearRect(0, 0, rendered.width, rendered.height);

        rendered.lines.forEach(line => line.segments.forEach(segment => drawBuffer(context, segment.buffer, segment.x, line.y)));
    }, [ rendered ]);

    if(!rendered) return null;

    return <canvas ref={ canvasRef } width={ rendered.width } height={ rendered.height } className="truffle-chat-text" role="img" aria-label={ `${ username ? `${ username }: ` : '' }${ text }` } />;
}
