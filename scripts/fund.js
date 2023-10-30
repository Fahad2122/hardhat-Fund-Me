const { getNamedAccounts, ethers, deployments } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMeAddress = (await deployments.get("FundMe")).address;
    const fundMe = await ethers.getContractAt("FundMe", fundMeAddress);

    console.log(`Got FundMe contract at ${fundMeAddress}`);
    console.log("Funding Contract...");
    
    const response = await fundMe.fund({ value: ethers.parseEther('0.1')});
    await response.wait(1);

    console.log("Funded successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })