import { readFileSync } from 'fs'
import React from 'react'
import { SignInButton,SignedOut,SignedIn, SignOutButton } from '@clerk/nextjs'

const HomePage = () => {
  return (
    <div>
      HomePage
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <SignOutButton />
      </SignedIn>
    </div>
  )
}

export default HomePage;