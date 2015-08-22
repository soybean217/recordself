package com.recordself.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.dbutils.QueryRunner;
import org.apache.commons.dbutils.handlers.BeanListHandler;
import org.apache.commons.dbutils.handlers.ColumnListHandler;
import org.apache.log4j.Logger;
import org.common.util.Base;
import org.common.util.ConfigManager;
import org.common.util.ConnectionService;
import org.common.util.GenerateIdService;

import com.recordself.entity.Record;
import com.recordself.entity.User;
import com.recordself.json.protocol.ReceivedLocalRecords;

public class RecordService {

  private final static Logger LOG = Logger.getLogger("Demo.class");
  private ReceivedLocalRecords receivedLocalRecords;
  private User user;
  public final long mCurrent = System.currentTimeMillis();
  private Map<String, Record> mReceivedMap = new HashMap<String, Record>();
  private static final String QUERY_COLUMN = " serverId,serverUpdateTime,title,detail,"
      + "beginTime,endTime,state,titleServerId ";

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public List<Record> procReceive() {
    List<Record> result = new ArrayList<Record>();

    Map<String, Record> sendClientUpdateRecords = new HashMap<String, Record>();
    List<Record> receiveWithServerIdList = new ArrayList<Record>();
    queryRecordToClient(sendClientUpdateRecords);
    for (Record record : receivedLocalRecords.getRecords()) {
      if (!(record.getServerId() != null && record.getServerId().length() > 5)) {
        LOG.error("no server id . user id :" + user.getUserId());
      } else {
        // server Id exist
        receiveWithServerIdList.add(record);
        mReceivedMap.put(record.getServerId(), record);
      }
    }
    if (receiveWithServerIdList.size() > 0) {
      // check server id
      procReceiveToDb(receiveWithServerIdList, sendClientUpdateRecords);
    }

    result.addAll(sendClientUpdateRecords.values());
    return result;
  }

  private List<Record> getRecordsDbMatchClient(List<Record> receiveWithServerIdList) {
    List<Record> results = null;
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      QueryRunner queryRunner = new QueryRunner(true);
      StringBuilder sql = new StringBuilder();
      // perhaps thread issue , think about lock
      for (Record record : receiveWithServerIdList) {
        if (Base.isNumeric(record.getServerId()) && Long.parseLong(record.getServerId()) > 0) {
          sql.append("union all SELECT " + QUERY_COLUMN + " FROM server_records where serverId = "
              + record.getServerId() + " ");
        } else {
          LOG.error(record.getServerId() + ":not correct . user id :" + user.getUserId());
        }
      }
      sql.delete(0, 9);
      results = (List) queryRunner.query(con, sql.toString(), new BeanListHandler(Record.class));
    } catch (Exception e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } finally {
      if (con != null) {
        try {
          con.close();
        } catch (SQLException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      }
    }
    return results;
  }

  private void procReceiveToDb(List<Record> receiveWithServerIdList, Map<String, Record> sendClientUpdateRecords) {
    List<Record> matchedFromDb = getRecordsDbMatchClient(receiveWithServerIdList);

    // List<Long> results = (List<Long>) queryRunner.query(con, sql.toString(),
    // new ColumnListHandler());
    List<Object[]> updateArray = new ArrayList<Object[]>();
    List<Object[]> insertArray = new ArrayList<Object[]>();

    identifyRecords(matchedFromDb, updateArray, insertArray, sendClientUpdateRecords);

    if (updateArray.size() > 0) {
      updateServerDb(updateArray);
    }

    if (mReceivedMap.size() > 0) {
      batchInsertNewRecords(sendClientUpdateRecords);
    }

  }

