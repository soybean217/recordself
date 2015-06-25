package com.recordself.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.common.util.ConfigManager;
import org.common.util.ConnectionService;
import org.common.util.GenerateIdService;

import com.recordself.entity.User;

public class UserService {

  private boolean checkAvailableUserName(String userName) {
    boolean result = false;
    PreparedStatement ps = null;
    Connection con = null;
    ResultSet rs = null;
    // max loop try time = 5
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      ps = con.prepareStatement("select userId from server_users where userName = ?");
      int m = 1;
      ps.setString(m++, userName);
      rs = ps.executeQuery();
      if (!rs.next()) {
        result = true;
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
    return result;
  }

  public User addUser(User user) {
    if (!checkAvailableUserName(user.getUserName())) {
      throw new IllegalArgumentException(" User existed !");
    }
    long tmpId = GenerateIdService.getInstance().generateNew(
        Integer.parseInt(ConfigManager.getConfigData("server.id")), "server_users");
    if (tmpId > 0) {
      PreparedStatement ps = null;
      Connection con = null;
      try {
        con = ConnectionService.getInstance().getConnectionForLocal();
        ps = con.prepareStatement("insert into server_users (userId,userName,password) values (?,?,md5(?))");
        int m = 1;
        ps.setLong(m++, tmpId);
        ps.setString(m++, user.getUserName());
        ps.setString(m++, user.getPassword());
        user.setUserId(tmpId);
        if (!(ps.executeUpdate() == 1)) {
          throw new SQLException(" Insert user failed !");
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
    } else {
      throw new IllegalArgumentException(" Generate user name Id error !");
    }
    return user;
  }

  /**
   * @return true ; user current . and user id will be filled into user .
   * */
  public boolean checkUserCurrent(User user) throws SQLException,IllegalArgumentException {
    boolean result = false;
    String sql = "";
    String password = "";
    if (user.getPasswordEncrypted() != null && user.getPasswordEncrypted().length() == 32) {
      sql = "select userId from server_users where userName = ? and password = ?";
      password = user.getPasswordEncrypted();
    } else if (user.getPassword() != null & user.getPassword().length() > 0) {
      sql = "select userId from server_users where userName = ? and password = md5(?)";
      password = user.getPassword();
    } else {
      throw new IllegalArgumentException("Password is not right format !");
    }
    PreparedStatement ps = null;
    Connection con = null;
    ResultSet rs = null;
    try {
      con = ConnectionService.getInstance().getConnectionForLocal();
      ps = con.prepareStatement(sql);
      int m = 1;
      ps.setString(m++, user.getUserName());
      ps.setString(m++, password);
      rs = ps.executeQuery();
      result = checkUserId(user, rs);
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
    return result;
  }

  private boolean checkUserId(User user, ResultSet rs) throws SQLException,IllegalArgumentException {
    boolean result = false;
    if (rs.next()) {
      if (user.getUserId()  > 0) {
        if (user.getUserId()==rs.getLong("userId")) {
          result = true;
          user.setUserId(user.getUserId());
        } else {
          throw new IllegalArgumentException("Strange , user id not match !");
        }
      } else {
        result = true;
        user.setUserId(rs.getLong("userId"));
      }
    } else {
      throw new IllegalArgumentException("Can not match valid user !");
    }
    return result;
  }

}
