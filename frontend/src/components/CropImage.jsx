import React, { useRef, useState } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

const CropImage = ({ onCropSuccess }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleCrop = () => {
    if (!cropperRef.current) return;

    const cropper = cropperRef.current.cropper;
    cropper.getCroppedCanvas({
      width: 300,
      height: 400,
    }).toBlob((blob) => {
      onCropSuccess(blob);
    });
  };

  const handleCancel = () => {
    setFile(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} ref={fileInputRef} />
      {imageUrl && (
        <div>
          <Cropper
            src={imageUrl}
            style={{ height: 400, width: "100%" }}
            initialAspectRatio={4 / 3}
            aspectRatio={4 / 3}
            guides={false}
            viewMode={1} // Ustawienie viewMode na 1, aby nie można było wyjść poza obszar obrazu
            ref={cropperRef}
          />
          <div>
            <button onClick={handleCrop}>Crop Image</button>
            <button onClick={handleCancel} style={{ marginLeft: "10px" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropImage;