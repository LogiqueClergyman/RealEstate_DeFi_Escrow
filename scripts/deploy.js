const hre = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};
async function main() {
  [buyer, seller, inspector, lender] = await ethers.getSigners();

  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.waitForDeployment();

  console.log(`Deployed Real Estate Contract at: ${realEstate.target}`);
  console.log(`Minting properties...\n`);

  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate
      .connect(seller)
      .mint(
        `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${
          i + 1
        }.json`
      );
    await transaction.wait();
  }

  console.log(`Delpying escrow...\n`);
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.target,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.waitForDeployment();
  console.log(`Deployed Escrow Contract at: ${escrow.target}`);

  console.log(`Approving properties...\n`);
  for (let i = 0; i < 3; i++) {
    let transaction = await realEstate
      .connect(seller)
      .approve(escrow.target, i + 1);
    await transaction.wait();
  }

  console.log(`Listing properties...\n`);
  transaction = await escrow
    .connect(seller)
    .listing(1, buyer.address, tokens(20), tokens(10));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .listing(2, buyer.address, tokens(15), tokens(5));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .listing(3, buyer.address, tokens(10), tokens(5));
  await transaction.wait();

  console.log(`Completed successfully!`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
