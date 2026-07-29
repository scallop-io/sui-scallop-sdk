import { SDK_API_BASE_URL } from 'src/constants/api.js';
import { ApiDataSource, ApiDataSourceParams } from './api.js';

export class IndexerDataSource extends ApiDataSource {
  public readonly url: string;
  constructor({ url = SDK_API_BASE_URL, ...args }: ApiDataSourceParams) {
    super({ url, ...args });
    this.url = url;
  }
}
