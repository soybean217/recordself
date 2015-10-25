package com.recordself.json.protocol;

import java.util.List;

import com.recordself.entity.Content;


public class ReceivedLocalRecords {
  private List<Content> dataRows;
  private Long lastSyncServerTimeFromClient;

  public List<Content> getDataRows() {
    return dataRows;
  }

  public void setDataRows(List<Content> dataRows) {
    this.dataRows = dataRows;
  }

  public Long getLastSyncServerTimeFromClient() {
    return lastSyncServerTimeFromClient;
  }

  public void setLastSyncServerTimeFromClient(Long lastSyncServerTimeFromClient) {
    this.lastSyncServerTimeFromClient = lastSyncServerTimeFromClient;
  }

  @Override
  public String toString() {
    return "ReceivedLocalRecords [dataRows=" + dataRows + ", lastSyncServerTimeFromClient="
        + lastSyncServerTimeFromClient + "]";
  }

}
