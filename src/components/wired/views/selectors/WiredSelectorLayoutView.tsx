import { WiredSelectorLayout } from '../../../../api';
import { WiredSelectorFurniInAreaView } from './WiredSelectorFurniInAreaView';
import { WiredSelectorFurniInNeighborhoodView } from './WiredSelectorFurniInNeighborhoodView';
import { WiredSelectorFurniByTypeView } from './WiredSelectorFurniByTypeView';
import { WiredSelectorFurniOnFurniView } from './WiredSelectorFurniOnFurniView';
import { WiredSelectorFurniWithAltitudeView } from './WiredSelectorFurniWithAltitudeView';
import { WiredSelectorFurniPicksView } from './WiredSelectorFurniPicksView';
import { WiredSelectorFurniFromSignalView } from './WiredSelectorFurniFromSignalView';
import { WiredSelectorUserInAreaView } from './WiredSelectorUserInAreaView';
import { WiredSelectorUserInNeighborhoodView } from './WiredSelectorUserInNeighborhoodView';
import { WiredSelectorUserByTypeView } from './WiredSelectorUserByTypeView';
import { WiredSelectorUserFromSignalView } from './WiredSelectorUserFromSignalView';
import { WiredSelectorUserInTeamView } from './WiredSelectorUserInTeamView';
import { WiredSelectorUserByActionView } from './WiredSelectorUserByActionView';
import { WiredSelectorUserByNameView } from './WiredSelectorUserByNameView';
import { WiredSelectorUserOnFurniView } from './WiredSelectorUserOnFurniView';
import { WiredSelectorUserWithHanditemView } from './WiredSelectorUserWithHanditemView';
import { WiredSelectorUserInGroupView } from './WiredSelectorUserInGroupView';
import { WiredSelectorFilterXUserView } from './WiredSelectorFilterXUserView';
import { WiredSelectorFilterXFurniView } from './WiredSelectorFilterXFurniView';
import { WiredSelectorTilePicksView } from './WiredSelectorTilePicksView';
import { WiredSelectorRemoteSelectionView } from './WiredSelectorRemoteSelectionView';
import { WiredSelectorUserWithVariableView } from './WiredSelectorUserWithVariableView';
import { WiredSelectorFurniWithVariableView } from './WiredSelectorFurniWithVariableView';
import { WiredSelectorFilterUserHighLowView } from './WiredSelectorFilterUserHighLowView';
import { WiredSelectorFilterFurniHighLowView } from './WiredSelectorFilterFurniHighLowView';

export const WiredSelectorLayoutView = (code: number) =>
{
    switch(code)
    {   
        case WiredSelectorLayout.FURNI_IN_AREA:
            return <WiredSelectorFurniInAreaView />;
        case WiredSelectorLayout.FURNI_IN_NEIGHBORHOOD:
            return <WiredSelectorFurniInNeighborhoodView />;
        case WiredSelectorLayout.FURNI_BY_TYPE:
            return <WiredSelectorFurniByTypeView />;
        case WiredSelectorLayout.FURNI_ON_FURNI:
            return <WiredSelectorFurniOnFurniView />;
        case WiredSelectorLayout.FURNI_BY_ALTITUDE:
            return <WiredSelectorFurniWithAltitudeView />;
        case WiredSelectorLayout.FURNI_PICKS:
            return <WiredSelectorFurniPicksView />;
        case WiredSelectorLayout.FURNI_FROM_SIGNAL:
            return <WiredSelectorFurniFromSignalView />;
        case WiredSelectorLayout.USER_IN_AREA:
            return <WiredSelectorUserInAreaView />;
        case WiredSelectorLayout.USER_IN_NEIGHBORHOOD:
            return <WiredSelectorUserInNeighborhoodView />;
        case WiredSelectorLayout.USER_BY_TYPE:
            return <WiredSelectorUserByTypeView />;
        case WiredSelectorLayout.USER_FROM_SIGNAL:
            return <WiredSelectorUserFromSignalView />;
        case WiredSelectorLayout.USER_IN_TEAM:
            return <WiredSelectorUserInTeamView />;
        case WiredSelectorLayout.USER_BY_ACTION:
            return <WiredSelectorUserByActionView />;
        case WiredSelectorLayout.USER_BY_NAME:
            return <WiredSelectorUserByNameView />;
        case WiredSelectorLayout.USER_ON_FURNI:
            return <WiredSelectorUserOnFurniView />;
        case WiredSelectorLayout.USER_WITH_HANDITEM:
            return <WiredSelectorUserWithHanditemView />;
        case WiredSelectorLayout.USER_IN_GROUP:
            return <WiredSelectorUserInGroupView />;
        case WiredSelectorLayout.FILTER_X_USER:
            return <WiredSelectorFilterXUserView />;
        case WiredSelectorLayout.FILTER_X_FURNI:
            return <WiredSelectorFilterXFurniView />;
        case WiredSelectorLayout.TILE_PICKS:
            return <WiredSelectorTilePicksView />;
        case WiredSelectorLayout.REMOTE_SELECTION:
            return <WiredSelectorRemoteSelectionView />;
        case WiredSelectorLayout.USER_WITH_VARIABLE:
            return <WiredSelectorUserWithVariableView />;
        case WiredSelectorLayout.FURNI_WITH_VARIABLE:
            return <WiredSelectorFurniWithVariableView />;
        case WiredSelectorLayout.FILTER_USER_HIGH_LOW:
            return <WiredSelectorFilterUserHighLowView />;
        case WiredSelectorLayout.FILTER_FURNI_HIGH_LOW:
            return <WiredSelectorFilterFurniHighLowView />;
    }

    return null;
}
