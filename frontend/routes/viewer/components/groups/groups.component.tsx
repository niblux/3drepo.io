/**
 *  Copyright (C) 2017 3D Repo Ltd
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { isEqual, isEmpty } from 'lodash';

import { ViewerPanel } from '../viewerPanel/viewerPanel.component';
import IconButton from '@material-ui/core/IconButton';
import ArrowBack from '@material-ui/icons/ArrowBack';
import GroupWork from '@material-ui/icons/GroupWork';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/Cancel';
import MoreIcon from '@material-ui/icons/MoreVert';
import SearchIcon from '@material-ui/icons/Search';
import Check from '@material-ui/icons/Check';
import Bolt from '@material-ui/icons/OfflineBolt';
import { HandPaper } from '../../../components/fontAwesomeIcon';
import { CREATE_ISSUE } from '../../../../constants/issue-permissions';

import { ButtonMenu } from '../../../components/buttonMenu/buttonMenu.component';
import { FilterPanel } from '../../../components/filterPanel/filterPanel.component';
import { renderWhenTrue } from '../../../../helpers/rendering';
import { ViewerPanelContent, ViewerPanelFooter, ViewerPanelButton } from '../viewerPanel/viewerPanel.styles';
import { Viewer } from '../../../../services/viewer/viewer';
import { VIEWER_EVENTS } from '../../../../constants/viewer';
import { searchByFilters } from '../../../../helpers/searching';
import { getGroupRGBAColor } from '../../../../helpers/colors';
import {
	GROUPS_ACTIONS_ITEMS,
	GROUPS_ACTIONS_MENU,
	DEFAULT_OVERRIDE_COLOR
} from '../../../../constants/groups';
import { ListContainer, Summary } from './../risks/risks.styles';
import { GroupsListItem } from './components/groupsListItem/groupsListItem.component';
import { EmptyStateInfo } from '../views/views.styles';
import { StyledIcon } from '../groups/groups.styles';
import {
	MenuList, StyledListItem,	StyledItemText, IconWrapper
} from '../../../components/filterPanel/components/filtersMenu/filtersMenu.styles';
import { GroupDetails } from './components/groupDetails';
import { ListNavigation } from '../listNavigation/listNavigation.component';
import { hasPermissions, PERMISSIONS } from '../../../../helpers/permissions';

interface IProps {
	teamspace: string;
	model: any;
	revision?: string;
	isPending?: boolean;
	showDetails?: boolean;
	groups: any[];
	groupsMap: any;
	activeGroupId: string;
	highlightedGroups: any;
	searchEnabled: boolean;
	selectedFilters: any[];
	colorOverrides: any;
	allOverrided: any;
	modelSettings: any;
	setState: (componentState: any) => void;
	setNewGroup: () => void;
	showGroupDetails: (group, revision?) => void;
	closeDetails: () => void;
	setActiveGroup: (group, revision?) => void;
	saveGroup: (teamspace, model, group) => void;
	toggleColorOverride: (group) => void;
	toggleColorOverrideAll: () => void;
	deleteGroups: (teamspace, model, groups) => void;
	showConfirmDialog: (config) => void;
	isolateGroup: (group) => void;
	downloadGroups: (teamspace, model) => void;
	selectGroup: (group) => void;
}

interface IState {
	groupDetails?: any;
	modelLoaded: boolean;
	filteredGroups: any[];
}

const MenuButton = ({ IconProps, Icon, ...props }) => (
  <IconButton
    {...props}
    aria-label="Show filters menu"
    aria-haspopup="true"
  >
    <MoreIcon {...IconProps} />
  </IconButton>
);

export class Groups extends React.PureComponent<IProps, IState> {
	public state = {
		groupDetails: {},
		modelLoaded: false,
		filteredGroups: []
	};

	public componentDidMount() {
		this.setState({ filteredGroups: this.filteredGroups });

		if (Viewer.viewer.model && !this.state.modelLoaded) {
			this.setState({ modelLoaded: true });
		}

		Viewer.on(VIEWER_EVENTS.MODEL_LOADED, () => {
			this.setState({ modelLoaded: true });
		});
	}

	public componentDidUpdate(prevProps) {
		const { groups, selectedFilters, activeGroupId, showDetails } = this.props;
		const groupsChanged = !isEqual(prevProps.groups, groups);
		const filtersChanged = prevProps.selectedFilters.length !== selectedFilters.length;

		const changes = {} as IState;

		if (groupsChanged || filtersChanged) {
			changes.filteredGroups = this.filteredGroups;
		}

		if (!isEmpty(changes)) {
			this.setState(changes);
		}
	}

	public get filteredGroups() {
		const { groups, selectedFilters } = this.props;
		return searchByFilters(groups, selectedFilters, false);
	}

	public get filters() {
		return [];
	}

	public get activeGroup() {
		return this.props.groupsMap[this.props.activeGroupId];
	}

	public getOverridedColor = (groupId, color) => {
		const overrided = this.isOverrided(groupId);
		if (overrided) {
			return getGroupRGBAColor(color);
		}
		return DEFAULT_OVERRIDE_COLOR;
	}

	public getGroupTypeIcon(group) {
		if (!group) {
			return (
				<StyledIcon><HandPaper fontSize="inherit" /></StyledIcon>
			);
		}

		const {_id, color, rules} = group;

		return(
			<StyledIcon color={this.getOverridedColor(_id, color)}>
				{
					Boolean(rules && rules.length) ? <Bolt fontSize="inherit" /> : <HandPaper fontSize="inherit" />
				}
			</StyledIcon>
		);
	}

	public handleCloseSearchMode = () => {
		this.props.setState({ searchEnabled: false });
		this.setState({
			filteredGroups: this.props.groups
		});
	}

	public handleOpenSearchMode = () => {
		this.props.setState({ searchEnabled: true });
	}

	public getSearchButton = () => {
		if (this.props.searchEnabled) {
			return <IconButton onClick={this.handleCloseSearchMode}><CancelIcon /></IconButton>;
		}
		return <IconButton onClick={this.handleOpenSearchMode}><SearchIcon /></IconButton>;
	}

	public renderTitleIcon = () => {
		if (this.props.showDetails) {
			return (
				<IconButton onClick={this.props.closeDetails} >
					<ArrowBack />
				</IconButton>
			);
		}
		return <GroupWork />;
	}

	public handleDeleteGroups = () => {
		const { groups, deleteGroups, teamspace, model } = this.props;

		this.props.showConfirmDialog({
			title: 'Delete groups',
			content: `Delete all groups?`,
			onConfirm: () => {
				const allGroups = groups.map((group) => group._id).join(',');
				deleteGroups(teamspace, model, allGroups);
			}
		});
	}

	get menuActionsMap() {
		const { toggleColorOverrideAll, teamspace, model, downloadGroups } = this.props;
		return {
			[GROUPS_ACTIONS_ITEMS.OVERRIDE_ALL]: () => toggleColorOverrideAll(),
			[GROUPS_ACTIONS_ITEMS.DELETE_ALL]: () => this.handleDeleteGroups(),
			[GROUPS_ACTIONS_ITEMS.DOWNLOAD]: () => downloadGroups(teamspace, model)
		};
	}

	public renderActionsMenu = () => (
		<MenuList>
			{GROUPS_ACTIONS_MENU.map(({ name, Icon, label }) => {
				return (
					<StyledListItem key={name} button onClick={this.menuActionsMap[name]}>
						<IconWrapper><Icon fontSize="small" /></IconWrapper>
						<StyledItemText>
							{label}
							{(name === GROUPS_ACTIONS_ITEMS.OVERRIDE_ALL && this.props.allOverrided) && <Check fontSize="small" />}
						</StyledItemText>
					</StyledListItem>
				);
			})}
		</MenuList>
	)

	public getMenuButton = () => (
		<ButtonMenu
			renderButton={MenuButton}
			renderContent={this.renderActionsMenu}
			PaperProps={{ style: { overflow: 'initial', boxShadow: 'none' } }}
			PopoverProps={{ anchorOrigin: { vertical: 'center', horizontal: 'left' } }}
			ButtonProps={{ disabled: false }}
		/>
	)

	public handleNavigationChange = (currentIndex) => {
		this.props.showGroupDetails(this.state.filteredGroups[currentIndex], this.props.revision);
	}

	public renderHeaderNavigation = renderWhenTrue(() => {
		const initialIndex = this.state.filteredGroups.findIndex(({ _id }) => this.props.activeGroupId === _id);

		return (
			<ListNavigation
				initialIndex={initialIndex}
				lastIndex={this.state.filteredGroups.length - 1}
				onChange={this.handleNavigationChange}
			/>
		);
	});

	public renderActions = () => {
		if (this.props.showDetails) {
			return this.renderHeaderNavigation(this.props.activeGroupId && this.state.filteredGroups.length >= 2);
		}

		return (
			<>
				{this.getSearchButton()}
				{this.getMenuButton()}
			</>
		);
	}

	public setActiveGroup = (group) => () => {
		this.props.setActiveGroup(group);
	}

	public handleShowGroupDetails = (group) => () => {
		this.props.showGroupDetails(group, this.props.revision);
	}

	public isOverrided = (groupId) => Boolean(this.props.colorOverrides[groupId]);

	public deleteGroup = (groupId) => {
		const { teamspace, model, deleteGroups } = this.props;
		deleteGroups(teamspace, model, groupId);
	}

	public get canAddOrUpdate() {
		if (this.props.modelSettings && this.props.modelSettings.permissions) {
			return hasPermissions(CREATE_ISSUE, this.props.modelSettings.permissions) && this.state.modelLoaded;
		}
		return false;
	}

	public renderGroupsList = renderWhenTrue(() => {
		const Items = this.state.filteredGroups.map((group = {}, index) => (
			<GroupsListItem
				{...group}
				key={group._id}
				onItemClick={this.setActiveGroup(group)}
				onArrowClick={this.handleShowGroupDetails(group)}
				active={this.props.activeGroupId === group._id}
				modelLoaded={this.state.modelLoaded}
				highlighted={Boolean(this.props.highlightedGroups[group._id])}
				overridedColor={this.getOverridedColor(group._id, group.color)}
				deleteGroup={this.deleteGroup}
				toggleColorOverride={() => this.props.toggleColorOverride(group)}
				isolateGroup={() => this.props.isolateGroup(group)}
				GroupTypeIcon={() => this.getGroupTypeIcon(group)}
			/>
		));

		return <ListContainer>{Items}</ListContainer>;
	});

	public renderEmptyState = renderWhenTrue(() => (
		<EmptyStateInfo>No groups have been created yet</EmptyStateInfo>
	));

	public renderNotFound = renderWhenTrue(() => (
		<EmptyStateInfo>No groups matched</EmptyStateInfo>
	));

	public handleAddNewGroup = () => {
		this.props.setNewGroup();
	}

	public renderListView = renderWhenTrue(() => (
		<>
			<ViewerPanelContent className="height-catcher">
			{this.renderEmptyState(!this.props.searchEnabled && !this.state.filteredGroups.length)}
			{this.renderNotFound(this.props.searchEnabled && !this.state.filteredGroups.length)}
			{this.renderGroupsList(this.state.filteredGroups.length)}
			</ViewerPanelContent>
			<ViewerPanelFooter alignItems="center" justify="space-between">
				<Summary>
					{`${this.state.filteredGroups.length} groups displayed`}
				</Summary>
				<ViewerPanelButton
					aria-label="Add group"
					onClick={this.handleAddNewGroup}
					color="secondary"
					variant="fab"
					disabled={!this.canAddOrUpdate}
				>
					<AddIcon />
				</ViewerPanelButton>
			</ViewerPanelFooter>
		</>
	)
	);

  public handleFilterChange = (selectedFilters) => {
		this.props.setState({
			selectedFilters
		});
		this.setState({
			filteredGroups: this.filteredGroups
		});
  }

	public renderFilterPanel = renderWhenTrue(() => (
		<FilterPanel
			filters={this.filters}
			onChange={this.handleFilterChange}
			selectedFilters={this.props.selectedFilters}
			hideMenu={true}
		/>
	));

	public handleSaveGroup = (teamspace, model, group) => {
		this.props.saveGroup(teamspace, model, group);
	}

	public renderDetailsView = renderWhenTrue(() => (
		<GroupDetails
			teamspace={this.props.teamspace}
			model={this.props.model}
			saveGroup={this.props.saveGroup}
			selectGroup={() => this.props.selectGroup(this.activeGroup)}
			GroupTypeIconComponent={() => this.getGroupTypeIcon(this.activeGroup)}
			canUpdate={this.canAddOrUpdate}
		/>
	));

	public render() {
		return (
			<ViewerPanel
				title="Groups"
				Icon={this.renderTitleIcon()}
				renderActions={this.renderActions}
				pending={this.props.isPending}
			>
				{this.renderFilterPanel(this.props.searchEnabled && !this.props.showDetails)}
				{this.renderListView(!this.props.showDetails)}
				{this.renderDetailsView(this.props.showDetails)}
			</ViewerPanel>
		);
	}
}