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

import { all, put, select, takeLatest } from 'redux-saga/effects';
import { differenceBy, isEmpty, omit, pick, map } from 'lodash';

import * as API from '../../services/api';
import { getAngularService, dispatch, getState, runAngularViewerTransition } from '../../helpers/migration';
import { prepareIssue } from '../../helpers/issues';
import { Cache } from '../../services/cache';
import { Viewer } from '../../services/viewer/viewer';
import { DialogActions } from '../dialog';
import { SnackbarActions } from '../snackbar';
import { IssuesTypes, IssuesActions } from './issues.redux';
import {
	selectActiveIssueId,
	selectIssues,
	selectShowPins,
	selectIssuesMap,
	selectActiveIssueDetails,
	selectFilteredIssues
} from './issues.selectors';
import { selectJobsList } from '../jobs';
import { selectCurrentUser } from '../currentUser';
import { PIN_COLORS } from '../../styles';

export function* fetchIssues({teamspace, modelId, revision}) {
	yield put(IssuesActions.togglePendingState(true));
	try {
		const { data } = yield API.getIssues(teamspace, modelId, revision);
		const jobs = yield select(selectJobsList);

		const preparedIssues = data.map((issue) => prepareIssue(issue, jobs));

		yield put(IssuesActions.fetchIssuesSuccess(preparedIssues));
		// yield put(IssuesActions.renderPins(data));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('get', 'issues', error));
	}
	yield put(IssuesActions.togglePendingState(false));
}

export function* fetchIssue({teamspace, modelId, issueId}) {
	try {
		const {data} = yield API.getIssue(teamspace, modelId, issueId);

		yield put(IssuesActions.fetchIssueSuccess(data));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('get', 'issue', error));
	}
}

const createGroupData = (name, nodes) => {
	const groupData = {
		name,
		color: [255, 0, 0],
		objects: nodes
	};

	return nodes.length === 0 ? null : groupData;
};

const createGroup = (issue, objectInfo, teamspace, model) => {
	// Create a group of selected objects
	const highlightedGroupData = createGroupData(issue.name, objectInfo.highlightedNodes);
	// Create a group of hidden objects
	const hiddenGroupData = createGroupData(issue.name, objectInfo.hiddenNodes);

	return Promise.all([
		highlightedGroupData && API.createGroup(teamspace, model, highlightedGroupData),
		hiddenGroupData && API.createGroup(teamspace, model, hiddenGroupData)
	]);
};

const toggleIssuePin = (issue, selected = true) => {
	if (issue && issue.position && issue.position.length > 0 && issue._id) {
		Viewer.changePinColor({
			id: issue._id,
			colours: selected ? PIN_COLORS.YELLOW : PIN_COLORS.BLUE
		});
	}
};

export function* saveIssue({ teamspace, model, issueData, revision }) {
	try {
		yield Viewer.setPinDropMode(false);
		const [viewpoint, objectInfo, screenshot, userJob] = yield all([
			Viewer.getCurrentViewpoint({ teamspace, model }),
			Viewer.getObjectsStatus(),
			issueData.screenshot || Viewer.getScreenshot(),
			API.getMyJob(teamspace)
		]);

		const TreeService = getAngularService('TreeService') as any;
		const AnalyticService = getAngularService('AnalyticService') as any;

		viewpoint.hideIfc = TreeService.getHideIfc();

		issueData.rev_id = revision;

		if (objectInfo.highlightedNodes.length > 0 || objectInfo.hiddenNodes.length > 0) {
			const [highlightedGroup, hiddenGroup] = yield createGroup(issueData, objectInfo, teamspace, model);

			if (highlightedGroup) {
				viewpoint.highlighted_group_id = highlightedGroup.data._id;
			}

			if (hiddenGroup) {
				viewpoint.hidden_group_id = hiddenGroup.data._id;
			}
		}

		viewpoint.screenshot = screenshot.substring(screenshot.indexOf(',') + 1);

		const issue = {
			...omit(issueData, ['author', 'statusColor']),
			owner: issueData.author,
			rev_id: revision,
			objectId: null,
			creator_role: userJob.data._id,
			viewpoint,
			pickedPos: null,
			pickedNorm: null,
			scale: 1.0
		};

		// Pin data
		const pinData = Viewer.getPinData();
		if (pinData !== null) {
			issue.pickedPos = pinData.pickedPos;
			issue.pickedNorm = pinData.pickedNorm;
		}

		const { data: savedIssue } = yield API.saveIssue(teamspace, model, issue);

		AnalyticService.sendEvent({
			eventCategory: 'Issue',
			eventAction: 'create'
		});

		const jobs = yield select(selectJobsList);
		const preparedIssue = prepareIssue(savedIssue, jobs);
		yield put(IssuesActions.saveIssueSuccess(preparedIssue));
		yield put(IssuesActions.showDetails(savedIssue, [], revision));
		yield put(SnackbarActions.show('Issue created'));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('save', 'issue', error));
	}
}

