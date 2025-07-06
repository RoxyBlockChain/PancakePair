import 'dotenv/config';
import { ethers, formatEther, parseUnits } from "ethers";
import pancakeFactoryV2Abi from './abi/pancakeFactoryV2Abi.js';
import pairAddressAbi from './abi/pairAddressAbi.js';
import tokenAbi from './abi/tokenAbi.js';
import fs from 'fs';
import XLSX from 'xlsx';


// Provider to get readable link to any BSC network or Testnet.

//const bscProvider = new ethers.Providers.HTTPProvider("https://bsc-dataseed.binance.org/");
//const bscTestnetProvider = new ethers.HTTPProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
const bscProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
const bscTestnetProvider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

const wBNBAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDTAddress = "0x55d398326f99059fF775485246999027B3197955";

const tokenContract = {
    token: new ethers.Contract(wBNBAddress, tokenAbi, bscProvider),
};

const pancakeContractAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const pancakeAbi = pancakeFactoryV2Abi;
const pairAbi = pairAddressAbi;


const pancakeContract = new ethers.Contract(
    pancakeContractAddress,
    pancakeAbi,
    bscProvider,
);

const allPairsLength = await pancakeContract.allPairsLength();



for (let i = 1875090; i < allPairsLength; i++) {
    const pairAddress = await pancakeContract.allPairs(i);
    // console.log("Pair Address", pairAddress);
    const pairContract = new ethers.Contract(
        pairAddress,
        pairAbi,
        bscProvider,
    );

    if(((await pairContract.getReserves())[1]) > 10000000000000000000 && 
    ((await pairContract.getReserves())[0]) > 100000000000000000000 && 
    ((await pairContract.getReserves())[0] / (await pairContract.getReserves())[1]) != 0)  {
    const tokenData = [
        {       "Pair Address": pairAddress, 
                "Pair Name": await pairContract.name(),
                "Pair Symbol": await pairContract.symbol(),
                "Token0": await pairContract.token0(),
                "Token1": await pairContract.token1(),
                "MinLiquidity": (await pairContract.MINIMUM_LIQUIDITY()).toString(),
                "TotalSupply": (await pairContract.totalSupply()).toString(),
                "Reserve0": formatEther((await pairContract.getReserves())[0]),
                "Reserve1": formatEther((await pairContract.getReserves())[1]),
                "Liquidity": formatEther(((await pairContract.getReserves())[1] * (await pairContract.getReserves())[1])),
                "Market Cap": formatEther(((await pairContract.totalSupply()) * (await pairContract.getReserves())[1] / (await pairContract.getReserves())[0])),
                "Price": formatEther(((await pairContract.getReserves())[0] / (await pairContract.getReserves())[1])),
                "Klast": formatEther(((await pairContract.getReserves())[0] * (await pairContract.getReserves())[1])),
        }
                ]
              
                appendToJSON(tokenData);
            }

    // Write to JSON file
   
    function appendToJSON(newData) {
        const filename = 'historical_data.json';
        
        try {
          let existing = [];
          if (fs.existsSync(filename)) {
            existing = JSON.parse(fs.readFileSync(filename));
          }
          
          const updated = [...existing, ...newData];
          fs.writeFileSync(filename, JSON.stringify(updated, null, 2));
          console.log('Data appended successfully');
        } catch (error) {
          console.error('Error appending data:', error);
        }
   }
   
}
