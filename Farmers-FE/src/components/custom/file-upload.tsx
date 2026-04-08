"use client"

import type React from "react"
import { useState, useRef, useCallback, type DragEvent, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileIcon, X } from "lucide-react"

type UploadStatus = "idle" | "dragging" | "success" | "error"

interface FileUploadProps {
  onFileSelect?: (file: File) => void
  onFileError?: (error: string) => void
  onFileRemove?: () => void
  maxFileSize?: number // in bytes
  currentFile?: File | null
  acceptedFileTypes?: string[] // e.g., [".pdf", ".jpg", ".png"] or ["image/*", "application/pdf"]
}

export default function FileUpload({
  onFileSelect,
  onFileError,
  onFileRemove,
  maxFileSize = 10 * 1024 * 1024, // Default 10MB
  currentFile: initialFile = null,
  acceptedFileTypes = ["image/*"], // Default chỉ cho phép image
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync với currentFile prop khi nó thay đổi từ bên ngoài
  useEffect(() => {
    setFile(initialFile)
    if (!initialFile) {
      setStatus("idle")
      setError(null)
      setPreviewUrl(null)
      setImageDimensions(null)
    }
  }, [initialFile])

  useEffect(() => {
    if (file?.type?.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // Lấy dimensions của ảnh
      const img = new Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = url
      
      return () => {
        URL.revokeObjectURL(url)
        setImageDimensions(null)
      }
    }
    return () => {
      setPreviewUrl(null)
      setImageDimensions(null)
    }
  }, [file])

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (!+bytes) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const unit = sizes[i] || sizes[sizes.length - 1]

    return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`
  }

  const isValidFileType = useCallback(
    (file: File): boolean => {
      if (!acceptedFileTypes || acceptedFileTypes.length === 0) return true

      const fileName = file.name.toLowerCase()
      const fileType = file.type.toLowerCase()

      return acceptedFileTypes.some((acceptedType) => {
        // Nếu là MIME type pattern như "image/*"
        if (acceptedType.includes("*")) {
          const baseType = acceptedType.split("/")[0]
          return fileType.startsWith(`${baseType}/`)
        }
        // Nếu là extension như ".pdf", ".jpg"
        if (acceptedType.startsWith(".")) {
          return fileName.endsWith(acceptedType.toLowerCase())
        }
        // Nếu là MIME type đầy đủ như "application/pdf"
        return fileType === acceptedType.toLowerCase()
      })
    },
    [acceptedFileTypes],
  )

  const getAcceptedTypesDisplay = useCallback((): string => {
    if (!acceptedFileTypes || acceptedFileTypes.length === 0) return "All files"
    if (acceptedFileTypes.length === 1 && acceptedFileTypes[0] === "image/*") {
      return "Images only (PNG, JPG, JPEG, GIF, WEBP)"
    }
    return acceptedFileTypes.map((type) => type.replace("*", "")).join(", ")
  }, [acceptedFileTypes])

  // Chuyển đổi acceptedFileTypes thành format cho accept attribute
  // Ví dụ: ["image/*"] -> "image/jpeg,image/png,image/gif,image/webp"
  const getAcceptAttribute = useCallback((): string => {
    if (!acceptedFileTypes || acceptedFileTypes.length === 0) return "*"
    
    // Nếu có image/*, thay thế bằng các extension cụ thể để trình duyệt filter tốt hơn
    if (acceptedFileTypes.length === 1 && acceptedFileTypes[0] === "image/*") {
      return "image/jpeg,image/jpg,image/png,image/gif,image/webp"
    }
    
    return acceptedFileTypes.join(",")
  }, [acceptedFileTypes])

  const handleFileValidation = useCallback(
    (selectedFile: File): boolean => {
      setError(null)
      // type validation: check against acceptedFileTypes
      if (!isValidFileType(selectedFile)) {
        const acceptedTypesStr = acceptedFileTypes?.join(", ") || "accepted types"
        const err = `File type not allowed. Accepted types: ${acceptedTypesStr}`
        setError(err)
        setStatus("error")
        if (onFileError) onFileError(err)
        return false
      }
      if (maxFileSize && selectedFile.size > maxFileSize) {
        const err = `File size exceeds the limit of ${formatBytes(maxFileSize)}.`
        setError(err)
        setStatus("error")
        if (onFileError) onFileError(err)
        return false
      }
      return true
    },
    [maxFileSize, onFileError, isValidFileType, acceptedFileTypes],
  )

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return

      if (!handleFileValidation(selectedFile)) {
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
      setStatus("success")
      if (onFileSelect) {
        onFileSelect(selectedFile)
      }
    },
    [handleFileValidation, onFileSelect],
  )

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (status !== "success") {
        setStatus("dragging")
      }
    },
    [status],
  )

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (status === "dragging") {
        setStatus("idle")
      }
    },
    [status],
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (status === "success") return

      setStatus("idle")
      const droppedFile = e.dataTransfer.files?.[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [status, handleFileSelect],
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    handleFileSelect(selectedFile || null)
    if (e.target) e.target.value = ""
  }

  const triggerFileInput = () => {
    if (status === "success") return
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    resetState()
    if (onFileRemove) {
      onFileRemove()
    }
  }

  const resetState = () => {
    setFile(null)
    setStatus("idle")
    setError(null)
    setPreviewUrl(null)
    setImageDimensions(null)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="px-4">
        {file ? (
          <div className={previewUrl ? "grid grid-cols-2 gap-4" : "space-y-3"}>
            <div className="relative">
              {previewUrl ? (
                <div className="w-full aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt={`Preview of ${file.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-32 h-32 rounded-lg border bg-muted">
                  <FileIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium truncate" title={file.name}>
                {file.name}
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span>Size: </span>
                    <span className="font-medium">{formatBytes(file.size)}</span>
                  </div>
                  <div>
                    <span>Type: </span>
                    <span className="font-medium">{file.type.split("/")[1]?.toUpperCase() || "Unknown"}</span>
                  </div>
                </div>
                {imageDimensions && (
                  <div>
                    <span>Dimensions: </span>
                    <span className="font-medium">
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  </div>
                )}
                <div>
                  <span>Last modified: </span>
                  <span className="font-medium">
                    {new Date(file.lastModified).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : status === "idle" || status === "dragging" ? (
          <div
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              status === "dragging"
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <UploadCloud className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {getAcceptedTypesDisplay()}
              {maxFileSize && ` • Max ${formatBytes(maxFileSize)}`}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptAttribute()}
              className="sr-only"
              onChange={handleFileInputChange}
            />
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <X className="w-12 h-12 text-destructive" />
            <div>
              <p className="font-medium text-destructive">File Selection Failed</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error || "An unknown error occurred."}</p>
            </div>
            <Button onClick={resetState} variant="outline">
              Try Again
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}