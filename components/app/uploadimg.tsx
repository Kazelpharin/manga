/* eslint-disable react/no-unescaped-entities */
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
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

export const ImageUpload = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [chapterTitle, setChapterTitle] = useState("");
    const [chapterPages, setChapterPages] = useState<File[]>([]);
    const [chapterPagePreviews, setChapterPagePreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const user = useCurrentUser();
    const router = useRouter();

    console.log(user);
    const onCoverDrop = useCallback((acceptedFiles: File[]) => {
        setCoverImage(acceptedFiles[0]);
        const reader = new FileReader();
        reader.onload = (e) => {
          setCoverImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(acceptedFiles[0]);
      }, []);
    
      const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps } = useDropzone({
        onDrop: onCoverDrop,
        accept: { 'image/*': [] } as Accept,
        maxFiles: 1,
      });
    
      const onChapterPagesDrop = useCallback((acceptedFiles: File[]) => {
        setChapterPages(prevPages => [...prevPages, ...acceptedFiles]);
        const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
        setChapterPagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      }, []);
    
      const { getRootProps: getChapterRootProps, getInputProps: getChapterInputProps } = useDropzone({
        onDrop: onChapterPagesDrop,
        accept: { 'image/*': [] } as Accept,
        multiple: true,
      });
    
      const removeChapterPage = (index: number) => {
        setChapterPages(prevPages => prevPages.filter((_, i) => i !== index));
        setChapterPagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
      };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsUploading(true);
      setUploadProgress(0);
    
      if (!coverImage) {
        console.error("No cover image selected");
        setIsUploading(false);
        return;
      }
  
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('categories', JSON.stringify(categories));
      formData.append('coverImage', coverImage);
      formData.append('chapterTitle', chapterTitle);
      chapterPages.forEach((page, index) => {
        formData.append(`chapterPages`, page);
      });
  
      try {
        const response = await fetch('/api/upload-manga', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Upload failed');
        }
  
        const result = await response.json();
        console.log('Upload successful:', result);
  
        // Reset form
        setTitle("");
        setDescription("");
        setCategories([]);
        setCoverImage(null);
        setChapterTitle("");
        setChapterPages([]);

        if((user?.user?.role as UserRole) === "ADMIN"){
          router.push("/admin");
        }else{
          router.push("/profile");
        }

      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    };
  return (   
     <div className="container mx-auto p-4 relative">
            {isUploading && <LoadingScreen />}

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
            <div className="mt-2">
              <Image src={coverImagePreview} alt="Cover preview" width={200} height={200} objectFit="contain" />
            </div>
          ) : (
            <p>Drag 'n' drop a cover image here, or click to select one</p>
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
                  <div key={index} className="relative group">
                    <Image src={preview} alt={`Page ${index + 1}`} width={100} height={100} objectFit="contain" />
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
              <p>Drag 'n' drop chapter pages here, or click to select them</p>
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

