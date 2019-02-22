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
import { ViewerPanel } from '../viewerPanel/viewerPanel.component';
import IconButton from '@material-ui/core/IconButton';
import ArrowBack from '@material-ui/icons/ArrowBack';
import GroupWork from '@material-ui/icons/GroupWork';
import AddIcon from '@material-ui/icons/Add';
import { renderWhenTrue } from '../../../../helpers/rendering';
import { ViewerPanelContent, ViewerPanelFooter, ViewerPanelButton } from '../viewerPanel/viewerPanel.styles';
import { Viewer } from '../../../../services/viewer/viewer';
import { VIEWER_EVENTS } from '../../../../constants/viewer';
import { Container } from './groups.styles';
import { ListContainer, Summary } from './../risks/risks.styles';
import { GroupsListItem } from './components/groupsListItem/groupsListItem.component';

interface IProps {
	isPending?: boolean;
	showDetails?: boolean;
	groups: any[];
	activeGroupId: string;
	highlightedGroups: any;
	closeDetails: () => void;
	setActiveGroup: (group, filteredGroups, revision?) => void;
}

interface IState {
	modelLoaded: boolean;
}

export class Groups extends React.PureComponent<IProps, IState> {
	public state = {
		modelLoaded: false
	};

	public componentDidMount() {
		if (Viewer.viewer.model && !this.state.modelLoaded) {
			this.setState({ modelLoaded: true });
		}

		Viewer.on(VIEWER_EVENTS.MODEL_LOADED, () => {
			this.setState({ modelLoaded: true });
		});
	}

	public componentDidUpdate = () => {
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

	public renderActions = () => {
		return [];
	}
	
	public setActiveGroup = (group) => () => {
		this.props.setActiveGroup(group, []);
	}

	public handleShowGroupDetails = (group) => () => {
		// this.props.showGroupDetails(group);
	}

	public renderGroupsList = renderWhenTrue(() => {
		const Items = this.props.groups.map((group, index) => (
			<GroupsListItem
				{...group}
				key={index}
				onItemClick={this.setActiveGroup(group)}
				onArrowClick={this.handleShowGroupDetails(group)}
				active={this.props.activeGroupId === group._id}
				// hasViewPermission={this.hasPermission(VIEW_ISSUE)}
				modelLoaded={this.state.modelLoaded}
				highlighted={Boolean(this.props.highlightedGroups[group._id])}
			/>
		));

		return <ListContainer>{Items}</ListContainer>;
	});


	public renderListView = renderWhenTrue(() => (
		<>
			<ViewerPanelContent className="height-catcher">
			{this.renderGroupsList(this.props.groups.length)}

			</ViewerPanelContent>
			<ViewerPanelFooter alignItems="center" justify="space-between">
				<Summary>
					{`${this.props.groups.length} groups displayed`}
				</Summary>
				<ViewerPanelButton
					aria-label="Add group"
					color="secondary"
					variant="fab"
				>
					<AddIcon />
				</ViewerPanelButton>
			</ViewerPanelFooter>
		</>
	)
	);

	public render() {
		return (
			<ViewerPanel
				title="Groups"
				Icon={this.renderTitleIcon()}
				actions={this.renderActions()}
				pending={this.props.isPending}
			>
				{/* {this.renderFilterPanel(this.props.searchEnabled && !this.props.showDetails)}
				{this.renderDetailsView(this.props.showDetails)} */}
				{this.renderListView(!this.props.showDetails)}
			</ViewerPanel>
		);
	}
}