const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MockPyth contract...");

  const MockPyth = await ethers.getContractFactory("MockPyth");
  const pyth = await MockPyth.deploy();
  await pyth.deployed();

  console.log("MockPyth deployed to:", pyth.address);

  // Common Pyth price feed IDs
  const priceIds = {
    ETH: "0xff61491a85d71acf75bb0f98866a1e8e1e9c1b1e1c1e1e1e1e1e1e1e1e1e1e1",
    BTC: "0xe629f29d8c522317679728663bdde96004fe0ca0b0258868b2a3e3c9e26e615e",
    SOL: "0xef0d8b622a05c7ca9e8df527b6b0b6064b4b0b0b0b0b0b0b0b0b0b0b0b0b0b0b",
  };

  // Set initial prices (price in 10^8 format for USD pairs, exponent 8)
  const currentTime = Math.floor(Date.now() / 1000);

  console.log("Setting initial prices...");
  
  // ETH/USD: $2017.99
  await pyth.setPrice(priceIds.ETH, 20179900000, 8, currentTime);
  console.log("  ETH/USD: $2017.99");

  // BTC/USD: $43250.50
  await pyth.setPrice(priceIds.BTC, 432505000000, 8, currentTime);
  console.log("  BTC/USD: $43,250.50");

  // SOL/USD: $86.13
  await pyth.setPrice(priceIds.SOL, 8613000000, 8, currentTime);
  console.log("  SOL/USD: $86.13");

  console.log("\n✅ MockPyth deployed and initialized successfully!");
  console.log("\nTo use this address, update your protocol/addresses.json:");
  console.log(`  "Pyth": "${pyth.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