export function* updateIssue({ teamspace, modelId, issueData }) {
	try {
		const { data: updatedIssue } = yield API.updateIssue(teamspace, modelId, issueData);

		const AnalyticService = getAngularService('AnalyticService') as any;
		yield AnalyticService.sendEvent({
			eventCategory: 'Issue',
			eventAction: 'edit'
		});

		toggleIssuePin(issueData, true);
		const jobs = yield select(selectJobsList);
		const preparedIssue = prepareIssue(updatedIssue, jobs);
		yield put(IssuesActions.saveIssueSuccess(preparedIssue));
		yield put(SnackbarActions.show('Issue updated'));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('update', 'issue', error));
	}
}

export function* renderPins() {
	try {
		const filteredIssues = yield select(selectFilteredIssues);
		const issuesList = yield select(selectIssues);
		const shouldShowPins = yield select(selectShowPins);
		const invisibleIssues = issuesList.length !== filteredIssues.length
			? differenceBy(issuesList, filteredIssues, '_id')
			: [];

		const activeIssueId = yield select(selectActiveIssueId);
		const removePins = (issues) => issues.forEach((issue) => {
			Viewer.removePin({ id: issue._id });
		});

		yield removePins(!shouldShowPins ? issuesList : invisibleIssues);

		if (shouldShowPins) {
			for (let index = 0; index < filteredIssues.length; index++) {
				const issue = filteredIssues[index];

				const pinPosition = issue.position && issue.position.length;

				if (pinPosition) {
					const isSelectedPin = activeIssueId && issue._id === activeIssueId;
					const pinColor = isSelectedPin ? PIN_COLORS.YELLOW : PIN_COLORS.BLUE;

					yield Viewer.addPin({
						id: issue._id,
						type: 'issue',
						account: issue.account,
						model: issue.model,
						pickedPos: issue.position,
						pickedNorm: issue.norm,
						colours: pinColor,
						viewpoint: issue.viewpoint
					});
				}
			}
		}
	} catch (error) {
		yield put(DialogActions.showErrorDialog('show', 'pins', error));
	}
}

export function* downloadIssues({ teamspace, modelId }) {
	try {
		const endpoint = `${teamspace}/${modelId}/issues.json`;
		const modelName = Viewer.viewer && Viewer.viewer.settings ? Viewer.viewer.settings.name : '';
		yield API.downloadJSON('issues', modelName, endpoint);

	} catch (error) {
		yield put(DialogActions.showErrorDialog('update', 'issue', error));
	}
}

export function* printIssues({ teamspace, modelId }) {
	try {
		const filteredIssues = yield select(selectFilteredIssues);
		const issuesIds = map(filteredIssues, '_id').join(',');
		const printEndpoint = `${teamspace}/${modelId}/issues.html?ids=${issuesIds}`;
		const printUrl = `${ClientConfig.apiUrls.all[0]}/${printEndpoint}`;
		window.open(printUrl, '_blank');
	} catch (error) {
		yield put(DialogActions.showErrorDialog('update', 'issue', error));
	}
}

const getIssueGroup = async (issue, groupId, revision) => {
	if (!groupId) {
		return null;
	}

	const cachedGroup = Cache.get('issue.group', groupId);
	if (cachedGroup) {
		return cachedGroup;
	}

	const { data } = await API.getGroup(issue.account, issue.model, groupId, revision);

	if (data.hiddenObjects && !issue.viewpoint.group_id) {
		data.hiddenObjects = null;
	}

	Cache.add('issue.group', groupId, data);
	return data;
};

