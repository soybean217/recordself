function formInitial() {
	$("#formSignUp").validate({
		rules : {
			signUpUserName : {
				required : true,
				minlength : 1,
				maxlength : 31
			},
			signUpPassword : {
				required : true,
				minlength : 1,
				maxlength : 31
			},
			signUpConfirmPassword : {
				required : true,
				minlength : 1,
				maxlength : 31,
				equalTo : "#signUpPassword"
			}
		}
	});
	$("#formSignUp").submit(function(e) {
		e.preventDefault();
		if ($("#formSignUp").valid()) {
			signUpAjax(mServerUrl);
		}
	});
	$("#formSignIn").validate({
		rules : {
			signInUserName : {
				required : true,
				minlength : 1,
				maxlength : 31
			},
			signInPassword : {
				required : true,
				minlength : 1,
				maxlength : 31
			}
		}
	});
	$("#formSignIn").submit(function(e) {
		e.preventDefault();
		if ($("#formSignIn").valid()) {
			signInAjax(mServerUrl);
		}
	});

	$("#formRecord").validate({
		rules : {
			recordEditDetail : {
				required : true
			}
		}
	});
	$("#formRecord").submit(
			function(e) {
				e.preventDefault();
				if ($("#formRecord").valid()) {
					db.transaction(insertOrUpdateRecord($("#selectCatalog")
							.val()), errorCB);
				}
			});
	$("#formCatalog").validate({
		rules : {
			catalogEditContent : {
				required : true,
				minlength : 1,
				maxlength : 1000
			}
		}
	});
	$("#formCatalog").submit(function(e) {
		e.preventDefault();
		if ($("#formCatalog").valid()) {
			catalogInfo = {
				title : $("#catalogEditContent").val(),
				id : $("#catalogEditId").val()
			};
			editCatalogProcess(catalogInfo);
			// signInAjax(mServerUrl);
		}
	});
}

function setupRecordListFromDb() {
	mRecordTable = $('#tableRecord').DataTable({
		"data" : mRecordDataSet,
		"paging" : false,
		"ordering" : false,
		"info" : false,
		"searching" : false,
		"order" : [ [ 0, "desc" ] ],
		"columns" : [ {
			"title" : "Id"
		}, {
			"title" : globalization_title
		}, {
			"title" : globalization_detail
		}, {
			"title" : globalization_begin_time
		}, {
			"title" : globalization_end_time
		}, {
			"title" : "catalogId"
		} ],
		"columnDefs" : [ {
			"targets" : [ 0 ],
			"visible" : false,
			"searchable" : false
		}, {
			"targets" : [ 1 ],
			"visible" : false,
		}, {
			"targets" : [ 4 ],
			"visible" : false,
		}, {
			"targets" : [ 5 ],
			"visible" : false,
		} ]
	});
	$('#tableRecord tbody').on('click', 'tr', function() {
		divRecordFormFill(mRecordTable.row(this).data());
		location.hash = 'divRecord';
	});
	$("#recordEditDelete").click(function() {
		deleteRecordWithId();
	})
}
function setupCatalogListFromDb() {
	mCatalogTable = $('#tableCatalog').DataTable({
		"data" : mCatalogDataSet,
		"paging" : false,
		"ordering" : false,
		"info" : false,
		"searching" : false,
		"order" : [ [ 2, "desc" ] ],
		"columns" : [ {
			"title" : "Id"
		}, {
			"title" : globalization_catalog
		}, {
			"title" : globalization_last_update
		} ],
		"columnDefs" : [ {
			"targets" : [ 0 ],
			"visible" : false,
			"searchable" : false
		} ]
	});
	$('#tableCatalog tbody').on('click', 'tr', function() {
		showViewRecord(mCatalogTable.row(this).data()[0])
	});
}

function editCatalogProcess(info) {
	if (info != null) {
		if (info.id > 0) {
			// update
			mLocalDbProcess = "updateCatalog";
		} else {
			// insert
			mLocalDbProcess = "insertCatalog";
			db.transaction(dbInsertCatalog(info), errorCB);
		}
	}
}

function insertOrUpdateRecord(titleClientId) {
	return function(tx) {
		tx.executeSql('select serverId from local_titles where clientId=?',
				[ titleClientId ], getTitleServerIdByClientIdTxCb);
	}
}

