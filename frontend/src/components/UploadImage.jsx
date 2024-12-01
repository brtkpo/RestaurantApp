import React, { useRef, useState } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

const UploadImage = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const cropperRef = useRef(null);

  // Obsługa wczytywania pliku
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFile(file);
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Funkcja do przesyłania obrazu na Cloudinary
  const handleUpload = () => {
    if (!cropperRef.current) return;

    setLoading(true);
    const cropper = cropperRef.current.cropper;

    // Pobieranie przyciętego obrazu jako Blob
    cropper.getCroppedCanvas({
      width: 300, // Szerokość obrazu wyjściowego (zmień wg potrzeb)
      height: 400, // Wysokość obrazu wyjściowego (zmień wg potrzeb)
    }).toBlob((blob) => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "ml_default"); // Twój upload preset
      formData.append("cloud_name", "dljau5sfr"); // Twoja nazwa chmury

      // Wysyłanie na Cloudinary
      fetch("https://api.cloudinary.com/v1_1/dljau5sfr/image/upload", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          setLoading(false);
          const imagePath = `image/upload/v${data.version}/${data.public_id}`;
          setImageUrl(data.secure_url);
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
    });
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <input type="file" onChange={handleFileChange} />
      {imageUrl && (
        <div>
          <Cropper
            src={imageUrl}
            style={{ height: 400, width: "100%" }}
            initialAspectRatio={4 / 3} // Proporcje obrazu
            aspectRatio={4 / 3} // Proporcje obrazu
            guides={false}
            ref={cropperRef}
          />
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Uploading..." : "Upload Cropped Image"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
