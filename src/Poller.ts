import { LoggerFactory } from '@codification/cutwater-logging';
import { MessageProcessor, PollingCheckpoint } from '.';
import { APIGateway } from './APIGateway';
import { AppConfig } from './AppConfig';

const Logger = LoggerFactory.getLogger();

export class Poller {
  private config: AppConfig;
  private apiGateway: APIGateway;
  private processor: MessageProcessor;
  private checkpoint: PollingCheckpoint;

  constructor(config: AppConfig, apiGateway: APIGateway, checkpoint: PollingCheckpoint, processor: MessageProcessor) {
    this.config = config;
    this.processor = processor;
    this.checkpoint = checkpoint;
    this.apiGateway = apiGateway;
  }

  public poll(): void {
    this.doPoll()
      .then(results => this.processor.process(results))
      .catch(err => Logger.error('Polling encountered an error: ', err));
  }

  public async doPoll(): Promise<any[]> {
    const lastMessageDate = await this.checkpoint.getLastMessageDate();
    Logger.debug(`Received previous last message date: ${new Date(lastMessageDate).toUTCString()}`);

    const latestMessages = (await this.getLatestMessages()) || [];
    Logger.debug('Total messages: ', latestMessages.length);
    const newMessages = this.sortMessages(latestMessages).filter(
      message => Date.parse(message.created_at) > lastMessageDate,
    );
    Logger.debug('New messages: ', newMessages.length);

    if (newMessages.length < 1) {
      Logger.debug('Exiting, no new messages detected.');
      return [];
    } else {
      const currentLatestMessageDate = Date.parse(newMessages[0].created_at);
      Logger.debug(`Updating checkpoint timestamp: ${new Date(currentLatestMessageDate).toUTCString()}`);
      this.checkpoint.setLastMessageDate(currentLatestMessageDate);
      return newMessages;
    }
  }

  private getLatestMessages(): Promise<any[] | undefined> {
    const query = `q=${this.config.searchQuery}${
      this.config.additionalParameters ? '&' + this.config.additionalParameters : ''
    }`;
    Logger.trace(`Using query string: ${query}`);
    return this.apiGateway.callAPI(`/search/tweets.json`, query);
  }

  private sortMessages(messages: any[]): any[] {
    return messages.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }
}