function getTitleServerIdByClientIdTxCb(tx, results) {
	if (results.rows.length > 0) {
		editRecord = {
			detail : $("#recordEditDetail").val(),
			beginTimeInputString : $("#recordEditBeginTime").val(),
			endTimeInputString : $("#recordEditEndTime").val(),
			clientId : $("#recordEditId").val(),
			titleClientId : $("#selectCatalog").val(),
			titleServerId : results.rows[0].serverId
		};
		editRecordProcess(editRecord);
	}
}

function dbInsertCatalog(info) {
	return function(tx) {
		tx
				.executeSql(
						'insert into local_titles (userId,content,lastUseTime) values (?,?,?)',
						[ mLocalParameters['userId'], info.title,
								(new Date()).valueOf() ], dbAfterInsertCatalog);
	}
}
function dbAfterInsertCatalog(tx, results) {
	tx.executeSql(
			'select clientId from local_titles order by clientId desc limit 1',
			[], dbGetLastCatalogClientId);
}
function dbGetLastCatalogClientId(tx, results) {
	if (results.rows.length > 0) {
		queryCatalogAndDisplay();
	} else {
		alert("no record");
	}
}

function editRecordProcess(editRecord) {
	if (editRecord != null) {
		if (editRecord.clientId > 0) {
			// update
			mLocalDbProcess = "updateRecord";
			db.transaction(dbUpdateSingleRecord(editRecord), errorCB);
		} else {
			// insert
			mLocalDbProcess = "insertRecord";
			db.transaction(dbInsertSingleRecord(editRecord), errorCB);
		}
	}
}

function initialDB() {
	mLocalDbProcess = "Initial DB";
	db.transaction(populateDB, errorCB, successCB);
}
/**
 * create table
 */
