"use client" ;

import React, { useState, useCallback } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import Image from "next/image";
import { useDropzone, Accept } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/app/loadingScreen";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

const compressImage = async (file: File, maxSizeMB: number = 1, maxWidthOrHeight: number = 1024): Promise<File | Blob> => {
  const image = document.createElement('img');
  const reader = new FileReader();

  // Load the image file into an HTMLImageElement
  reader.readAsDataURL(file);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

  image.src = dataUrl;

  await new Promise((resolve) => (image.onload = resolve));

  // Calculate new dimensions while keeping aspect ratio
  let { width, height } = image;
  if (width > height && width > maxWidthOrHeight) {
    height = (height * maxWidthOrHeight) / width;
    width = maxWidthOrHeight;
  } else if (height > width && height > maxWidthOrHeight) {
    width = (width * maxWidthOrHeight) / height;
    height = maxWidthOrHeight;
  }

  // Create a canvas to resize the image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(image, 0, 0, width, height);

  // Compress the image by reducing quality
  const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7); // 70% quality to reduce size
  const compressedBlob = await (await fetch(compressedDataUrl)).blob();

  // Ensure the compressed file is under the specified MB limit
  if (compressedBlob.size / 1024 / 1024 > maxSizeMB) {
    throw new Error("Compressed image exceeds the maximum allowed size");
  }

  return new File([compressedBlob], file.name, { type: "image/jpeg" });
};


export const ImageUpload: React.FC = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [chapterTitle, setChapterTitle] = useState("");
    const [chapterPages, setChapterPages] = useState<File[]>([]);
    const [chapterPagePreviews, setChapterPagePreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const user = useCurrentUser();
    const router = useRouter();

    const validateFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image`);
        }
        console.log(`Validating file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
        return true;
    };

    const handleFile = async (file: File): Promise<File> => {
        try {
            validateFile(file);
            console.log(`Processing file: ${file.name}`);
            return file;
        } catch (err) {
            console.error('Error handling file:', err);
            throw err;
        }
    };

    const onCoverDrop = useCallback(async (acceptedFiles: File[]) => {
        try {
            setError(null);
            if (acceptedFiles.length === 0) {
                throw new Error('No file selected');
            }

            const file = acceptedFiles[0];
            console.log(`Cover image selected: ${file.name}, Size: ${file.size}`);

            const processedFile = await handleFile(file);
            setCoverImage(processedFile);

            const objectUrl = URL.createObjectURL(processedFile);
            setCoverImagePreview(objectUrl);

            console.log('Cover image processed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process cover image';
            console.error('Cover image error:', errorMessage);
            setError(errorMessage);
        }
    }, []);

    const onChapterPagesDrop = useCallback(async (acceptedFiles: File[]) => {
        try {
            setError(null);
            console.log(`${acceptedFiles.length} chapter pages selected`);

            const processedFiles = await Promise.all(
                acceptedFiles.map(file => handleFile(file))
            );

            setChapterPages(prevPages => [...prevPages, ...processedFiles]);
            
            const newPreviews = processedFiles.map(file => URL.createObjectURL(file));
            setChapterPagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
            
            console.log('Chapter pages processed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process chapter pages';
            console.error('Chapter pages error:', errorMessage);
            setError(errorMessage);
        }
    }, []);

    const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps } = useDropzone({
        onDrop: onCoverDrop,
        accept: { 'image/*': [] } as Accept,
        maxFiles: 1,
        multiple: false
    });

    const { getRootProps: getChapterRootProps, getInputProps: getChapterInputProps } = useDropzone({
        onDrop: onChapterPagesDrop,
        accept: { 'image/*': [] } as Accept,
        multiple: true
    });

    const removeChapterPage = (index: number) => {
        setChapterPages(prevPages => prevPages.filter((_, i) => i !== index));
        setChapterPagePreviews(prevPreviews => {
            URL.revokeObjectURL(prevPreviews[index]);
            return prevPreviews.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUploading(true);
        setError(null);

        try {
            if (!coverImage) {
                throw new Error("No cover image selected");
            }

            console.log('Starting upload...');
            
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('categories', JSON.stringify(categories));
            formData.append('coverImage', coverImage);
            formData.append('chapterTitle', chapterTitle);

            chapterPages.forEach((page, index) => {
                formData.append(`chapterPages`, page);
            });

            const response = await fetch('/api/upload-manga', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Upload failed');
            }

            const result = await response.json();
            console.log('Upload successful:', result);

            // Clean up
            chapterPagePreviews.forEach(preview => URL.revokeObjectURL(preview));
            if (coverImagePreview) {
                URL.revokeObjectURL(coverImagePreview);
            }

            // Reset form
            setTitle("");
            setDescription("");
            setCategories([]);
            setCoverImage(null);
            setCoverImagePreview(null);
            setChapterTitle("");
            setChapterPages([]);
            setChapterPagePreviews([]);

            if ((user?.user?.role as UserRole) === "ADMIN") {
                router.push("/admin");
            } else {
                router.push("/profile");
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload manga';
            console.error('Upload error:', error);
            setError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 relative">
            {isUploading && <LoadingScreen />}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <h1 className="text-2xl font-bold mb-4">Upload Manga</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="title">Manga Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor="categories">Categories (comma-separated)</Label>
                    <Input
                        id="categories"
                        value={categories.join(", ")}
                        onChange={(e) => setCategories(e.target.value.split(", "))}
                    />
                </div>

                <div>
                    <Label>Cover Image</Label>
                    <div {...getCoverRootProps()} className="border-2 border-dashed p-4 text-center cursor-pointer">
                        <input {...getCoverInputProps()} />
                        {coverImagePreview ? (
                            <div className="mt-2 relative w-[200px] h-[200px]">
                                <Image 
                                    src={coverImagePreview} 
                                    alt="Cover preview"
                                    fill
                                    sizes="200px"
                                    style={{ objectFit: "contain" }}
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <p>Drag and drop a cover image here, or click to select one</p>
                        )}
                    </div>
                </div>

                <div>
                    <Label htmlFor="chapterTitle">Chapter Title</Label>
                    <Input
                        id="chapterTitle"
                        value={chapterTitle}
                        onChange={(e) => setChapterTitle(e.target.value)}
                    />
                </div>

                <div>
                    <Label>Chapter Pages</Label>
                    <div {...getChapterRootProps()} className="border-2 border-dashed p-4 text-center cursor-pointer">
                        <input {...getChapterInputProps()} />
                        {chapterPagePreviews.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4 mt-2">
                                {chapterPagePreviews.map((preview, index) => (
                                    <div key={index} className="relative w-[100px] h-[100px] group">
                                        <Image 
                                            src={preview} 
                                            alt={`Page ${index + 1}`}
                                            fill
                                            sizes="100px"
                                            style={{ objectFit: "contain" }}
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeChapterPage(index)}
                                            className="absolute top-1 right-1 bg-gray-200 text-gray-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Drag and drop chapter pages here, or click to select them</p>
                        )}
                    </div>
                </div>

                <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload Manga'}
                </Button>
            </form>
        </div>
    );
} ;