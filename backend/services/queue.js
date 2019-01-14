/**
 *	Copyright (C) 2015 3D Repo Ltd
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU Affero General Public License as
 *	published by the Free Software Foundation, either version 3 of the
 *	License, or (at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU Affero General Public License for more details.
 *
 *	You should have received a copy of the GNU Affero General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/** *************************************************************************
 *  @file Contains functionality to dispatch work to the
 *       queue via amqp protocol. A compute node with a worker must be running
 *       to fulfil the tasks in order for the work to be done.
 ****************************************************************************/
"use strict";
(() => {

	const amqp = require("amqplib");
	const fs = require("fs.extra");
	const shortid = require("shortid");
	const systemLogger = require("../logger.js").systemLogger;
	const Mailer = require("../mailer/mailer");
	const config = require("../config");

	function ImportQueue() {}

	/** *****************************************************************************
	 * Create a connection and a channel in ampq and init variables
	 * @param {url} url - ampq connection string
	 * @param {options} options - defines sharedSpacePath, logger, callbackQName and workerQName
	 *******************************************************************************/
	ImportQueue.prototype.connect = function (url, options) {
		if (this.conn) {
			return Promise.resolve();
		}

		if (!url) {
			url = config.cn_queue.host;
		}

		if (!options) {
			options = {
				shared_storage: config.cn_queue.shared_storage,
				logger: systemLogger,
				callback_queue: config.cn_queue.callback_queue,
				worker_queue: config.cn_queue.worker_queue,
				model_queue: config.cn_queue.model_queue,
				event_exchange: config.cn_queue.event_exchange
			};
		}

		this.uid = shortid.generate();

		if (!options.shared_storage) {
			return Promise.reject({ message: "Please define shared_storage in queue config" });
		} else if (!options.logger) {
			return Promise.reject({ message: "Please define logger in options" });
		} else if (!options.callback_queue) {
			return Promise.reject({ message: "Please define callback_queue in queue config" });
		} else if (!options.worker_queue) {
			return Promise.reject({ message: "Please define worker_queue in queue config" });
		} else if (!options.model_queue) {
			return Promise.reject({ message: "Please define model_queue in queue config" });
		} else if (!options.event_exchange) {
			return Promise.reject({ message: "Please define event_exchange in queue config" });
		}

		this.sharedSpacePath = options.shared_storage;
		this.logger = options.logger;
		this.callbackQName = options.callback_queue;
		this.workerQName = options.worker_queue;
		this.modelQName = options.model_queue;
		this.eventExchange = options.event_exchange;

		return amqp.connect(url)
			.then(conn => {
				this.conn = conn;

				conn.on("close", () => {
					this.conn = null;
				});

				conn.on("error", function (err) {
					systemLogger.logError("[AMQP] connection error " + err.message);
				});

				return conn.createChannel();
			})
			.then(channel => {
				this.channel = channel;
				this.deferedObjs = {}; // cclw05 - should be deferred?

				return this._consumeCallbackQueue();
			})
			.catch(err => {
				return Promise.reject(err);
			});
	};

	ImportQueue.prototype.getChannel = function () {
		if (this.conn && this.channel) {
			return Promise.resolve(this.channel);
		} else {
			systemLogger.logInfo("Reconnecting to queue...");
			return this.connect().then(() => {
				systemLogger.logInfo("...Connected to queue!");
				return this.channel;
			}).catch((err) => {
				systemLogger.logError("Error (getChannel): " + err.message);
				return Promise.resolve();
			});
		}
	};

	/** *****************************************************************************
	 * Dispatch work to queue to import a model via a file uploaded by User
	 * @param {filePath} filePath - Path to uploaded file
	 * @param {orgFileName} orgFileName - Original file name of the file
	 * @param {databaseName} databaseName - name of database to commit to
	 * @param {modelName} modelName - name of model to commit to
	 * @param {userName} userName - name of user
	 * @param {copy} copy - use fs.copy or fs.move, default fs.move
	 * @param {tag} tag - revision tag
	 * @param {desc} desc - revison description
	 *******************************************************************************/
	ImportQueue.prototype.importFile = function (correlationId, filePath, orgFileName, databaseName, modelName, userName, copy, tag, desc) {
		const corID = correlationId;

		let newPath;
		const jsonFilename = `${this.sharedSpacePath}/${corID}.json`;

		return this._moveFileToSharedSpace(corID, filePath, orgFileName, copy)
			.then(obj => {
				newPath = obj.filePath;

				const json = {
					file: newPath,
					database: databaseName,
					project: modelName,
					owner: userName
				};

				if (tag) {
					json.tag = tag;
				}

				if (desc) {
					json.desc = desc;
				}

				return new Promise((resolve, reject) => {
					fs.writeFile(jsonFilename, JSON.stringify(json), { flag: "a+" }, err => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				});

			})
			.then(() => {
				const msg = `import -f ${jsonFilename}`;
				return this._dispatchWork(corID, msg, true);
			});
	};

	/** *****************************************************************************
	 * Dispatch work to queue to create a federated model
	 * @param {account} account - username
	 * @param {defObj} defObj - object to describe the federated model like submodels and transformation
	 *******************************************************************************/
	ImportQueue.prototype.createFederatedModel = function (correlationId, account, defObj) {
		const corID = correlationId;
		const newFileDir = this.sharedSpacePath + "/" + corID;
		const filename = `${newFileDir}/obj.json`;
		// let filename = `${newFileDir}.json`; //cclw05 - is /obj necessary? kept it there for now

		return new Promise((resolve, reject) => {
			fs.mkdir(this.sharedSpacePath, function (err) {
				if (!err || err && err.code === "EEXIST") {
					resolve();
				} else {
					reject(err);
				}
			});
		})
			.then(() => {
				return new Promise((resolve, reject) => {
					fs.mkdir(newFileDir, function (err) {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});

				});
			})
			.then(() => {
				return new Promise((resolve, reject) => {
					fs.writeFile(filename, JSON.stringify(defObj), { flag: "a+" }, err => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				});
			})
			.then(() => {
				const msg = `genFed ${filename} ${account}`;
				return this._dispatchWork(corID, msg);
			});

	};

	/** *****************************************************************************
	 * Dispatch work to import toy model
	 * @param {string} database - database name
	 * @param {string} model - model id
	 * @param {string} modeDirName - the dir name of the model database dump staying in
	 *******************************************************************************/
	ImportQueue.prototype.importToyModel = function (correlationId, database, model, options) {
		const corID = correlationId;

		const skip = options.skip && JSON.stringify(options.skip) || "";
		const msg = `importToy ${database} ${model} ${options.modelDirName} ${skip}`;

		return this._dispatchWork(corID, msg);
	};

	/** *****************************************************************************
	 * Move a specified file to shared storage (area shared by queue workers)
	 * move the file to shared storage space, put it in a corID/newFileName
	 * note: using move(in fs.extra) instead of rename(in fs) as rename doesn"t allow cross device
	 * @param {corID} corID - Correlation ID
	 * @param {orgFilePath} orgFilePath - Path to where the file is currently
	 * @param {newFileName} newFileName - New file name to rename to
	 * @param {copy} copy - use fs.copy instead of fs.move if set to true
	 *******************************************************************************/
	ImportQueue.prototype._moveFileToSharedSpace = function (corID, orgFilePath, newFileName, copy) {
		const ModelHelper = require("../models/helper/model");

		newFileName = newFileName.replace(ModelHelper.fileNameRegExp, "_");

		const newFileDir = this.sharedSpacePath + "/" + corID + "/";
		const filePath = newFileDir + newFileName;

		return new Promise((resolve, reject) => {
			fs.mkdir(newFileDir, function (err) {
				if (err) {
					reject(err);
				} else {

					const move = copy ? fs.copy : fs.move;

					move(orgFilePath, filePath, function (moveErr) {
						if (moveErr) {
							reject(moveErr);
						} else {
							resolve({ filePath, newFileDir });
						}
					});
				}

			});
		});

	};

	/** *****************************************************************************
	 * Insert a job item in worker queue
	 *
	 * @param {corID} corID - Correlation ID
	 * @param {msg} orgFilePath - Path to where the file is currently
	 * @param {isModelImport} whether this job is a model import
	 *******************************************************************************/
	ImportQueue.prototype._dispatchWork = function (corID, msg, isModelImport) {
		const _channel = this.getChannel();
		const queueName = isModelImport ? this.modelQName : this.workerQName;
		let info;

		_channel.then((channel) => {
			try {
				return channel.assertQueue(queueName, { durable: true })
					.then(_info => {
						info = _info;

						return channel.sendToQueue(queueName,
							new Buffer.from(msg), {
								correlationId: corID,
								appId: this.uid,
								persistent: true
							}
						);

					})
					.then(() => {
						this.logger.logInfo(
							"Sent work to queue[" + queueName + "]: " + msg.toString() + " with corr id: " + corID.toString() + " reply queue: " + this.callbackQName, {
								corID: corID.toString()
							}
						);

						if (info.consumerCount <= 0) {
							this.logger.logError(
								"No consumer found in the queue", {
									corID: corID.toString()
								}
							);
							this.logger.logInfo("No consumer in queue. Sending email alert...");

							Mailer.sendNoConsumerAlert().then(() => {
								this.logger.logInfo("Email sent.");
							}).catch(err =>{
								this.logger.logInfo("Failed to send email:", err);
							});

						}

						return Promise.resolve(() => {});
					});
			} catch(err) {
				systemLogger.logError("Error (_dispatchWork): " + err.message);
				return Promise.resolve();
			}
		});
	};

	/** *****************************************************************************
	 * Listen to callback queue, resolve promise when job done
	 * Should be called once only, presumably in constructor
	 *******************************************************************************/
	ImportQueue.prototype._consumeCallbackQueue = function () {
		const self = this;
		const _channel = this.getChannel();
		let queue;

		_channel.then((channel) => {
			try {
				return channel.assertExchange(this.callbackQName, "direct", { durable: true })
					.then(() => {

						return channel.assertQueue("", { exclusive: true });

					})
					.then((q) => {

						queue = q.queue;
						return channel.bindQueue(queue, this.callbackQName, this.uid);

					})
					.then(() => {

						return channel.consume(queue, function (rep) {

							self.logger.logInfo("Job request id " + rep.properties.correlationId + " returned with: " + rep.content);

							const ModelHelper = require("../models/helper/model");

							const defer = self.deferedObjs[rep.properties.correlationId];

							const resData = JSON.parse(rep.content);

							const resErrorCode = resData.value;
							const resErrorMessage = resData.message;
							const resDatabase = resData.database;
							const resProject = resData.project;
							const resUser = resData.user ? resData.user : "unknown";

							const status = resData.status;

							if ("processing" === status) {
								ModelHelper.setStatus(resDatabase, resProject, "processing");
							} else {
								if (resErrorCode === 0) {
									ModelHelper.importSuccess(resDatabase, resProject, self.sharedSpacePath);
								} else {
									ModelHelper.importFail(resDatabase, resProject, resUser, resErrorCode, resErrorMessage, true);
								}
								defer && delete self.deferedObjs[rep.properties.correlationId];
							}
						}, { noAck: true });
					});
			} catch(err) {
				systemLogger.logError("Error (_consumeCallbackQueue): " + err.message);
				return Promise.resolve();
			}
		});
	};

	ImportQueue.prototype.insertEventMessage = function (msg) {
		const _channel = this.getChannel();

		_channel.then((channel) => {
			try {
				return channel.assertExchange(this.eventExchange, "fanout", {
					durable: true
				})
					.then(() => {
						return channel.publish(
							this.eventExchange,
							"",
							new Buffer.from(JSON.stringify(msg)), {
								persistent: true
							}
						);
					});
			} catch(err) {
				systemLogger.logError("Error (insertEventMessage): " + err.message);
				return Promise.resolve();
			}
		});
	};

	ImportQueue.prototype.consumeEventMessage = function (callback) {
		const _channel = this.getChannel();
		let queue;

		_channel.then((channel) => {
			try {
				return channel.assertExchange(this.eventExchange, "fanout", {
					durable: true
				})
					.then(() => {

						return channel.assertQueue("", { exclusive: true });

					})
					.then(q => {

						queue = q.queue;
						return channel.bindQueue(queue, this.eventExchange, "");

					})
					.then(() => {

						return channel.consume(queue, function (rep) {

							callback(JSON.parse(rep.content));

						}, { noAck: true });
					});
			} catch(err) {
				systemLogger.logError("Error (consumeEventMessage): " + err.message);
				return Promise.resolve();
			}
		});
	};

	module.exports = new ImportQueue();

})();
