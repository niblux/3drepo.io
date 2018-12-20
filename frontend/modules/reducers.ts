import { combineReducers } from 'redux';

import { reducer as currentUserReducer } from './currentUser/currentUser.redux';
import { reducer as userManagementReducer } from './userManagement/userManagement.redux';
import { reducer as dialogReducer } from './dialog/dialog.redux';
import { reducer as jobsReducer } from './jobs/jobs.redux';
import { reducer as snackbarReducer } from './snackbar/snackbar.redux';
import { reducer as billingReducer } from './billing/billing.redux';
import { reducer as teamspacesReducer } from './teamspaces/teamspaces.redux';
import { reducer as modelReducer } from './model/model.redux';
import { reducer as authReducer } from './auth/auth.redux';
import { reducer as notificationsReducer } from './notifications/notifications.redux';
<<<<<<< HEAD
import { reducer as staticPagesReducer } from './staticPages/staticPages.redux';
=======
import { reducer as usersReducer } from './users/users.redux';
>>>>>>> ISSUE #1266 - Create users modeule, create saga to caching users details responses
// <-- IMPORT MODULE REDUCER -->

export default function createReducer() {
	return combineReducers({
		currentUser: currentUserReducer,
		userManagement: userManagementReducer,
		dialog: dialogReducer,
		jobs: jobsReducer,
		snackbar: snackbarReducer,
		billing: billingReducer,
		teamspaces: teamspacesReducer,
		model: modelReducer,
		auth: authReducer,
		notifications: notificationsReducer,
<<<<<<< HEAD
		staticPages: staticPagesReducer// <-- INJECT MODULE REDUCER -->
=======
		users: usersReducer// <-- INJECT MODULE REDUCER -->
>>>>>>> ISSUE #1266 - Create users modeule, create saga to caching users details responses
	});
}
