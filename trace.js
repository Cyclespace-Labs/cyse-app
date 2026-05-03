const { createPublicClient, http } = require('viem');
const { hardhat } = require('viem/chains');

const rpcUrl = 'http://127.0.0.1:8545';
const publicClient = createPublicClient({ chain: hardhat, transport: http(rpcUrl) });
const PositionManager = '0x5067457698Fd6Fa1C6964e416b3f42713513B3dD';
const account0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const abi = [{ type: 'function', name: 'executeDecreaseOrder', inputs: [{ name: '_account', type: 'address' }, { name: '_orderIndex', type: 'uint256' }, { name: '_feeReceiver', type: 'address' }], outputs: [] }];

async function main() {
  try {
    const trace = await publicClient.request({
      method: 'debug_traceCall',
      params: [
        {
          to: PositionManager,
          from: account0,
          data: '0x323b7da30000000000000000000000008626f6940e2eb28930efb4cef49b2d1f2c9c11990000000000000000000000000000000000000000000000000000000000000009000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266'
        },
        'latest',
        { tracer: 'callTracer' }
      ]
    });
    console.log(JSON.stringify(trace, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
