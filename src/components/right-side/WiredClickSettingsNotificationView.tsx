import { WiredClickSettingsEvent, WiredClickSettingsToggleComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetWiredClickSettings, LocalizeText, SendMessageComposer, SetWiredClickSettings } from '../../api';
import { useMessageEvent } from '../../hooks';

type ClickSettingsNotice = 'active' | 'reset';

export const WiredClickSettingsNotificationView: FC<{}> = props =>
{
    const [ notices, setNotices ] = useState<ClickSettingsNotice[]>([]);
    const [ active, setActive ] = useState(false);
    const [ exiting, setExiting ] = useState(false);
    const fadeTimer = useRef<number>(0);
    const clearTimer = useRef<number>(0);
    const text = (key: string, fallback: string) =>
    {
        const value = LocalizeText(key);

        return value === key ? fallback : value;
    }

    const clearTimers = () =>
    {
        if(fadeTimer.current) window.clearTimeout(fadeTimer.current);
        if(clearTimer.current) window.clearTimeout(clearTimer.current);

        fadeTimer.current = 0;
        clearTimer.current = 0;
    }

    useEffect(() => () => clearTimers(), []);

    useMessageEvent<WiredClickSettingsEvent>(WiredClickSettingsEvent, event =>
    {
        const parser = event.getParser();
        const hasCustomSettings = (parser.userMode !== 0) || (parser.furniMode !== 0);

        SetWiredClickSettings({
            userMode: parser.userMode,
            furniMode: parser.furniMode,
            active: parser.active
        });

        setActive(parser.active);

        clearTimers();
        setExiting(false);

        if(hasCustomSettings)
        {
            setNotices([ 'active' ]);
            return;
        }

        setNotices(previous =>
        {
            const nextNotices = previous.includes('active') ? [ 'active', 'reset' ] : [ 'reset' ];

            return nextNotices;
        });

        fadeTimer.current = window.setTimeout(() => setExiting(true), 1800);
        clearTimer.current = window.setTimeout(() =>
        {
            setNotices([]);
            setExiting(false);
        }, 2300);
    });

    if(!notices.length) return null;

    const setClickSettingsActive = (nextActive: boolean) =>
    {
        setActive(nextActive);
        SetWiredClickSettings({
            ...GetWiredClickSettings(),
            active: nextActive
        });

        SendMessageComposer(new WiredClickSettingsToggleComposer(nextActive));
    };

    return (
        <div className={ `nitro-wired-click-settings-stack ${ exiting ? 'is-exiting' : '' }` }>
            { notices.map(notice => (
                <div key={ notice } className={ `nitro-wired-click-settings nitro-wired-click-settings-${ notice }` }>
                    <div className="nitro-wired-click-settings-body">
                        <div className="nitro-wired-click-settings-message">{ text('notification.click_settings', 'The clicking behavior has changed for this room') }</div>
                        { notice === 'active' &&
                            <div className="nitro-wired-click-settings-actions">
                                { active
                                    ? <button type="button" onClick={ () => setClickSettingsActive(false) }>{ text('notification.stop', 'Stop') }</button>
                                    : <button type="button" onClick={ () => setClickSettingsActive(true) }>{ text('notification.resume', 'Resume') }</button> }
                            </div> }
                    </div>
                </div>
            )) }
        </div>
    );
}
