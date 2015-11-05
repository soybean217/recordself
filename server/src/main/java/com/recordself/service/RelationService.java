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

import com.recordself.entity.Relation;
import com.recordself.entity.User;
import com.recordself.json.protocol.ReceivedLocalRelations;

public class RelationService {

  private final static Logger LOG = Logger.getLogger("RelationService.class");
  private ReceivedLocalRelations receivedLocalRelations;
  private User user;
  public final long mCurrent = System.currentTimeMillis();
  private Map<String, Relation> mReceivedMap = new HashMap<String, Relation>();
  private static final String QUERY_COLUMN = " serverId,serverUpdateTime,idFrom,idTo,state ";

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public List<Relation> procReceive() {
    List<Relation> result = new ArrayList<Relation>();

    Map<String, Relation> sendClientUpdateRecords = new HashMap<String, Relation>();
    List<Relation> receiveWithServerIdList = new ArrayList<Relation>();
    queryRecordToClient(sendClientUpdateRecords);
    for (Relation record : receivedLocalRelations.getDataRows()) {
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

  private List<Relation> getRecordsDbMatchClient(List<Relation> receiveWithServerIdList) {
    List<Relation> results = null;
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      QueryRunner queryRunner = new QueryRunner(true);
      StringBuilder sql = new StringBuilder();
      // perhaps thread issue , think about lock
      for (Relation record : receiveWithServerIdList) {
        if (Base.isNumeric(record.getServerId()) && Long.parseLong(record.getServerId()) > 0) {
          sql.append("union all SELECT " + QUERY_COLUMN + " FROM server_contents where serverId = "
              + record.getServerId() + " ");
        } else {
          LOG.error(record.getServerId() + ":not correct . user id :" + user.getUserId());
        }
      }
      sql.delete(0, 9);
      results = (List) queryRunner.query(con, sql.toString(), new BeanListHandler(Relation.class));
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

  private void procReceiveToDb(List<Relation> receiveWithServerIdList, Map<String, Relation> sendClientUpdateRecords) {
    List<Relation> matchedFromDb = getRecordsDbMatchClient(receiveWithServerIdList);

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
              " update server_contents set Relation=?,contentType=?,state=?,serverUpdateTime=? where serverId=? ;",
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

  private void queryRecordToClient(Map<String, Relation> sendClientUpdateRecords) {
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      // sync all is not good idea , just demo
      String sql = "select " + QUERY_COLUMN + " from server_contents where userId=? and  serverUpdateTime >?";
      QueryRunner queryRunner = new QueryRunner(true);
      List<Relation> results = (List) queryRunner.query(con, sql, new BeanListHandler(Relation.class), user.getUserId(),
          receivedLocalRelations.getLastSyncServerTimeFromClient());
      for (Relation cell : results) {
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

  private void identifyRecords(List<Relation> matchedFromDb, List<Object[]> updateArray, List<Object[]> insertArray,
      Map<String, Relation> sendClientUpdateRecords) {
    for (Relation cell : matchedFromDb) {
      if (mReceivedMap.containsKey(cell.getServerId())) {
        if (mReceivedMap.get(cell.getServerId()).getServerUpdateTime().equals(cell.getServerUpdateTime())) {
          Object[] currentSql = new Object[] { mReceivedMap.get(cell.getServerId()).getIdFrom(),
              mReceivedMap.get(cell.getServerId()).getIdTo(),  mReceivedMap.get(cell.getServerId()).getState(),
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

  private void batchInsertNewRecords(Map<String, Relation> sendClientUpdateRecords) {
    Connection con = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      QueryRunner queryRunner = new QueryRunner(true);
      Object[][] insertAll = new Object[mReceivedMap.size()][];
      int i = 0;
      for (Relation cell : mReceivedMap.values()) {
        Object[] currentForSql = new Object[] { cell.getServerId(), user.getUserId(), cell.getIdFrom(),
            cell.getIdTo(), cell.getState(), mCurrent };
        insertAll[i] = currentForSql;
        i++;
        cell.setServerUpdateTime(mCurrent);
        sendClientUpdateRecords.put(cell.getServerId(), cell);
      }
      1
      queryRunner.batch(con, "insert into server_contents (serverId,userId,Relation,contentType,state,"
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

  public ReceivedLocalRelations getReceivedLocalRecords() {
    return receivedLocalRelations;
  }

  public void setReceivedLocalRecords(ReceivedLocalRelations receivedLocalRelations) {
    this.receivedLocalRelations = receivedLocalRelations;
  }

}
