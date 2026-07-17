import { ButtonHTMLAttributes, FC, PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredBaseView } from '../WiredBaseView';
import { WiredAssetIcon, WiredCheckbox, WiredParam } from '../WiredControls';
import { WiredSourceSelectorConfig } from '../WiredFurniSelectorView';
import { WiredIcon, wiredIconUrl } from '../WiredIcons';

export interface WiredSelectorBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: (filterExistingSelection?: boolean, invert?: boolean) => void;
    showSelectorOptions?: boolean;
    selectorOptionOffset?: number;
    furniSource?: number;
    onFurniSourceChange?: (source: number) => void;
    sourceOptions?: number[];
    sourceTitleKey?: string;
    sourceLabelPrefix?: string;
    sourceSelectors?: WiredSourceSelectorConfig[];
    hideFurniSelector?: boolean;
    expanded?: boolean;
    expandedWindow?: boolean;
    onToggleExpanded?: () => void;
    alwaysExpandedSources?: boolean;
    advancedSlot?: ReactNode;
    showSourceDivider?: boolean;
}

export const WiredSelectorOptionsParam: FC<{
    filterExistingSelection: boolean;
    invert: boolean;
    onFilterExistingSelectionChange: (value: boolean) => void;
    onInvertChange: (value: boolean) => void;
    divider?: boolean;
}> = props =>
{
    const { filterExistingSelection, invert, onFilterExistingSelectionChange, onInvertChange, divider = true } = props;

    return (
        <WiredParam titleKey="wiredfurni.params.selector_options_selector" divider={ divider }>
            <WiredCheckbox
                checked={ filterExistingSelection }
                onChange={ onFilterExistingSelectionChange }
                label={ LocalizeText('wiredfurni.params.selector_option.0') } />

            <WiredCheckbox
                checked={ invert }
                onChange={ onInvertChange }
                label={ LocalizeText('wiredfurni.params.selector_option.1') } />
        </WiredParam>
    );
}

type WiredSelectorToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: string;
    active?: boolean;
};

export const WiredSelectorToolButton: FC<WiredSelectorToolButtonProps> = props =>
{
    const { icon, active = false, className = '', ...rest } = props;

    return (
        <button
            { ...rest }
            type="button"
            className={ `nw-selector-tool-btn ${ active ? 'is-active' : '' } ${ className }` }
            style={ { backgroundImage: `url(${ wiredIconUrl(WiredIcon.emptyButton) })` } }>
            <WiredAssetIcon name={ icon } />
        </button>
    );
}

export const WiredSelectorBaseView: FC<PropsWithChildren<WiredSelectorBaseViewProps>> = props =>
{
    const {
        requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE,
        save = null,
        hasSpecialInput = false,
        showSelectorOptions = false,
        selectorOptionOffset = 0,
        furniSource,
        onFurniSourceChange,
        sourceOptions,
        sourceTitleKey,
        sourceLabelPrefix,
        sourceSelectors,
        hideFurniSelector,
        expanded,
        expandedWindow,
        onToggleExpanded,
        alwaysExpandedSources,
        advancedSlot,
        showSourceDivider,
        children = null
    } = props;

    const [ filterExistingSelection, setFilterExistingSelection ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    const { trigger = null } = useWired();

    useEffect(() =>
    {
        if(!showSelectorOptions || !trigger) return;

        const intData = (trigger.intData || []);

        setFilterExistingSelection(intData.length > selectorOptionOffset ? (intData[selectorOptionOffset] === 1) : false);
        setInvert(intData.length > (selectorOptionOffset + 1) ? (intData[selectorOptionOffset + 1] === 1) : false);
    }, [ trigger, showSelectorOptions, selectorOptionOffset ]);

    return (
        <WiredBaseView
            wiredType="selector"
            requiresFurni={ requiresFurni }
            hasSpecialInput={ hasSpecialInput }
            save={ () => (save ?? (() => {}))(filterExistingSelection, invert) }
            furniSource={ furniSource }
            onFurniSourceChange={ onFurniSourceChange }
            sourceOptions={ sourceOptions }
            sourceTitleKey={ sourceTitleKey }
            sourceLabelPrefix={ sourceLabelPrefix }
            sourceSelectors={ sourceSelectors }
            hideFurniSelector={ hideFurniSelector }
            expanded={ expanded }
            expandedWindow={ expandedWindow }
            onToggleExpanded={ onToggleExpanded }
            alwaysExpandedSources={ alwaysExpandedSources }
            advancedSlot={ advancedSlot }
            showSourceDivider={ showSourceDivider }
        >
            <>
                { children }

                { showSelectorOptions &&
                    <WiredSelectorOptionsParam
                        filterExistingSelection={ filterExistingSelection }
                        invert={ invert }
                        onFilterExistingSelectionChange={ setFilterExistingSelection }
                        onInvertChange={ setInvert }
                        divider={ false } /> }
            </>
        </WiredBaseView>
    );
}
