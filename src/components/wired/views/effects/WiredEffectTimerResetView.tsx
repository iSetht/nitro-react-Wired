import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredEffectBaseView } from './WiredEffectBaseView';

export const WiredEffectTimerResetView: FC<{}> = props =>
{
    return <WiredEffectBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ false } save={ null } />;
}
