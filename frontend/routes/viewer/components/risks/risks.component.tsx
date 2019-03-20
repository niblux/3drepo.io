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
import * as queryString from 'query-string';
import { map, isEqual, isEmpty } from 'lodash';

import ReportProblem from '@material-ui/icons/ReportProblem';
import ArrowBack from '@material-ui/icons/ArrowBack';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import CancelIcon from '@material-ui/icons/Cancel';
import MoreIcon from '@material-ui/icons/MoreVert';
import Check from '@material-ui/icons/Check';

import { hasPermissions } from '../../../../helpers/permissions';
import { ButtonMenu } from '../../../components/buttonMenu/buttonMenu.component';
import RiskDetails from './components/riskDetails/riskDetails.container';
import { renderWhenTrue } from '../../../../helpers/rendering';
import { PreviewListItem } from '../previewListItem/previewListItem.component';
import { ViewerPanel } from '../viewerPanel/viewerPanel.component';
import { ListContainer, Summary } from './risks.styles';
import { ViewerPanelContent, ViewerPanelFooter, ViewerPanelButton } from '../viewerPanel/viewerPanel.styles';
import {
	RISK_FILTERS,
	RISK_MITIGATION_STATUSES,
	RISK_FILTER_RELATED_FIELDS,
	RISKS_ACTIONS_MENU,
	RISKS_ACTIONS_ITEMS,
	RISK_CONSEQUENCES,
	RISK_LIKELIHOODS,
	RISK_CATEGORIES,
	LEVELS_OF_RISK,
	RISK_LEVELS
} from '../../../../constants/risks';
import {
	MenuList,
	StyledListItem,
	StyledItemText,
	IconWrapper
} from '../../../components/filterPanel/components/filtersMenu/filtersMenu.styles';
import { FilterPanel } from '../../../components/filterPanel/filterPanel.component';
import { CREATE_ISSUE, VIEW_ISSUE } from '../../../../constants/issue-permissions';
import { searchByFilters } from '../../../../helpers/searching';
import { Viewer } from '../../../../services/viewer/viewer';
import { VIEWER_EVENTS } from '../../../../constants/viewer';
import { EmptyStateInfo } from '../views/views.styles';

interface IProps {
	history: any;
	location: any;
	teamspace: string;
	model: any;
	risks: any[];
	jobs: any[];
	revision?: string;
	isPending?: boolean;
	fetchingDetailsIsPending?: boolean;
	activeRiskId?: string;
	showDetails?: boolean;
	riskDetails?: any;
	searchEnabled: boolean;
	showPins: boolean;
	selectedFilters: any[];
	modelSettings: {
		permissions: any[];
	};
	activeRiskDetails: any;
	sortOrder: string;
	fetchRisks: (teamspace, model, revision) => void;
	setState: (componentState: any) => void;
	setNewRisk: () => void;
	downloadRisks: (teamspace, model, risksIds) => void;
	printRisks: (teamspace, model, risksIds) => void;
	setActiveRisk: (risk, revision?) => void;
	showRiskDetails: (teamspace, model, revision, risk) => void;
	closeDetails: (teamspace, model, revision) => void;
	toggleShowPins: (showPins: boolean, filteredRisks) => void;
	subscribeOnRiskChanges: (teamspace, modelId) => void;
	unsubscribeOnRiskChanges: (teamspace, modelId) => void;
	onFiltersChange: (selectedFilters) => void;
	toggleSortOrder: () => void;
	setFilters: (filters) => void;
}

interface IState {
	riskDetails?: any;
	filteredRisks: any[];
	modelLoaded: boolean;
}

const UNASSIGNED_JOB = {
	name: 'Unassigned',
	value: ''
};

const MenuButton = ({ IconProps, Icon, ...props }) => (
  <IconButton
    {...props}
    aria-label="Show filters menu"
    aria-haspopup="true"
  >
    <MoreIcon {...IconProps} />
  </IconButton>
);

export class Risks extends React.PureComponent<IProps, IState> {
	public state = {
		riskDetails: {},
		filteredRisks: [],
		modelLoaded: false
	};

	get jobsList() {
		return [...this.props.jobs, UNASSIGNED_JOB];
	}

	get filtersValuesMap() {
		return {
			[RISK_FILTER_RELATED_FIELDS.CATEGORY]: this.getFilterValues(RISK_CATEGORIES),
			[RISK_FILTER_RELATED_FIELDS.MITIGATION_STATUS]: this.getFilterValues(RISK_MITIGATION_STATUSES),
			[RISK_FILTER_RELATED_FIELDS.CREATED_BY]: this.getFilterValues(this.props.jobs),
			[RISK_FILTER_RELATED_FIELDS.RISK_OWNER]: this.getFilterValues(this.jobsList),
			[RISK_FILTER_RELATED_FIELDS.RISK_CONSEQUENCE]: this.getFilterValues(RISK_CONSEQUENCES),
			[RISK_FILTER_RELATED_FIELDS.RISK_LIKELIHOOD]: this.getFilterValues(RISK_LIKELIHOODS),
			[RISK_FILTER_RELATED_FIELDS.RESIDUAL_CONSEQUENCE]: this.getFilterValues(RISK_CONSEQUENCES),
			[RISK_FILTER_RELATED_FIELDS.RESIDUAL_LIKELIHOOD]: this.getFilterValues(RISK_LIKELIHOODS),
			[RISK_FILTER_RELATED_FIELDS.LEVEL_OF_RISK]: this.getFilterValues(LEVELS_OF_RISK),
			[RISK_FILTER_RELATED_FIELDS.RESIDUAL_LEVEL_OF_RISK]: this.getFilterValues(LEVELS_OF_RISK),
			[RISK_FILTER_RELATED_FIELDS.OVERALL_LEVEL_OF_RISK]: this.getFilterValues(LEVELS_OF_RISK)
		};
	}