function populateDB(tx) {
	// tx.executeSql('DROP TABLE IF EXISTS local_system_parameters');
	tx
			.executeSql('CREATE TABLE IF NOT EXISTS local_system_parameters (title text primary key, detail text)');
	tx.executeSql('DROP TABLE IF EXISTS local_records');
	tx.executeSql('CREATE TABLE IF NOT EXISTS local_records ('
			+ 'clientId integer primary key,' + 'userId text,'
			+ 'serverId text UNIQUE,' + 'title text not null,detail text,'
			+ 'beginTime integer default 0,' + 'endTime integer default 0,'
			+ 'state integer default 0,'
			+ 'serverUpdateTime integer default 0,'
			+ 'modifyStatus integer default 1 ,' + 'titleClientId integer ,'
			+ 'titleServerId text )');
	// tx.executeSql('DROP TABLE IF EXISTS local_titles');
	tx.executeSql('CREATE TABLE IF NOT EXISTS local_titles ('
			+ 'clientId integer primary key,' + 'userId text,'
			+ 'serverId text UNIQUE,' + 'content text not null,'
			+ 'lastUseTime integer default 0,'
			+ 'serverUpdateTime integer default 0,'
			+ 'modifyStatus integer default 1 )');
	checkParametersForInitial(tx);
}
function checkParametersForInitial(tx) {
	mLocalDbProcess = "Get initial parameter";
	tx.executeSql("SELECT title,detail from local_system_parameters ;", [],
			callbackInitialParameters, errorCB);
}
// Display the results
function callbackInitialParameters(tx, results) {
	var len = results.rows.length;
	if (len == 0) {
		// enter register or local use
		divControl("#divSignUp");
	} else {
		for (var i = 0; i < len; i++) { // loop as many times as there are row
			// results
			mLocalParameters[results.rows.item(i).title] = results.rows.item(i).detail;
		}
		// list record
		databaseStatus = "exist";
		// divRecordFormNew();
		// queryRecordAndDisplay();
		queryCatalogAndDisplay();
	}
}
function divControl() {
	var i = 0, numargs = arguments.length;
	// close all div
	var argArray = arguments;
	divArray.forEach(function(elem, index, arr) {
		elem.hide();
		// you can optimize here from last index, if arguments is sorted .
		for (i = 0; i < numargs; i++) {
			// if (elem.selector == arguments[i].selector) {
			if (elem.selector == argArray[i]) {
				elem.show();
				break;
			}
		}
	});
}
function divRecordFormNew() {
	$("#recordEditButtonGroup").hide();
	$("#recordEditTimePicker").hide();
	$("#recordEditAddNew").show();
	$("#recordEditId").val(null);
	$("#recordEditDetail").val(null);
	$(".form_datetime").datetimepicker({
		format : 'yyyy-mm-dd hh:ii',
		autoclose : 1,
		initialDate : new Date()
	});
}
function queryRecordAndDisplay(catalogId) {
	divControl("#divMenu", "#divRecord", "#divDisplayRecordList",
			"#divMenuAfterSignIn");
	mLocalDbProcess = "queryRecordAndDisplay";
	db.transaction(dbQueryRecord(catalogId), errorCB);
}
function queryCatalogAndDisplay() {
	divControl("#divMenu", "#divCatalogForm", "#divCatalogList",
			"#divMenuAfterSignIn");
	mLocalDbProcess = "queryCatalogAndDisplay";
	db.transaction(dbQueryCatalog, errorCB);
}
function dbQueryRecord(catalogId) {
	return function(tx) {
		if (catalogId != null && catalogId > 0) {
			tx
					.executeSql(
							"SELECT clientId,serverId,title,detail,serverUpdateTime,modifyStatus,beginTime,"
									+ " endTime,titleClientId "
									+ " from local_records where userId=? "
									+ " and state<>-1 and titleClientId=? order by beginTime desc limit 0,20;",
							[ mLocalParameters['userId'], catalogId ],
							refreshRecordListView, errorCB);
		} else {
			tx
					.executeSql(
							"SELECT clientId,serverId,title,detail,serverUpdateTime,modifyStatus,beginTime,"
									+ " endTime,titleClientId "
									+ " from local_records where userId=? "
									+ " and state<>-1 order by beginTime desc limit 0,20;",
							[ mLocalParameters['userId'] ],
							refreshRecordListView, errorCB);
		}

	}
}
// Display the results
function refreshRecordListView(tx, results) {
	var mRow = [];
	mRecordDataSet = [];
	var len = results.rows.length;
	// alert("results.rows.length: " + results.rows.length);
	for (var i = 0; i < len; i++) { // loop as many times as there are row
		// results
		// mRecordDataSet[i][0] = results.rows.item(i).title;
		var mRow = [
				results.rows.item(i).clientId,
				results.rows.item(i).title,
				results.rows.item(i).detail,
				new Date(results.rows.item(i).beginTime)
						.Format("yyyy-MM-dd hh:mm"),
				results.rows.item(i).endTime == 0 ? "" : (new Date(results.rows
						.item(i).endTime).Format("yyyy-MM-dd hh:mm")),
				results.rows.item(i).titleClientId ];
		mRecordDataSet[i] = mRow;
	}

	mRecordTable.clear();
	mRecordTable.rows.add(mRecordDataSet);
	mRecordTable.draw();

	var syncThread = new syncServer();
}
function dbQueryCatalog(tx) {
	tx.executeSql("SELECT clientId,serverId,content,lastUseTime "
			+ " from local_titles where userId=? "
			+ " order by lastUseTime desc ;", [ mLocalParameters['userId'] ],
			refreshCatalogListView, errorCB);
}
// Display the catalog
function refreshCatalogListView(tx, results) {
	var mRow = [];
	mCatalogDataSet = [];
	var len = results.rows.length;
	$('#selectCatalog').find('option').remove()
	// alert("results.rows.length: " + results.rows.length);
	for (var i = 0; i < len; i++) { // loop as many times as there are row
		// results
		// mRecordDataSet[i][0] = results.rows.item(i).title;
		var mRow = [
				results.rows.item(i).clientId,
				results.rows.item(i).content,
				new Date(results.rows.item(i).lastUseTime)
						.Format("yyyy-MM-dd hh:mm") ];
		mCatalogDataSet[i] = mRow;
		$("#selectCatalog").append(
				"<option value='" + results.rows.item(i).clientId + "'>"
						+ results.rows.item(i).content + "</option>");
	}

	mCatalogTable.clear();
	mCatalogTable.rows.add(mCatalogDataSet);
	mCatalogTable.draw();

	// var syncThread = new syncRecordServer();
}
function convertDateStringToLong(inputString) {
	if (isNaN((new Date(inputString)).valueOf())) {
		return (new Date()).valueOf();
	} else {
		return (new Date(inputString).valueOf());
	}
}

