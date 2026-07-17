import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker, chooserSelectionVisualizer } from '../../../../api';
import { useFurniChooserWidget } from '../../../../hooks';
import { ChooserWidgetView } from './ChooserWidgetView';

export const FurniChooserWidgetView: FC<{}> = props =>
{
    const { items = null, onClose = null, selectItem = null, populateChooser = null } = useFurniChooserWidget();

    const SelectItem = (item) =>
        {
            selectItem(item); // engine logic
        
            chooserSelectionVisualizer.clearAll(); // remove old
            console.log('[CHOOSER VISUALIZER] Showing:', item.id, item.category); // ✅ LOG THIS
            chooserSelectionVisualizer.show(item.id, item.category); // add new
        };   

        useEffect(() =>
            {
                return () =>
                {
                    chooserSelectionVisualizer.clearAll(); // cleanup on unmount
                };
            }, []);
            
    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                populateChooser();
            },
            eventUrlPrefix: 'furni-chooser/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ populateChooser ]);
    
    if(!items) return null;

    return <ChooserWidgetView title={ LocalizeText('widget.chooser.furni.title') } items={ items } selectItem={ SelectItem } onClose={ () => { chooserSelectionVisualizer.clearAll(); onClose();  } } label="items" />;
}
