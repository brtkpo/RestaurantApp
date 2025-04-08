import React, { useRef, useState } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

const UploadImage = ({ onUploadSuccess, metadata, isLoaded, setIsLoaded }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const cropperRef = useRef(null);
  const [showCropper, setShowCropper] = useState(true); 
  const fileInputRef = useRef(null); 

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFile(file);
        setShowCropper(true);
        setImageUrl(reader.result);
        if (setIsLoaded) {
          setIsLoaded(true); 
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!cropperRef.current) {
      if (setIsLoaded) {
        setIsLoaded(true); 
      }
      return;
    }

    setLoading(true);
    const cropper = cropperRef.current.cropper;

    cropper.getCroppedCanvas({
      width: 300, 
      height: 400, 
    }).toBlob((blob) => {
      const formData = new FormData();
      formData.append("file", blob);

      const publicId = `${metadata.id}_${metadata.name.replace(/\s+/g, "_")}`; 
      formData.append("public_id", publicId);

      formData.append("upload_preset", "ml_default");
      formData.append("cloud_name", "dljau5sfr"); 

      fetch("http://localhost:8000/api/generate-signature/?public_id=" + publicId)
        .then((res) => res.json())
        .then((data) => {
          console.log("Backend signature data:", data); 

          formData.append("api_key", data.api_key);
          formData.append("timestamp", data.timestamp);
          formData.append("signature", data.signature);

          fetch("https://api.cloudinary.com/v1_1/dljau5sfr/image/upload", {
            method: "POST",
            body: formData,
          })
            .then((res) => res.json())
            .then((data) => {
              setLoading(false);
              console.log('Cloudinary response:', data); 

              const imagePath = `image/upload/v${data.version}/${data.public_id}`;
              setImageUrl(data.secure_url);
              setShowCropper(false);

              if (onUploadSuccess) {
                onUploadSuccess({
                  publicId: data.public_id,
                  version: data.version,
                  path: imagePath,
                });
              }
            })
            .catch((error) => {
              setLoading(false);
              console.error("Error uploading image:", error);
            });
        })
        .catch((error) => {
          console.error("Error getting signature:", error); 
        });
    });
    if (setIsLoaded) {
      setIsLoaded(false); 
    }
  };

  const handleCancel = () => {
    setFile(null);
    setImageUrl(null);
    if (setIsLoaded) {
      setIsLoaded(false); 
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div>
        <input type="file" onChange={handleFileChange} ref={fileInputRef} class="block w-full px-3 py-2 mt-2 mb-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg file:bg-gray-200 file:text-gray-700 file:text-sm file:px-4 file:py-1 file:border-none file:rounded-full dark:file:bg-gray-800 dark:file:text-gray-200 dark:text-gray-300 placeholder-gray-400/70 dark:placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:focus:border-blue-300" />
      </div>

      {imageUrl && showCropper && (
        <div>
          <Cropper
            src={imageUrl}
            style={{ height: 400, width: "100%" }}
            initialAspectRatio={4 / 3} 
            aspectRatio={4 / 3} 
            guides={false}
            viewMode={1} 
            ref={cropperRef}
          />
          <div className="mt-2 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2">
            <button type="button" onClick={handleCancel} disabled={loading} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
              Anuluj
            </button>
            <button type="submit" onClick={handleUpload} disabled={loading} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
            {loading ? 'Dodawanie' : 'Dodaj'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
