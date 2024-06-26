"use client";
import axios from "axios";
import React, { useState } from "react";

const UploaderForm = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file && file.name && file.type) {
      const response = await axios.post(process.env.NEXT_PUBLIC_WS_URL || '', {
        fileName: file.name,
        fileType: file.type
      });

      const { signed_url } = response.data;
      alert(signed_url);

      await axios.put(signed_url, file, {
        headers: {
          "Content-Type": file.type,
        },
      });
    }
  };

  return (
    <div>
      <input name="file" type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default UploaderForm;
