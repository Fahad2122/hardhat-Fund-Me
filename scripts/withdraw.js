const { deployments, ethers } = require("hardhat");

async function main(){
    const fundMeAddress = (await deployments.get("FundMe")).address;
    const fundMe = await ethers.getContractAt("FundMe", fundMeAddress);
    
    console.log(`Got FundMe contract at ${fundMeAddress}`);
    console.log("Withdrawing from Contract...");

    const response = await fundMe.withdraw();
    await response.wait();

    console.log("Withrad successfully");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })