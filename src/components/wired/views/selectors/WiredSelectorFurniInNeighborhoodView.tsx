import { FC } from 'react';
import { WiredSelectorNeighborhoodView } from './WiredSelectorNeighborhoodView';

const SOURCE_KIND_FURNI = 0;
const SOURCE_SELECTED = 100;

export const WiredSelectorFurniInNeighborhoodView: FC<{}> = props =>
{
    return <WiredSelectorNeighborhoodView defaultSourceKind={ SOURCE_KIND_FURNI } defaultSource={ SOURCE_SELECTED } />;
};
