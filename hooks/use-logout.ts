'use client'

import { useRouter } from 'next/navigation'
import { logout } from '../actions/logout' // Adjust this import path as needed
import { getSession } from 'next-auth/react';

export function useLogout() {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    getSession()
    router.push('/login') // Redirect to login page after logout
  }

  return handleLogout
}