import { FC } from 'react';
import { ColorUtils, LocalizeText } from '../../../../api';
import { NitroCardView, Text } from '../../../../common';
import { useFurnitureBackgroundColorWidget } from '../../../../hooks';
import { WiredButton, WiredDivider } from '../../../wired/views/WiredControls';

export const FurnitureBackgroundColorView: FC<{}> = props =>
{
    const { objectId = -1, color = 0, setColor = null, applyToner = null, toggleToner = null, onClose = null } = useFurnitureBackgroundColorWidget();
    const colorHex = ColorUtils.makeColorNumberHex(color);

    if(objectId === -1) return null;

    return (
        <NitroCardView
            uniqueKey="nitro-background-color"
            className="nitro-wired nitro-background-color"
            theme="primary"
            style={ { width: 238 } }>
            <div className="nw-header drag-handler">
                <div className="nw-header-bg" />
                <div className="nw-header-row1">
                    <span className="nw-header-title">
                        <Text bitmapFont="il_heading_3">{ LocalizeText('widget.backgroundcolor.title') }</Text>
                    </span>
                    <button className="nw-btn nw-btn-close" onClick={ onClose } />
                </div>
            </div>

            <div className="nw-body">
                <div className="nw-special">
                    <div className="nw-param">
                        <Text className="nw-control-title" bitmapFont="il_link_strong">{ LocalizeText('widget.backgroundcolor.hue') }</Text>
                        <label className="nw-bgcolor-picker">
                            <span className="nw-bgcolor-swatch" style={ { backgroundColor: colorHex } } />
                            <span className="nw-bgcolor-value">
                                <Text bitmapFont="il_regular">{ colorHex.toUpperCase() }</Text>
                            </span>
                            <input
                                type="color"
                                value={ colorHex }
                                onChange={ event => setColor(ColorUtils.convertFromHex(event.target.value)) } />
                        </label>
                    </div>

                    <WiredDivider />

                    <div className="nw-bgcolor-buttons">
                        <WiredButton className="nw-inline-btn" onClick={ () => applyToner() }>
                            { LocalizeText('widget.backgroundcolor.button.apply') }
                        </WiredButton>
                        <WiredButton className="nw-inline-btn" onClick={ toggleToner }>
                            { LocalizeText('widget.backgroundcolor.button.on') }
                        </WiredButton>
                    </div>
                </div>
            </div>
        </NitroCardView>
    );
}
