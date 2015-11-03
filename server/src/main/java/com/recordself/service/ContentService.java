package com.recordself.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.dbutils.QueryRunner;
import org.apache.commons.dbutils.handlers.BeanListHandler;
import org.apache.log4j.Logger;
import org.common.util.Base;
import org.common.util.ConnectionService;

import com.recordself.entity.Content;
import com.recordself.entity.User;
import com.recordself.json.protocol.ReceivedLocalContents;

public class ContentService {

  private final static Logger LOG = Logger.getLogger("RecordService.class");
  private ReceivedLocalContents receivedLocalContents;
  private User user;
  public final long mCurrent = System.currentTimeMillis();
  private Map<String, Content> mReceivedMap = new HashMap<String, Content>();
  private static final String QUERY_COLUMN = " serverId,serverUpdateTime,content,contentType,"
      + "state ";

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public List<Content> procReceive() {
    List<Content> result = new ArrayList<Content>();

    Map<String, Content> sendClientUpdateRecords = new HashMap<String, Content>();
    List<Content> receiveWithServerIdList = new ArrayList<Content>();
    queryRecordToClient(sendClientUpdateRecords);
    for (Content record : receivedLocalContents.getDataRows()) {
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

  private List<Content> getRecordsDbMatchClient(List<Content> receiveWithServerIdList) {
    List<Content> results = null;
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      QueryRunner queryRunner = new QueryRunner(true);
      StringBuilder sql = new StringBuilder();
      // perhaps thread issue , think about lock
      for (Content record : receiveWithServerIdList) {
        if (Base.isNumeric(record.getServerId()) && Long.parseLong(record.getServerId()) > 0) {
          sql.append("union all SELECT " + QUERY_COLUMN + " FROM server_contents where serverId = "
              + record.getServerId() + " ");
        } else {
          LOG.error(record.getServerId() + ":not correct . user id :" + user.getUserId());
        }
      }
      sql.delete(0, 9);
      results = (List) queryRunner.query(con, sql.toString(), new BeanListHandler(Content.class));
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

  private void procReceiveToDb(List<Content> receiveWithServerIdList, Map<String, Content> sendClientUpdateRecords) {
    List<Content> matchedFromDb = getRecordsDbMatchClient(receiveWithServerIdList);

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
              " update server_contents set content=?,contentType=?,state=?,serverUpdateTime=? where serverId=? ;",
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

  private void queryRecordToClient(Map<String, Content> sendClientUpdateRecords) {
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      // sync all is not good idea , just demo
      String sql = "select " + QUERY_COLUMN + " from server_contents where userId=? and  serverUpdateTime >?";
      QueryRunner queryRunner = new QueryRunner(true);
      List<Content> results = (List) queryRunner.query(con, sql, new BeanListHandler(Content.class), user.getUserId(),
          receivedLocalContents.getLastSyncServerTimeFromClient());
      for (Content cell : results) {
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

  private void identifyRecords(List<Content> matchedFromDb, List<Object[]> updateArray, List<Object[]> insertArray,
      Map<String, Content> sendClientUpdateRecords) {
    for (Content cell : matchedFromDb) {
      if (mReceivedMap.containsKey(cell.getServerId())) {
        if (mReceivedMap.get(cell.getServerId()).getServerUpdateTime().equals(cell.getServerUpdateTime())) {
          Object[] currentSql = new Object[] { mReceivedMap.get(cell.getServerId()).getContent(),
              mReceivedMap.get(cell.getServerId()).getContentType(),  mReceivedMap.get(cell.getServerId()).getState(),
              mCurrent,  cell.getServerId() };
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

  private void batchInsertNewRecords(Map<String, Content> sendClientUpdateRecords) {
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      QueryRunner queryRunner = new QueryRunner(true);
      Object[][] insertAll = new Object[mReceivedMap.size()][];
      int i = 0;
      for (Content cell : mReceivedMap.values()) {
        Object[] currentForSql = new Object[] { cell.getServerId(), user.getUserId(), cell.getContent(),
            cell.getContentType(), cell.getState(), mCurrent };
        insertAll[i] = currentForSql;
        i++;
        cell.setServerUpdateTime(mCurrent);
        sendClientUpdateRecords.put(cell.getServerId(), cell);
      }
      queryRunner.batch(con, "insert into server_contents (serverId,userId,content,contentType,state,"
          + "serverUpdateTime) values (?,?,?,?,?,?)", insertAll);
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

  public ReceivedLocalContents getReceivedLocalRecords() {
    return receivedLocalContents;
  }

  public void setReceivedLocalRecords(ReceivedLocalContents receivedLocalContents) {
    this.receivedLocalContents = receivedLocalContents;
  }

}
