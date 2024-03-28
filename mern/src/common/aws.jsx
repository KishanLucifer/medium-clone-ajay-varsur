import axios from 'axios';

export const uploadImage = async (img) => {
  try {
    const response = await axios.get(
      import.meta.env.VITE_SERVER_DOMAIN + '/get-upload-url'
    );
    const uploadURL = response.data.uploadURL;

    await axios.put(uploadURL, img, {
      headers: { 'Content-Type': 'multipart/form-data' }, // Adjust content type as per your image type
    });

    // Extract the base URL without query parameters
    const imgUrl = uploadURL.split('?')[0];
    return imgUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null; // Return null or handle error as per your application's logic
  }
};

// import axios from 'axios';

// export const uploadImage = async (img) => {
//   let imgUrl = null;

//   await axios
//     .get(import.meta.env.VITE_SERVER_DOMAIN + '/get-upload-url')

//     .then(async ({ data: { uploadURL } }) => {
//       await axios({
//         method: 'PUT',
//         url: uploadURL,
//         headers: { 'Content-Type': 'multipart/form-data' },
//         data: img,
//       }).then(() => {
//         imgUrl = uploadURL.split('?')[0];
//       });
//     });

//   return imgUrl;
// };
