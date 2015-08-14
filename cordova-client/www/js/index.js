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
			recordEditTitle : {
				required : true
			}
		}
	});
	$("#formRecord").submit(function(e) {
		e.preventDefault();
		if ($("#formRecord").valid()) {
			mEditRecord = {
				title : $("#recordEditTitle").val(),
				detail : $("#recordEditDetail").val(),
				beginTimeInputString : $("#recordEditBeginTime").val(),
				endTimeInputString : $("#recordEditEndTime").val(),
				clientId : $("#recordEditId").val()
			};
			editRecordProcess();
		}
	});
	$("#formCatalog").validate({
		rules : {
			catalogEditTitle : {
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
				title : $("#catalogEditTitle").val(),
				id : $("#catalogEditId").val()
			};
			editCatalogProcess(catalogInfo);
			// signInAjax(mServerUrl);
		}
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
	if (results.rows.length>0){
		alert(results.rows.item(0).clientId);
	}
	else{
		alert("no record");
	}
}

function editRecordProcess() {
	if (mEditRecord != null) {
		if (mEditRecord.clientId > 0) {
			// update
			mLocalDbProcess = "updateRecord";
			db.transaction(dbUpdateSingleRecord, errorCB);
		} else {
			// insert
			mLocalDbProcess = "insertRecord";
			db.transaction(dbInsertSingleRecord, errorCB);
		}
	}
}
function divDisplayRecordListFromDb() {
	mTable = $('#tableRecord').DataTable({
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
		} ],
		"columnDefs" : [ {
			"targets" : [ 0 ],
			"visible" : false,
			"searchable" : false
		}, {
			"targets" : [ 2 ],
			"visible" : false,
		}, {
			"targets" : [ 4 ],
			"visible" : false,
		} ]
	});
	$('#tableRecord tbody').on('click', 'tr', function() {
		divRecordFormFill(mTable.row(this).data());
		location.hash = 'divRecord';
	});
	$("#recordEditDelete").click(function() {
		deleteRecordWithId();
	})
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
	// tx.executeSql('DROP TABLE IF EXISTS local_records');
	tx.executeSql('CREATE TABLE IF NOT EXISTS local_records ('
			+ 'clientId integer primary key,' + 'userId text,'
			+ 'serverId text UNIQUE,' + 'title text not null,detail text,'
			+ 'beginTime integer default 0,' + 'endTime integer default 0,'
			+ 'state integer default 0,'
			+ 'serverUpdateTime integer default 0,'
			+ 'modifyStatus integer default 1 )');
	// tx.executeSql('DROP TABLE IF EXISTS local_records');
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
		pageTitleList();
		// queryRecordAndDisplay();
	}
}
function pageTitleList() {
	divControl("#divMenu", "#divTitleForm", "#divTitleList");
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
	$("#recordEditTitle").val(null);
	$("#recordEditId").val(null);
	$("#recordEditDetail").val(null);
	$(".form_datetime").datetimepicker({
		format : 'yyyy-mm-dd hh:ii',
		autoclose : 1,
		initialDate : new Date()
	});
}
function queryRecordAndDisplay() {
	divControl("#divRecord", "#divDisplayRecordList", "#divMenuAfterSignIn");
	mLocalDbProcess = "queryRecordAndDisplay";
	db.transaction(dbQueryRecord, errorCB);
}

// form the query
function dbQueryRecord(tx) {
	tx
			.executeSql(
					"SELECT clientId,serverId,title,detail,serverUpdateTime,modifyStatus,beginTime,endTime "
							+ " from local_records where userId=? "
							+ " and state<>-1 order by beginTime desc limit 0,20;",
					[ mLocalParameters['userId'] ], refreshDataView, errorCB);
}

// Display the results
function refreshDataView(tx, results) {
	mDisplayData = {
		records : []
	};
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
						.item(i).endTime).Format("yyyy-MM-dd hh:mm")) ];
		mRecordDataSet[i] = mRow;
		var row = {};
		row.clientId = results.rows.item(i).clientId;
		row.serverId = results.rows.item(i).serverId;
		row.title = results.rows.item(i).title;
		row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
		mDisplayData.records.push(row);
	}
	// mTable.fnClearTable();
	// mTable.fnAddData(mRecordDataSet);
	// mTable.fnUpdate();
	// mTable.rows.add(mRecordDataSet).draw();
	// mTable.fnDraw();

	mTable.clear();
	mTable.rows.add(mRecordDataSet);
	mTable.draw();

	var syncThread = new syncRecordServer();
}
function convertDateStringToLong(inputString) {
	if (isNaN((new Date(inputString)).valueOf())) {
		return (new Date()).valueOf();
	} else {
		return (new Date(inputString).valueOf());
	}
}

