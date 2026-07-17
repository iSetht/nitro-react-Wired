import { FurnitureStackHeightComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import { Flex, NitroCardView, Text } from '../../../../common';
import { useFurnitureStackHeightWidget } from '../../../../hooks';
import { WiredButton, WiredControlTitle, WiredParam, WiredSlider, WiredTextInput } from '../../../wired/views/WiredControls';

const STACK_HEIGHT_STEP = 0.01;

const formatHeight = (value: number) => value.toFixed(2);

export const FurnitureStackHeightView: FC<{}> = props =>
{
    const { objectId = -1, height = 0, maxHeight = 40, onClose = null, updateHeight = null } = useFurnitureStackHeightWidget();
    const [ tempHeight, setTempHeight ] = useState('');

    const updateTempHeight = (value: string) =>
    {
        setTempHeight(value);

        const newValue = parseFloat(value);

        if(isNaN(newValue) || (newValue === height)) return;

        updateHeight(newValue);
    }

    useEffect(() =>
    {
        setTempHeight(formatHeight(height));
    }, [ height ]);

    const commitTempHeight = () =>
    {
        const nextHeight = parseFloat(tempHeight);

        if(isNaN(nextHeight))
        {
            setTempHeight(formatHeight(height));
            return;
        }

        setTempHeight(formatHeight(Math.min(maxHeight, Math.max(0, nextHeight))));
    }

    if(objectId === -1) return null;

    return (
        <NitroCardView
            uniqueKey="nitro-widget-custom-stack-height"
            className="nitro-wired nitro-widget-custom-stack-height"
            theme="primary"
            style={ { width: 238 } }>
            <div className="nw-header drag-handler">
                <div className="nw-header-bg" />
                <div className="nw-header-row1">
                    <span className="nw-header-title">
                        <Text bitmapFont="il_heading_3">{ LocalizeText('widget.custom.stack.height.title') }</Text>
                    </span>
                    <button className="nw-btn nw-btn-close" onClick={ onClose } />
                </div>
            </div>

            <div className="nw-body">
                <div className="nw-special">
                    <Text className="nw-furni-desc" bitmapFont="il_regular">{ LocalizeText('widget.custom.stack.height.text') }</Text>

                    <WiredParam divider={ false }>
                        <Flex className="nw-title-input-row" alignItems="center" gap={ 1 }>
                            <WiredControlTitle>{ LocalizeText('widget.custom.stack.height.title') }</WiredControlTitle>
                            <WiredTextInput
                                type="number"
                                compact
                                min={ 0 }
                                max={ maxHeight }
                                step={ STACK_HEIGHT_STEP }
                                value={ tempHeight }
                                onChange={ event => updateTempHeight(event.target.value) }
                                onBlur={ commitTempHeight } />
                        </Flex>
                        <WiredSlider
                            min={ 0 }
                            max={ maxHeight }
                            step={ STACK_HEIGHT_STEP }
                            value={ height }
                            onChange={ event => updateHeight(event) } />
                    </WiredParam>

                    <div className="nw-stack-height-buttons">
                        <WiredButton className="nw-inline-btn" onClick={ event => SendMessageComposer(new FurnitureStackHeightComposer(objectId, -100)) }>
                            { LocalizeText('furniture.above.stack') }
                        </WiredButton>
                        <WiredButton className="nw-inline-btn" onClick={ event => SendMessageComposer(new FurnitureStackHeightComposer(objectId, 0)) }>
                            { LocalizeText('furniture.floor.level') }
                        </WiredButton>
                    </div>
                </div>
            </div>
        </NitroCardView>
    );
}
