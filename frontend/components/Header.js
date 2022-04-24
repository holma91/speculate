import Link from 'next/link';
import { useState, useEffect } from 'react';
import styled from 'styled-components';

const Header = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have metamask!');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  return (
    <HeaderContainer>
      <Title>
        <Link href="/">
          <a>Speculate</a>
        </Link>
      </Title>
      <ButtonContainer>
        <Button>
          <Link href="/positions">
            <a>Positions</a>
          </Link>
        </Button>
        <Button onClick={connectWallet}>
          {currentAccount ? (
            <span>Connected</span>
          ) : (
            <span>Connect Wallet</span>
          )}
        </Button>
      </ButtonContainer>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  border-bottom: 1px solid #b9b9b9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
`;
const Title = styled.div`
  a {
    font-weight: 600;
    font-size: 25px;
    :hover {
      color: #0f6cf7;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  justify-content: space-between;
  align-items: center;
`;

const Button = styled.button`
  background-color: #0f6cf7;
  opacity: 75%;
  color: white;
  padding: 10px 20px;
  font-size: 110%;
  border-radius: 3px;
  min-width: 100px;
  border: none;
  outline: none;
  cursor: pointer;
  :hover {
    opacity: 100%;
  }
`;

export default Header;
