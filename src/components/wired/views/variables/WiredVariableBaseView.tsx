import { FC, PropsWithChildren } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredVariableBaseViewProps
{
    save: () => void;
}

export const WiredVariableBaseView: FC<PropsWithChildren<WiredVariableBaseViewProps>> = props =>
{
    const { save = null, children = null } = props;

    return (
        <WiredBaseView wiredType="variable" requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            { children }
        </WiredBaseView>
    );
}