const showMultipleGroups = async (issue, revision) => {
	const TreeService = getAngularService('TreeService') as any;

	const hasViewpointGroups = !isEmpty(pick(issue.viewpoint, [
		'highlighted_group_id',
		'hidden_group_id',
		'shown_group_id'
	]));

	let objects = {} as { hidden: any[], shown: any[], objects: any[] };

	if (hasViewpointGroups) {
		const [highlightedGroupData, shownGroupData, hiddenGroupData] = await Promise.all([
			getIssueGroup(issue, issue.viewpoint.highlighted_group_id, revision),
			getIssueGroup(issue, issue.viewpoint.hidden_group_id, revision),
			getIssueGroup(issue, issue.viewpoint.shown_group_id, revision)
		]) as any;

		if (hiddenGroupData) {
			objects.hidden = hiddenGroupData.objects;
		}

		if (shownGroupData) {
			objects.shown = hiddenGroupData.objects;
		}

		if (highlightedGroupData) {
			objects.objects = highlightedGroupData.objects;
		}
	} else {
		const hasViewpointDefaultGroup = issue.viewpoint.group_id;
		const groupId = hasViewpointDefaultGroup ? issue.viewpoint.group_id : issue.group_id;
		const groupData = await getIssueGroup(issue, groupId, revision);

		if (groupData.hiddenObjects && !issue.viewpoint.group_id) {
			groupData.hiddenObjects = null;
			Cache.add('issue.group', groupId, groupData);
		}

		objects = groupData;
	}

	if (objects.hidden) {
		TreeService.hideNodesBySharedIds(objects.hidden);
	}

	if (objects.shown) {
		TreeService.isolateNodesBySharedIds(objects.shown);
	}

	if (objects.objects && objects.objects.length > 0) {
		TreeService.selectedIndex = undefined;
		await TreeService.selectNodesBySharedIds(objects.objects);
		window.dispatchEvent(new Event('resize'));
	}
};

export function* focusOnIssue({ issue, revision }) {
	try {
		yield put(IssuesActions.renderPins());
		const TreeService = getAngularService('TreeService') as any;

		// Remove highlight from any multi objects
		Viewer.highlightObjects([]);
		TreeService.clearCurrentlySelected();

		const hasViewpoint = issue.viewpoint;
		const hasHiddenOrShownGroup = hasViewpoint && (issue.viewpoint.hidden_group_id || issue.viewpoint.shown_group_id);

		// Reset object visibility
		if (hasViewpoint && issue.viewpoint.hideIfc) {
			TreeService.setHideIfc(issue.viewpoint.hideIfc);
		}

		TreeService.showAllTreeNodes(!hasHiddenOrShownGroup);
		const hasViewpointGroup = hasViewpoint && (issue.viewpoint.highlighted_group_id || issue.viewpoint.group_id);
		const hasGroup = issue.group_id;

		if (hasViewpointGroup || hasGroup || hasHiddenOrShownGroup) {
			yield showMultipleGroups(issue, revision);
		}

		const { account, model, viewpoint } = issue;
		if (viewpoint) {
			if (viewpoint.position && viewpoint.position.length > 0) {
				Viewer.setCamera({ ...viewpoint, account, model });
			}

			yield Viewer.updateClippingPlanes({
				clippingPlanes: viewpoint.clippingPlanes,
				account,
				model
			});
		} else {
			yield Viewer.goToDefaultViewpoint();
		}

	} catch (error) {
		yield put(DialogActions.showErrorDialog('focus', 'issue', error));
	}
}

export function* setActiveIssue({ issue, revision }) {
	try {
		const activeIssueId = yield select(selectActiveIssueId);
		const issuesMap = yield select(selectIssuesMap);

		if (activeIssueId !== issue._id) {
			toggleIssuePin(issuesMap[activeIssueId], false);
			toggleIssuePin(issue, true);
		}
		yield all([
			put(IssuesActions.focusOnIssue(issue, revision)),
			put(IssuesActions.setComponentState({ activeIssue: issue._id, expandDetails: true }))
		]);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('set', 'issue as active', error));
	}
}

export function* showDetails({ issue, revision }) {
	try {
		runAngularViewerTransition({
			account: issue.account,
			model: issue.model,
			revision,
			issueId: issue._id,
			noSet: true
		});

		yield put(IssuesActions.setActiveIssue(issue, revision));
		yield put(IssuesActions.setComponentState({ showDetails: true }));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('display', 'issue details', error));
	}
}

export function* closeDetails() {
	try {
		const activeIssue = yield select(selectActiveIssueDetails);

		if (activeIssue) {
			runAngularViewerTransition({
				account: activeIssue.account,
				model: activeIssue.model,
				revision: activeIssue.rev_id,
				issueId: null,
				noSet: true
			});
		}

		yield put(IssuesActions.setComponentState({ activeIssue: null, showDetails: false }));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('close', 'issue details', error));
	}
}