// update record to local
function dbUpdateSingleRecord(tx) {
	var recordBeginTimeLong = convertDateStringToLong(mEditRecord.beginTimeInputString);
	var recordEndTimeLong = convertDateStringToLong(mEditRecord.endTimeInputString);
	tx
			.executeSql(
					"update local_records set title = ? ,detail = ? ,beginTime = ? ,endTime=? ,modifyStatus=1 where clientId=?; ",
					[ mEditRecord.title, mEditRecord.detail,
							recordBeginTimeLong, recordEndTimeLong,
							mEditRecord.clientId ]);
	queryRecordAndDisplay();
	divRecordFormNew();
}
/**
 * insert record to local
 */
function dbInsertSingleRecord(tx) {
	var recordBeginTimeLong = convertDateStringToLong(mEditRecord.beginTimeInputString);
	tx
			.executeSql(
					"insert into local_records (userId,title,detail,beginTime) values (?,?,?,?); ",
					[ mLocalParameters['userId'], mEditRecord.title,
							mEditRecord.detail, recordBeginTimeLong ]);
	queryRecordAndDisplay();
	divRecordFormNew();
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

var syncRecordServer = function() {
	console.log("mSyncStatus:" + mSyncStatus + " "
			+ ((new Date()).valueOf() - mLastSyncTime));
	if (mSyncStatus == 'stop'
			|| ((new Date()).valueOf() - mLastSyncTime > mSyncTimeout)) {
		console.log("begin sync");
		mSyncStatus = 'work';
		mLastSyncTime = (new Date()).valueOf();
		var needSyncCount = 0;
		var currentServerId = bigInt(0);

		procServerIdFromServer();
		// syncLocalToServer();
	}

	function syncLocalToServer() {
		db.transaction(dbLastSyncTime, errorCB);
	}

	function dbLastSyncTime(tx) {
		mLocalDbProcess = "dbLastSyncTime";
		tx
				.executeSql(
						"Select serverUpdateTime from local_records where userId=? order by serverUpdateTime desc limit 1 ;",
						[ mLocalParameters['userId'] ], handlerLastSyncTime,
						errorCB);
	}

	function handlerLastSyncTime(tx, results) {

		if (results.rows.length > 0) {
			if (results.rows.item(0).serverUpdateTime > 0) {
				withInputGetNeedSyncRecords(results.rows.item(0).serverUpdateTime);
			} else {
				withInputGetNeedSyncRecords(0);
			}
		} else {
			withInputGetNeedSyncRecords(0);
		}
	}

	function withInputGetNeedSyncRecords(lastServerTime) {
		db.transaction(withInputDbGetNeedSyncRecords(lastServerTime), errorCB);
	}

	function withInputDbGetNeedSyncRecords(lastServerTime) {
		return function dbGetNeedSyncRecords(tx) {
			mLocalDbProcess = "dbGetNeedSyncRecords";
			tx
					.executeSql(
							"Select serverId,title,detail,beginTime,endTime,state,serverUpdateTime "
									+ " from local_records where userId=? "
									+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
							[ mLocalParameters['userId'],
									LIMIT_UPDATE_BATCH_SIZE ],
							withInputHandlerSyncRecordToServer(lastServerTime),
							errorCB);
		}
	}

	function withInputHandlerSyncRecordToServer(lastServerTime) {
		return function handlerSyncRecordToServer(tx, results) {
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
				syncData.records.push(row);
			}
			syncRecordAjax(mServerUrl, receiveSyncRecordRspAjax,
					ajaxGetNotSuccessMsg, ajaxNetworkError, syncData);
		}
	}

	function syncRecordAjax(serverUrl, successAjaxProc, errorRsp,
			ajaxNetworkError, syncData) {
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

	function procServerIdFromServer() {
		db.transaction(dbGetCountNeedServerId, errorCB);
	}

	function dbGetCountNeedServerId(tx) {
		tx
				.executeSql(
						"SELECT count(clientId) as total from local_records where userId=? and serverId is null ;",
						[ mLocalParameters['userId'] ],
						handlerGetCountNeedServerId, errorCB);
	}

	function handlerGetCountNeedServerId(tx, results) {
		if (results.rows.length > 0) {
			if (results.rows.item(0).total > 0) {
				if (results.rows.item(0).total > LIMIT_UPDATE_BATCH_SIZE) {
					needSyncCount = LIMIT_UPDATE_BATCH_SIZE;
				} else {
					needSyncCount = results.rows.item(0).total;
				}
				getServerIdAjax(mServerUrl, receiveGetServerIdAjax,
						ajaxGetNotSuccessMsg, ajaxNetworkError, needSyncCount,
						"server_records");
			} else {
				// todo no result ;
				console
						.log("handlerGetCountNeedServerId:no record need get serverId .");
				syncLocalToServer();
			}
		} else {
			// todo no result ;
			console.log("error ! handlerGetCountNeedServerId");
		}
	}

	function receiveSyncRecordRspAjax(msg) {
		for (var i = 0; i < msg.data.length; i++) {
			if (msg.data[i].serverId.length > 1) {
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
							[ receiveRecord.serverId,
									mLocalParameters['userId'] ],
							updateOrInsertReceivedRecord(receiveRecord),
							errorCB);
		}
	}
	function updateOrInsertReceivedRecord(receiveRecord) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				tx
						.executeSql(
								"update local_records set title = ? ,detail = ? ,beginTime = ? ,endTime=?,"
										+ "state=? ,serverUpdateTime=?,modifyStatus=0 where serverId=?; ",
								[ receiveRecord.title, receiveRecord.detail,
										receiveRecord.beginTime,
										receiveRecord.endTime,
										receiveRecord.state,
										receiveRecord.serverUpdateTime,
										receiveRecord.serverId ]);
			} else {
				tx
						.executeSql(
								"insert into local_records (userId,title,detail,beginTime,endTime,state,serverUpdateTime,modifyStatus,serverId) values (?,?,?,?,?,?,?,0,?); ",
								[ mLocalParameters['userId'],
										receiveRecord.title,
										receiveRecord.detail,
										receiveRecord.beginTime,
										receiveRecord.endTime,
										receiveRecord.state,
										receiveRecord.serverUpdateTime,
										receiveRecord.serverId ]);
			}
		}
	}

	function receiveGetServerIdAjax(msg, count) {
		currentServerId = bigInt(msg.data);
		needSyncCount = count;
		if (currentServerId > 0) {
			db.transaction(dbProcRowNeedServerId, errorCB);
		}
	}

	function dbProcRowNeedServerId(tx) {
		tx
				.executeSql(
						"SELECT clientId from local_records where userId=? and serverId is null order by clientId limit ? ;",
						[ mLocalParameters['userId'], needSyncCount ],
						handlerUpdateClientServerId, errorCB);
	}
	function handlerUpdateClientServerId(tx, results) {
		if (results.rows.length > 0) {
			// getTransaction(iWork, results, currentServerId);
			db.transaction(iWork(results, currentServerId), errorCB)
			syncLocalToServer();
		} else {
			// todo no result ;
			console.log("handlerUpdateClientServerId: no rows .");
		}
	}

	function iWork(resultOfClientID, serverId) {
		return function(tx) {
			for (var i = 0; i < resultOfClientID.rows.length; i++) {
				tx
						.executeSql(
								"update local_records set serverId=? where clientId = ?; ",
								[ serverId.toString(),
										resultOfClientID.rows.item(i).clientId ]);
				serverId = serverId.add(1);
			}
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
					successGetServerIdAjaxProc(msg, needCount);
				} else {
					errorRsp(msg);
				}
			},
			error : ajaxNetworkError
		});
	}

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
	queryRecordAndDisplay();
	divRecordFormNew();
}

function divRecordFormFill(row) {
	if (row == null) {
	} else {
		$("#recordEditTitle").val(row[1]);
		$("#recordEditDetail").val(row[2]);
		$("#recordEditId").val(row[0]);
		$("#recordEditBeginTime").val(row[3]);
		if (row[4] == "") {
			$("#recordEditEndTime").val(new Date().Format("yyyy-MM-dd hh:mm"));
		} else {
			$("#recordEditEndTime").val(row[4]);
		}
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