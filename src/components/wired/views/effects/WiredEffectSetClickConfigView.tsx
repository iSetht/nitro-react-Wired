import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { WiredParam, WiredSelect, WIRED_SOURCE_TRIGGER } from '../WiredControls';
import { WiredEffectBaseView } from './WiredEffectBaseView';
import { createUserSourceSelector, useWiredEffectSource, USER_SOURCE_OPTIONS } from './WiredEffectSourceSelector';
import { useWired } from '../../../../hooks';

const MODE_DEFAULT = 0;

const text = (key: string, fallback: string) =>
{
    const value = LocalizeText(key);

    return value === key ? fallback : value;
}

export const WiredEffectSetClickConfigView: FC<{}> = props =>
{
    const [ userMode, setUserMode ] = useState(MODE_DEFAULT);
    const [ furniMode, setFurniMode ] = useState(MODE_DEFAULT);
    const { trigger = null, setIntParams = null } = useWired();
    const [ userSource, setUserSource, expanded, setExpanded ] = useWiredEffectSource(trigger, 2, WIRED_SOURCE_TRIGGER, USER_SOURCE_OPTIONS);
    const save = () => setIntParams([ userMode, furniMode, userSource ]);

    useEffect(() =>
    {
        if(!trigger) return;

        setUserMode((trigger.intData.length > 0) ? Math.max(0, Math.min(2, trigger.intData[0])) : MODE_DEFAULT);
        setFurniMode((trigger.intData.length > 1) ? Math.max(0, Math.min(1, trigger.intData[1])) : MODE_DEFAULT);
    }, [ trigger ]);

    return (
        <WiredEffectBaseView
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }
            sourceSelectors={ [ createUserSourceSelector(userSource, setUserSource) ] }
            expanded={ expanded }
            onToggleExpanded={ () => setExpanded(value => !value) }>
            <WiredParam title={ text('wiredfurni.params.click_settings.user', 'User click behavior') }>
                <WiredSelect
                    className="nw-select-nowrap nw-click-settings-user-select"
                    value={ userMode }
                    onChange={ event => setUserMode(Number(event.target.value)) }
                    options={ [
                        { value: 0, label: text('wiredfurni.params.click_settings.user.0', 'Default') },
                        { value: 1, label: text('wiredfurni.params.click_settings.user.1', 'Click the user, but walk behind the user') },
                        { value: 2, label: text('wiredfurni.params.click_settings.user.2', 'Click passes through the user') }
                    ] } />
            </WiredParam>
            <WiredParam title={ text('wiredfurni.params.click_settings.furni', 'Furni click behavior') } divider={ false }>
                <WiredSelect
                    value={ furniMode }
                    onChange={ event => setFurniMode(Number(event.target.value)) }
                    options={ [
                        { value: 0, label: text('wiredfurni.params.click_settings.furni.0', 'Default') },
                        { value: 1, label: text('wiredfurni.params.click_settings.furni.1', 'Click passes through the furni') }
                    ] } />
            </WiredParam>
        </WiredEffectBaseView>
    );
}