// update record to local
function dbUpdateSingleRecord(editRecord) {
	return function(tx) {
		var recordBeginTimeLong = convertDateStringToLong(editRecord.beginTimeInputString);
		var recordEndTimeLong = convertDateStringToLong(editRecord.endTimeInputString);
		tx
				.executeSql(
						"update local_records set title = ? ,detail = ? ,beginTime = ? ,endTime=?"
								+ " ,modifyStatus=1,titleClientId=?,titleServerId=? where clientId=?; ",
						[ editRecord.title, editRecord.detail,
								recordBeginTimeLong, recordEndTimeLong,
								editRecord.titleClientId,
								editRecord.titleServerId, editRecord.clientId ]);
		showViewRecord(editRecord.titleCatalogId);
	}
}
function showViewRecord(catalogId) {
	queryRecordAndDisplay(catalogId);
	$("#selectCatalog").val(catalogId);
	divRecordFormNew();
}
/**
 * insert record to local
 */
function dbInsertSingleRecord(editRecord) {
	return function(tx) {
		var recordBeginTimeLong = convertDateStringToLong(editRecord.beginTimeInputString);
		tx
				.executeSql(
						"insert into local_records (userId,title,detail,beginTime,titleClientId,titleServerId) values (?,?,?,?,?,?); ",
						[ mLocalParameters['userId'], editRecord.title,
								editRecord.detail, recordBeginTimeLong,
								editRecord.titleClientId,
								editRecord.titleServerId ]);
		showViewRecord(editRecord.titleClientId);
	}
}

function clearLocalDataForSignOut() {
	db.transaction(dbClearLocalDataForSignOut, errorCB);
	databaseStatus = "empty";
	divControl("#divSignUp");
}

function dbClearLocalDataForSignOut(tx) {
	tx.executeSql('delete from local_system_parameters;');
}

// Transaction error callback
function errorCB(err) {
	alert("errorCB:" + err.code + " as:" + mLocalDbProcess);
	console.log("Error processing SQL: " + err.code + " : " + err.message);
}
// Success callback
function successCB() {
}

function ajaxGetNotSuccessMsg(msg) {
	console.log("ajaxGetNotSuccessMsg:" + msg.status + "-" + msg.msg);
	alert("ajaxGetNotSuccessMsg:" + msg.status + "-" + msg.msg);
}

function ajaxNetworkError(XMLHttpRequest, textStatus, errorThrown) {
	// alert("ajaxNetworkError:" + XMLHttpRequest.status + "-" +
	// XMLHttpRequest.readyState + "-" + textStatus);
	console.log("ajaxNetworkError:" + XMLHttpRequest.status + "-"
			+ XMLHttpRequest.readyState + "-" + textStatus);
}
function deleteRecordWithId() {
	mLocalDbProcess = "deleteRecord";
	db.transaction(dbDeleteSingleRecord, errorCB);
}
function dbDeleteSingleRecord(tx) {
	tx
			.executeSql(
					"update local_records set state = -1 ,modifyStatus=1 where clientId = ?; ",
					[ $("#recordEditId").val() ]);
	showViewRecord();
}

function divRecordFormFill(row) {
	if (row == null) {
	} else {
		$("#recordEditDetail").val(row[2]);
		$("#recordEditId").val(row[0]);
		$("#recordEditBeginTime").val(row[3]);
		if (row[4] == "") {
			$("#recordEditEndTime").val(new Date().Format("yyyy-MM-dd hh:mm"));
		} else {
			$("#recordEditEndTime").val(row[4]);
		}
		$("#selectCatalog").val(row[5]);
		$("#recordEditBeginTime").show();
		$("#recordEditEndTime").show();
		$("#recordEditButtonGroup").show();
		$("#recordEditTimePicker").show();
		$("#recordEditAddNew").hide();
	}
}

