import React, { FC, useMemo, useState } from 'react';
import { LocalizeText, RoomObjectItem, chooserSelectionVisualizer } from '../../../../api';
import { NitroCardHeaderView, NitroCardView } from '../../../../common';

interface ChooserWidgetViewProps {
    title: string;
    items: RoomObjectItem[];
    selectItem: (item: RoomObjectItem) => void;
    onClose: () => void;
    label?: 'users' | 'items';
}

export const ChooserWidgetView: FC<ChooserWidgetViewProps> = (props) =>
{
    const { title, items, selectItem, onClose, label = 'items' } = props;

    const [ selectedItem, setSelectedItem ] = useState<RoomObjectItem>(null);
    const [ selectedFilter, setSelectedFilter ] = useState('all');
    const [ searchValue, setSearchValue ] = useState('');
    const [ expandedGroups, setExpandedGroups ] = useState<string[]>([]);

    const filteredItems = useMemo(() =>
    {
        const value = searchValue.toLowerCase();

        return items.filter(item =>
        {
            const matchesSearch = item.name?.toLowerCase().includes(value);
            const matchesFilter =
                selectedFilter === 'all' ||
                (label === 'users' ? item.type === selectedFilter : item.ownerName === selectedFilter);

            return matchesSearch && matchesFilter;
        });
    }, [ items, searchValue, selectedFilter, label ]);

    const groupedItems = useMemo(() =>
    {
        return Object.entries(
            filteredItems.reduce((acc, item) =>
            {
                acc[item.name] = acc[item.name] || [];
                acc[item.name].push(item);
                return acc;
            }, {} as { [key: string]: RoomObjectItem[] })
        );
    }, [ filteredItems ]);

    const toggleGroup = (name: string) =>
    {
        setExpandedGroups(prev =>
            prev.includes(name)
                ? prev.filter(n => n !== name)
                : [ ...prev, name ]);
    };

    const labelText = label === 'users'
        ? (filteredItems.length === 1 ? 'user' : 'users')
        : (filteredItems.length === 1 ? 'item' : 'items');

    return (
        <NitroCardView className={ label === 'items' ? 'nitro-furni-table-widget' : 'nitro-chooser-widget' } theme="primary">
            <NitroCardHeaderView headerText={ title } onCloseClick={ onClose } />

            <div className="d-flex overflow-hidden flex-column gap-2 container-fluid content-area">
                <div className="furni-search-container">
                    <div className="search-input-container">
                        <input
                            type="text"
                            className="form-control"
                            placeholder={ LocalizeText('generic.search') }
                            value={ searchValue }
                            onChange={ event => setSearchValue(event.target.value) }
                        />
                    </div>
                    <div className="owner-select-container">
                        <select
                            className="form-control"
                            value={ selectedFilter }
                            onChange={ event => setSelectedFilter(event.target.value) }>
                            <option value="all">
                                { label === 'users' ? 'All types' : 'All Owners' }
                            </option>
                            {Array.from(new Set(items.map(item => label === 'users' ? item.type : item.ownerName)))
                                .filter(value => !!value && value !== '-')
                                .map((value, index) => (
                                    <option key={ index } value={ value }>{ value }</option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="furni-table">
                        <colgroup>
                            <col style={{ width: '70%' }} />
                            <col style={{ width: '30%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="name-column">Name</th>
                                <th className="owner-column">{ label === 'users' ? 'Type' : 'Owner' }</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedItems.map(([name, group], index) =>
                            {
                                const isExpanded = expandedGroups.includes(name);
                                const isGrouped = group.length > 1;
                                const isSelectedGroup = selectedItem?.id === group[0]?.id && !isGrouped;

                                return (
                                    <React.Fragment key={ `group-${index}` }>
    <tr className={ `group-row ${index % 2 === 0 ? 'row-even' : 'row-odd'} ${isSelectedGroup ? 'selected' : ''}` } onClick={ isGrouped ? () => toggleGroup(name) : () => { setSelectedItem(group[0]); selectItem(group[0]); } } >
                                            <td className="name-column" title={ name }>
                                                    { name }
                                                    { isGrouped && ` (x${ group.length })` }
                                                    { isGrouped && (
                                                        <span className="toggle-icon">
                                                            { isExpanded ? '▼' : '▶' }
                                                        </span>
                                                    )}
                                            </td>
                                            <td
    title={ label === 'users' ? (group[0]?.type ?? '-') : (group[0]?.ownerName ?? '-') }
    className="owner-column"
>
    { label === 'users' ? (group[0]?.type ?? '-') : (group[0]?.ownerName ?? '-') }
</td>

                                        </tr>

                                        {isExpanded && group.map((item, i) =>
                                        {
                                            const isSelectedChild = selectedItem?.id === item.id;

                                            return (
                                                <tr
                                                key={ `item-${index}-${i}` }
                                                className={ `child-row ${isSelectedChild ? 'selected' : ''}` }
                                                onClick={ () =>
                                                {
                                                    chooserSelectionVisualizer.clearAll();
                                                    console.log('[CHOOSER VISUALIZER] Showing:', item.id, item.category);
                                                    chooserSelectionVisualizer.show(item.id, item.category);
                                                    setSelectedItem(item);
                                                    selectItem(item);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                              >
                                              
                                                    <td className="name-column ps-3">↳ { item.name }</td>
                                                    <td className="owner-column">
                                                        { label === 'users' ? item.type : item.ownerName }
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="furni-footer">
                    <div className="pt-1 ps-1" style={{ fontSize: '11px', color: '#666' }}>
                        { filteredItems.length } { labelText } found
                        { label === 'items' && ` in ${ groupedItems.length } ${ groupedItems.length === 1 ? 'group' : 'groups' }` }
                    </div>
                </div>
            </div>
        </NitroCardView>
    );
};
