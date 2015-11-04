package com.recordself.entity;

public class Relation {
  // private Long serverId;
  private String serverId; // to compatible JS
  private String idFrom;
  private String idTo;
  private Long serverUpdateTime;
  private Integer state;

  @Override
  public String toString() {
    return "Relation [serverId=" + serverId + ", idFrom=" + idFrom + ", idTo=" + idTo + ", serverUpdateTime="
        + serverUpdateTime + ", state=" + state + "]";
  }

  public String getIdFrom() {
    return idFrom;
  }

  public void setIdFrom(String idFrom) {
    this.idFrom = idFrom;
  }

  public String getIdTo() {
    return idTo;
  }

  public void setIdTo(String idTo) {
    this.idTo = idTo;
  }

  public Integer getState() {
    return state;
  }

  public void setState(Integer state) {
    this.state = state;
  }

  public String getServerId() {
    return serverId;
  }

  public void setServerId(String serverId) {
    this.serverId = serverId;
  }

  public Long getServerUpdateTime() {
    return serverUpdateTime;
  }

  public void setServerUpdateTime(Long serverUpdateTime) {
    this.serverUpdateTime = serverUpdateTime;
  }

}
