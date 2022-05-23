import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
export default function Rainbow() {
  const { data, isLoading, error } = useAccount();
  console.log(data);
  return <div>hey</div>;
}
