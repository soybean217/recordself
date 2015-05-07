package com.recordself.entity;

public class User {

  private String userName;
  private String password;

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
    } else if (this.userName.length() < 2 || this.userName.length() > 31) {
      throw new IllegalArgumentException("userName length is wrong .");
    } else if (this.password.length() < 2 || this.password.length() > 31) {
      throw new IllegalArgumentException("password length is wrong .");
    }
    return result;
  }
}
