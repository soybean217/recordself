package com.recordself.json.protocol;

import java.util.List;

import com.recordself.entity.Record;


public class ReceivedLocalRecords {
  private List<Record> dataRows;
  private Long lastSyncServerTimeFromClient;

  public List<Record> getDataRows() {
    return dataRows;
  }

  public void setDataRows(List<Record> dataRows) {
    this.dataRows = dataRows;
  }

  public Long getLastSyncServerTimeFromClient() {
    return lastSyncServerTimeFromClient;
  }

  public void setLastSyncServerTimeFromClient(Long lastSyncServerTimeFromClient) {
    this.lastSyncServerTimeFromClient = lastSyncServerTimeFromClient;
  }

}
