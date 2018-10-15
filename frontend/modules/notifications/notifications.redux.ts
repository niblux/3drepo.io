/**
 *  Copyright (C) 2018 3D Repo Ltd
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

import { createActions, createReducer } from 'reduxsauce';
import { consolidateStreamedStyles } from 'styled-components';

export const { Types: NotificationsTypes, Creators: NotificationsActions } = createActions({
	fetchNotifications: ['username'],
	fetchNotificationsSuccess: ['notifications'],
	upsertNotification: ['notification'],
	deleteNotification: ['notification']
}, { prefix: 'NOTIFICATIONS_' });

export const INITIAL_STATE = [];

export const fetchNotificationsSuccess = (state = INITIAL_STATE, { notifications }) =>  state.concat(notifications) ;

export const upsertNotification = (state = INITIAL_STATE, { notification }) =>  {
	const index = state.findIndex((n) => n._id === notification._id);
	const newState = state.concat([]);
	newState.splice(index, (index >= 0 ? 1 : 0), notification);
	return newState.sort((a, b) => b.timestamp - a.timestamp);
};

export const deleteNotification = (state = INITIAL_STATE, { notification }) =>  {
	const index = state.findIndex((n) => n._id === notification._id);
	const newState = state.concat([]);
	newState.splice(index, (index >= 0 ? 1 : 0));
	return newState.sort((a, b) => b.timestamp - a.timestamp);
};

export const reducer = createReducer(INITIAL_STATE, {
	[NotificationsTypes.FETCH_NOTIFICATIONS_SUCCESS]: fetchNotificationsSuccess,
	[NotificationsTypes.UPSERT_NOTIFICATION]: upsertNotification,
	[NotificationsTypes.DELETE_NOTIFICATION]: deleteNotification
});
