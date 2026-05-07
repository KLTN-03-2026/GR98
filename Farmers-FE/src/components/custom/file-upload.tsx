"use client"

import type React from "react"
import { useState, useRef, useCallback, type DragEvent, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileIcon, X, Image as ImageIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type UploadStatus = "idle" | "dragging" | "success" | "error"

interface FileUploadProps {
  onFilesSelect?: (files: File[]) => void
  onFileSelect?: (file: File) => void
  onFileError?: (error: string) => void
  onFileRemove?: () => void
  maxFileSize?: number // in bytes
  currentFile?: File | null
  acceptedFileTypes?: string[] // e.g., [".pdf", ".jpg", ".png"] or ["image/*", "application/pdf"]
  multiple?: boolean
}

export default function FileUpload({
  onFileSelect,
  onFileError,
  onFileRemove,
  maxFileSize = 10 * 1024 * 1024, // Default 10MB
  currentFile: initialFile = null,
  acceptedFileTypes = ["image/*"], // Default chỉ cho phép image
  multiple = false,
  onFilesSelect,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>(multiple && initialFile ? [initialFile] : [])
  const [file, setFile] = useState<File | null>(!multiple ? initialFile : null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync previews for multiple files
  useEffect(() => {
    if (multiple && files.length > 0) {
      const urls = files.map(f => URL.createObjectURL(f))
      setPreviewUrls(urls)
      setStatus("success")
      return () => urls.forEach(url => URL.revokeObjectURL(url))
    } else if (multiple) {
      setPreviewUrls([])
      setStatus("idle")
    }
  }, [files, multiple])

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

  const handleFilesSelect = useCallback(
    (selectedFiles: File[]) => {
      if (!selectedFiles.length) return

      const validFiles: File[] = []
      for (const file of selectedFiles) {
        if (handleFileValidation(file)) {
          validFiles.push(file)
        }
      }

      if (!validFiles.length) return

      if (multiple) {
        const newFiles = [...files, ...validFiles]
        setFiles(newFiles)
        setError(null)
        setStatus("success")
        if (onFilesSelect) onFilesSelect(validFiles)
      } else {
        const fileToSet = validFiles[0]
        if (selectedFiles.length > 1) {
          toast.info("Chỉ nhận 1 ảnh đại diện, đã tự động chọn ảnh đầu tiên")
        }
        setFile(fileToSet)
        setError(null)
        setStatus("success")
        if (onFileSelect) onFileSelect(fileToSet)
      }
    },
    [handleFileValidation, onFileSelect, onFilesSelect, multiple, files],
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
      if (status === "success" && !multiple) return

      setStatus("idle")
      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length) {
        handleFilesSelect(droppedFiles)
      }
    },
    [status, handleFilesSelect, multiple],
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    handleFilesSelect(selectedFiles)
    if (e.target) e.target.value = ""
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = (index?: number) => {
    if (multiple && index !== undefined) {
      const newFiles = [...files]
      newFiles.splice(index, 1)
      setFiles(newFiles)
      if (newFiles.length === 0) setStatus("idle")
      // Logic xóa thực tế thường được xử lý ở parent thông qua URL
    } else {
      resetState()
      if (onFileRemove) {
        onFileRemove()
      }
    }
  }

  const resetState = () => {
    setFile(null)
    setFiles([])
    setStatus("idle")
    setError(null)
    setPreviewUrl(null)
    setPreviewUrls([])
    setImageDimensions(null)
  }

  return (
    <Card className={cn(
      "w-full max-w-md mx-auto transition-all duration-300",
      status === "dragging" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-slate-200"
    )}>
      <CardContent 
        className="px-4 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {status === "dragging" && (
          <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-[2px] flex flex-col items-center justify-center border-2 border-dashed border-primary rounded-xl pointer-events-none animate-in fade-in duration-200">
            <UploadCloud className="size-10 text-primary animate-bounce" />
            <p className="text-sm font-black text-primary uppercase tracking-widest mt-2">Thả vào đây để thêm</p>
          </div>
        )}

        {status === "success" ? (
          <div className="space-y-4 py-2 relative">
            {multiple && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm hover:text-primary hover:border-primary transition-all z-20 group/add"
                onClick={triggerFileInput}
                title="Thêm ảnh mới"
              >
                <Plus className="size-4 group-hover/add:scale-110 transition-transform" />
              </Button>
            )}
            
            {multiple ? (
              <div className="grid grid-cols-3 gap-3">
                {previewUrls.map((url, i) => (
                  <div 
                    key={i} 
                    className="relative aspect-square rounded-xl overflow-hidden border bg-white group cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1">
                      <Plus className="size-4 text-white" />
                      <span className="text-[6px] font-black text-white uppercase tracking-tighter">Thêm ảnh</span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 rounded-full z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(i);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div 
                  className="aspect-square rounded-xl border border-dashed border-primary/30 flex flex-col items-center justify-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all group/slot border-2"
                  onClick={triggerFileInput}
                >
                  <div className="size-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-primary/20 group-hover/slot:scale-110 transition-transform">
                    <Plus className="size-4 text-primary" />
                  </div>
                  <span className="text-[8px] font-black text-primary uppercase mt-2 tracking-widest">Thêm tiếp</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 animate-in fade-in zoom-in-95 duration-300">
                <div 
                  className="relative group cursor-pointer w-full max-w-[240px] aspect-square mx-auto rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm transition-all hover:border-primary/30"
                  onClick={triggerFileInput}
                >
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                        <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                          <UploadCloud className="size-5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Thay đổi ảnh đại diện</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-300">
                      <ImageIcon className="size-12 opacity-20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Chưa có ảnh</span>
                    </div>
                  )}
                  
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-3 right-3 h-7 w-7 rounded-full z-10 shadow-lg scale-90 group-hover:scale-100 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {file && (
                  <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-2 max-w-full">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[150px]">
                      {file.name}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">
                      ({formatBytes(file.size)})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : status === "idle" || status === "dragging" ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              status === "dragging"
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
            )}
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

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptAttribute()}
          className="sr-only"
          onChange={handleFileInputChange}
        />
      </CardContent>
    </Card>
  )
}