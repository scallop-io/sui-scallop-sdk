import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { QueryKey } from '@tanstack/query-core';
import ScallopQueryClient, {
  ScallopQueryClientParams,
} from './scallopQueryClient';

export type ScallopAxiosParams = {
  baseUrl?: string;
  axiosInstance?: AxiosInstance;
  axiosTimeout?: number;
} & ScallopQueryClientParams;

class ScallopAxios extends ScallopQueryClient {
  public readonly axiosInstance: AxiosInstance;

  constructor(params: ScallopAxiosParams = {}) {
    super(params);

    this.axiosInstance =
      params.axiosInstance ??
      axios.create({
        baseURL: params.baseUrl,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: params.axiosTimeout ?? 8000,
      });
  }

  // Overload signatures
  post<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  post<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    queryKey: QueryKey,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;

  // Implementation
  async post<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    arg2?: QueryKey | D,
    arg3?: AxiosRequestConfig<D> | D,
    arg4?: AxiosRequestConfig<D>
  ): Promise<R> {
    // Determine which overload was called
    if (Array.isArray(arg2)) {
      // Second argument is queryKey (post with query)
      const queryKey = arg2;
      const data = arg3 as D;
      const config = arg4;

      return this.queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          this.axiosInstance
            .post<T>(url, data, config)
            .then((response) => response as R),
      });
    } else {
      // Normal post
      const data = arg2 as D;
      const config = arg3 as AxiosRequestConfig<D>;

      return this.axiosInstance.post<T>(url, data, config) as unknown as R;
    }
  }

  // Similar overloading for get
  get<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  get<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    queryKey: QueryKey,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;

  async get<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    arg2?: QueryKey | AxiosRequestConfig<D>,
    arg3?: AxiosRequestConfig<D>
  ): Promise<R> {
    if (Array.isArray(arg2)) {
      // get with query
      const queryKey = arg2;
      const config = arg3;

      return this.queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          this.axiosInstance
            .get<T>(url, config)
            .then((response) => response as R),
      });
    } else {
      // normal get
      const config = arg2 as AxiosRequestConfig<D>;
      return this.axiosInstance.get<T>(url, config) as unknown as R;
    }
  }

  // Similar overloading for put
  put<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  put<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    queryKey: QueryKey,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;

  async put<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    arg2?: QueryKey | D,
    arg3?: AxiosRequestConfig<D> | D,
    arg4?: AxiosRequestConfig<D>
  ): Promise<R> {
    if (Array.isArray(arg2)) {
      // put with query
      const queryKey = arg2;
      const data = arg3 as D;
      const config = arg4;

      return this.queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          this.axiosInstance
            .put<T>(url, data, config)
            .then((response) => response as R),
      });
    } else {
      // normal put
      const data = arg2 as D;
      const config = arg3 as AxiosRequestConfig<D>;

      return this.axiosInstance.put<T>(url, data, config) as unknown as R;
    }
  }

  // Similar overloading for delete
  delete<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  delete<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    queryKey: QueryKey,
    config?: AxiosRequestConfig<D>
  ): Promise<R>;
  async delete<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    arg2?: QueryKey | AxiosRequestConfig<D>,
    arg3?: AxiosRequestConfig<D>
  ): Promise<R> {
    if (Array.isArray(arg2)) {
      // delete with query
      const queryKey = arg2;
      const config = arg3;

      return this.queryClient.fetchQuery({
        queryKey,
        queryFn: () =>
          this.axiosInstance
            .delete<T>(url, config)
            .then((response) => response as R),
      });
    } else {
      // normal delete
      const config = arg2 as AxiosRequestConfig<D>;
      return this.axiosInstance.delete<T>(url, config) as unknown as R;
    }
  }
}

export default ScallopAxios;
