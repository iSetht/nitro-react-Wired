const allowedColours: Map<string, string> = new Map();
const habboMarkdownColours: Map<string, string> = new Map();

allowedColours.set('r', 'red');
allowedColours.set('b', 'blue');
allowedColours.set('g', 'green');
allowedColours.set('y', 'yellow');
allowedColours.set('w', 'white');
allowedColours.set('o', 'orange');
allowedColours.set('c', 'cyan');
allowedColours.set('br', 'brown');
allowedColours.set('pr', 'purple');
allowedColours.set('pk', 'pink');

allowedColours.set('red', 'red');
allowedColours.set('blue', 'blue');
allowedColours.set('green', 'green');
allowedColours.set('yellow', 'yellow');
allowedColours.set('white', 'white');
allowedColours.set('orange', 'orange');
allowedColours.set('cyan', 'cyan');
allowedColours.set('brown', 'brown');
allowedColours.set('purple', 'purple');
allowedColours.set('pink', 'pink');

habboMarkdownColours.set('red', '#973535');
habboMarkdownColours.set('blue', '#2E6AA7');
habboMarkdownColours.set('green', '#268F26');
habboMarkdownColours.set('cyan', '#309393');
habboMarkdownColours.set('purple', '#672A67');

const encodeHTML = (str: string) =>
{
    return str.replace(/([\u00A0-\u9999<>&])(.|$)/g, (full, char, next) =>
    {
        if(char !== '&' || next !== '#')
        {
            if(/[\u00A0-\u9999<>&]/.test(next)) next = '&#' + next.charCodeAt(0) + ';';

            return '&#' + char.charCodeAt(0) + ';' + next;
        }

        return full;
    });
}

export type WiredChatAlignment = 'left' | 'center' | 'right';

export interface WiredChatLayout
{
    text: string;
    bubbleWidth?: number;
    textAlign?: WiredChatAlignment;
}

const normalizeWiredBubbleWidth = (value: number) =>
{
    if(!Number.isFinite(value)) return null;

    return Math.max(55, Math.min(900, Math.round(value)));
}

export const ExtractWiredChatLayout = (content: string): WiredChatLayout =>
{
    let bubbleWidth: number = null;
    let textAlign: WiredChatAlignment = null;
    let text = content;

    text = text.replace(/\[nw-width:(\d{1,4})\]/gi, (_match, width) =>
    {
        bubbleWidth = normalizeWiredBubbleWidth(Number(width));
        return '';
    });

    text = text.replace(/\[nw-align:(left|center|right)\]/gi, (_match, align) =>
    {
        textAlign = align.toLowerCase() as WiredChatAlignment;
        return '';
    });

    return { text, bubbleWidth, textAlign };
}

export const RoomChatFormatter = (content: string) =>
{
    let result = '';

    content = ExtractWiredChatLayout(content).text;
    content = encodeHTML(content);
    //content = (joypixels.shortnameToUnicode(content) as string)

    if(content.startsWith('@') && content.indexOf('@', 1) > -1)
    {
        let match = null;

        while((match = /@[a-zA-Z]+@/g.exec(content)) !== null)
        {
            const colorTag = match[0].toString();
            const colorName = colorTag.substr(1, colorTag.length - 2);
            const text = content.replace(colorTag, '');

            if(!allowedColours.has(colorName))
            {
                result = text;
            }
            else
            {
                const color = allowedColours.get(colorName);
                result = '<span style="color: ' + color + '">' + text + '</span>';
            }
            break;
        }
    }
    else
    {
        result = content;
    }

    return applyHabboMarkdown(result);
}

