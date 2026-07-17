const FORMATTING_TAG_PATTERN = /^\[(?:\/?(?:b|i|u|red|blue|green|cyan|purple|left|center|right|wave|shake|cuss|pulse|line)|\/?#[0-9a-f]{6})\]/i;

export const WIRED_MESSAGE_VISIBLE_MAX_LENGTH = 300;
export const WIRED_MESSAGE_MAX_LINES = 8;
export const WIRED_MESSAGE_WIDTH_MIN = 55;
export const WIRED_MESSAGE_WIDTH_DEFAULT = 125;
export const WIRED_MESSAGE_WIDTH_MAX = 900;
export const WIRED_MESSAGE_ALIGN_LEFT = 0;
export const WIRED_MESSAGE_ALIGN_CENTER = 1;
export const WIRED_MESSAGE_ALIGN_RIGHT = 2;

export const getWiredMessageVisibleLength = (message: string) =>
    message.replace(/\[(?:\/?(?:b|i|u|red|blue|green|cyan|purple|left|center|right|wave|shake|cuss|pulse|line)|\/?#[0-9a-f]{6})\]/gi, '').length;

export const limitWiredMessage = (message: string, maxLength = WIRED_MESSAGE_VISIBLE_MAX_LENGTH) =>
{
    let visibleLength = 0;
    let lineCount = 1;
    let result = '';

    for(let i = 0; i < message.length;)
    {
        const tagMatch = message.substring(i).match(FORMATTING_TAG_PATTERN);

        if(tagMatch)
        {
            result += tagMatch[0];
            i += tagMatch[0].length;
            continue;
        }

        if(visibleLength >= maxLength) break;
        if(message[i] === '\n') lineCount++;
        if(lineCount > WIRED_MESSAGE_MAX_LINES) break;

        result += message[i];
        visibleLength++;
        i++;
    }

    return result;
}

export const normalizeWiredMessageWidth = (value: number) =>
{
    const numericValue = Number(value);

    if(!Number.isFinite(numericValue)) return WIRED_MESSAGE_WIDTH_DEFAULT;

    return Math.max(WIRED_MESSAGE_WIDTH_MIN, Math.min(WIRED_MESSAGE_WIDTH_MAX, Math.round(numericValue)));
}

export const normalizeWiredMessageAlignment = (value: number) =>
    [ WIRED_MESSAGE_ALIGN_LEFT, WIRED_MESSAGE_ALIGN_CENTER, WIRED_MESSAGE_ALIGN_RIGHT ].includes(value) ? value : WIRED_MESSAGE_ALIGN_LEFT;

export const wiredMessageAlignmentName = (value: number) =>
{
    switch(normalizeWiredMessageAlignment(value))
    {
        case WIRED_MESSAGE_ALIGN_CENTER:
            return 'center';
        case WIRED_MESSAGE_ALIGN_RIGHT:
            return 'right';
        default:
            return 'left';
    }
}
