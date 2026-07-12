import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createFurniSourceSelector, createUserSourceSelector, FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { WIRED_SOURCE_SELECTED, WIRED_SOURCE_TRIGGER, WiredCheckbox, WiredParam } from '../WiredControls';

export const WiredEffectTeleportToFurniView: FC<{}> = props =>
{
    const [ fastTeleport, setFastTeleport ] = useState(false);
    const { trigger = null, setIntParams = null } = useWired();
    const usesFastTeleportParam = trigger?.intData?.length > 3;
    const furniSourceIndex = usesFastTeleportParam ? 1 : 0;
    const userSourceIndex = usesFastTeleportParam ? 2 : 1;
    const furniSourceOptions = FURNI_TILE_SOURCE_OPTIONS_WITH_TRIGGERING;
    const [ furniSource, setFurniSource, furniExpanded, setFurniExpanded ] = useWiredEffectSource(trigger, furniSourceIndex, WIRED_SOURCE_SELECTED, furniSourceOptions);
    const [ userSource, setUserSource, userExpanded, setUserExpanded ] = useWiredEffectSource(trigger, userSourceIndex, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const expanded = furniExpanded || userExpanded;

    const save = () => setIntParams([ fastTeleport ? 1 : 0, furniSource, userSource ]);

    useEffect(() =>
    {
        setFastTeleport(usesFastTeleportParam ? (trigger.intData[0] === 1) : false);
    }, [ trigger, usesFastTeleportParam ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [
                createFurniSourceSelector(furniSource, setFurniSource, furniSourceOptions),
                createUserSourceSelector(userSource, setUserSource)
            ] }
            expanded={ expanded }
            onToggleExpanded={ () =>
            {
                setFurniExpanded(!expanded);
                setUserExpanded(!expanded);
            } }>
            <Column gap={ 1 }>
                <WiredParam titleKey="wiredfurni.params.teleport.options" divider={ false }>
                    <WiredCheckbox
                        checked={ fastTeleport }
                        onChange={ setFastTeleport }
                        label={ LocalizeText('wiredfurni.params.teleport.options.0') } />
                </WiredParam>
            </Column>
        </WiredEffectBaseView>
    );
}
