// upload.js
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file, uid) => {
  const date = new Date().getTime(); // unique timestamp
  const storageRef = ref(storage, `images/${uid}/${date}_${file.name}`);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      null, // we can skip progress callback if not needed
      (error) => reject("Upload failed: " + error.code),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

export default upload;
