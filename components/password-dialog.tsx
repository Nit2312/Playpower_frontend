"use client"

import type React from "react"

import { useState } from "react"
import { Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => void
  mode: "set" | "verify"
  title?: string
  description?: string
  isLoading?: boolean
  error?: string
}

export function PasswordDialog({
  isOpen,
  onClose,
  onSubmit,
  mode,
  title,
  description,
  isLoading = false,
  error,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState("")

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (!pwd.match(/[A-Z]/)) {
      return "Password must contain an uppercase letter"
    }
    if (!pwd.match(/[a-z]/)) {
      return "Password must contain a lowercase letter"
    }
    if (!pwd.match(/[0-9]/)) {
      return "Password must contain a number"
    }
    if (!pwd.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)) {
      return "Password must contain a special character"
    }
    return ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    const passwordError = validatePassword(password)
    if (passwordError) {
      setValidationError(passwordError)
      return
    }
    
    if (mode === "set" && password !== confirmPassword) {
      setValidationError("Passwords do not match")
      return 
    }

    if (password.trim()) {
      onSubmit(password)
    }
  }

  const handleClose = () => {
    setPassword("")
    setConfirmPassword("")
    setShowPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  const isPasswordMismatch = mode === "set" && confirmPassword.length > 0 && password !== confirmPassword

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {title || (mode === "set" ? "Set Password" : "Enter Password")}
          </DialogTitle>
          <DialogDescription>
            {description ||
              (mode === "set"
                ? "Set a password to protect this note. You will need this password to view the note in the future."
                : "This note is password protected. Enter the password to view its contents.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10"
                disabled={isLoading}
                autoFocus
              />
              {validationError && (
                <p className="text-sm text-destructive mt-1">{validationError}</p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {mode === "set" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={`pr-10 ${isPasswordMismatch ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {isPasswordMismatch && <p className="text-sm text-destructive">Passwords do not match</p>}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || password.trim() === "" || (mode === "set" && (confirmPassword.trim() === "" || isPasswordMismatch))}
            >
              {isLoading ? "Processing..." : mode === "set" ? "Set Password" : "Unlock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
