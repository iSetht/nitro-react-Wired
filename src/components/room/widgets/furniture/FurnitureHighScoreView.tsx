import { FurnitureMultiStateComposer, HighScoreDataType, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useMemo } from 'react';
import { GetUserProfile, LocalizeText, SendMessageComposer } from '../../../../api';
import { LayoutAvatarImageView, Text } from '../../../../common';
import { useFurnitureHighScoreWidget, useRoom } from '../../../../hooks';
import { wiredIconUrl } from '../../../wired/views/WiredIcons';
import { ObjectLocationView } from '../object-location/ObjectLocationView';

const PODIUM_PLACEMENTS = [ 2, 1, 3 ];
const PODIUM_DIRECTIONS = [ 2, 3, 4 ];
const HIGHSCORE_LIST_VIEW_REQUEST = 101;
const HIGHSCORE_PODIUM_VIEW_REQUEST = 102;
const HIGHSCORE_DELETE_ROW_REQUEST_BASE = 200;

const getPlacementLabel = (placement: number) => `${ placement }${ placement === 1 ? 'st' : placement === 2 ? 'nd' : 'rd' }`;

interface FurnitureHighScoreItemViewProps
{
    objectId: number;
    stuffData: HighScoreDataType;
    getScoreType: (type: number) => string;
    getClearType: (type: number) => string;
}

const FurnitureHighScoreItemView: FC<FurnitureHighScoreItemViewProps> = props =>
{
    const { objectId = -1, stuffData = null, getScoreType = null, getClearType = null } = props;
    const { roomSession = null } = useRoom();
    const isPodiumView = (stuffData.getLegacyString() === '2');
    const canToggleView = !!roomSession?.isRoomOwner;
    const topEntries = useMemo(() => stuffData.entries.slice(0, 3), [ stuffData.entries ]);
    const podiumEntries = useMemo(() => [ topEntries[1], topEntries[0], topEntries[2] ], [ topEntries ]);

    const openUserProfile = (userId: number) =>
    {
        if(userId <= 0) return;

        GetUserProfile(userId);
    }

    const toggleView = () =>
    {
        if(!canToggleView) return;

        SendMessageComposer(new FurnitureMultiStateComposer(objectId, isPodiumView ? HIGHSCORE_LIST_VIEW_REQUEST : HIGHSCORE_PODIUM_VIEW_REQUEST));
    }

    const deleteRow = (index: number) =>
    {
        if(!canToggleView) return;

        SendMessageComposer(new FurnitureMultiStateComposer(objectId, HIGHSCORE_DELETE_ROW_REQUEST_BASE + index));
    }

    return (
        <ObjectLocationView objectId={ objectId } category={ RoomObjectCategory.FLOOR }>
            <div className="nitro-widget-high-score">
                <div className="hs-panel">
                    <div className="hs-caption">
                        <Text bitmapFont="id_heading_2">
                            { LocalizeText('high.score.display.caption', [ 'scoretype', 'cleartype' ], [ LocalizeText(`high.score.display.scoretype.${ getScoreType(stuffData.scoreType) }`), LocalizeText(`high.score.display.cleartype.${ getClearType(stuffData.clearType) }`) ]) }
                        </Text>
                    </div>
                    { isPodiumView
                        ? (
                            <div className="hs-podium-view">
                                <div className="hs-podium-stage">
                                    { podiumEntries.map((entry, podiumIndex) =>
                                    {
                                        const placement = PODIUM_PLACEMENTS[podiumIndex];
                                        const userName = entry?.users?.[0] ?? '-';
                                        const userId = entry?.userIds?.[0] ?? 0;
                                        const figure = entry?.looks?.[0];
                                        const direction = PODIUM_DIRECTIONS[podiumIndex];

                                        return (
                                            <div key={ placement } className={ `hs-podium-player hs-podium-rank-${ placement }` }>
                                                <Text bitmapFont="button_regular" className="hs-podium-place">{ getPlacementLabel(placement) }</Text>
                                                <div className="hs-podium-body">
                                                    <button type="button" className="hs-podium-avatar-wrap" onClick={ () => openUserProfile(userId) }>
                                                        { figure && <LayoutAvatarImageView figure={ figure } direction={ direction } scale={ 1 } /> }
                                                    </button>
                                                    <div className="hs-podium-info">
                                                        <Text bitmapFont="button_regular" className="hs-podium-name">{ userName }</Text>
                                                        <Text bitmapFont="button_regular" className="hs-podium-score">{ entry?.score ?? 0 }</Text>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) }
                                </div>
                            </div>
                        )
                        : (
                            <>
                                <div className="hs-column-headings">
                                    <div className="hs-heading hs-heading-users">
                                        <Text bitmapFont="il_regular">{ LocalizeText('high.score.display.users.header') }</Text>
                                    </div>
                                    <div className="hs-heading hs-heading-score">
                                        <Text bitmapFont="il_regular">{ LocalizeText('high.score.display.score.header') }</Text>
                                    </div>
                                </div>
                                <div className="hs-list-wrap">
                                    <div className="hs-list">
                                        { stuffData.entries.map((entry, index) =>
                                        {
                                            return (
                                                <div key={ `${ entry.userIds.join('-') }-${ entry.score }-${ index }` } className={ `hs-row ${ index < 3 ? `hs-row-rank-${ index + 1 }` : '' } ${ canToggleView ? 'is-owner' : '' }` }>
                                                    { canToggleView &&
                                                        <button type="button" className="hs-delete-row" onClick={ () => deleteRow(index) }>
                                                            <Text bitmapFont="button_regular">x</Text>
                                                        </button> }
                                                    <Text bitmapFont="button_regular" className="hs-users">{ entry.users.join(', ') }</Text>
                                                    <Text bitmapFont="button_regular" className="hs-score">{ entry.score }</Text>
                                                </div>
                                            );
                                        }) }
                                    </div>
                                </div>
                            </>
                        ) }
                    <div className="hs-footer">
                        { canToggleView &&
                            <button type="button" className={ `hs-view-toggle ${ isPodiumView ? 'is-back' : '' }` } onClick={ toggleView } /> }
                    </div>
                </div>
                { !isPodiumView &&
                    <img className="hs-trophy" alt="" src={ wiredIconUrl('leaderboard_trophy') } /> }
                <div className="hs-bubble-hook" />
            </div>
        </ObjectLocationView>
    );
}

export const FurnitureHighScoreView: FC<{}> = props =>
{
    const { roomSession = null } = useRoom();
    const { stuffDatas = null, getScoreType = null, getClearType = null } = useFurnitureHighScoreWidget();

    if(!roomSession || !stuffDatas || !stuffDatas.size) return null;

    return (
        <>
            { Array.from(stuffDatas.entries()).map(([ objectId, stuffData ]) =>
                <FurnitureHighScoreItemView key={ objectId } objectId={ objectId } stuffData={ stuffData } getScoreType={ getScoreType } getClearType={ getClearType } />) }
        </>
    );
}