const applyHabboMarkdown = (content: string) =>
{
    let result = content;

    result = result.replace(/\[(#[0-9a-f]{6})\]([\s\S]*?)\[\/\1\]/gi, (_match, colour, value) => `<span style="color: ${ colour }">${ value }</span>`);

    habboMarkdownColours.forEach((colour, tag) =>
    {
        result = replaceTag(result, tag, value => `<span style="color: ${ colour }">${ value }</span>`);
    });

    result = replaceTag(result, 'u', value => `<u>${ value }</u>`);
    result = replaceTag(result, 'i', value => `<i>${ value }</i>`);
    result = replaceTag(result, 'b', value => `<b>${ value }</b>`);
    result = result.replace(/\[(left|center|right)\]([\s\S]*?)\[\/\1\]/gi, (_match, align, value) => `<span style="display: block; width: 100%; text-align: ${ align.toLowerCase() }">${ value }</span>`);
    result = replaceTag(result, 'wave', value => renderLetterEffect(value, 'chat-effect-wave'));
    result = replaceTag(result, 'shake', value => renderLetterEffect(value, 'chat-effect-shake'));
    result = replaceTag(result, 'pulse', value => renderPulseEffect(value));
    result = replaceTag(result, 'cuss', value => renderCussEffect(value));
    result = replaceTag(result, 'line', () => '<span class="chat-effect-line" aria-hidden="true"></span>');

    return result
        .replace(/(?:\r\n|\r|\n)+(?=<span class="chat-effect-line")/g, '')
        .replace(/(<span class="chat-effect-line" aria-hidden="true"><\/span>)(?:\r\n|\r|\n)+/g, '$1')
        .replace(/\r\n|\r|\n/g, '<br />')
        .replace(/<\/span><br \/><span style="display: block; width: 100%; text-align:/g, '</span><span style="display: block; width: 100%; text-align:');
}

const replaceTag = (content: string, tag: string, render: (value: string) => string) =>
{
    const expression = new RegExp(`\\[${ tag }\\]([\\s\\S]*?)\\[\\/${ tag }\\]`, 'gi');

    return content.replace(expression, (_match, value) => render(value));
}

const renderLetterEffect = (content: string, className: string) =>
{
    const letters = tokenizeFormattedText(content);
    let visibleIndex = 0;

    return `<span class="chat-effect ${ className }">${ letters.map(letter =>
    {
        if(letter.isMarkup) return letter.value;
        if(letter.value === ' ') return ' ';

        return `<span class="chat-effect-letter" style="--i:${ visibleIndex++ }">${ letter.value }</span>`;
    }).join('') }</span>`;
}

const renderCussEffect = (content: string) =>
{
    const symbols = [ '&', '$', '!', '@', '*', '#', '%' ];
    let visibleIndex = 0;

    const cussed = tokenizeFormattedText(content).map(token =>
    {
        if(token.isMarkup) return token.value;

        const letter = token.value;
        if(/\s/.test(letter)) return letter;

        if(/[;,.?:'"()[\]{}<>/\\|`~_\-+=]/.test(letter))
        {
            return letter;
        }

        const index = visibleIndex++;
        const variants = [ 0, 3, 5, 1, 4, 6 ].map(offset => escapeAttribute(symbols[(index + offset) % symbols.length]));

        return `<span class="chat-effect-letter chat-effect-cuss-letter" style="--i:${ index }" data-c1="${ variants[0] }" data-c2="${ variants[1] }" data-c3="${ variants[2] }" data-c4="${ variants[3] }" data-c5="${ variants[4] }" data-c6="${ variants[5] }"></span>`;
    }).join('');

    return `<span class="chat-effect chat-effect-cuss">${ cussed }</span>`;
}

const renderPulseEffect = (content: string) =>
{
    const letters = tokenizeFormattedText(content);

    return `<span class="chat-effect chat-effect-pulse">${ letters.map(letter =>
    {
        if(letter.isMarkup) return letter.value;
        if(letter.value === ' ') return ' ';

        return `<span class="chat-effect-pulse-letter" data-pulse="${ escapeAttribute(letter.value) }">${ letter.value }</span>`;
    }).join('') }</span>`;
}

const escapeAttribute = (content: string) =>
    content.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tokenizeFormattedText = (content: string) =>
{
    const tokens: { value: string; isMarkup: boolean }[] = [];

    for(let index = 0; index < content.length;)
    {
        if(content[index] === '<')
        {
            const end = content.indexOf('>', index);

            if(end > -1)
            {
                tokens.push({ value: content.substring(index, end + 1), isMarkup: true });
                index = end + 1;
                continue;
            }
        }

        if(content[index] === '&')
        {
            const end = content.indexOf(';', index);

            if(end > -1)
            {
                tokens.push({ value: content.substring(index, end + 1), isMarkup: false });
                index = end + 1;
                continue;
            }
        }

        tokens.push({ value: content[index], isMarkup: false });
        index++;
    }

    return tokens;
}
