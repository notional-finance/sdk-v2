import EventEmitter from 'eventemitter3';
import {DataSource} from '.';

export default class Cache extends DataSource {
  constructor(
    protected eventEmitter: EventEmitter,
    public refreshIntervalMS: number,
  ) {
    super(eventEmitter, refreshIntervalMS);
  }

  async refreshData() {
    console.log('refresh');
  }
}
