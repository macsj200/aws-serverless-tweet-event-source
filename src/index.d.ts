export interface PollingCheckpoint {
  getLastMessageDate(): Promise<number>;
  setLastMessageDate(timestamp: number): void;
}

export interface MessageProcessor {
  process(messages: any[]): void;
}
