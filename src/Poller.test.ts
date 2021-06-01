import { LoggerFactory } from '@codification/cutwater-logging';
import * as fs from 'fs';
import * as path from 'path';
import { MessageProcessor, PollingCheckpoint } from '.';
import { APIGateway } from './APIGateway';
import { AppConfig } from './AppConfig';
import { Poller } from './Poller';

const Logger = LoggerFactory.getLogger();

// tslint:disable: max-classes-per-file
class MockAPIGateway implements APIGateway {
  private readonly MOCK_FILE_PATH = path.resolve(__dirname, 'TwitterAPIResponse.mock.json');
  public callAPI(url: string, query?: string): Promise<any[]> {
    return JSON.parse(fs.readFileSync(this.MOCK_FILE_PATH, { encoding: 'utf8' })).statuses;
  }
}

class MockPollingCheckpoint implements PollingCheckpoint {
  public lastMessageDate: number = -1;

  constructor(lastMessageDate?: number) {
    if (lastMessageDate) {
      this.lastMessageDate = lastMessageDate;
    }
  }

  public async getLastMessageDate(): Promise<number> {
    return this.lastMessageDate;
  }

  public setLastMessageDate(timestamp: number): void {
    this.lastMessageDate = timestamp;
  }
}

class MockEventProcessor implements MessageProcessor {
  public process(messages: any[]): void {
    Logger.debug(`Recieved messages: ${JSON.stringify(messages, null, 2)}`);
  }
}

describe('Poller', () => {
  const config = AppConfig.instance;
  const apiGateway = new MockAPIGateway();
  const checkpoint = new MockPollingCheckpoint();
  const processor = new MockEventProcessor();
  const poller = new Poller(config, apiGateway, checkpoint, processor);

  it('can progressively poll messages', async () => {
    let messages: any[] = await poller.doPoll();
    expect(messages.length).toBeGreaterThan(1);

    const first = messages[0];
    const last = messages[messages.length - 1];
    expect(Date.parse(first.created_at)).toBeGreaterThan(Date.parse(last.created_at));
    expect(checkpoint.lastMessageDate).toBeGreaterThan(-1);

    const lastMessageDate = checkpoint.lastMessageDate;
    messages = await poller.doPoll();
    expect(messages.length).toEqual(0);
    expect(checkpoint.lastMessageDate).toEqual(lastMessageDate);
  });
});
