import React,{useEffect, useState} from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import SelectCharacter from './Components/SelectCharacter';
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import myEpicGame from "./utils/MyEpicGame.json";
import {ethers} from "ethers";
import Arena from "./Components/Arena"; 
import LoadingIndicator from "./Components/LoadingIndicator";

// Constants
const TWITTER_HANDLE = 'moreau_Fivman';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [characterNFT, setCharacterNFT] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  //rinkeby に接続しているか確認
  const checkNetwork = async () =>{
    try{
      if(window.ethereum.networkVersion !== "4"){
        alert("Rinkeby Test Newworkに接続してください");
      }else{
        console.log("Rinkeby に接続されています");
      }
    }catch(error){
      console.log(error);
    }
  }

  //Metamask確認
  const checkIfWalletIsConnected = async () =>{
    try{
      const {ethereum} = window;
      if(!ethereum){
        console.log("Make sure you have MetaMask!");
        setIsLoading(false);
        return;
      }else{
        console.log("We have the ethereum object", ethereum);
        const accounts = await ethereum.request({method: "eth_accounts"});
        if(accounts.length !== 0){
          const account = accounts[0];
          console.log("Found an authorized account: ", account);
          setCurrentAccount(account);
        }else{
          console.log("No authorized account found");
        }
      }
    }catch(error){
      console.log(error);
    }
    setIsLoading(false);
  }

  //レンダリングメソッド
  const renderContent = () =>{
    if(isLoading){
      return <LoadingIndicator/>;
    }

    if(!currentAccount){
      return(
        <div className="connect-wallet-container">
        <img src="https://i.imgur.com/TXBQ4cC.png" alt="LUFFY"/>
        <button className="cta-button connect-wallet-button" onClick={connectWalletAction}>Connect Wallet To Get Started</button>
      </div>
      );
    }else if (currentAccount && !characterNFT){
      return <SelectCharacter setCharacterNFT={setCharacterNFT}/>;
    }else if (currentAccount && characterNFT){
      return <Arena characterNFT = {characterNFT} setCharacterNFT={setCharacterNFT}/>;
    }
  }

  // connectWallet
  const connectWalletAction = async () => {
    try{
      const {ethereum} = window;
      if(!ethereum){
        alert("Get MetaMask!");
        return;
      }
      //userがウォレットを持っているか
      checkIfWalletIsConnected();

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      
      //rinkebyに接続されているか
      checkNetwork();

    }catch(error){
      console.log(error);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
  },[]);

  useEffect(() =>{
    const fetchNFTMetadata = async () =>{
      console.log("Checking for Character NFT on address: ", currentAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
      
      console.log("【checkIfUserHasNFT】")
      const txn = await gameContract.checkIFUserHasNFT();
      console.log("【ENDcheckIfUserHasNFT】")
      if(txn.name){
        console.log("User has character NFT");
        setCharacterNFT(transformCharacterData(txn));
      }else{
        console.log("No character NFT found");
      }
    }
    
    if(currentAccount){
      console.log("CurrentAccount: ", currentAccount);
      fetchNFTMetadata();
    }
    setIsLoading(false);
  },[currentAccount]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
        <p className="header gradient-text">⚡️ METAVERSE GAME ⚡️</p>
          <p className="sub-text">プレイヤーと協力してボスを倒そう✨</p>
          {renderContent()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
