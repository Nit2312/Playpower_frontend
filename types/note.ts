export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  isPasswordProtected: boolean
  password?: string
  tags: string[]
  summary?: string
}

export interface FormattingState {
  bold: boolean
  italic: boolean
  underline: boolean
  alignment: "left" | "center" | "right"
  fontSize: number
}
