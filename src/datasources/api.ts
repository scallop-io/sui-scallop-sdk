import axios, { type AxiosInstance } from 'axios';

export type ApiDataSourceParams = {
  url?: string;
  httpClient?: AxiosInstance;
  timeout?: number;
  authToken?: string;
};

export class ApiDataSource {
  private readonly client: AxiosInstance;
  private readonly authToken?: string;

  constructor({
    url,
    httpClient,
    timeout = 8000,
    authToken,
  }: ApiDataSourceParams = {}) {
    this.authToken = authToken;
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

  async authenticatedGet<T>(
    urlPath: string,
    authToken = this.authToken
  ): Promise<T> {
    if (!authToken) {
      throw new Error(
        'Authentication token is required for authenticated requests.'
      );
    }

    const response = await this.client.get<T>(urlPath, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (response.status !== 200) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }
    return response.data;
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
