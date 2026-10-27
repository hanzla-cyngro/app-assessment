'use client'

import { useRef, useState } from 'react'
import { FileText, ImageIcon, Loader2, Paperclip, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/components/providers/api-provider'
import { useAttachments } from '@/hooks/use-incidents'
import { toApiError } from '@/lib/api/errors'
import { formatBytes, formatRelative } from '@/lib/format'
import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MIME_TYPES } from '@/lib/types'

export function AttachmentsPanel({ incidentId }: { incidentId: string }) {
  const api = useApi()
  const { data, error, isLoading, mutate } = useAttachments(incidentId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)

  async function onFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!(ATTACHMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error('Only PNG, JPEG, WebP, GIF, or PDF files are allowed.')
      return
    }
    if (file.size > ATTACHMENT_MAX_BYTES) {
      toast.error(`Files must be ${formatBytes(ATTACHMENT_MAX_BYTES)} or smaller.`)
      return
    }
    setUploading(true)
    try {
      await api.uploadAttachment(incidentId, file)
      await mutate()
      toast.success(`Uploaded ${file.name}`)
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function open(attachmentId: string) {
    setOpening(attachmentId)
    try {
      const { url } = await api.getAttachmentReadUrl(incidentId, attachmentId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setOpening(null)
    }
  }

  return (
    <section aria-labelledby="attachments-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="attachments-title" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Paperclip className="size-3.5" aria-hidden="true" />
          Attachments
          {data && <span className="font-mono">{data.length}</span>}
        </h2>
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_MIME_TYPES.join(',')}
          className="sr-only"
          id={`upload-${incidentId}`}
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
          Upload
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : isLoading ? (
        <Skeleton className="h-14 w-full" />
      ) : data && data.length > 0 ? (
        <ul className="flex flex-col divide-y overflow-hidden rounded-lg border">
          {data.map((a) => {
            const Icon = a.mimeType.startsWith('image/') ? ImageIcon : FileText
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => open(a.id)}
                  className="flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm">{a.originalFilename}</span>
                  <span className="font-mono text-xs text-muted-foreground">{formatBytes(a.sizeBytes)}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{formatRelative(a.createdAt)}</span>
                  {opening === a.id && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFiles(e.dataTransfer.files)
          }}
          className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:bg-accent/40"
        >
          <span>Drop a screenshot or log export here</span>
          <span className="text-xs">PNG, JPEG, WebP, GIF, or PDF up to {formatBytes(ATTACHMENT_MAX_BYTES)}</span>
        </button>
      )}
    </section>
  )
}