  private void updateServerDb(List<Object[]> updateArray) {
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();

      QueryRunner queryRunner = new QueryRunner(true);
      Object[][] updateAll = new Object[updateArray.size()][];
      for (int i = 0; i < updateArray.size(); i++) {
        updateAll[i] = updateArray.get(i);
      }
      queryRunner
          .batch(
              con,
              " update server_records set title=?,detail=?,beginTime=?,endTime=?,state=?,serverUpdateTime=?,titleServerId=? where serverId=? ;",
              updateAll);
    } catch (Exception e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } finally {
      if (con != null) {
        try {
          con.close();
        } catch (SQLException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      }
    }
  }

  private void queryRecordToClient(Map<String, Record> sendClientUpdateRecords) {
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      // sync all is not good idea , just demo
      String sql = "select " + QUERY_COLUMN + " from server_records where userId=? and  serverUpdateTime >?";
      QueryRunner queryRunner = new QueryRunner(true);
      List<Record> results = (List) queryRunner.query(con, sql, new BeanListHandler(Record.class), user.getUserId(),
          receivedLocalRecords.getLastSyncServerTimeFromClient());
      for (Record cell : results) {
        sendClientUpdateRecords.put(cell.getServerId(), cell);
      }
    } catch (Exception e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } finally {
      if (con != null) {
        try {
          con.close();
        } catch (SQLException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      }
    }
  }

  private void identifyRecords(List<Record> matchedFromDb, List<Object[]> updateArray, List<Object[]> insertArray,
      Map<String, Record> sendClientUpdateRecords) {
    for (Record cell : matchedFromDb) {
      if (mReceivedMap.containsKey(cell.getServerId())) {
        if (mReceivedMap.get(cell.getServerId()).getServerUpdateTime().equals(cell.getServerUpdateTime())) {
          Object[] currentSql = new Object[] { mReceivedMap.get(cell.getServerId()).getTitle(),
              mReceivedMap.get(cell.getServerId()).getDetail(), mReceivedMap.get(cell.getServerId()).getBeginTime(),
              mReceivedMap.get(cell.getServerId()).getEndTime(), mReceivedMap.get(cell.getServerId()).getState(),
              mCurrent, mReceivedMap.get(cell.getServerId()).getTitleServerId(), cell.getServerId() };
          updateArray.add(currentSql);
          mReceivedMap.get(cell.getServerId()).setServerUpdateTime(mCurrent);
          sendClientUpdateRecords.put(cell.getServerId(), mReceivedMap.get(cell.getServerId()));
        } else {
          sendClientUpdateRecords.put(cell.getServerId(), cell);
        }
        mReceivedMap.remove(cell.getServerId());
      } else {
        sendClientUpdateRecords.put(cell.getServerId(), cell);
      }
      // forQueryMap.get(cell).setServerUpdateTime(mCurrent);
    }
  }

  private void batchInsertNewRecords(Map<String, Record> sendClientUpdateRecords) {
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      QueryRunner queryRunner = new QueryRunner(true);
      Object[][] insertAll = new Object[mReceivedMap.size()][];
      int i = 0;
      for (Record cell : mReceivedMap.values()) {
        Object[] currentForSql = new Object[] { cell.getServerId(), user.getUserId(), cell.getTitle(),
            cell.getDetail(), cell.getBeginTime(), cell.getEndTime(), cell.getState(), mCurrent,cell.getTitleServerId() };
        insertAll[i] = currentForSql;
        i++;
        cell.setServerUpdateTime(mCurrent);
        sendClientUpdateRecords.put(cell.getServerId(), cell);
      }
      queryRunner.batch(con, "insert into server_records (serverId,userId,title,detail,beginTime,endTime,state,"
          + "serverUpdateTime,titleClientId) values (?,?,?,?,?,?,?,?,?)", insertAll);
    } catch (Exception e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } finally {
      if (con != null) {
        try {
          con.close();
        } catch (SQLException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
        }
      }
    }
  }

  public ReceivedLocalRecords getReceivedLocalRecords() {
    return receivedLocalRecords;
  }

  public void setReceivedLocalRecords(ReceivedLocalRecords receivedLocalRecords) {
    this.receivedLocalRecords = receivedLocalRecords;
  }

}
