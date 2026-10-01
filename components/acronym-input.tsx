"use client"

import { REGEXP_ONLY_CHARS } from "input-otp"

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { ACRONYM_LENGTH } from "@/lib/validation"

type AcronymInputProps = {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  id?: string
  name?: string
  autoFocus?: boolean
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

/** Three letter boxes. Accepts A–Z only and always reports uppercase. */
export function AcronymInput({ value, onChange, onComplete, ...props }: AcronymInputProps) {
  return (
    <InputOTP
      maxLength={ACRONYM_LENGTH}
      pattern={REGEXP_ONLY_CHARS}
      value={value}
      onChange={(next) => onChange(next.toUpperCase())}
      onComplete={(next: string) => onComplete?.(next.toUpperCase())}
      pasteTransformer={(text) => text.replace(/[^a-z]/gi, "").toUpperCase()}
      autoComplete="off"
      {...props}
    >
      <InputOTPGroup>
        {Array.from({ length: ACRONYM_LENGTH }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="size-14 text-2xl font-semibold uppercase sm:size-16 sm:text-3xl"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
