import { Button } from "@/components/ui/button";
// import { Globe, Github } from 'lucide-react'
import { ConnectButton } from "@mysten/dapp-kit";

export function Header() {
  return (
    <header className="mx-auto max-w-5xl fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl">Suink</span>
          </a>
        </div>

        <div className="flex items-center justify-end gap-4">
          {/* <Button variant="ghost" size="icon">
            <Globe className="h-4 w-4" />
          </Button> */}
          <Button variant="ghost" size="sm">
            testnet
          </Button>
          <ConnectButton />
          {/* <Button>Connect Wallet</Button> */}
        </div>
      </div>
    </header>
  );
}
