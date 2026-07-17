import { RoomControllerLevel, RoomObjectOperationType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaArrowsAlt, FaSearch, FaSyncAlt, FaTrashRestore } from 'react-icons/fa';
import { AvatarInfoFurni, CreateLinkEvent, GetWiredCreatorToolsSettings, ProcessRoomObjectOperation, WIRED_CREATOR_TOOLS_SETTINGS_EVENT } from '../../../../../api';
import { Flex } from '../../../../../common';
import { ContextMenuHeaderView } from '../../context-menu/ContextMenuHeaderView';
import { ContextMenuListItemView } from '../../context-menu/ContextMenuListItemView';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

interface AvatarInfoWidgetFurniViewProps
{
    avatarInfo: AvatarInfoFurni;
    onClose: () => void;
}

export const AvatarInfoWidgetFurniView: FC<AvatarInfoWidgetFurniViewProps> = props =>
{
    const { avatarInfo = null, onClose = null } = props;
    const [ creatorSettings, setCreatorSettings ] = useState(() => GetWiredCreatorToolsSettings());

    useEffect(() =>
    {
        const updateSettings = () => setCreatorSettings(GetWiredCreatorToolsSettings());

        window.addEventListener(WIRED_CREATOR_TOOLS_SETTINGS_EVENT, updateSettings);

        return () => window.removeEventListener(WIRED_CREATOR_TOOLS_SETTINGS_EVENT, updateSettings);
    }, []);

    const processAction = (name: string) =>
    {
        let hideMenu = true;

        if(name)
        {
            switch(name)
            {
                case 'move':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_MOVE);
                    break;
                case 'rotate':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE);
                    break;
                case 'pickup':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_PICKUP);
                    break;
                case 'eject':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_EJECT);
                    break;
                case 'inspect':
                    CreateLinkEvent(`wired-tools/inspect/furni/${ avatarInfo.id }/${ avatarInfo.category }`);
                    break;
            }
        }
    }

    const canManipulate = !creatorSettings.playtestingMode;

    return (
        <ContextMenuView objectId={ avatarInfo.id } category={ avatarInfo.category } onClose={ onClose } collapsable={ true }>
            <ContextMenuHeaderView>
                { avatarInfo.name }
            </ContextMenuHeaderView>
            <Flex className="menu-list-split-4">
                <ContextMenuListItemView onClick={ event => processAction('move') } disabled={ !canManipulate }>
                    <FaArrowsAlt className="center fa-icon" />
                </ContextMenuListItemView>
                <ContextMenuListItemView onClick={ event => processAction('rotate') } disabled={ avatarInfo.isWallItem || !canManipulate }>
                    <FaSyncAlt className="center fa-icon" />
                </ContextMenuListItemView>
                { canManipulate && (avatarInfo.isOwner || avatarInfo.isAnyRoomController) &&
                    <ContextMenuListItemView onClick={ event => processAction('pickup') }>
                        <FaTrashRestore className="center fa-icon" />
                    </ContextMenuListItemView> }
                { canManipulate && (!avatarInfo.isOwner && !avatarInfo.isAnyRoomController) && (avatarInfo.isRoomOwner || (avatarInfo.roomControllerLevel >= RoomControllerLevel.GUILD_ADMIN)) &&
                    <ContextMenuListItemView onClick={ event => processAction('eject') }>
                        <FaTrashRestore className="center fa-icon" />
                    </ContextMenuListItemView> }
                { creatorSettings.showInspectButton &&
                    <ContextMenuListItemView onClick={ event => processAction('inspect') }>
                        <FaSearch className="center fa-icon" />
                    </ContextMenuListItemView> }
            </Flex>
        </ContextMenuView>
    );
}
