import React, { useState } from "react";

const UploadImage2 = ({ imageBlob, onUploadSuccess, metadata }) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = () => {
    if (!imageBlob) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", imageBlob);

    const publicId = `${metadata.id}_${metadata.name.replace(/\s+/g, "_")}`;
    formData.append("public_id", publicId);
    formData.append("upload_preset", "ml_default");
    formData.append("cloud_name", "dljau5sfr");

    fetch(`http://localhost:8000/api/generate-signature/?public_id=${publicId}`)
      .then((res) => res.json())
      .then((data) => {
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
            const imagePath = `image/upload/v${data.version}/${data.public_id}`;
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
  };

  return (
    <div>
      <button onClick={handleUpload} disabled={loading || !imageBlob}>
        {loading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
};

export default UploadImage2;