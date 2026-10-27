import { AlertTriangle, Inbox, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ApiError } from '@/lib/api/errors'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full border bg-card">
        <Inbox className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const Icon = error.isForbidden ? Lock : AlertTriangle
  const title = error.isForbidden
    ? 'Access denied'
    : error.isNotFound
      ? 'Not found'
      : 'Something went wrong'
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-16 text-center"
    >
      <div className="flex size-10 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10">
        <Icon className="size-4 text-destructive" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">{error.message}</p>
      </div>
      {onRetry && !error.isForbidden && !error.isNotFound && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
