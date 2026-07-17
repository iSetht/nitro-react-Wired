import { WiredActionDefinition } from '@nitrots/nitro-renderer';
import { FC, PropsWithChildren, ReactNode, useEffect } from 'react';
import { GetWiredTimeLocale, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { WiredDelaySlider } from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';

export interface WiredEffectBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
    validate?: () => boolean;
    furniSource?: number;
    onFurniSourceChange?: (source: number) => void;
    sourceOptions?: number[];
    sourceTitleKey?: string;
    sourceLabelPrefix?: string;
    sourceSelectors?: WiredSourceSelectorConfig[];
    hideFurniSelector?: boolean;
    hideFurniSelectionCaption?: boolean;
    expanded?: boolean;
    windowWidth?: number;
    onToggleExpanded?: () => void;
    headerSlot?: ReactNode;
    advancedSlot?: ReactNode;
    alwaysExpandedSources?: boolean;
}

export const WiredEffectBaseView: FC<PropsWithChildren<WiredEffectBaseViewProps>> = props =>
{
    const {
        requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE,
        save = null,
        validate = null,
        hasSpecialInput = false,
        children = null,
        furniSource,
        onFurniSourceChange,
        sourceOptions,
        sourceTitleKey,
        sourceLabelPrefix,
        sourceSelectors,
        hideFurniSelector,
        hideFurniSelectionCaption,
        expanded,
        windowWidth,
        onToggleExpanded,
        headerSlot,
        advancedSlot,
        alwaysExpandedSources
    } = props;
    const { trigger = null, actionDelay = 0, setActionDelay = null } = useWired();
    const BaseView = WiredBaseView as any;

    useEffect(() =>
    {
        setActionDelay((trigger as WiredActionDefinition).delayInPulses);
    }, [ trigger, setActionDelay ]);

    return (
        <BaseView
            wiredType="effect"
            requiresFurni={ requiresFurni }
            save={ save }
            validate={ validate }
            hasSpecialInput={ hasSpecialInput }
            furniSource={ furniSource }
            onFurniSourceChange={ onFurniSourceChange }
            sourceOptions={ sourceOptions }
            sourceTitleKey={ sourceTitleKey }
            sourceLabelPrefix={ sourceLabelPrefix }
            sourceSelectors={ sourceSelectors }
            hideFurniSelector={ hideFurniSelector }
            hideFurniSelectionCaption={ hideFurniSelectionCaption }
            expanded={ expanded }
            windowWidth={ windowWidth }
            onToggleExpanded={ onToggleExpanded }
            headerSlot={ headerSlot }
            advancedSlot={ advancedSlot }
            alwaysExpandedSources={ alwaysExpandedSources }
            afterSelectorSlot={
                <WiredDelaySlider
                    divider={ false }
                    label={ LocalizeText('wiredfurni.params.delay', [ 'seconds' ], [ GetWiredTimeLocale(actionDelay) ]) }
                    value={ actionDelay }
                    onChange={ event => setActionDelay(event) } />
            }>
            { children }
        </BaseView>
    );
}
