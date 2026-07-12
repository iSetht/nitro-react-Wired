import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetRoomEngine, LocalizeText, WiredFurniType } from '../../../../api';
import { useNotification, useWired } from '../../../../hooks';
import { WiredParam, WiredSlider, WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR } from '../WiredControls';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const SOURCES = [ WIRED_SOURCE_SELECTED, WIRED_SOURCE_SELECTOR ];

export const WiredTriggerCounterReachesSetTimeView: FC<{}> = props =>
{
    const [ furniSource, setFurniSource ] = useState(WIRED_SOURCE_SELECTED);
    const [ expanded, setExpanded ] = useState(false);
    const [ minutes, setMinutes ]         = useState(0);
    const [ halfSeconds, setHalfSeconds ] = useState(0);
    const { trigger = null, setIntParams = null, furniIds = [] } = useWired();
    const { simpleAlert = null } = useNotification();

    const save = () => setIntParams([ furniSource, minutes, halfSeconds ]);

    const GAME_TIMER_CLASS_NAMES = new Set([
        'fball_counter',
        'bb_counter',
        'es_counter',
        'wf_upcounter1',
        'wf_game_upcounter1',
        'shone_coivjau',
        'shone_coivver',
        'shone_combleu',
        'shone_comvert',
        'wf_game_upcounter2',
        'hcity_coivble',
        'hcity_coivrou',
        'hcity_comjaun',
        'hcity_comroug',
        'irinc_counter'
    ]);

    const validate = () =>
    {
        for (const furniId of furniIds)
        {
            const roomObject = GetRoomEngine().getRoomObject(
                GetRoomEngine().activeRoomId,
                furniId,
                RoomObjectCategory.FLOOR
            );

            if (!roomObject || !GAME_TIMER_CLASS_NAMES.has(roomObject.type))
            {
                simpleAlert(LocalizeText('wiredfurni.error.require_counter_furni'));
                return false;
            }
        }

        return true;
    }

    useEffect(() =>
    {
        if (!trigger) return;

        const saved = trigger.intData?.length > 0 ? trigger.intData[0] : WIRED_SOURCE_SELECTED;
        const valid = SOURCES.includes(saved) ? saved : WIRED_SOURCE_SELECTED;

        setFurniSource(valid);
        setExpanded(valid !== WIRED_SOURCE_SELECTED);
        setMinutes(     (trigger.intData.length > 1) ? trigger.intData[1] : 0 );
        setHalfSeconds( (trigger.intData.length > 2) ? trigger.intData[2] : 0 );
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE }
            hasSpecialInput={ true }
            save={ save }
            validate={ validate }
            furniSource={ furniSource }
            onFurniSourceChange={ setFurniSource }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(v => !v) }
        >
            <WiredParam title={ LocalizeText('wiredfurni.params.clock_minutes_elapsed', [ 'minutes' ], [ String(minutes) ]) }>
                <WiredSlider
                    min={ 0 }
                    max={ 99 }
                    step={ 1 }
                    value={ minutes }
                    onChange={ value => setMinutes(value) } />
            </WiredParam>
            <WiredParam title={ LocalizeText('wiredfurni.params.clock_seconds_elapsed', [ 'seconds' ], [ String(halfSeconds / 2) ]) } divider={ false }>
                <WiredSlider
                    min={ 0 }
                    max={ 119 }
                    step={ 1 }
                    value={ halfSeconds }
                    onChange={ value => setHalfSeconds(value) } />
            </WiredParam>
        </WiredTriggerBaseView>
    );
}
