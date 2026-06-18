import { ApiDataSource } from 'src/datasources/api.js';
import { BaseRepository } from '../base.js';
import { AddressApiRepoContext, AddressApiRepoParams } from './types.js';
import { readFromApi } from './helpers.js';

export class AddressApiRepository extends BaseRepository<AddressApiRepoContext> {
  private readonly api: ApiDataSource;

  constructor({ api, ...args }: AddressApiRepoParams) {
    super(args);
    this.api = api;
  }

  get context() {
    return {
      ...this.baseContext,
      api: this.api,
    };
  }

  read(addressId: string) {
    return readFromApi(this.context, addressId);
  }
}
