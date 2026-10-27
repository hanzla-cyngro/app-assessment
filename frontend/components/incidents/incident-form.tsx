'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/components/providers/api-provider'
import { useSession } from '@/components/providers/session-provider'
import { useRevalidateIncidents } from '@/hooks/use-incidents'
import { toApiError, type FieldErrors } from '@/lib/api/errors'
import { shortId } from '@/lib/format'
import { DESCRIPTION_MAX, SEVERITIES, TITLE_MAX, type Incident, type Severity } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { PresenceMember } from '@/hooks/use-realtime-room'

const UNASSIGNED = 'unassigned'

const SEVERITY_HINT: Record<Severity, string> = {
  Low: 'Minor degradation, no customer impact',
  Medium: 'Partial impact or a workaround exists',
  Critical: 'Outage or major customer impact',
}

export function IncidentForm({
  incident,
  members = [],
  onTyping,
}: {
  incident?: Incident
  members?: PresenceMember[]
  onTyping?: (isTyping: boolean) => void
}) {
  const api = useApi()
  const router = useRouter()
  const { operator } = useSession()
  const revalidate = useRevalidateIncidents()
  const [title, setTitle] = useState(incident?.title ?? '')
  const [description, setDescription] = useState(incident?.description ?? '')
  const [severity, setSeverity] = useState<Severity>(incident?.severity ?? 'Medium')
  const [assignee, setAssignee] = useState(incident?.assignedUserId ?? UNASSIGNED)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  const assigneeItems = [{ value: UNASSIGNED, label: 'Unassigned' }]
  if (operator) assigneeItems.push({ value: operator.id, label: `${operator.displayName} (you)` })
  for (const m of members) {
    if (m.userId !== operator?.id) assigneeItems.push({ value: m.userId, label: m.displayName })
  }
  if (assignee !== UNASSIGNED && !assigneeItems.some((i) => i.value === assignee)) {
    assigneeItems.push({ value: assignee, label: `Operator ${shortId(assignee)}` })
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!title.trim()) e.title = 'Title is required.'
    else if (title.trim().length > TITLE_MAX) e.title = `Title must be ${TITLE_MAX} characters or fewer.`
    if (!description.trim()) e.description = 'Description is required.'
    else if (description.length > DESCRIPTION_MAX) e.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`
    return e
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length) return
    setPending(true)
    onTyping?.(false)
    const input = {
      title: title.trim(),
      description: description.trim(),
      severity,
      assignedUserId: assignee === UNASSIGNED ? null : assignee,
    }
    try {
      const saved = incident ? await api.updateIncident(incident.id, input) : await api.createIncident(input)
      revalidate(saved.id)
      toast.success(incident ? 'Incident updated' : 'Incident declared')
      router.push(`/incidents/${saved.id}`)
    } catch (err) {
      const apiErr = toApiError(err)
      setErrors(apiErr.fieldErrors)
      toast.error(apiErr.message)
      setPending(false)
    }
  }

  const typingProps = onTyping
    ? { onKeyDown: () => onTyping(true), onBlur: () => onTyping(false) }
    : {}

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Title</Label>
          <span className={cn('font-mono text-xs text-muted-foreground', title.length > TITLE_MAX && 'text-destructive')}>
            {title.length}/{TITLE_MAX}
          </span>
        </div>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Checkout API returning 500s"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          autoFocus={!incident}
          {...typingProps}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive">
            {errors.title}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span
            className={cn(
              'font-mono text-xs text-muted-foreground',
              description.length > DESCRIPTION_MAX && 'text-destructive',
            )}
          >
            {description.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is happening, who is affected, and what has been tried so far?"
          rows={8}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
          {...typingProps}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive">
            {errors.description}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Severity</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {SEVERITIES.map((s) => {
            const selected = severity === s
            return (
              <label
                key={s}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  selected ? 'border-foreground bg-accent' : 'hover:bg-accent/50',
                )}
              >
                <input
                  type="radio"
                  name="severity"
                  value={s}
                  checked={selected}
                  onChange={() => setSeverity(s)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-2 rounded-full',
                      s === 'Critical' ? 'bg-destructive' : s === 'Medium' ? 'bg-warning' : 'bg-muted-foreground',
                    )}
                  />
                  {s}
                </span>
                <span className="text-xs text-muted-foreground">{SEVERITY_HINT[s]}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="assignee">Assignee</Label>
        <Select items={assigneeItems} value={assignee} onValueChange={(v) => setAssignee((v as string | null) ?? UNASSIGNED)}>
          <SelectTrigger id="assignee" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assigneeItems.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Operators currently online can be assigned.</p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t pt-6">
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {incident ? 'Save changes' : 'Declare incident'}
        </Button>
      </div>
    </form>
  )
}
