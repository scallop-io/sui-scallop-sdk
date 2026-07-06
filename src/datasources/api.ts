import axios, { type AxiosInstance } from 'axios';

export type ApiDataSourceParams = {
  url?: string;
  httpClient?: AxiosInstance;
  timeout?: number;
};

export class ApiDataSource {
  private readonly client: AxiosInstance;

  constructor({ url, httpClient, timeout = 8000 }: ApiDataSourceParams = {}) {
    this.client =
      httpClient ??
      axios.create({
        baseURL: url,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout,
      });
  }

  async get<T>(urlPath: string): Promise<T> {
    const response = await this.client.get<T>(urlPath);
    if (response.status !== 200) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }
    return response.data;
  }
}
