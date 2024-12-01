import React, { useState } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

const UploadImage = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const cropperRef = useRef(null);

  // Funkcja do obsługi zmiany pliku
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Funkcja do obsługi przesyłania pliku na Cloudinary
  const handleUpload = () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default"); // Twój upload_preset
    formData.append("cloud_name", "dljau5sfr"); // Twoja nazwa chmury

    fetch("https://api.cloudinary.com/v1_1/dljau5sfr/image/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);

        // Tworzenie ścieżki na podstawie odpowiedzi Cloudinary
        const imagePath = `image/upload/v${data.version}/${data.public_id}`;

        // Przechowywanie URL do podglądu
        setImageUrl(data.secure_url);

        // Wywołanie callbacku z obiektem odpowiedzi Cloudinary
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
  };

  return (
    <div>
      <h2>Upload Image to Cloudinary</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Image"}
      </button>

      {imageUrl && (
        <div>
          <h3>Image uploaded:</h3>
          <img src={imageUrl} alt="Uploaded" width="200" />
        </div>
      )}
    </div>
  );
};

export default UploadImage;
