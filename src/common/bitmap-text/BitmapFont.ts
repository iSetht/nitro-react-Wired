import glyphIndex from '../../assets/glyphs/index.json';

export type BitmapFontName = keyof typeof glyphIndex.styles | string;

interface BitmapGlyph
{
    advance: number;
    w: number;
    h: number;
    x: number;
    y: number;
    bx: number;
    by: number;
}

interface BitmapFontMetrics
{
    ascent: number;
    descent: number;
    glyphs: Record<string, BitmapGlyph>;
    charIndex: string;
    kern: [ number, number, number ][];
    lineHeight: number;
    size: number;
    fontFamily: string;
}

export interface BitmapFontDefinition
{
    name: string;
    atlas: string;
    metrics: BitmapFontMetrics;
    kerning: Map<string, number>;
    yOffset: number;
}

const metricsModules = import.meta.glob('../../assets/glyphs/*.json', { eager: true });
const atlasModules = import.meta.glob('../../assets/glyphs/*.png', { eager: true, query: '?url', import: 'default' });

const fonts = new Map<string, BitmapFontDefinition>();

const getModuleDefault = <T>(module: unknown): T =>
{
    if(module && typeof module === 'object' && ('default' in module)) return (module as { default: T }).default;

    return module as T;
}

Object.entries(glyphIndex.styles).forEach(([ name, style ]) =>
{
    const metricsPath = `../../assets/glyphs/${ style.metrics }`;
    const atlasPath = `../../assets/glyphs/${ style.atlas }`;
    const yOffset = Number((style as { yOffset?: number }).yOffset ?? 0);
    const metrics = getModuleDefault<BitmapFontMetrics>(metricsModules[metricsPath]);
    const atlas = getModuleDefault<string>(atlasModules[atlasPath]);

    if(!metrics || !atlas) return;

    const kerning = new Map<string, number>();

    if(metrics.kern && metrics.kern.length)
    {
        for(const [ leftIndex, rightIndex, amount ] of metrics.kern)
        {
            const left = metrics.charIndex[leftIndex];
            const right = metrics.charIndex[rightIndex];

            if(left && right && amount) kerning.set(left + right, amount);
        }
    }

    fonts.set(name, { name, atlas, metrics, kerning, yOffset });
});

export const GetBitmapFont = (name: BitmapFontName): BitmapFontDefinition =>
{
    return fonts.get(name) || fonts.get('regular');
}

export const HasBitmapFont = (name: BitmapFontName): boolean => fonts.has(name);

export const GetBitmapKerning = (font: BitmapFontDefinition, left: string, right: string): number =>
{
    if(!left || !right) return 0;

    return font.kerning.get(left + right) || 0;
}

export const MeasureBitmapText = (fontName: BitmapFontName, text: string): number =>
{
    const font = GetBitmapFont(fontName);

    if(!font || !text) return 0;

    let width = 0;

    for(let i = 0; i < text.length; i++)
    {
        const character = text[i];
        const glyph = font.metrics.glyphs[character] || font.metrics.glyphs['?'];

        if(!glyph) continue;

        width += glyph.advance;
        width += GetBitmapKerning(font, character, text[i + 1]);
    }

    return Math.ceil(width);
}
