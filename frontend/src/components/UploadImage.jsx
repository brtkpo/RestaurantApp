import React, { useRef, useState } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

const UploadImage = ({ onUploadSuccess, metadata }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null); // Referencja do pola input typu file

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
      width: 300, // Szerokość obrazu wyjściowego
      height: 400, // Wysokość obrazu wyjściowego
    }).toBlob((blob) => {
      const formData = new FormData();
      formData.append("file", blob);

      // Tworzymy public_id z danych restauracji
      const publicId = `${metadata.id}_${metadata.name.replace(/\s+/g, "_")}`; // np. "123_Main_Restaurant"
      formData.append("public_id", publicId);

      formData.append("upload_preset", "ml_default"); // Twój upload preset
      formData.append("cloud_name", "dljau5sfr"); // Twoja nazwa chmury

      // Wysyłanie zapytania do Django w celu uzyskania podpisu i innych danych
      fetch("http://localhost:8000/api/generate-signature/?public_id=" + publicId)
        .then((res) => res.json())
        .then((data) => {
          console.log("Backend signature data:", data); // Debugging: sprawdzanie odpowiedzi z backendu

          formData.append("api_key", data.api_key);
          formData.append("timestamp", data.timestamp);
          formData.append("signature", data.signature);

          // Wysyłanie na Cloudinary
          fetch("https://api.cloudinary.com/v1_1/dljau5sfr/image/upload", {
            method: "POST",
            body: formData,
          })
            .then((res) => res.json())
            .then((data) => {
              setLoading(false);
              console.log('Cloudinary response:', data); // Debugging: odpowiedź z Cloudinary

              const imagePath = `image/upload/v${data.version}/${data.public_id}`;
              setImageUrl(data.secure_url);

              // Wywołanie callbacku z danymi obrazu
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
          console.error("Error getting signature:", error); // Debugging: błąd podczas pobierania podpisu z backendu
        });
    });
  };

  // Funkcja do anulowania załadowanego zdjęcia
  const handleCancel = () => {
    setFile(null);
    setImageUrl(null);

    // Resetuje wartość pola input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      {/*<h2>Upload Image</h2>*/}
      <input type="file" onChange={handleFileChange} ref={fileInputRef} />
      {imageUrl && (
        <div>
          <Cropper
            src={imageUrl}
            style={{ height: 400, width: "100%" }}
            initialAspectRatio={4 / 3} // Proporcje obrazu
            aspectRatio={4 / 3} // Proporcje obrazu
            guides={false}
            viewMode={1} 
            ref={cropperRef}
          />
          <div>
            <button onClick={handleUpload} disabled={loading}>
              {loading ? "Uploading..." : "Upload Cropped Image"}
            </button>
            <button onClick={handleCancel} disabled={loading} style={{ marginLeft: "10px" }}>
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadImage;
