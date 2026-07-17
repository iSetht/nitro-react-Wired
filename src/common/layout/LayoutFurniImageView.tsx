import { IGetImageListener, ImageResult, TextureUtils, Vector3d } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useMemo, useState } from 'react';
import { BaseProps } from '..';
import { GetRoomEngine, ProductTypeEnum } from '../../api';
import { Base } from '../Base';

interface LayoutFurniImageViewProps extends BaseProps<HTMLDivElement>
{
    productType: string;
    productClassId: number;
    direction?: number;
    extraData?: string;
    scale?: number;
}

export const LayoutFurniImageView: FC<LayoutFurniImageViewProps> = props =>
{
    const { productType = 's', productClassId = -1, direction = 2, extraData = '', scale = 1, style = {}, ...rest } = props;
    const [ imageElement, setImageElement ] = useState<HTMLImageElement>(null);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(imageElement?.src?.length)
        {
            newStyle.backgroundImage = `url('${ imageElement.src }')`;
            newStyle.width = imageElement.width;
            newStyle.height = imageElement.height;
        }

        if(scale !== 1)
        {
            newStyle.transform = `scale(${ scale })`;

            if(!(scale % 1)) newStyle.imageRendering = 'pixelated';
        }

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ imageElement, scale, style ]);

    useEffect(() =>
    {
        let imageResult: ImageResult = null;
        let disposed = false;

        const updateImage = (image: HTMLImageElement) =>
        {
            if(!image) return;

            if(image.complete) setImageElement(image);
            else image.onload = () =>
            {
                if(!disposed) setImageElement(image);
            };
        };

        const listener: IGetImageListener = {
            imageReady: (id, texture, image) =>
            {
                if(!image && texture)
                {
                    image = TextureUtils.generateImage(texture);
                }

                updateImage(image);
            },
            imageFailed: null
        };

        switch(productType.toLocaleLowerCase())
        {
            case ProductTypeEnum.FLOOR:
                imageResult = GetRoomEngine().getFurnitureFloorImage(productClassId, new Vector3d(direction), 64, listener, 0, extraData);
                break;
            case ProductTypeEnum.WALL:
                imageResult = GetRoomEngine().getFurnitureWallImage(productClassId, new Vector3d(direction), 64, listener, 0, extraData);
                break;
        }

        if(imageResult)
        {
            const image = imageResult.getImage();

            updateImage(image);
        }

        return () =>
        {
            disposed = true;
        };
    }, [ productType, productClassId, direction, extraData ]);

    if(!imageElement) return null;

    return <Base classNames={ [ 'furni-image' ] } style={ getStyle } { ...rest } />;
}
