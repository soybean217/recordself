package com.recordself.entity;

public class User {

  private String userName;
  private String password;
  private Long userId;
  private String userIdString;

  public Long getUserId() {
    return userId;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
    this.userIdString = Long.toString(userId);
  }

  public String getUserIdString() {
    return userIdString;
  }

  public void setUserIdString(String userIdString) {
    this.userIdString = userIdString;
    this.userId = Long.parseLong(userIdString);
  }

  public String getUserName() {
    return userName;
  }

  public void setUserName(String userName) {
    this.userName = userName;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public boolean validate() {
    boolean result = false;
    if (this.userName == null) {
      throw new IllegalArgumentException("userName is null .");
    } else if (this.password == null) {
      throw new IllegalArgumentException("password is null .");
    } else if (this.userName.length() < 1 || this.userName.length() > 31) {
      throw new IllegalArgumentException("userName length is wrong .");
    } else if (this.password.length() < 1 || this.password.length() > 31) {
      throw new IllegalArgumentException("password length is wrong .");
    }
    return result;
  }
}
