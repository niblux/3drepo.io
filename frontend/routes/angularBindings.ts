/*
	This file contains react components conversion to angular context.
	It should be change to ReactRouter file if app is fully migrated
*/
import * as React from 'react';
import { react2angular as wrap } from 'react2angular';

// Routes
import Users from './users/users.container';
import DialogContainer from './components/dialogContainer/dialogContainer.container';
import Jobs from './jobs/jobs.container';
import ModelsPermissions from './modelsPermissions/modelsPermissions.container';
import ProjectsPermissions from './projectsPermissions/projectsPermissions.container';
import Projects from './projects/projects.container';

angular
	.module('3drepo')
	.component('users', wrap(Users, ['users', 'jobs', 'active', 'limit']))
	.component('jobs', wrap(Jobs, ['active']))
	.component('dialogContainer', wrap(DialogContainer))
	.component('modelsPermissions', wrap(ModelsPermissions, [
		'models', 'permissions', 'onSelectionChange', 'onPermissionsChange'
	]))
	.component('projectsPermissions', wrap(ProjectsPermissions, [
		'permissions', 'onSelectionChange', 'onPermissionsChange'
	]))
	.component('projects', wrap(Projects, ['projects', 'users']));