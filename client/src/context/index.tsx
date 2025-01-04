'use client'

import { wagmiAdapter, projectId } from '../config'
import { createAppKit } from '@reown/appkit/react' 
import { mainnet, arbitrum, scroll, morph, berachainTestnetbArtio, mantle, soneiumMinato, zircuit} from '@reown/appkit/networks'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = { //this is optional
  name: "appkit-example",
  description: "AppKit Example - EVM",
  url: "https://reown-appkit-evm.vercel.app", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"]
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  chainImages: { // Customize networks' logos
    5000: '/mantle.png', // <chainId>: 'www.network.com/logo.png'
    534_352: '/scroll.png',
    80084: '/berachain.png',
    2818: '/morph.png',
    1946: '/soneium.png',
    48900: '/zircuit.svg'
  },
  projectId,
  networks: [mainnet, arbitrum, scroll, morph, berachainTestnetbArtio, mantle, soneiumMinato, zircuit],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: true, // default to true
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook', 'farcaster'],
    emailShowWallets: true, // default to true
  },
  themeMode: 'light'
})

function ContextProvider({ children }: { children: ReactNode }) {
 

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider