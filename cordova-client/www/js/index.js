function formSignUpFormInitial() {
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
}
function divRecordFormInitial() {
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
			titleEdit : {
				required : true,
				minlength : 1,
				maxlength : 1000
			}
		}
	});
	$("#formCatalog").submit(function(e) {
		e.preventDefault();
		if ($("#formCatalog").valid()) {
			// signInAjax(mServerUrl);
		}
	});
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
create table
 */
function populateDB(tx) {
	//tx.executeSql('DROP TABLE IF EXISTS local_system_parameters');
	tx
			.executeSql('CREATE TABLE IF NOT EXISTS local_system_parameters (title text primary key, detail text)');
	//tx.executeSql('DROP TABLE IF EXISTS local_records');
	tx.executeSql('CREATE TABLE IF NOT EXISTS local_records ('
			+ 'clientId integer primary key,' + 'userId text,'
			+ 'serverId text UNIQUE,'
			+ 'title text not null,detail text,'
			+ 'beginTime integer default 0,'
			+ 'endTime integer default 0,' + 'state integer default 0,'
			+ 'serverUpdateTime integer default 0,'
			+ 'modifyStatus integer default 1 )');
	checkParametersForInitial(tx);
}
function checkParametersForInitial(tx) {
	mLocalDbProcess = "Get initial parameter";
	tx.executeSql("SELECT title,detail from local_system_parameters ;",
			[], callbackInitialParameters, errorCB);
}
// Display the results
function callbackInitialParameters(tx, results) {
	var len = results.rows.length;
	if (len == 0) {
		//enter register or local use
		divControl("#divSignUp");
	} else {
		for (var i = 0; i < len; i++) { // loop as many times as there are row results
			mLocalParameters[results.rows.item(i).title] = results.rows
					.item(i).detail;
		}
		//list record
		databaseStatus = "exist";
		//divRecordFormNew();
		//queryRecordAndDisplay();
		pageTitleList();
		//queryRecordAndDisplay();
	}
}
function pageTitleList(){
	divControl("#divMenu","#divTitleForm","#divTitleList");
}
function divControl() {
	var i = 0, numargs = arguments.length;
	//close all div
	var argArray = arguments;
	divArray.forEach(function(elem, index, arr) {
		elem.hide();
		//you can optimize here from last index, if arguments is sorted .
		for (i = 0; i < numargs; i++) {
			//					if (elem.selector == arguments[i].selector) {
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
	divControl("#divRecord", "#divDisplayRecordList",
			"#divMenuAfterSignIn");
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
					[ mLocalParameters['userId'] ], refreshDataView,
					errorCB);
}

// Display the results
function refreshDataView(tx, results) {
	mDisplayData = {
		records : []
	};
	var mRow = [];
	mRecordDataSet = [];
	var len = results.rows.length;
	//alert("results.rows.length: " + results.rows.length);
	for (var i = 0; i < len; i++) { // loop as many times as there are row results
		//			mRecordDataSet[i][0] = results.rows.item(i).title;
		var mRow = [
				results.rows.item(i).clientId,
				results.rows.item(i).title,
				results.rows.item(i).detail,
				new Date(results.rows.item(i).beginTime)
						.Format("yyyy-MM-dd hh:mm"),
				results.rows.item(i).endTime == 0 ? "" : (new Date(
						results.rows.item(i).endTime)
						.Format("yyyy-MM-dd hh:mm")) ];
		mRecordDataSet[i] = mRow;
		var row = {};
		row.clientId = results.rows.item(i).clientId;
		row.serverId = results.rows.item(i).serverId;
		row.title = results.rows.item(i).title;
		row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
		mDisplayData.records.push(row);
	}
	//mTable.fnClearTable();
	//mTable.fnAddData(mRecordDataSet);
	//mTable.fnUpdate();
	//mTable.rows.add(mRecordDataSet).draw();
	//mTable.fnDraw();

	mTable.clear();
	mTable.rows.add(mRecordDataSet);
	mTable.draw();

	var syncThread = new syncRecordServer();
}