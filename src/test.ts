import {providers} from 'ethers';
import Notional from './Notional';

async function main() {
  const provider = new providers.JsonRpcBatchProvider(
    'https://mainnet.infura.io/v3/d8c2000266474878b2c62cab30755894',
    providers.getNetwork('mainnet'),
  );
  await Notional.load(1, provider);
}

main();