	get filters() {
		const filterValuesMap = this.filtersValuesMap;
		return RISK_FILTERS.map((riskFilter) => {
			riskFilter.values = filtersValuesMap[riskFilter.relatedField];
			return riskFilter;
		});
	}

	get menuActionsMap() {
		const { printRisks, downloadRisks, toggleShowPins, teamspace, model, showPins } = this.props;
		const { filteredRisks } = this.state;
		const risksIds = map(filteredRisks, '_id').join(',');
		return {
			[RISKS_ACTIONS_ITEMS.PRINT]: () => printRisks(teamspace, model, risksIds),
			[RISKS_ACTIONS_ITEMS.DOWNLOAD]: () => downloadRisks(teamspace, model, risksIds),
			[RISKS_ACTIONS_ITEMS.SHOW_PINS]: () => toggleShowPins(!showPins, filteredRisks)
		};
	}

	get activeRiskIndex() {
		return this.state.filteredRisks.findIndex((risk) => risk._id === this.props.activeRiskId);
	}

	get filteredRisks() {
		const { risks, selectedFilters } = this.props;

		let returnHiddenRisk = false;
		if (selectedFilters.length) {
			returnHiddenRisk = selectedFilters
				.some(({ value: { value }}) => value === RISK_LEVELS.AGREED_FULLY);
		}

		return searchByFilters(risks, selectedFilters, returnHiddenRisk);
	}

	get showDefaultHiddenItems() {
		if (this.props.selectedFilters.length) {
			return this.props.selectedFilters
				.some(({ value: { value } }) => value === RISK_LEVELS.AGREED_FULLY);
		}
		return false;
	}

	public componentDidMount() {
		this.props.subscribeOnRiskChanges(this.props.teamspace, this.props.model);
	}

	public componentDidUpdate(prevProps) {
		const { risks, selectedFilters, activeRiskId, showDetails, revision, teamspace, model } = this.props;
		const filtersChanged = prevProps.selectedFilters.length !== selectedFilters.length;

		if (risks.length && !filtersChanged && location.search && !activeRiskId && !prevProps.showDetails) {
			const { riskId } = queryString.parse(location.search);
			if (riskId) {
				const foundRisk = risks.find((risk) => risk._id === riskId);

				if (foundRisk) {
					this.props.showRiskDetails(teamspace, model, revision, foundRisk);
				}
			}
		}
	}

	public componentWillUnmount() {
		this.props.unsubscribeOnRiskChanges(this.props.teamspace, this.props.model);
	}

	public setActiveRisk = (item) => {
		this.props.setActiveRisk(item, this.props.revision);
	}

	public showRiskDetails = (item) => {
		const { teamspace, model, revision } = this.props;
		this.props.showRiskDetails(teamspace, model, revision, item);
	}

	public closeRiskDetails = () => {
		const { teamspace, model, revision } = this.props;
		this.props.closeDetails(teamspace, model, revision);
	}

	public getFilterValues(property) {
		return property.map(({ value, name }) => {
			return {
				label: name,
				value
			};
		});
	}

	public handleToggleFilters = (searchEnabled) => {
		const changes: any = { searchEnabled };

		if (!searchEnabled) {
			changes.selectedFilters = [];
		}
		this.props.setState(changes);
	}

	public renderDetailsView = renderWhenTrue(() => (
		<RiskDetails
			teamspace={this.props.teamspace}
			model={this.props.model}
			revision={this.props.revision}
		/>
	));

	public renderTitleIcon = () => {
		if (this.props.showDetails) {
			return (
				<IconButton onClick={this.props.closeDetails} >
					<ArrowBack />
				</IconButton>
			);
		}
		return <ReportProblem />;
	}

	public render() {
		return (
			<ReportedItems
				title="SafetiBase"
				Icon={this.renderTitleIcon()}
				isPending={this.props.isPending}

				items={this.props.risks}
				showDefaultHiddenItems={this.showDefaultHiddenItems}
				activeItemId={this.props.activeRiskId}
				showDetails={this.props.showDetails}
				permissions={this.props.modelSettings.permissions}
				headerMenuItems={this.headerMenuItems}
				searchEnabled={this.props.searchEnabled}
				filters={this.filters}
				selectedFilters={this.props.selectedFilters}
				isImportingBCF={this.props.isImportingBCF}
				sortOrder={this.props.sortOrder}

				onToggleFilters={this.handleToggleFilters}
				onChangeFilters={this.props.setFilters}
				onActiveItem={this.setActiveRisk}
				onNewItem={this.props.setNewRisk}
				onShowDetails={this.showRiskDetails}
				onCloseDetails={this.closeRiskDetails}

				renderDetailsView={this.renderDetailsView}
			/>
		);
	}
}
