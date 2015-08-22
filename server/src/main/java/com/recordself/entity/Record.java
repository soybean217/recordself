package com.recordself.entity;

public class Record {
  // private Long serverId;
  private String serverId; // to compatible JS
  private String title;
  private Long serverUpdateTime;
  private String detail;
  private Long beginTime;
  private Long endTime;
  private Integer state;
  private String titleServerId;

  @Override
  public String toString() {
    return "Record [serverId=" + serverId + ", title=" + title + ", serverUpdateTime=" + serverUpdateTime + ", detail="
        + detail + ", beginTime=" + beginTime + ", endTime=" + endTime + ", state=" + state + ", titleServerId="
        + titleServerId + "]";
  }

  public String getTitleServerId() {
    return titleServerId;
  }

  public void setTitleServerId(String titleServerId) {
    this.titleServerId = titleServerId;
  }

  public String getDetail() {
    return detail;
  }

  public void setDetail(String detail) {
    this.detail = detail;
  }

  public Long getBeginTime() {
    return beginTime;
  }

  public void setBeginTime(Long beginTime) {
    this.beginTime = beginTime;
  }

  public Long getEndTime() {
    return endTime;
  }

  public void setEndTime(Long endTime) {
    this.endTime = endTime;
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

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Long getServerUpdateTime() {
    return serverUpdateTime;
  }

  public void setServerUpdateTime(Long serverUpdateTime) {
    this.serverUpdateTime = serverUpdateTime;
  }

}
