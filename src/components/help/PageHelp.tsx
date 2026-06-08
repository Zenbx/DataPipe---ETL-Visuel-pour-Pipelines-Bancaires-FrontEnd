'use client'

import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PageHelpPanel } from '@/components/help/PageHelpPanel'
import { getPageHelp } from '@/lib/pageHelp'

export function PageHelpButton({ helpKey }: { helpKey: string }) {
  const help = getPageHelp(helpKey)
  if (!help) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-gray-500 hover:text-primary"
          title={`Aide : ${help.title}`}
        >
          <CircleHelp className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base">Guide — {help.title}</DialogTitle>
        </DialogHeader>
        <PageHelpPanel helpKey={helpKey} />
      </DialogContent>
    </Dialog>
  )
}
