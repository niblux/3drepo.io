import NewReleases from '@material-ui/icons/NewReleases';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import ErrorSolid from '@material-ui/icons/Error';
import CheckCircle from '@material-ui/icons/CheckCircle';
import SyncProblem from '@material-ui/icons/SyncProblem';

import Print from '@material-ui/icons/Print';
import Download from '@material-ui/icons/CloudDownload';
import Pins from '@material-ui/icons/PinDrop';

import { values } from 'lodash';
import { DATA_TYPES } from '../routes/components/filterPanel/filterPanel.component';

const LEVELS = {
	VERY_LOW: { value: 0, name: 'Very Low' },
	LOW: { value: 1, name: 'Low' },
	MODERATE: { value: 2, name: 'Moderate' },
	HIGH: { value: 3, name: 'High' },
	VERY_HIGHT: { value: 4, name: 'Very High' }
};

const LEVELS_LIST = values(LEVELS);

export const RISK_CATEGORIES = [
	{ value: 'health_material_effect', name: 'Health - Material effect' },
	{ value: 'health_mechanical_effect', name: 'Health - Mechanical effect' },
	{ value: 'safety_fall', name: 'Safety Issue - Fall' },
	{ value: 'safety_trapped', name: 'Safety Issue - Trapped' },
	{ value: 'safety_event', name: 'Safety Issue - Event' },
	{ value: 'safety_handling', name: 'Safety Issue - Handling' },
	{ value: 'safety_struck', name: 'Safety Issue - Struck' },
	{ value: 'safety_public', name: 'Safety Issue - Public' },
	{ value: 'environmental', name: 'Environmental Issue' },
	{ value: 'commercial', name: 'Commercial Issue' },
	{ value: 'social', name: 'Social Issue' },
	{ value: 'other', name: 'Other Issue' },
	{ value: 'unknown', name: 'UNKNOWN' },
	{ value: '', name: 'UNSET' }
];

export const RISK_LIKELIHOODS = [...LEVELS_LIST];

export const RISK_CONSEQUENCES = [...LEVELS_LIST];

export const LEVELS_OF_RISK = [...LEVELS_LIST];

export const RISK_LEVELS = {
	UNMITIGATED: '',
	PROPOSED: 'proposed',
	AGREED_PARTIAL: 'agreed_partial',
	AGREED_FULLY: 'agreed_fully',
	REJECTED: 'rejected'
};

export const RISK_MITIGATION_STATUSES = [
	{ value: RISK_LEVELS.UNMITIGATED, name: 'Unmitigated' },
	{ value: RISK_LEVELS.PROPOSED, name: 'Proposed'},
	{ value: RISK_LEVELS.AGREED_PARTIAL, name: 'Agreed (Partial)' },
	{ value: RISK_LEVELS.AGREED_FULLY, name: 'Agreed (Fully)' },
	{ value: RISK_LEVELS.REJECTED, name: 'Rejected' }
];

export const RISK_LEVELS_ICONS = {
	[RISK_LEVELS.UNMITIGATED]: NewReleases,
	[RISK_LEVELS.PROPOSED]: ErrorOutline,
	[RISK_LEVELS.AGREED_PARTIAL]: ErrorSolid,
	[RISK_LEVELS.AGREED_FULLY]: CheckCircle,
	[RISK_LEVELS.REJECTED]: SyncProblem
};

export const RISK_LEVELS_COLORS = ['#008000', '#32cd32', '#fffacd', '#ff8c00', '#800000'];

export const RISK_FILTER_DATA_TYPES = {
	NORMAL: DATA_TYPES.UNDEFINED,
	QUERY: DATA_TYPES.QUERY
};

export const RISK_FILTER_RELATED_FIELDS = {
	MITIGATION_STATUS: 'mitigation_status',
	CREATED_BY: 'creator_role',
	RISK_OWNER: 'assigned_roles',
	CATEGORY: 'category',
	RISK_CONSEQUENCE: 'consequence',
	RISK_LIKELIHOOD: 'likelihood',
	LEVELS_OF_RISK: 'level_of_risk'
};

export const RISK_FILTERS = [
	{
		label: 'Category',
		relatedField: RISK_FILTER_RELATED_FIELDS.CATEGORY,
		type: RISK_FILTER_DATA_TYPES.NORMAL
	},
  {
    label: 'Mitigation Status',
		relatedField: RISK_FILTER_RELATED_FIELDS.MITIGATION_STATUS,
    type: RISK_FILTER_DATA_TYPES.NORMAL
  },
  {
    label: 'Created by',
		relatedField: RISK_FILTER_RELATED_FIELDS.CREATED_BY,
    type: RISK_FILTER_DATA_TYPES.NORMAL
  },
  {
    label: 'Risk owner',
		relatedField: RISK_FILTER_RELATED_FIELDS.RISK_OWNER,
    type: RISK_FILTER_DATA_TYPES.NORMAL
  },
	{
		label: 'Risk likelihood',
		relatedField: RISK_FILTER_RELATED_FIELDS.RISK_LIKELIHOOD,
		type: RISK_FILTER_DATA_TYPES.NORMAL
	},
	{
		label: 'Risk consequence',
		relatedField: RISK_FILTER_RELATED_FIELDS.RISK_CONSEQUENCE,
		type: RISK_FILTER_DATA_TYPES.NORMAL
	},
	{
		label: 'Level of risk',
		relatedField: RISK_FILTER_RELATED_FIELDS.LEVELS_OF_RISK,
		type: RISK_FILTER_DATA_TYPES.NORMAL
	}
] as any;

export const RISKS_ACTIONS_ITEMS = {
	PRINT: 'print',
	DOWNLOAD: 'download',
	SHOW_PINS: 'showPins'
};

export const RISKS_ACTIONS_MENU = [
	{
		name: RISKS_ACTIONS_ITEMS.PRINT,
		label: 'Create report',
		Icon: Print
	},
	{
		name: RISKS_ACTIONS_ITEMS.SHOW_PINS,
		label: 'Show Pins',
		Icon: Pins
	},
	{
		name: RISKS_ACTIONS_ITEMS.DOWNLOAD,
		label: 'Download JSON',
		Icon: Download
	}
];