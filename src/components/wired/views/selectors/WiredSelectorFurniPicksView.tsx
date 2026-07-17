import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

export const WiredSelectorFurniPicksView: FC<{}> = props =>
{
    const { setIntParams = null } = useWired();

    const save = (filterExistingSelection = false, invert = false) =>
    {
        setIntParams([
            filterExistingSelection ? 1 : 0,
            invert ? 1 : 0
        ]);
    };

    return (
        <WiredSelectorBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            showSelectorOptions={ true }
            selectorOptionOffset={ 0 }
        />
    );
}