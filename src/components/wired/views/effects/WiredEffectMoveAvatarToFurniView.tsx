import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING, USER_SOURCE_OPTIONS, useWiredEffectSource } from './WiredEffectSourceSelector';
import { WIRED_SOURCE_SELECTED, WIRED_SOURCE_TRIGGER, WiredParam, WiredRadio } from '../WiredControls';

const walkModeOptions = [ 0, 1, 2 ];

export const WiredEffectMoveAvatarToFurniView: FC<{}> = props =>
{
    const [ walkMode, setWalkMode ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();
    const furniSourceOptions = FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING;
    const [ furniSource, setFurniSource, furniExpanded, setFurniExpanded ] = useWiredEffectSource(trigger, 1, WIRED_SOURCE_SELECTED, furniSourceOptions);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const expanded = furniExpanded || userExpanded;

    const save = () => setIntParams([ walkMode, furniSource, userSource ]);

    useEffect(() =>
    {
        setWalkMode((trigger.intData.length > 0) ? trigger.intData[0] : 0);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                {
                    value: furniSource,
                    onChange: setFurniSource,
                    options: furniSourceOptions,
                    titleKey: 'wiredfurni.params.sources.furni.title.mv.1',
                    labelPrefix: 'wiredfurni.params.sources.furni'
                },
                {
                    value: userSource,
                    onChange: setUserSource,
                    options: USER_SOURCE_OPTIONS,
                    titleKey: 'wiredfurni.params.sources.furni.title.mv_user2',
                    labelPrefix: 'wiredfurni.params.sources.users'
                }
            ] }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                setFurniExpanded(!expanded);
                setUserExpanded(!expanded);
            } }
            alwaysExpandedSources={ true }>
            <WiredParam titleKey="wiredfurni.params.user_move.walkmode" divider={ false }>
                { walkModeOptions.map(option =>
                {
                    return (
                        <WiredRadio
                            key={ option }
                            name="walkMode"
                            checked={ walkMode === option }
                            onChange={ () => setWalkMode(option) }
                            label={ LocalizeText(`wiredfurni.params.user_move.walkmode.${ option }`) } />
                    )
                }) }
            </WiredParam>
        </WiredEffectBaseView>
    );
}
