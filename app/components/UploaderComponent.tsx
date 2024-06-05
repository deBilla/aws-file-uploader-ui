"use client";
import React, { useState, ChangeEvent } from "react";
import axios from "axios";

const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    try {
      const createMultipartUploadResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_UPLOAD_WS}/create-multipart-upload`,
        {
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }
      );

      const { UploadId } = createMultipartUploadResponse.data;

      const partSize = 5 * 1024 * 1024; // 5MB
      const parts = Math.ceil(selectedFile.size / partSize);
      const multipartMap = {
        Parts: [] as Array<{ ETag: string; PartNumber: number }>,
      };

      for (let partNumber = 1; partNumber <= parts; partNumber++) {
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, selectedFile.size);
        const blob = selectedFile.slice(start, end);

        const presignedUrlResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_UPLOAD_WS}/generate-presigned-url`,
          {
            uploadId: UploadId,
            partNumber,
            fileName: selectedFile.name,
          }
        );

        const { url } = presignedUrlResponse.data;

        const uploadPartResponse = await axios.put(url, blob, {
          headers: {
            "Content-Type": selectedFile.type,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total!
            );
            setUploadProgress(
              Math.round(((partNumber - 1 + progress / 100) * 100) / parts)
            );
          },
        });

        multipartMap.Parts.push({
          ETag: uploadPartResponse.headers.etag,
          PartNumber: partNumber,
        });
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_UPLOAD_WS}/complete-multipart-upload`,
        {
          uploadId: UploadId,
          fileName: selectedFile.name,
          parts: multipartMap.Parts,
        }
      );

      setUploadProgress(100);
      alert("Upload completed successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadFile} disabled={!selectedFile}>
        Upload
      </button>
      {uploadProgress > 0 && <div>Upload Progress: {uploadProgress}%</div>}
    </div>
  );
};

export default FileUpload;