function signInAjax(serverUrl) {
	var oriData = {
		userName : $("#signInUserName").val(),
		password : $("#signInPassword").val()
	};
	$.ajax({
		type : "post",
		url : serverUrl + "sign-in.jsp",
		async : false,
		data : JSON.stringify(oriData),
		dataType : "json",
		success : function(msg) {
			if (msg.status == "success") {
				if (databaseStatus == "empty") {
					signInOrUpSuccess(msg, $("#signInUserName").val());
				} else {
					//
				}
			} else {
				ajaxGetNotSuccessMsg(msg);
			}
		},
		error : ajaxNetworkError
	});
}
function signUpAjax(serverUrl) {
	var oriData = {
		userName : $("#signUpUserName").val(),
		password : $("#signUpPassword").val()
	};
	$.ajax({
		type : "post",
		url : serverUrl + "sign-up.jsp",
		async : false,
		data : JSON.stringify(oriData),
		dataType : "json",
		success : function(msg) {
			if (msg.status == "success") {
				if (databaseStatus == "empty") {
					signInOrUpSuccess(msg, $("#signUpUserName").val());
				} else {
					//
				}
			} else {
				ajaxGetNotSuccessMsg(msg);
			}
		},
		error : ajaxNetworkError
	});
}

function signInOrUpSuccess(msg, password) {
	mJsonMsg = msg;
	mLocalParameters['userId'] = msg.data.userId;
	// insert account to local database
	mLocalDbProcess = "insertLocalUserAccout";
	db.transaction(dbInsertAccountInfo(msg.data.userName, password), errorCB);
}

function initialButton() {
	$("#signUpJumpToSignIn").click(function() {
		// check form data
		divControl("#divSignIn");
	})
}

// insert account info to local
function dbInsertAccountInfo(userName, password) {
	return function(tx) {
		// ,$("#signUpUserName").val()
		tx
				.executeSql(
						'insert into local_system_parameters (title,detail) values (?,?)',
						[ "userName", userName ]);
		tx
				.executeSql(
						'insert into local_system_parameters (title,detail) values (?,?)',
						[ "userId", mJsonMsg.data.userId ]);
		tx
				.executeSql(
						'insert into local_system_parameters (title,detail) values (?,?)',
						[ "passwordEncrypted", MD5(password) ]);
		mLocalParameters['userName'] = userName;
		mLocalParameters['passwordEncrypted'] = MD5(password);
		queryRecordAndDisplay();
	}
}

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

		procServerIdFromServer("local_titles");
	}

}
function syncLocalToServer(tableName) {
	db.transaction(dbLastSyncTime(tableName), errorCB);
}

function dbLastSyncTime(tableName) {
	return function(tx) {
		mLocalDbProcess = "dbLastSyncTime";
		tx.executeSql("Select serverUpdateTime from " + tableName
				+ " where userId=? order by serverUpdateTime desc limit 1 ;",
				[ mLocalParameters['userId'] ], handlerLastSyncTime(tableName),
				errorCB);
	}

}
function handlerLastSyncTime(tableName) {
	return function(tx, results) {
		if (results.rows.length > 0) {
			if (results.rows.item(0).serverUpdateTime > 0) {
				withInputGetNeedSyncRecords(results.rows.item(0).serverUpdateTime,tableName);
			} else {
				withInputGetNeedSyncRecords(0,tableName);
			}
		} else {
			withInputGetNeedSyncRecords(0,tableName);
		}
	}
}
function withInputGetNeedSyncRecords(lastServerTime,tableName) {
	db.transaction(withInputDbGetNeedSyncRecords(lastServerTime,tableName), errorCB);
}

function withInputDbGetNeedSyncRecords(lastServerTime,tableName) {
	return function(tx) {
		mLocalDbProcess = "dbGetNeedSyncRecords";
		switch(tableName){
		case "local_records":
			tx
			.executeSql(
					"Select serverId,title,detail,beginTime,endTime,state,"
							+ " serverUpdateTime,titleServerId "
							+ " from local_records where userId=? "
							+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
					[ mLocalParameters['userId'], LIMIT_UPDATE_BATCH_SIZE ],
					withInputHandlerSyncRecordToServer(lastServerTime),
					errorCB);
			break;
		case "local_titles":
			tx
			.executeSql(
					"Select serverId,content,state,"
							+ " serverUpdateTime "
							+ " from local_titles where userId=? "
							+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
					[ mLocalParameters['userId'], LIMIT_UPDATE_BATCH_SIZE ],
					withInputHandlerSyncRecordToServer(lastServerTime),
					errorCB);
			break;
		}
		
	}
}

