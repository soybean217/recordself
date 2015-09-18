var syncServer = function() {
	console.log("mSyncStatus:" + mSyncStatus + " "
			+ ((new Date()).valueOf() - mLastSyncTime));
	if (mSyncStatus == 'stop'
			|| ((new Date()).valueOf() - mLastSyncTime > mSyncTimeout)) {
		console.log("begin sync");
		mSyncStatus = 'work';
		mLastSyncTime = (new Date()).valueOf();
		var needSyncCount = 0;
		var currentServerId = bigInt(0);

		procServerIdFromServer("local_contents");
	}
	function syncLocalToServer(tableName) {
		mLocalDbProcess = "syncLocalToServer:" + tableName
		db.transaction(dbLastSyncTime(tableName), errorCB);
	}

	function dbLastSyncTime(tableName) {
		return function(tx) {
			mLocalDbProcess = "dbLastSyncTime";
			tx
					.executeSql(
							"Select serverUpdateTime from "
									+ tableName
									+ " where userId=? order by serverUpdateTime desc limit 1 ;",
							[ mLocalParameters['userId'] ],
							handlerLastSyncTime(tableName), errorCB);
		}

	}
	function handlerLastSyncTime(tableName) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				if (results.rows.item(0).serverUpdateTime > 0) {
					withInputGetNeedSyncRows(
							results.rows.item(0).serverUpdateTime, tableName);
				} else {
					withInputGetNeedSyncRows(0, tableName);
				}
			} else {
				withInputGetNeedSyncRows(0, tableName);
			}
		}
	}
	function withInputGetNeedSyncRows(lastServerTime, tableName) {
		db.transaction(
				withInputDbGetNeedSyncRecords(lastServerTime, tableName),
				errorCB);
	}

	function withInputDbGetNeedSyncRecords(lastServerTime, tableName) {
		return function(tx) {
			mLocalDbProcess = "dbGetNeedSyncRecords";
			switch (tableName) {
			case "local_records":
				tx
						.executeSql(
								"Select serverId,title,detail,beginTime,endTime,state,"
										+ " serverUpdateTime,titleServerId "
										+ " from local_records where userId=? "
										+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
								[ mLocalParameters['userId'],
										LIMIT_UPDATE_BATCH_SIZE ],
								withInputHandlerSyncDataToServer(
										lastServerTime, tableName), errorCB);
				break;
			case "local_contents":
				tx
						.executeSql(
								"Select serverId,content,state,"
										+ " serverUpdateTime "
										+ " from local_contents where userId=? "
										+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
								[ mLocalParameters['userId'],
										LIMIT_UPDATE_BATCH_SIZE ],
								withInputHandlerSyncDataToServer(
										lastServerTime, tableName), errorCB);
				break;
			}

		}
	}

	function withInputHandlerSyncDataToServer(lastServerTime, tableName) {
		return function(tx, results) {
			var syncData = {
				dataRows : [],
				lastSyncServerTimeFromClient : lastServerTime,
				clientParameters : mLocalParameters,
				tableName : tableName
			};
			for (var i = 0; i < results.rows.length; i++) {
				var row = {};
				switch (tableName) {
				case "local_records":
					row.serverId = results.rows.item(i).serverId;
					row.title = results.rows.item(i).title;
					row.detail = results.rows.item(i).detail;
					row.beginTime = results.rows.item(i).beginTime;
					row.endTime = results.rows.item(i).endTime;
					row.state = results.rows.item(i).state;
					row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
					row.titleServerId = results.rows.item(i).titleServerId;
					break;
				case "local_contents":
					row.serverId = results.rows.item(i).serverId;
					row.content = results.rows.item(i).content;
					row.state = results.rows.item(i).state;
					row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
					break;
				}
				syncData.dataRows.push(row);
			}
			syncRecordAjax(mServerUrl, receiveSyncRecordRspAjax,
					ajaxGetNotSuccessMsg, ajaxNetworkError, syncData, tableName);
		}
	}

	function syncRecordAjax(serverUrl, successAjaxProc, errorRsp,
			ajaxNetworkError, syncData, tableName) {
		$.ajax({
			type : "post",
			url : serverUrl + "sync-record.jsp",
			async : false,
			data : JSON.stringify(syncData),
			dataType : "json",
			success : function(msg) {
				if (msg.status == "success") {
					successAjaxProc(msg, tableName);
				} else {
					errorRsp(msg);
				}
			},
			error : ajaxNetworkError
		});
	}

	function procServerIdFromServer(tableName) {
		mLocalDbProcess = "procServerIdFromServer";
		db.transaction(dbGetCountNeedServerId(tableName), errorCB);
	}

	function dbGetCountNeedServerId(tableName) {
		return function(tx) {
			tx.executeSql("SELECT count(clientId) as total from " + tableName
					+ " where userId=? and serverId is null ;",
					[ mLocalParameters['userId'] ],
					handlerGetCountNeedServerId(tableName), errorCB);
		}
	}

	function handlerGetCountNeedServerId(tableName) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				if (results.rows.item(0).total > 0) {
					if (results.rows.item(0).total > LIMIT_UPDATE_BATCH_SIZE) {
						needSyncCount = LIMIT_UPDATE_BATCH_SIZE;
					} else {
						needSyncCount = results.rows.item(0).total;
					}
					getServerIdAjax(mServerUrl, receiveGetServerIdAjax,
							ajaxGetNotSuccessMsg, ajaxNetworkError,
							needSyncCount, tableName);
				} else {
					// todo no result ;
					console
							.log("handlerGetCountNeedServerId:no record need get serverId .");
					syncLocalToServer(tableName);
				}
			} else {
				// todo no result ;
				console.log("error ! handlerGetCountNeedServerId");
			}
		}

	}
	function receiveSyncRecordRspAjax(msg, tableName) {
		for (var i = 0; i < msg.data.length; i++) {
			if (msg.data[i].serverId != null && msg.data[i].serverId != '') {
				db.transaction(dbProcReceivedRow(msg.data[i], tableName),
						errorCB);
			}
		}
		mSyncStatus = 'stop';
	}
	function dbProcReceivedRow(row, tableName) {
		return function(tx) {
			switch (tableName) {
			case "local_records":
				tx
						.executeSql(
								"SELECT 1 from local_records where serverId=? and userId=? ;",
								[ row.serverId, mLocalParameters['userId'] ],
								updateOrInsertReceivedRecord(row), errorCB);
				break;
			case "local_contents":
				tx
						.executeSql(
								"SELECT 1 from local_contents where serverId=? and userId=? ;",
								[ row.serverId, mLocalParameters['userId'] ],
								updateOrInsertReceivedTitle(row), errorCB);
				break;
			}

		}
	}
	function updateOrInsertReceivedTitle(row) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				tx
						.executeSql(
								"update local_contents set content = ?  ,"
										+ "state=? ,serverUpdateTime=?,modifyStatus=0 where serverId=?; ",
								[ row.content, row.state, row.serverUpdateTime,
										row.serverId ]);
			} else {
				tx
						.executeSql(
								"insert into local_contents (userId,content,state,"
										+ "serverUpdateTime,modifyStatus,serverId) values (?,?,?,?,0,?); ",
								[ mLocalParameters['userId'], row.content,
										row.state, row.serverUpdateTime,
										row.serverId ],
								updateRecordTitleClientId(row.serverId));
			}
		}
	}
	// modify insertId . Perhaps no use .
	function updateRecordTitleClientId(titleServerId) {
		return function(tx, results) {
			tx.executeSql('select last_insert_rowid() as id', [],
					dbGetLastUpdateTitleClientIdToUpdateRecord(titleServerId));
		}
	}
	function dbGetLastUpdateTitleClientIdToUpdateRecord(titleServerId) {
		return function(tx, results) {
			tx
					.executeSql(
							'update local_records set titleClientId=?,modifyStatus=1 where titleServerId=?',
							[ results.rows.item(0).id, titleServerId ]);
		}
	}
	function updateOrInsertReceivedRecord(row) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				tx
						.executeSql(
								"update local_records set title = ? ,detail = ? ,beginTime = ? ,endTime=?,"
										+ "state=? ,serverUpdateTime=?,modifyStatus=0,"
										+ "titleClientId=?,titleServerId=? where serverId=?; ",
								[ row.title, row.detail, row.beginTime,
										row.endTime, row.state,
										row.serverUpdateTime,
										row.titleClientId, row.titleServerId,
										row.serverId ]);
			} else {
				tx
						.executeSql(
								"insert into local_records (userId,title,detail,beginTime,endTime,state,"
										+ "serverUpdateTime,modifyStatus,serverId,titleClientId,"
										+ "titleServerId) values (?,?,?,?,?,?,?,0,?,?,?); ",
								[ mLocalParameters['userId'], row.title,
										row.detail, row.beginTime, row.endTime,
										row.state, row.serverUpdateTime,
										row.serverId, row.titleClientId,
										row.titleServerId ]);
			}
		}
	}

	function receiveGetServerIdAjax(msg, count, tableName) {
		currentServerId = bigInt(msg.data);
		needSyncCount = count;
		if (currentServerId > 0) {
			db.transaction(dbProcRowNeedServerId(tableName), errorCB);
		}
	}

	function dbProcRowNeedServerId(tableName) {
		return function(tx) {
			tx
					.executeSql(
							"SELECT clientId from "
									+ tableName
									+ " where userId=? and serverId is null order by clientId limit ? ;",
							[ mLocalParameters['userId'], needSyncCount ],
							handlerUpdateClientServerId(tableName), errorCB);
		}
	}
	function handlerUpdateClientServerId(tableName) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				// getTransaction(updateLocalServerId, results,
				// currentServerId);
				db.transaction(updateLocalServerId(results, currentServerId,
						tableName), errorCB)

			} else {
				// todo no result ;
				console.log("handlerUpdateClientServerId: no rows .");
			}
		}
	}
	function updateLocalServerId(resultOfClientID, serverId, tableName) {
		return function(tx) {
			for (var i = 0; i < resultOfClientID.rows.length; i++) {
				if (tableName == "local_contents") {
					tx.executeSql("update " + tableName
							+ " set serverId=? where clientId = ?; ", [
							serverId.toString(),
							resultOfClientID.rows.item(i).clientId ],
							dbGetLastUpdateTitleServerId(serverId.toString(),
									resultOfClientID.rows.item(i).clientId));
				} else {
					tx.executeSql("update " + tableName
							+ " set serverId=? where clientId = ?; ", [
							serverId.toString(),
							resultOfClientID.rows.item(i).clientId ]);
				}
				serverId = serverId.add(1);
			}
			syncLocalToServer(tableName);
		}
	}

	function dbGetLastUpdateTitleServerId(titleServerId, titleClientId) {
		return function(tx, results) {
			tx
					.executeSql(
							'update local_records set titleServerId=?,modifyStatus=1 where titleClientId=?',
							[ titleServerId, titleClientId ]);
		}
	}

	function getServerIdAjax(serverUrl, successGetServerIdAjaxProc, errorRsp,
			ajaxNetworkError, needCount, tableName) {
		var oriData = {
			amount : needCount,
			keyTitle : tableName
		};
		$.ajax({
			type : "post",
			url : serverUrl + "get-server-id.jsp",
			async : false,
			data : JSON.stringify(oriData),
			dataType : "json",
			success : function(msg) {
				if (msg.status == "success") {
					successGetServerIdAjaxProc(msg, needCount, tableName);
				} else {
					errorRsp(msg);
				}
			},
			error : ajaxNetworkError
		});
	}
}
