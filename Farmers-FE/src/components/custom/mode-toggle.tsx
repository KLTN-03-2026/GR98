'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useTheme } from '@/providers/theme-provider'
import { Moon, Sun } from "lucide-react"
import { cn } from '@/lib/utils'

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant='ghost'
        size='icon'
        className={cn('relative', className)}
      >
        <Moon className='h-5 w-5' />
        <span className='sr-only'>Chuyển đổi giao diện</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size='icon'
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className='relative'
    >
      <motion.div
        key='sun-icon'
        initial={{ opacity: 1, rotate: 0, scale: 1 }}
        animate={{
          opacity: theme === 'light' ? 1 : 0,
          rotate: theme === 'light' ? 0 : 90,
          scale: theme === 'light' ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <Sun className='h-5 w-5' />
      </motion.div>

      <motion.div
        key='moon-icon'
        initial={{ opacity: 0, rotate: 90, scale: 0 }}
        animate={{
          opacity: theme === 'dark' ? 1 : 0,
          rotate: theme === 'dark' ? 0 : 90,
          scale: theme === 'dark' ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className='absolute'
      >
        <Moon className='h-5 w-5' />
      </motion.div>
      <span className='sr-only'>Chuyển đổi giao diện</span>
    </Button>
  )
}
