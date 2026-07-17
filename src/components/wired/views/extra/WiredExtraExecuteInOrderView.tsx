import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';

export const WiredExtraExecuteInOrderView: FC<{}> = props =>
{
    return (
        <WiredBaseView
            wiredType="extra"
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ false }
            save={ null } />
    );
}
