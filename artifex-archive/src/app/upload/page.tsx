"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MediaType, Visibility } from "@prisma/client";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  File,
  X,
  Loader2,
  Image,
  Music,
  Video,
  Gamepad2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { TagsInput } from "@/components/ui/tags-input";
import { Label } from "@/components/ui/label";

// Form schema
const uploadSchema = z.object({
  // Step 1
  mediaType: z.nativeEnum(MediaType),
  // Step 2
  file: z
    .instanceof(File, { message: "Please upload a file" })
    .refine((file) => file.size <= 100 * 1024 * 1024, {
      message: "File size must be less than 100MB",
    }),
  // Step 3
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
  aiModelUsed: z.string().max(100, "AI model name is too long").optional(),
  promptSummary: z.string().max(1000, "Prompt summary is too long").optional(),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  license: z.enum(["CC0", "CC-BY", "CC-BY-SA", "CC-BY-NC", "CC-BY-NC-SA", "All Rights Reserved"]).optional(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const STEPS = [
  { id: 1, title: "Media Type", description: "Select the type of media" },
  { id: 2, title: "Upload File", description: "Upload your media file" },
  { id: 3, title: "Metadata", description: "Add details and tags" },
];

const MEDIA_TYPE_OPTIONS = [
  { value: MediaType.IMAGE, label: "Image", icon: Image },
  { value: MediaType.VIDEO, label: "Video", icon: Video },
  { value: MediaType.MUSIC, label: "Music", icon: Music },
  { value: MediaType.GAME, label: "Game", icon: Gamepad2 },
  { value: MediaType.TEXT, label: "Text", icon: FileText },
];

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<{
    uploadUrl: string;
    publicUrl: string;
    thumbnailUrl?: string;
  } | null>(null);

  const getUploadUrlMutation = trpc.media.getUploadUrl.useMutation();
  const createMediaMutation = trpc.media.create.useMutation();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      mediaType: MediaType.IMAGE,
      visibility: Visibility.PUBLIC,
      tags: [],
      description: "",
      aiModelUsed: "",
      promptSummary: "",
      license: "CC0",
    },
    mode: "onChange",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/upload");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const handleNext = async () => {
    let fieldsToValidate: (keyof UploadFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["mediaType"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["file"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type based on mediaType
    const mediaType = form.getValues("mediaType");
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    const validExtensions: Record<MediaType, string[]> = {
      [MediaType.IMAGE]: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
      [MediaType.VIDEO]: ["mp4", "webm", "mov", "avi"],
      [MediaType.MUSIC]: ["mp3", "wav", "ogg", "flac"],
      [MediaType.GAME]: ["zip", "rar", "7z", "exe", "app"],
      [MediaType.TEXT]: ["txt", "md", "pdf", "doc", "docx"],
    };

    if (
      fileExtension &&
      !validExtensions[mediaType].includes(fileExtension)
    ) {
      form.setError("file", {
        type: "manual",
        message: `Invalid file type for ${mediaType}. Allowed: ${validExtensions[mediaType].join(", ")}`,
      });
      return;
    }

    // Validate file size
    if (file.size > 100 * 1024 * 1024) {
      form.setError("file", {
        type: "manual",
        message: "File size must be less than 100MB",
      });
      return;
    }

    form.setValue("file", file);
    setUploadedFile(file);
    form.clearErrors("file");

    // Get presigned upload URL
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const result = await getUploadUrlMutation.mutateAsync({
        filename: file.name,
        mediaType: mediaType,
        contentType: file.type,
      });
      setUploadUrls(result);
      setIsUploading(false);
    } catch (error) {
      console.error("Failed to get upload URL:", error);
      form.setError("file", {
        type: "manual",
        message: "Failed to prepare upload. Please try again.",
      });
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const uploadFileToR2 = async (file: File, uploadUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const onSubmit = async (data: UploadFormValues) => {
    if (!uploadUrls || !uploadedFile) {
      form.setError("root", {
        type: "manual",
        message: "Please upload a file first.",
      });
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file directly to R2
      await uploadFileToR2(uploadedFile, uploadUrls.uploadUrl);
      setUploadProgress(100);

      // Step 2: Create media item with metadata
      const result = await createMediaMutation.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        mediaType: data.mediaType,
        mediaUrl: uploadUrls.publicUrl,
        thumbnailUrl: uploadUrls.thumbnailUrl,
        aiModelUsed: data.aiModelUsed || undefined,
        promptSummary: data.promptSummary || undefined,
        tags: data.tags,
        license: data.license || undefined,
        visibility: data.visibility,
      });

      toast.success("Uploaded! Share it with the world.", {
        description: "Your media has been uploaded and is now live.",
      });

      // Redirect to the new media item
      router.push(`/item/${result.id}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      form.setError("root", {
        type: "manual",
        message: error?.message || "Failed to upload. Please try again.",
      });
      toast.error("Upload failed", {
        description: error?.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upload Media</h1>
        <p className="text-muted-foreground mt-2">
          Share your AI-generated content with the community
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center flex-1 ${
                index < STEPS.length - 1 ? "mr-2" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <span className="text-sm">✓</span>
                ) : (
                  <span className="text-sm">{step.id}</span>
                )}
              </div>
              <p
                className={`text-xs mt-2 text-center ${
                  currentStep >= step.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.title}
              </p>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {STEPS[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Media Type */}
              {currentStep === 1 && (
                <FormField
                  control={form.control}
                  name="mediaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(value) =>
                            field.onChange(value as MediaType)
                          }
                          className="grid grid-cols-2 md:grid-cols-3 gap-4"
                        >
                          {MEDIA_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <div key={option.value}>
                                <RadioGroupItem
                                  value={option.value}
                                  id={option.value}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={option.value}
                                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                  <Icon className="mb-2 h-8 w-8" />
                                  <span className="text-sm font-medium">
                                    {option.label}
                                  </span>
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Step 2: File Upload */}
              {currentStep === 2 && (
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                            dragActive
                              ? "border-primary bg-primary/5"
                              : "border-muted"
                          }`}
                        >
                          {uploadedFile ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-2">
                                <File className="h-8 w-8 text-primary" />
                                <div className="text-left flex-1">
                                  <p className="font-medium">
                                    {uploadedFile.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {(uploadedFile.size / 1024 / 1024).toFixed(
                                      2
                                    )}{" "}
                                    MB
                                  </p>
                                </div>
                                {!isUploading && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setUploadedFile(null);
                                      setUploadUrls(null);
                                      setUploadProgress(0);
                                      form.setValue("file", undefined as any);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {isUploading && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Preparing upload...
                                    </span>
                                    <span className="text-muted-foreground">
                                      {uploadProgress > 0
                                        ? `${Math.round(uploadProgress)}%`
                                        : ""}
                                    </span>
                                  </div>
                                  {uploadProgress > 0 && (
                                    <Progress value={uploadProgress} />
                                  )}
                                </div>
                              )}
                              {uploadUrls && !isUploading && (
                                <div className="text-sm text-green-600 dark:text-green-400">
                                  ✓ Ready to upload
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  Drag and drop your file here, or click to
                                  browse
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Max file size: 100MB
                                </p>
                              </div>
                              <input
                                type="file"
                                accept={(() => {
                                  const mediaType = form.getValues("mediaType");
                                  const acceptMap: Record<MediaType, string> = {
                                    [MediaType.IMAGE]:
                                      "image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
                                    [MediaType.VIDEO]:
                                      "video/mp4,video/webm,video/quicktime,video/x-msvideo",
                                    [MediaType.MUSIC]:
                                      "audio/mpeg,audio/wav,audio/ogg,audio/flac",
                                    [MediaType.GAME]:
                                      "application/zip,application/x-rar-compressed,application/x-7z-compressed,application/x-msdownload,application/x-apple-diskimage",
                                    [MediaType.TEXT]:
                                      "text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                  };
                                  return acceptMap[mediaType] || "*/*";
                                })()}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileSelect(file);
                                  }
                                }}
                                className="hidden"
                                id="file-upload"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  document.getElementById("file-upload")?.click()
                                }
                              >
                                Select File
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Supported formats depend on the media type selected
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Step 3: Metadata */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a title for your media"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your media..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description of your content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiModelUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model Used</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Midjourney v6, DALL-E 3, Suno v3"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The AI model or tool used to create this content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="promptSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional: Share the prompt or prompt summary used..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional summary of the prompt used
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags *</FormLabel>
                        <FormControl>
                          <TagsInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Add tags..."
                          />
                        </FormControl>
                        <FormDescription>
                          Add at least one tag to help others discover your
                          content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="license"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a license" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CC0">CC0 (Public Domain)</SelectItem>
                              <SelectItem value="CC-BY">CC-BY (Attribution)</SelectItem>
                              <SelectItem value="CC-BY-SA">
                                CC-BY-SA (Attribution-ShareAlike)
                              </SelectItem>
                              <SelectItem value="CC-BY-NC">
                                CC-BY-NC (Attribution-NonCommercial)
                              </SelectItem>
                              <SelectItem value="CC-BY-NC-SA">
                                CC-BY-NC-SA
                                (Attribution-NonCommercial-ShareAlike)
                              </SelectItem>
                              <SelectItem value="All Rights Reserved">
                                All Rights Reserved
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={(value) =>
                                field.onChange(value as Visibility)
                              }
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={Visibility.PUBLIC}
                                  id="public"
                                />
                                <Label htmlFor="public" className="cursor-pointer">
                                  Public
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={Visibility.UNLISTED}
                                  id="unlisted"
                                />
                                <Label htmlFor="unlisted" className="cursor-pointer">
                                  Unlisted
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            Public: visible to everyone. Unlisted: only accessible
                            via direct link
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.formState.errors.root && (
                    <div className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || isUploading || !uploadUrls}>
                {isSubmitting || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading && uploadProgress > 0
                      ? `Uploading... ${Math.round(uploadProgress)}%`
                      : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

