import { LoggerFactory } from '@codification/cutwater-logging';
import { Lambda } from 'aws-sdk';
import { InvocationRequest } from 'aws-sdk/clients/lambda';
import { MessageProcessor } from '.';
import { AppConfig } from './AppConfig';

const Logger = LoggerFactory.getLogger();
const LAMBDA = new Lambda();

export class LambdaListingProcessor implements MessageProcessor {
  public process(messages: any[]): void {
    const functionName = AppConfig.instance.processorFunctionName;
    const params: InvocationRequest = {
      FunctionName: functionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(messages),
    };
    LAMBDA.invoke(params, err => {
      if (err) {
        Logger.error(`Encountered error publishing messages to lambda[${functionName}]: `, err);
      } else {
        Logger.info(`Successfully published ${messages.length} message(s) to lambda: ${functionName}`);
      }
    });
  }
}
