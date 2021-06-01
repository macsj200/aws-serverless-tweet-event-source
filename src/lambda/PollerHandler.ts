import { AppConfig } from '../AppConfig';
import { DynamoDBPollingCheckpoint } from '../DynamoDBPollingCheckpoint';
import { LambdaListingProcessor } from '../LambdaMessageProcessor';
import { Poller } from '../Poller';
import { TwitterAPIGateway } from '../TwitterAPIGateway';

const URL_BASE = 'https://api.twitter.com/1.1';
const config = AppConfig.instance;

const poller: Poller = new Poller(
  config,
  new TwitterAPIGateway(URL_BASE, config),
  new DynamoDBPollingCheckpoint(),
  new LambdaListingProcessor(),
);

exports.handler = () => {
  poller.poll();
};
