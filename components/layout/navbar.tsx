"use client";


import React,{useEffect, useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
// import logo from '@/public/logo/transparent_icon.png'
import { User , LogOut, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useCurrentUser } from '@/hooks/use-current-user';
import { useLogout } from '@/hooks/use-logout';
import {useRouter} from 'next/navigation';
import { getSession } from 'next-auth/react';

export const Navbar =  () => {

  const { user, isLoading, error } = useCurrentUser();
  console.log(`user: ${user}`)
  const handleLogout = useLogout();
  const role = user?.role 



  return (
    <nav className="flex items-center justify-between p-4 bg-background text-foreground shadow-md">
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          {/* <Image src={logo} alt="Tikomic" width={40} height={40} /> */}
          TIKOMIC
        </Link>

      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:block relative">
        </div>
      {user? (
        <>
        {/* <WalletMultiButton style={{ background: "#0582ca" }} /> */}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" >
            <User className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">


          {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
          {/* <DropdownMenuSeparator /> */}
        {role === 'ADMIN'?          <Link href="/uploads">
          <DropdownMenuItem>
            <Upload className="mr-2 h-4 w-4" /> 
            <span>Uploads</span>
          </DropdownMenuItem>
          </Link>  : ''}

          {/* <Link href="/profile">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          </Link> */}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>      
       </>
      ): (
        <div className="flex space-x-2">
        <Link href="/login">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Login
          </Button>
        </Link>
        <Link href="/register">
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Sign Up
          </Button>
        </Link>
      </div>
      )}
      </div>
    </nav>
  )
}     



