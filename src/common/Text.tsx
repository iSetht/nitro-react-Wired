import { FC, useMemo } from 'react';
import { Base, BaseProps } from './Base';
import { BitmapFontName, BitmapText } from './bitmap-text';
import { ColorVariantType, FontSizeType, FontWeightType, TextAlignType } from './types';

export interface TextProps extends BaseProps<HTMLDivElement>
{
    variant?: ColorVariantType;
    fontWeight?: FontWeightType;
    fontSize?: FontSizeType;
    align?: TextAlignType;
    bold?: boolean;
    underline?: boolean;
    italics?: boolean;
    truncate?: boolean;
    center?: boolean;
    textEnd?: boolean;
    small?: boolean;
    wrap?: boolean;
    noWrap?: boolean;
    textBreak?: boolean;
    bitmap?: boolean;
    bitmapFont?: BitmapFontName;
    bitmapScale?: number;
}

export const Text: FC<TextProps> = props =>
{
    const { variant = 'black', fontWeight = null, fontSize = 0, align = null, bold = false, underline = false, italics = false, truncate = false, center = false, textEnd = false, small = false, wrap = false, noWrap = false, textBreak = false, bitmap = false, bitmapFont = null, bitmapScale = 1, children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'd-inline' ];

        if(variant) newClassNames.push('text-' + variant);

        if(bold) newClassNames.push('fw-bold');

        if(fontWeight) newClassNames.push('fw-' + fontWeight);

        if(fontSize) newClassNames.push('fs-' + fontSize);

        if(align) newClassNames.push('text-' + align);

        if(underline) newClassNames.push('text-decoration-underline');

        if(italics) newClassNames.push('fst-italic');

        if(truncate) newClassNames.push('text-truncate');

        if(center) newClassNames.push('text-center');

        if(textEnd) newClassNames.push('text-end');

        if(small) newClassNames.push('small');

        if(wrap) newClassNames.push('text-wrap');

        if(noWrap) newClassNames.push('text-nowrap');

        if(textBreak) newClassNames.push('text-break');

        return newClassNames;
    }, [ variant, fontWeight, fontSize, align, bold, underline, italics, truncate, center, textEnd, small, wrap, noWrap, textBreak ]);

    const canUseBitmap = (bitmap || !!bitmapFont) && ((typeof children === 'string') || (typeof children === 'number'));

    return (
        <Base classNames={ getClassNames } { ...rest }>
            { canUseBitmap ? <BitmapText font={ bitmapFont || 'regular' } text={ children as string | number } scale={ bitmapScale } /> : children }
        </Base>
    );
}