export function* showNewPin({ issue, pinData }) {
	try {
		Viewer.removePin({ id: pinData.id });
		Viewer.setPin(null);

		const data = {
			...pinData,
			account: issue.account,
			model: issue.model,
			colours: pinData.selectColour,
			type: 'issue'
		};

		Viewer.addPin(data);
		Viewer.setPin(data);
	} catch (error) {
		yield put(DialogActions.showErrorDialog('display', 'pin', error));
	}
}

export function* toggleShowPins({ showPins }) {
	try {
		yield put(IssuesActions.setComponentState({ showPins }));
		yield put(IssuesActions.renderPins());
	} catch (error) {
		yield put(DialogActions.showErrorDialog('toggle', 'pins', error));
	}
}

const onUpdateEvent = (updatedIssue) => {
	const jobs = selectJobsList(getState());
	dispatch(IssuesActions.saveIssueSuccess(prepareIssue(updatedIssue, jobs)));
};

const onCreateEvent = (createdIssue) => {
	const jobs = selectJobsList(getState());
	dispatch(IssuesActions.saveIssueSuccess(prepareIssue(createdIssue[0], jobs)));
};

const getIssuesChannel = (teamspace, modelId) => {
	const ChatService = getAngularService('ChatService') as any;
	return ChatService.getChannel(teamspace, modelId).issues;
};

export function* subscribeOnIssueChanges({ teamspace, modelId }) {
	const issuesNotifications = getIssuesChannel(teamspace, modelId);
	issuesNotifications.subscribeToUpdated(onUpdateEvent, this);
	issuesNotifications.subscribeToCreated(onCreateEvent, this);
}

export function* unsubscribeOnIssueChanges({ teamspace, modelId }) {
	const issuesNotifications = getIssuesChannel(teamspace, modelId);
	issuesNotifications.unsubscribeFromUpdated(onUpdateEvent);
	issuesNotifications.unsubscribeFromCreated(onCreateEvent);
}

export function* setNewIssue() {
	const issues = yield select(selectIssues);
	const jobs = yield select(selectJobsList);
	const currentUser = yield select(selectCurrentUser);
	const issueNumber = issues.length + 1;

	try {
		const newIssue = prepareIssue({
			name: `Untitled issue ${issueNumber}`,
			associated_activity: '',
			assigned_roles: [],
			likelihood: 0,
			consequence: 0,
			level_of_issue: 0,
			mitigation_status: '',
			viewpoint: {},
			owner: currentUser.username
		}, jobs);

		yield put(IssuesActions.setComponentState({
			showDetails: true,
			activeIssue: null,
			newIssue
		}));
	} catch (error) {
		yield put(DialogActions.showErrorDialog('prepare', 'new issue', error));
	}
}

export default function* IssuesSaga() {
	yield takeLatest(IssuesTypes.FETCH_ISSUES, fetchIssues);
	yield takeLatest(IssuesTypes.FETCH_ISSUE, fetchIssue);
	yield takeLatest(IssuesTypes.SAVE_ISSUE, saveIssue);
	yield takeLatest(IssuesTypes.UPDATE_ISSUE, updateIssue);
	yield takeLatest(IssuesTypes.RENDER_PINS, renderPins);
	yield takeLatest(IssuesTypes.DOWNLOAD_ISSUES, downloadIssues);
	yield takeLatest(IssuesTypes.PRINT_ISSUES, printIssues);
	yield takeLatest(IssuesTypes.SET_ACTIVE_ISSUE, setActiveIssue);
	yield takeLatest(IssuesTypes.SHOW_DETAILS, showDetails);
	yield takeLatest(IssuesTypes.CLOSE_DETAILS, closeDetails);
	yield takeLatest(IssuesTypes.SHOW_NEW_PIN, showNewPin);
	yield takeLatest(IssuesTypes.TOGGLE_SHOW_PINS, toggleShowPins);
	yield takeLatest(IssuesTypes.SUBSCRIBE_ON_ISSUE_CHANGES, subscribeOnIssueChanges);
	yield takeLatest(IssuesTypes.UNSUBSCRIBE_ON_ISSUE_CHANGES, unsubscribeOnIssueChanges);
	yield takeLatest(IssuesTypes.FOCUS_ON_ISSUE, focusOnIssue);
	yield takeLatest(IssuesTypes.SET_NEW_ISSUE, setNewIssue);
}