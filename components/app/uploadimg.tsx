"use client";

import React, { useState, useCallback } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import Image from "next/image";
import { useDropzone, Accept } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/app/loadingScreen";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

const MAX_TOTAL_SIZE_MB = 20; // Maximum total size in MB

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
    const [totalSize, setTotalSize] = useState(0); // Total size in bytes

    const user = useCurrentUser();
    const router = useRouter();

    const updateTotalSize = (files: File[], removedSize = 0) => {
        const coverSize = coverImage?.size || 0;
        const pagesSize = files.reduce((acc, file) => acc + file.size, 0);
        setTotalSize(coverSize + pagesSize - removedSize);
    };

    const validateFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image`);
        }
        const newTotalSize = totalSize + file.size;
        if (newTotalSize / (1024 * 1024) > MAX_TOTAL_SIZE_MB) {
            throw new Error(`Adding this file would exceed the ${MAX_TOTAL_SIZE_MB}MB limit`);
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
            updateTotalSize([...chapterPages, processedFile]);

            const objectUrl = URL.createObjectURL(processedFile);
            setCoverImagePreview(objectUrl);

            console.log('Cover image processed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process cover image';
            console.error('Cover image error:', errorMessage);
            setError(errorMessage);
        }
    }, [chapterPages, totalSize]);

    const onChapterPagesDrop = useCallback(async (acceptedFiles: File[]) => {
        try {
            setError(null);
            console.log(`${acceptedFiles.length} chapter pages selected`);

            const processedFiles = await Promise.all(
                acceptedFiles.map(file => handleFile(file))
            );

            setChapterPages(prevPages => {
                const newPages = [...prevPages, ...processedFiles];
                updateTotalSize(newPages);
                return newPages;
            });
            
            const newPreviews = processedFiles.map(file => URL.createObjectURL(file));
            setChapterPagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
            
            console.log('Chapter pages processed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process chapter pages';
            console.error('Chapter pages error:', errorMessage);
            setError(errorMessage);
        }
    }, [totalSize]);

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
        const removedSize = chapterPages[index].size;
        setChapterPages(prevPages => {
            const newPages = prevPages.filter((_, i) => i !== index);
            updateTotalSize(newPages);
            return newPages;
        });
        setChapterPagePreviews(prevPreviews => {
            URL.revokeObjectURL(prevPreviews[index]);
            return prevPreviews.filter((_, i) => i !== index);
        });
    };

    const clearAllChapterPages = () => {
        chapterPagePreviews.forEach(preview => URL.revokeObjectURL(preview));
        setChapterPages([]);
        setChapterPagePreviews([]);
        updateTotalSize([]);
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
            setTotalSize(0);

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
            <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                    Total Size: {(totalSize / (1024 * 1024)).toFixed(2)}MB / {MAX_TOTAL_SIZE_MB}MB
                </span>
            </div>
            
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
                    <div className="flex justify-between items-center mb-2">
                        <Label>Chapter Pages</Label>
                        {chapterPages.length > 0 && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={clearAllChapterPages}
                                className="flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Clear All Pages
                            </Button>
                        )}
                    </div>
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
};