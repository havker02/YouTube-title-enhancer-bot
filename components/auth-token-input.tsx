"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface AuthTokenInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AuthTokenInput({ label, value, onChange, placeholder }: AuthTokenInputProps) {
  const [showToken, setShowToken] = useState(false)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          type={showToken ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
          onClick={() => setShowToken(!showToken)}
        >
          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
