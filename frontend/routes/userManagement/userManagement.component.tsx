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
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import * as queryString from 'query-string';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { MuiThemeProvider } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { isEqual, isEmpty } from 'lodash';

import { theme } from '../../styles';
import Users from '../users/users.container';
import Jobs from '../jobs/jobs.container';
import Projects from '../projects/projects.container';
import { CellSelect } from '../components/customTable/components/cellSelect/cellSelect.component';
import {
	Container,
	Title,
	Content,
	Header,
	TabContent,
	TeamspaceSelectContainer,
	LoaderContainer
} from './userManagement.styles';
import { TextOverlay } from '../components/textOverlay/textOverlay.component';
import { Loader } from '../components/loader/loader.component';

export const TABS_TYPES = {
	USERS: 0,
	PROJECTS: 1,
	JOBS: 2
};

const TABS = {
	[TABS_TYPES.USERS]: {
		id: TABS_TYPES.USERS,
		label: 'Users'
	},
	[TABS_TYPES.PROJECTS]: {
		id: TABS_TYPES.PROJECTS,
		label: 'Projects'
	},
	[TABS_TYPES.JOBS]: {
		id: TABS_TYPES.JOBS,
		label: 'Jobs'
	}
};

interface IProps {
	location: any;
	history: any;
	defaultTeamspace: string;
	teamspaces: any[];
	isLoadingTeamspace: boolean;
	onTeamspaceChange: (teamspace) => void;
}

interface IState {
	isTeamspaceAdmin: boolean;
	activeTab: number;
	selectedTeamspace: string;
	teamspacesItems: any[];
}

export class UserManagement extends React.PureComponent<IProps, IState> {
	public static getDerivedStateFromProps = (nextProps, prevState) => {
		const queryParams = queryString.parse(location.search);
		return {
			activeTab: Number(queryParams.tab || prevState.activeTab),
			selectedTeamspace: queryParams.teamspace || prevState.selectedTeamspace
		};
	}

	public state = {
		isTeamspaceAdmin: true,
		activeTab: TABS_TYPES.USERS,
		selectedTeamspace: '',
		teamspacesItems: []
	};

	public updateUrlParams = (params) => {
		/*
			TODO: location and history should be changed to equivalent objects in react's props,
						if parent component is migrated
		*/
		const { pathname, search } = location;
		const queryParams = Object.assign({}, queryString.parse(search), params);
		const updatedQueryString = queryString.stringify(queryParams);
		window.history.pushState({}, null, `${pathname}?${updatedQueryString}`);
	}

	public handleChange = (event, activeTab) => {
		this.updateUrlParams({tab: activeTab});
		this.setState({activeTab});
	}

	public onTeamspaceChange = (teamspace) => {
		this.updateUrlParams({teamspace});
		if (this.props.onTeamspaceChange) {
			this.props.onTeamspaceChange(teamspace);
		}
	}

	public componentDidMount() {
		const {teamspaces, defaultTeamspace} = this.props;
		const selectedTeamspace = queryString.parse(location.search).teamspace;
		this.setState({
			teamspacesItems: teamspaces.map(({ account }) => ({ value: account }))
		});

		const hasProperTeamspace = teamspaces.find(({ account }) => account === selectedTeamspace);
		const teamspace = hasProperTeamspace ? selectedTeamspace : defaultTeamspace;
		this.onTeamspaceChange(teamspace);
	}

	public componentDidUpdate(prevProps, prevState) {
		const changes = {} as IState;

		const teamspacesChanged = !isEqual(this.props.teamspaces, prevProps.teamspaces);
		if (teamspacesChanged) {
			changes.teamspacesItems = this.props.teamspaces.map(({account}) => ({value: account}));
		}

		if (!isEmpty(changes)) {
			this.setState(changes);
		}
	}

	public renderTabContent = (props) => {
		const {isLoadingTeamspace} = this.props;
		const {activeTab, selectedTeamspace} = this.state;

		if (!selectedTeamspace) {
			return <TextOverlay content="Select teamspace to enable settings" />;
		}

		if (isLoadingTeamspace) {
			const content = `Loading "${selectedTeamspace}" data...`;
			return (
				<LoaderContainer>
					<Loader content={content} />
				</LoaderContainer>
			);
		}

		return (
			<>
				{ activeTab === TABS_TYPES.USERS && <Users /> }
				{ activeTab === TABS_TYPES.PROJECTS && <Projects /> }
				{ activeTab === TABS_TYPES.JOBS && <Jobs /> }
			</>
		);
	}

	public render() {
		const {isLoadingTeamspace, teamspaces} = this.props;
		const {isTeamspaceAdmin, activeTab, selectedTeamspace, teamspacesItems} = this.state;

		return (
			<Router>
				<MuiThemeProvider theme={theme}>
					<Container>
						<Title>User management</Title>
						<Content>
							<Header>
								<TeamspaceSelectContainer>
									<FormControl fullWidth={true}>
										<InputLabel shrink htmlFor="teamspace-select">Teamspace</InputLabel>
										<CellSelect
											items={teamspacesItems}
											value={selectedTeamspace}
											placeholder="Select teamspace"
											disabledPlaceholder={true}
											onChange={this.onTeamspaceChange}
											inputId="teamspace-select"
										/>
									</FormControl>
								</TeamspaceSelectContainer>
								<Tabs
									value={this.state.activeTab}
									indicatorColor="primary"
									textColor="primary"
									onChange={this.handleChange}
								>
									<Tab label="Users" /* disabled={!selectedTeamspace || !isLoadingTeamspace || !isTeamspaceAdmin} */ />
									<Tab label="Projects" /* disabled={!selectedTeamspace || !isLoadingTeamspace} */ />
									<Tab label="Jobs" /* disabled={!selectedTeamspace || !isLoadingTeamspace || !isTeamspaceAdmin} */ />
								</Tabs>
							</Header>
							<TabContent>
								{/* TODO: This should be splitted to multiple routes after setup proper url's approach */}
								<Route exact path="/:teamspace" render={this.renderTabContent} />
							</TabContent>
						</Content>
					</Container>
				</MuiThemeProvider>

			</Router>
		);
	}
}