function withInputHandlerSyncRecordToServer(lastServerTime) {
	return function(tx, results) {
		var syncData = {
			records : [],
			lastSyncServerTimeFromClient : lastServerTime,
			clientParameters : mLocalParameters
		};
		for (var i = 0; i < results.rows.length; i++) {
			var row = {};
			console.log(results.rows.item(i).title);
			row.serverId = results.rows.item(i).serverId;
			row.title = results.rows.item(i).title;
			row.detail = results.rows.item(i).detail;
			row.beginTime = results.rows.item(i).beginTime;
			row.endTime = results.rows.item(i).endTime;
			row.state = results.rows.item(i).state;
			row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
			row.titleServerId = results.rows.item(i).titleServerId;
			syncData.records.push(row);
		}
		syncRecordAjax(mServerUrl, receiveSyncRecordRspAjax,
				ajaxGetNotSuccessMsg, ajaxNetworkError, syncData);
	}
}

function syncRecordAjax(serverUrl, successAjaxProc, errorRsp, ajaxNetworkError,
		syncData) {
	$.ajax({
		type : "post",
		url : serverUrl + "sync-record.jsp",
		async : false,
		data : JSON.stringify(syncData),
		dataType : "json",
		success : function(msg) {
			if (msg.status == "success") {
				successAjaxProc(msg);
			} else {
				errorRsp(msg);
			}
		},
		error : ajaxNetworkError
	});
}

function procServerIdFromServer(tableName) {
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
						ajaxGetNotSuccessMsg, ajaxNetworkError, needSyncCount,
						tableName);
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
function receiveSyncRecordRspAjax(msg) {
	for (var i = 0; i < msg.data.length; i++) {
		if (msg.data[i].serverId != null && msg.data[i].serverId != '') {
			db.transaction(dbProcReceivedRecord(msg.data[i]), errorCB);
		}
	}
	mSyncStatus = 'stop';
}
function dbProcReceivedRecord(receiveRecord) {
	return function(tx) {
		tx
				.executeSql(
						"SELECT 1 from `local_records` where serverId=? and userId=? ;",
						[ receiveRecord.serverId, mLocalParameters['userId'] ],
						updateOrInsertReceivedRecord(receiveRecord), errorCB);
	}
}
function updateOrInsertReceivedRecord(receiveRecord) {
	return function(tx, results) {
		if (results.rows.length > 0) {
			tx
					.executeSql(
							"update local_records set title = ? ,detail = ? ,beginTime = ? ,endTime=?,"
									+ "state=? ,serverUpdateTime=?,modifyStatus=0,"
									+ "titleClientId=?,titleServerId=? where serverId=?; ",
							[ receiveRecord.title, receiveRecord.detail,
									receiveRecord.beginTime,
									receiveRecord.endTime, receiveRecord.state,
									receiveRecord.serverUpdateTime,
									receiveRecord.titleClientId,
									receiveRecord.titleServerId,
									receiveRecord.serverId ]);
		} else {
			tx
					.executeSql(
							"insert into local_records (userId,title,detail,beginTime,endTime,state,"
									+ "serverUpdateTime,modifyStatus,serverId,titleClientId,"
									+ "titleServerId) values (?,?,?,?,?,?,?,0,?,?,?); ",
							[ mLocalParameters['userId'], receiveRecord.title,
									receiveRecord.detail,
									receiveRecord.beginTime,
									receiveRecord.endTime, receiveRecord.state,
									receiveRecord.serverUpdateTime,
									receiveRecord.serverId,
									receiveRecord.titleClientId,
									receiveRecord.titleServerId ]);
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
			// getTransaction(updateLocalServerId, results, currentServerId);
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
			tx.executeSql("update " + tableName
					+ " set serverId=? where clientId = ?; ",
					[ serverId.toString(),
							resultOfClientID.rows.item(i).clientId ]);
			serverId = serverId.add(1);
		}
		syncLocalToServer(tableName);
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