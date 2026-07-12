import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionMovementValidationView: FC<{}> = props =>
{
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams(trigger?.intData ?? []);
    
    return <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save } />;
}
