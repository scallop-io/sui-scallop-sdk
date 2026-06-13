import axios, { type AxiosInstance } from 'axios';

export type ApiDataSourceParams = {
  url?: string;
  client?: AxiosInstance;
  timeout?: number;
};

export class ApiDataSource {
  private readonly client: AxiosInstance;

  constructor({ url, client, timeout = 8000 }: ApiDataSourceParams = {}) {
    this.client =
      client ??
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
    return response.data;
  }
}
