import { CSSProperties, FC, ReactNode, useMemo } from 'react';
import { BitmapFontName, GetBitmapFont, GetBitmapKerning } from './BitmapFont';

interface BitmapTextProps
{
    text?: string | number;
    children?: ReactNode;
    font?: BitmapFontName;
    className?: string;
    style?: CSSProperties;
    maxWidth?: number | string;
    title?: string;
    preserveColor?: boolean;
    scale?: number;
}

interface BitmapTextHtmlProps extends Omit<BitmapTextProps, 'children' | 'text'>
{
    html: string;
}

const getTextFromChildren = (children: ReactNode): string =>
{
    if(children === null || children === undefined) return '';

    if(typeof children === 'string' || typeof children === 'number') return children.toString();

    return '';
}

const getWords = (text: string): string[] =>
{
    return text.split(/(\s+)/).filter(part => part.length);
}

const getFontForStyle = (font: BitmapFontName, bold: boolean, italic: boolean): BitmapFontName =>
{
    if(font && font !== 'regular') return font;

    if(bold && italic) return 'bold_italic';
    if(bold) return 'bold';
    if(italic) return 'italic';

    return font || 'regular';
}

export const BitmapText: FC<BitmapTextProps> = props =>
{
    const { text = null, children = null, font = 'regular', className = '', style = {}, maxWidth = null, title = null, preserveColor = false, scale = 1 } = props;
    const content = (text !== null && text !== undefined) ? text.toString() : getTextFromChildren(children);
    const bitmapFont = GetBitmapFont(font);

    const words = useMemo(() => getWords(content), [ content ]);

    if(!bitmapFont || !content.length) return null;

    return (
        <span
            className={ `bitmap-text ${ className }`.trim() }
            style={ { ...style, maxWidth: maxWidth || style.maxWidth } }
            title={ title || content }>
            { words.map((word, wordIndex) =>
            {
                const isWhitespace = /^\s+$/.test(word);

                if(isWhitespace)
                {
                    const width = Math.max(1, Math.round(word.length * (bitmapFont.metrics.glyphs[' ']?.advance || 3) * scale));

                    return <span key={ wordIndex } className="bitmap-text-space" style={ { width } } />;
                }

                return (
                    <span key={ wordIndex } className="bitmap-text-word">
                        { Array.from(word).map((character, characterIndex) =>
                        {
                            const glyph = bitmapFont.metrics.glyphs[character] || bitmapFont.metrics.glyphs['?'];

                            if(!glyph) return null;

                            const nextCharacter = word[characterIndex + 1];
                            const advance = Math.max(0, Math.round((glyph.advance + GetBitmapKerning(bitmapFont, character, nextCharacter)) * scale));
                            return (
                                <span
                                    key={ `${ characterIndex }-${ character }` }
                                    className="bitmap-text-glyph-box"
                                    style={ {
                                        width: advance,
                                        height: Math.ceil(bitmapFont.metrics.lineHeight * scale)
                                    } }>
                                    <span
                                        className={ `bitmap-text-glyph ${ preserveColor ? 'preserve-color' : '' }`.trim() }
                                        style={ {
                                            width: glyph.w,
                                            height: glyph.h,
                                            left: Math.round(glyph.bx * scale),
                                            top: Math.round((glyph.by + bitmapFont.yOffset) * scale),
                                            transform: `scale(${ scale })`,
                                            transformOrigin: 'top left',
                                            backgroundImage: preserveColor ? `url(${ bitmapFont.atlas })` : undefined,
                                            backgroundPosition: preserveColor ? `-${ glyph.x }px -${ glyph.y }px` : undefined,
                                            WebkitMaskImage: preserveColor ? undefined : `url(${ bitmapFont.atlas })`,
                                            WebkitMaskPosition: preserveColor ? undefined : `-${ glyph.x }px -${ glyph.y }px`,
                                            maskImage: preserveColor ? undefined : `url(${ bitmapFont.atlas })`,
                                            maskPosition: preserveColor ? undefined : `-${ glyph.x }px -${ glyph.y }px`
                                        } as CSSProperties }
                                    />
                                </span>
                            );
                        }) }
                    </span>
                );
            }) }
        </span>
    );
}

const renderHtmlNode = (node: Node, font: BitmapFontName, key: string, scale: number): ReactNode =>
{
    if(node.nodeType === Node.TEXT_NODE) return <BitmapText key={ key } font={ font } text={ node.textContent || '' } scale={ scale } />;

    if(node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const childFont = getFontForStyle(font, tagName === 'b' || tagName === 'strong', tagName === 'i' || tagName === 'em');
    const children = Array.from(element.childNodes).map((child, index) => renderHtmlNode(child, childFont, `${ key }-${ index }`, scale));

    if(tagName === 'br') return <br key={ key } />;
    if(tagName === 'b' || tagName === 'strong') return <strong key={ key }>{ children }</strong>;
    if(tagName === 'i' || tagName === 'em') return <em key={ key }>{ children }</em>;
    if(tagName === 'u') return <u key={ key }>{ children }</u>;
    if(tagName === 'a') return <a key={ key } href={ element.getAttribute('href') || undefined } target={ element.getAttribute('target') || undefined } rel={ element.getAttribute('rel') || undefined }>{ children }</a>;

    return <span key={ key } className={ element.getAttribute('class') || undefined }>{ children }</span>;
}

export const BitmapTextHtml: FC<BitmapTextHtmlProps> = props =>
{
    const { html = '', font = 'regular', className = '', style = {}, maxWidth = null, title = null, scale = 1 } = props;

    const content = useMemo(() =>
    {
        if(!html.length || typeof DOMParser === 'undefined') return null;

        const doc = new DOMParser().parseFromString(`<span>${ html }</span>`, 'text/html');
        const root = doc.body.firstElementChild;

        if(!root) return null;

        return Array.from(root.childNodes).map((node, index) => renderHtmlNode(node, font, index.toString(), scale));
    }, [ html, font, scale ]);

    if(!html.length) return null;

    return (
        <span className={ `bitmap-text bitmap-text-html ${ className }`.trim() } style={ { ...style, maxWidth: maxWidth || style.maxWidth } } title={ title }>
            { content || <BitmapText font={ font } text={ html } scale={ scale } /> }
        </span>
    );
}
