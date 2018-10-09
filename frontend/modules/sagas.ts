import { all, fork } from 'redux-saga/effects';
import teamspaceSaga from './teamspace/teamspace.sagas';
import userManagementSaga from './userManagement/userManagement.sagas';
import jobsSaga from './jobs/jobs.sagas';
import billingSaga from './billing/billing.sagas';
// <-- IMPORT MODULE SAGA -->

export default function* rootSaga() {
	yield all([
		fork(teamspaceSaga),
		fork(userManagementSaga),
		fork(jobsSaga),
		fork(billingSaga)// <-- INJECT MODULE SAGA -->
	]);
}